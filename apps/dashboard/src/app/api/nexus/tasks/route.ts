import { NextResponse } from "next/server";
import { validateDealRoomAccess } from "@/lib/admin-auth";
import { NEXUS_TASKS } from "@/lib/nexus-tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { errorResponse } = await validateDealRoomAccess(request);
  if (errorResponse) return errorResponse;
  return NextResponse.json({ tasks: NEXUS_TASKS });
}
