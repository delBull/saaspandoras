import { NextResponse } from "next/server";
import { getNexusAuthContext } from '@saasfly/shared';
import { getTasks } from "@/lib/nexus/operations-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await getNexusAuthContext(request.headers);
    if (!auth.isAuthenticated || !auth.permissions.dealRoom) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const orgId = auth.canonicalOrgId || 'pandoras';
    const tasks = await getTasks(orgId);
    return NextResponse.json({ tasks });
  } catch (err: any) {
    console.error("[Tasks] GET Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
