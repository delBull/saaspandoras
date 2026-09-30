import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 1800; // 30 min cache

/**
 * GET /api/public/rates
 * Returns live USD/MXN rate (open.er-api.com) and USDT/USD price (CoinGecko free).
 * Both cached at edge 30 min. Graceful fallback per source.
 */
export async function GET() {
  const [fxRes, cgRes] = await Promise.allSettled([
    fetch("https://open.er-api.com/v6/latest/USD", { next: { revalidate: 1800 } }),
    fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd",
      { next: { revalidate: 1800 } }
    ),
  ]);

  // ── MXN rate ─────────────────────────────────────────────────────────────
  let usdToMxn = 17.5;
  let fxFallback = true;
  if (fxRes.status === "fulfilled" && fxRes.value.ok) {
    try {
      const data = await fxRes.value.json();
      if (typeof data?.rates?.MXN === "number") {
        usdToMxn = data.rates.MXN;
        fxFallback = false;
      }
    } catch { /* keep fallback */ }
  }

  // ── USDT price (USD) ──────────────────────────────────────────────────────
  let usdtToUsd = 1.0;
  let usdtFallback = true;
  if (cgRes.status === "fulfilled" && cgRes.value.ok) {
    try {
      const data = await cgRes.value.json();
      if (typeof data?.tether?.usd === "number") {
        usdtToUsd = data.tether.usd;
        usdtFallback = false;
      }
    } catch { /* keep fallback */ }
  }

  return NextResponse.json(
    {
      usdToMxn,
      mxnToUsd: 1 / usdToMxn,
      usdtToUsd,          // how many USD = 1 USDT (≈ 1.000)
      usdToUsdt: 1 / usdtToUsd,  // how many USDT = 1 USD
      fallback: fxFallback,
      usdtFallback,
    },
    {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=300" },
    }
  );
}

