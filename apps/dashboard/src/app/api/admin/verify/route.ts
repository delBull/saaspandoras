import { NextResponse } from "next/server";
import { getAuth, isAdmin } from "@/lib/auth";
import { headers } from "next/headers";
import { SUPER_ADMIN_WALLET } from "@/lib/constants";

// ⚠️ EXPLICITAMENTE USAR Node.js RUNTIME para APIs que usan PostgreSQL
export const runtime = "nodejs";

export async function GET() {
  const { session } = await getAuth(await headers());

  console.log("VERIFY: session:", session);

  const userIsSuperAdmin = session?.userId?.toLowerCase() === SUPER_ADMIN_WALLET.toLowerCase();
  const userIsAdmin = !!session?.userId && (await isAdmin(session.userId));

  // 🔒 Validación defensiva adicional para userId
  if (!session?.userId) {
    console.error("🔐 AUTH ERROR: No userId for verify endpoint", {
      timestamp: new Date().toISOString(),
      session: JSON.stringify(session),
      headers: await headers()
    });
  }

  console.log("VERIFY: result:", { userIsAdmin, userIsSuperAdmin });
  return NextResponse.json({ isAdmin: userIsAdmin, isSuperAdmin: userIsSuperAdmin });
}
