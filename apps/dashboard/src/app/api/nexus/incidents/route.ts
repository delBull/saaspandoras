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
