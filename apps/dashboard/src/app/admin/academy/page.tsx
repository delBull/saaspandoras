/**
 * 🎓 Pandora's Academy Control Plane
 * apps/dashboard/src/app/admin/academy/page.tsx
 */

import { getAuth, isAdmin } from "@/lib/auth";
import { verifyAcademyToken, verifyUnlockToken } from "@/lib/nexus-deals/tokens";
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
  let userRole: "admin" | "manager" = "admin";
  let userEmail: string | undefined;

  // 1) Sesión de administrador autenticado vía Web3 → acceso directo como admin
  if (isVerified && session?.address && (await isAdmin(session.address))) {
    unlocked = true;
    userRole = "admin";
  }

  // 2) Token de desbloqueo firmado (Magic Link por email o Discord HMAC)
  if (!unlocked && typeof unlock === "string" && unlock) {
    const academyAuth = await verifyAcademyToken(unlock);
    if (academyAuth.valid) {
      unlocked = true;
      userRole = academyAuth.role || "manager";
      userEmail = academyAuth.email;
    } else {
      const isLegacyUnlocked = await verifyUnlockToken(unlock);
      if (isLegacyUnlocked) {
        unlocked = true;
        userRole = "admin";
      }
    }
  }

  return unlocked ? (
    <AcademyConsole role={userRole} userEmail={userEmail} unlockToken={unlock} />
  ) : (
    <AcademyAccessGate />
  );
}
