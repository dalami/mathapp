

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PAYPAL_API = process.env.PAYPAL_MODE === "production"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

const COIN_PACKS: Record<string, number> = {
  pack_sm: 500,
  pack_md: 1200,
  pack_lg: 3000,
};

async function getPayPalToken(): Promise<string> {
  const clientId     = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
  const credentials  = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  return data.access_token;
}

// ─── GET: PayPal redirige acá tras el pago ────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token   = searchParams.get("token");   // order ID
  const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!token) {
    return NextResponse.redirect(`${appUrl}/tienda?status=failure`);
  }

  try {
    const accessToken = await getPayPalToken();

    // Capturar el pago
    const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${token}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const capture = await captureRes.json();

    if (capture.status !== "COMPLETED") {
      return NextResponse.redirect(`${appUrl}/tienda?status=failure`);
    }

    // Extraer custom_id con userId, itemId, coins
    const customId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id;
    if (!customId) {
      return NextResponse.redirect(`${appUrl}/tienda?status=failure`);
    }

    const { userId, itemId, coins } = JSON.parse(customId) as {
      userId: string;
      itemId: string;
      coins: number;
    };

    const captureId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.id;

    // Evitar doble acreditación
    const { data: existing } = await supabase
      .from("purchases")
      .select("id")
      .eq("paypal_capture_id", captureId)
      .single();

    if (!existing) {
      // Acreditar monedas
      await supabase.rpc("add_coins", { p_user_id: userId, p_amount: coins });

      // Registrar compra
      await supabase.from("purchases").insert({
        user_id: userId,
        item_id: itemId,
        item_type: "pack",
        coins_granted: coins,
        gateway: "paypal",
        paypal_capture_id: captureId,
        status: "approved",
        amount_usd: COIN_PACKS[itemId] ? parseFloat(capture.purchase_units[0].amount.value) : 0,
      });
    }

    return NextResponse.redirect(`${appUrl}/tienda?status=coins_success&pack=${itemId}`);
  } catch (e) {
    console.error("paypal-webhook error:", e);
    return NextResponse.redirect(`${appUrl}/tienda?status=failure`);
  }
}

// ─── POST: Webhook de suscripción Pro PayPal ──────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventType = body.event_type;

    if (eventType === "BILLING.SUBSCRIPTION.ACTIVATED") {
      const sub = body.resource;
      const userId = sub.custom_id?.replace("pro_", "");
      if (!userId) return NextResponse.json({ ok: true });

      await supabase
        .from("profiles")
        .update({ plan: "pro", paypal_subscription_id: sub.id })
        .eq("id", userId);

      await supabase.from("purchases").insert({
        user_id: userId,
        item_id: "pro",
        item_type: "pro",
        gateway: "paypal",
        paypal_capture_id: sub.id,
        status: "approved",
        amount_usd: 0.99,
      });
    }

    if (
      eventType === "BILLING.SUBSCRIPTION.CANCELLED" ||
      eventType === "BILLING.SUBSCRIPTION.SUSPENDED"
    ) {
      const sub = body.resource;
      const userId = sub.custom_id?.replace("pro_", "");
      if (!userId) return NextResponse.json({ ok: true });

      await supabase
        .from("profiles")
        .update({ plan: "free" })
        .eq("id", userId);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("paypal-webhook POST error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}