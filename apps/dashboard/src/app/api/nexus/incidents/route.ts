import { NextResponse } from "next/server";
import { getNexusAuthContext } from '@saasfly/shared';
import { getIncidents } from "@/lib/nexus/operations-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await getNexusAuthContext(request.headers);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Incidents are tied to tech support/operations
    if (!auth.permissions['nexus.manage'] && !auth.permissions.dealRoom) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const orgId = auth.canonicalOrgId || 'pandoras';
    const incidents = await getIncidents(orgId);
    return NextResponse.json({ incidents });
  } catch (err: any) {
    console.error("[Incidents] GET Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getNexusAuthContext(request.headers);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (!auth.permissions['nexus.manage'] && !auth.permissions.dealRoom) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const orgId = auth.canonicalOrgId || 'pandoras';
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status || !['OPEN', 'INVESTIGATING', 'RESOLVED'].includes(status)) {
      return NextResponse.json({ error: "id and valid status ('OPEN' | 'INVESTIGATING' | 'RESOLVED') are required" }, { status: 400 });
    }

    const { db } = await import('@saasfly/db');
    const { nexusIncidents } = await import('@saasfly/db/schema');
    const { eq, and } = await import('@saasfly/db-core');

    const now = new Date();
    const updatePayload: any = {
      status,
      updatedAt: now,
    };

    if (status === 'RESOLVED') {
      updatePayload.resolvedBy = auth.collaboratorId || null;
      updatePayload.resolvedAt = now;
    }

    const [updated] = await db
      .update(nexusIncidents)
      .set(updatePayload)
      .where(and(eq(nexusIncidents.id, id), eq(nexusIncidents.canonicalOrgId, orgId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Incident not found in this organization scope" }, { status: 404 });
    }

    return NextResponse.json({ success: true, incident: updated });
  } catch (err: any) {
    console.error("[Incidents] PATCH Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return PATCH(request);
}

