import { NextRequest, NextResponse } from "next/server";
import { CommercialDecisionEngine } from "@/lib/domain/commercial-decision-engine";
import { IntegrationKeyService } from "@/lib/integrations/auth";

export const runtime = "nodejs";

const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin || "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key, Authorization",
});

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) });
}

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const apiKey = req.headers.get("x-api-key");
    const { searchParams } = new URL(req.url);
    const ambassadorId = searchParams.get("ambassadorId") || 'anon';

    if (!apiKey || !(await IntegrationKeyService.validateKey(apiKey))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: getCorsHeaders(req.headers.get("origin")) });
    }

    const decisions = await CommercialDecisionEngine.getDecisions(Number(projectId), ambassadorId);

    return NextResponse.json(decisions, { headers: getCorsHeaders(req.headers.get("origin")) });
  } catch (error: any) {
    console.error("❌ Commercial Decision Engine API Error:", error);
    return NextResponse.json({ error: "Failed to fetch decisions", message: error.message }, { status: 500, headers: getCorsHeaders(req.headers.get("origin")) });
  }
}
