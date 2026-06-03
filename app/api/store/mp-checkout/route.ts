import { NextRequest, NextResponse } from "next/server";

const MP_API = "https://api.mercadopago.com";

const COIN_PACKS: Record<string, { coins: number; priceUSD: number; label: string }> = {
  pack_sm: { coins: 500,  priceUSD: 0.49, label: "Pack Pequeño — 500 monedas" },
  pack_md: { coins: 1200, priceUSD: 0.99, label: "Pack Mediano — 1200 monedas" },
  pack_lg: { coins: 3000, priceUSD: 1.99, label: "Pack Grande — 3000 monedas" },
};

// Precio en moneda local según país
const COUNTRY_CURRENCY: Record<string, { currency: string; multiplier: number }> = {
  AR: { currency: "ARS", multiplier: 900  },
  MX: { currency: "MXN", multiplier: 17   },
  BR: { currency: "BRL", multiplier: 5    },
  CL: { currency: "CLP", multiplier: 920  },
  CO: { currency: "COP", multiplier: 4000 },
};

export async function POST(req: NextRequest) {
  try {
    const { userId, itemId, itemType, country } = await req.json();

    if (!userId || !itemId || !itemType) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ error: "MP no configurado" }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const cc = country ?? "AR";
    const { currency, multiplier } = COUNTRY_CURRENCY[cc] ?? COUNTRY_CURRENCY.AR;

    // ─── Suscripción Pro ─────────────────────────────────────
    if (itemType === "pro") {
      const priceLocal = Math.round(0.99 * multiplier);

      const body = {
        reason: "MathApp Pro — Vidas infinitas + sin publicidad",
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: priceLocal,
          currency_id: currency,
        },
        back_url: `${appUrl}/tienda?status=pro_success`,
        external_reference: `pro_${userId}`,
        payer_email: "", // MP lo pide al usuario en el checkout
      };

      const res = await fetch(`${MP_API}/preapproval_plan`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("MP preapproval error:", data);
        return NextResponse.json({ error: data.message ?? "Error MP" }, { status: 500 });
      }

      return NextResponse.json({ url: data.init_point });
    }

    // ─── Pack de monedas ─────────────────────────────────────
    const pack = COIN_PACKS[itemId];
    if (!pack) {
      return NextResponse.json({ error: "Pack inválido" }, { status: 400 });
    }

    const priceLocal = Math.round(pack.priceUSD * multiplier);

    const preference = {
      items: [
        {
          id: itemId,
          title: pack.label,
          quantity: 1,
          unit_price: priceLocal,
          currency_id: currency,
        },
      ],
      external_reference: `${itemId}_${userId}`,
      back_urls: {
        success: `${appUrl}/tienda?status=coins_success&pack=${itemId}`,
        failure: `${appUrl}/tienda?status=failure`,
        pending: `${appUrl}/tienda?status=pending`,
      },
      auto_return: "approved",
      notification_url: `${appUrl}/api/store/mp-webhook`,
      metadata: {
        user_id: userId,
        item_id: itemId,
        item_type: "pack",
        coins: pack.coins,
      },
    };

    const res = await fetch(`${MP_API}/checkout/preferences`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("MP preference error:", data);
      return NextResponse.json({ error: data.message ?? "Error MP" }, { status: 500 });
    }

    // sandbox_init_point para testing, init_point para producción
    const url = process.env.MP_MODE === "production"
      ? data.init_point
      : data.sandbox_init_point;

    return NextResponse.json({ url });
  } catch (e) {
    console.error("mp-checkout error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}