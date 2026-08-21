/**
 * 🎓 Pandora's Academy Control Plane
 * apps/dashboard/src/app/admin/academy/page.tsx
 */

import { getAuth, isAdmin } from "@/lib/auth";
import { verifyUnlockToken } from "@/lib/nexus-deals/tokens";
import AcademyAccessGate from "./AcademyAccessGate";
import AcademyConsole from "./AcademyConsole";

export const dynamic = "force-dynamic";

export default async function AdminAcademyPage({
  searchParams,
}: {
  searchParams: Promise<{ unlock?: string }>;
}) {
  const { unlock } = await searchParams;
  const { session, isVerified } = await getAuth();

  let unlocked = false;

  // 1) Sesión de administrador autenticado → acceso directo
  if (isVerified && session?.address && (await isAdmin(session.address))) {
    unlocked = true;
  }

  // 2) Token de desbloqueo HMAC firmado (enviado al canal privado de Discord)
  if (!unlocked && typeof unlock === "string" && unlock) {
    unlocked = await verifyUnlockToken(unlock);
  }

  return unlocked ? <AcademyConsole /> : <AcademyAccessGate />;
}
