import { getNexusAuthContext, checkNexusPermission } from "@/lib/nexus/nexus-rbac";
import { verifyAcademyToken, verifyUnlockToken } from "@/lib/nexus-deals/tokens";
import AcademyAccessGate from "./AcademyAccessGate";
import AcademyConsole from "./AcademyConsole";

export const dynamic = "force-dynamic";

export default async function AdminAcademyPage({
  searchParams,
}: {
  searchParams: Promise<{ unlock?: string; token?: string }>;
}) {
  const { unlock, token } = await searchParams;

  const auth = await getNexusAuthContext(null, token);

  let unlocked = checkNexusPermission(auth, "academyAdmin");
  let userRole: "admin" | "manager" =
    auth.role === "SUPER_ADMIN" || auth.role === "ADMIN" ? "admin" : "manager";
  let userEmail: string | undefined = auth.email || undefined;

  // Legacy fallback: Token de desbloqueo firmado (Magic Link por email o Discord HMAC)
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
