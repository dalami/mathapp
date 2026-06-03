import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MP_API = "https://api.mercadopago.com";

const COIN_PACKS: Record<string, number> = {
  pack_sm: 500,
  pack_md: 1200,
  pack_lg: 3000,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body;

    const accessToken = process.env.MP_ACCESS_TOKEN!;

    // ─── Pago aprobado (pack de monedas) ─────────────────────
    if (type === "payment") {
      const paymentId = data?.id;
      if (!paymentId) return NextResponse.json({ ok: true });

      const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payment = await res.json();

      if (payment.status !== "approved") return NextResponse.json({ ok: true });

      const ref: string = payment.external_reference ?? "";
      // formato: pack_sm_userId
      const parts = ref.split("_");
      const userId = parts.slice(2).join("_"); // por si el userId tiene _
      const packId = `${parts[0]}_${parts[1]}`; // pack_sm, pack_md, pack_lg

      const coins = COIN_PACKS[packId];
      if (!userId || !coins) return NextResponse.json({ ok: true });

      // Evitar doble acreditación
      const { data: existing } = await supabase
        .from("purchases")
        .select("id")
        .eq("mp_payment_id", String(paymentId))
        .single();

      if (existing) return NextResponse.json({ ok: true });

      // Acreditar monedas
      await supabase.rpc("add_coins", { p_user_id: userId, p_amount: coins });

      // Registrar compra
      await supabase.from("purchases").insert({
        user_id: userId,
        item_id: packId,
        item_type: "pack",
        coins_granted: coins,
        gateway: "mercadopago",
        mp_payment_id: String(paymentId),
        status: "approved",
        amount_usd: payment.transaction_amount,
      });

      return NextResponse.json({ ok: true });
    }

    // ─── Suscripción Pro aprobada ─────────────────────────────
    if (type === "subscription_preapproval") {
      const preapprovalId = data?.id;
      if (!preapprovalId) return NextResponse.json({ ok: true });

      const res = await fetch(`${MP_API}/preapproval/${preapprovalId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const sub = await res.json();

      if (sub.status !== "authorized") return NextResponse.json({ ok: true });

      const ref: string = sub.external_reference ?? "";
      const userId = ref.replace("pro_", "");
      if (!userId) return NextResponse.json({ ok: true });

      // Activar Pro
      await supabase
        .from("profiles")
        .update({ plan: "pro", mp_subscription_id: preapprovalId })
        .eq("id", userId);

      // Registrar
      await supabase.from("purchases").insert({
        user_id: userId,
        item_id: "pro",
        item_type: "pro",
        gateway: "mercadopago",
        mp_payment_id: preapprovalId,
        status: "approved",
        amount_usd: 0.99,
      });

      return NextResponse.json({ ok: true });
    }

    // ─── Suscripción cancelada/pausada ────────────────────────
    if (type === "subscription_authorized_payment") {
      // Pago mensual recurrente — no necesitamos hacer nada extra
      // MP mantiene el preapproval activo
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("mp-webhook error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// MP hace GET para verificar el endpoint
export async function GET() {
  return NextResponse.json({ ok: true });
}