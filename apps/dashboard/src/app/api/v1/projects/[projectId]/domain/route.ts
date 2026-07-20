import { NextRequest, NextResponse } from "next/server";
import { IntegrationKeyService } from "@/lib/integrations/auth";
import { ProjectDomainService } from "@/lib/domain/project-domain-service";

export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const rawAuth = req.headers.get('authorization');
    const apiKey = req.headers.get('x-api-key') || (rawAuth?.startsWith('Bearer ') ? rawAuth.substring(7) : null);
    
    if (!apiKey) {
      return NextResponse.json({ error: "API Key required" }, { status: 401 });
    }

    const client = await IntegrationKeyService.validateKey(apiKey);
    if (!client) {
      return NextResponse.json({ error: "Invalid API Key" }, { status: 403 });
    }

    const { projectId } = await params;
    
    // Defer all data fetching to the Domain Service
    const domainAggregate = await ProjectDomainService.buildProjectDomain(projectId);

    return NextResponse.json({
      success: true,
      domain: domainAggregate
    });

  } catch (error: any) {
    if (error.message?.includes('not found')) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    console.error("[Bulls Lab API] Error fetching domain:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
