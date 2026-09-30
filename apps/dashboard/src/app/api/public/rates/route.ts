import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 1800; // 30 min cache

/**
 * GET /api/public/rates
 * Returns USD/MXN exchange rate from open.er-api.com (free, no key needed).
 * Cached at the edge for 30 minutes — safe for checkout conversion display.
 */
export async function GET() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 1800 },
    });

    if (!res.ok) throw new Error(`Rate API ${res.status}`);

    const data = await res.json();
    const mxnRate: number = data?.rates?.MXN;

    if (!mxnRate || typeof mxnRate !== "number") {
      throw new Error("MXN rate missing from response");
    }

    return NextResponse.json(
      { usdToMxn: mxnRate, mxnToUsd: 1 / mxnRate, updatedAt: data.time_last_update_utc },
      {
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=300",
        },
      }
    );
  } catch (err: any) {
    console.error("[Rates API] Error:", err.message);
    // Fallback to a safe hardcoded rate if the API is down
    return NextResponse.json(
      { usdToMxn: 17.5, mxnToUsd: 1 / 17.5, updatedAt: null, fallback: true },
      { status: 200 }
    );
  }
}
