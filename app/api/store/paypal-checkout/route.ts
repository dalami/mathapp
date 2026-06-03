import { NextRequest, NextResponse } from "next/server";

const PAYPAL_API = process.env.PAYPAL_MODE === "production"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

const COIN_PACKS: Record<string, { coins: number; priceUSD: string; label: string }> = {
  pack_sm: { coins: 500,  priceUSD: "0.49", label: "MathApp — Pack Pequeño 500 monedas" },
  pack_md: { coins: 1200, priceUSD: "0.99", label: "MathApp — Pack Mediano 1200 monedas" },
  pack_lg: { coins: 3000, priceUSD: "1.99", label: "MathApp — Pack Grande 3000 monedas" },
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
  if (!data.access_token) throw new Error("No se pudo obtener token PayPal");
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const { userId, itemId, itemType } = await req.json();

    if (!userId || !itemId || !itemType) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const token  = await getPayPalToken();

    // ─── Suscripción Pro ─────────────────────────────────────
    if (itemType === "pro") {
      // 1. Crear plan de suscripción (o usar uno existente guardado en env)
      // Por simplicidad, creamos el plan on-the-fly si no existe
      const planId = process.env.PAYPAL_PRO_PLAN_ID;

      let resolvedPlanId = planId;

      if (!resolvedPlanId) {
        // Crear producto
        const productRes = await fetch(`${PAYPAL_API}/v1/catalogs/products`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "MathApp Pro",
            description: "Vidas infinitas, sin publicidad, acceso completo",
            type: "SERVICE",
            category: "EDUCATIONAL_AND_TEXTBOOKS",
          }),
        });
        const product = await productRes.json();

        // Crear plan
        const planRes = await fetch(`${PAYPAL_API}/v1/billing/plans`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product_id: product.id,
            name: "MathApp Pro Mensual",
            billing_cycles: [
              {
                frequency: { interval_unit: "MONTH", interval_count: 1 },
                tenure_type: "REGULAR",
                sequence: 1,
                total_cycles: 0,
                pricing_scheme: {
                  fixed_price: { value: "0.99", currency_code: "USD" },
                },
              },
            ],
            payment_preferences: {
              auto_bill_outstanding: true,
              payment_failure_threshold: 1,
            },
          }),
        });
        const plan = await planRes.json();
        resolvedPlanId = plan.id;
        // Loguear para guardar en env y no recrear cada vez
        console.log("PayPal Plan ID creado:", resolvedPlanId);
      }

      // Crear suscripción
      const subRes = await fetch(`${PAYPAL_API}/v1/billing/subscriptions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan_id: resolvedPlanId,
          custom_id: `pro_${userId}`,
          application_context: {
            return_url: `${appUrl}/tienda?status=pro_success`,
            cancel_url: `${appUrl}/tienda?status=cancelled`,
            brand_name: "MathApp",
            locale: "es-AR",
          },
        }),
      });

      const sub = await subRes.json();
      const approveLink = sub.links?.find((l: { rel: string; href: string }) => l.rel === "approve")?.href;

      if (!approveLink) {
        console.error("PayPal sub error:", sub);
        return NextResponse.json({ error: "Error creando suscripción PayPal" }, { status: 500 });
      }

      return NextResponse.json({ url: approveLink });
    }

    // ─── Pack de monedas ─────────────────────────────────────
    const pack = COIN_PACKS[itemId];
    if (!pack) {
      return NextResponse.json({ error: "Pack inválido" }, { status: 400 });
    }

    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: `${itemId}_${userId}`,
            description: pack.label,
            custom_id: JSON.stringify({ userId, itemId, coins: pack.coins }),
            amount: {
              currency_code: "USD",
              value: pack.priceUSD,
            },
          },
        ],
        application_context: {
          return_url: `${appUrl}/api/store/paypal-webhook?status=success`,
          cancel_url: `${appUrl}/tienda?status=cancelled`,
          brand_name: "MathApp",
          locale: "es-AR",
          landing_page: "NO_PREFERENCE",
          user_action: "PAY_NOW",
        },
      }),
    });

    const order = await orderRes.json();
    const approveLink = order.links?.find((l: { rel: string; href: string }) => l.rel === "approve")?.href;

    if (!approveLink) {
      console.error("PayPal order error:", order);
      return NextResponse.json({ error: "Error creando orden PayPal" }, { status: 500 });
    }

    return NextResponse.json({ url: approveLink });
  } catch (e) {
    console.error("paypal-checkout error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}