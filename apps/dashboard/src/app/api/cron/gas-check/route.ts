import { NextResponse } from "next/server";
import { checkGasAndAlert, getFormattedAdminEthBalance, getCurrentGasPrice } from "@/lib/treasury/gas-monitor";
import { formatUnits } from "viem";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const result = await checkGasAndAlert();

    return NextResponse.json({
      status: result.ok ? "ok" : "low",
      balanceEth: result.balanceEth,
      gasPriceGwei: result.gasPriceGwei,
      alertsSent: result.alertsSent,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[/api/cron/gas-check]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
