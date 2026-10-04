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
