import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth, isAdmin } from "@/lib/auth";
import { SUPER_ADMIN_WALLET } from "@/lib/constants";

export async function GET() {
  const { session } = await getAuth();

  console.log("VERIFY: session:", session);

  const userIsSuperAdmin = session?.userId?.toLowerCase() === SUPER_ADMIN_WALLET.toLowerCase();
  const userIsAdmin = !!session?.userId && (await isAdmin(session.userId));

  console.log("VERIFY: result:", { userIsAdmin, userIsSuperAdmin });
  return NextResponse.json({ isAdmin: userIsAdmin, isSuperAdmin: userIsSuperAdmin });
}
