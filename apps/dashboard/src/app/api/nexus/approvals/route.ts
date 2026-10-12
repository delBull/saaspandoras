import { NextResponse } from "next/server";
import { getNexusAuthContext } from '@saasfly/shared';
import { getApprovals } from "@/lib/nexus/operations-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await getNexusAuthContext(request.headers);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Approval center is usually tied to nexus.manage or specific high roles
    if (!auth.permissions['nexus.manage'] && !auth.permissions.dealRoom) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const orgId = auth.canonicalOrgId || 'pandoras';
    const approvals = await getApprovals(orgId);
    return NextResponse.json({ approvals });
  } catch (err: any) {
    console.error("[Approvals] GET Error:", err);
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
    const { id, action } = body;

    if (!id || !action || !['APPROVED', 'REJECTED'].includes(action)) {
      return NextResponse.json({ error: "id and action ('APPROVED' | 'REJECTED') are required" }, { status: 400 });
    }

    const { db } = await import('@saasfly/db');
    const { nexusApprovals } = await import('@saasfly/db/schema');
    const { eq, and } = await import('@saasfly/db-core');

    const [updated] = await db
      .update(nexusApprovals)
      .set({
        status: action as any,
        resolvedBy: auth.collaboratorId || null,
        resolvedAt: new Date(),
      })
      .where(and(eq(nexusApprovals.id, id), eq(nexusApprovals.canonicalOrgId, orgId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Approval request not found in this organization scope" }, { status: 404 });
    }

    return NextResponse.json({ success: true, approval: updated });
  } catch (err: any) {
    console.error("[Approvals] PATCH Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return PATCH(request);
}

