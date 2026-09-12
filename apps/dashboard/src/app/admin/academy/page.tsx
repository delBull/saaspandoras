import { headers } from "next/headers";
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

  const reqHeaders = await headers();
  const auth = await getNexusAuthContext(reqHeaders, token);

  const hasAcademyPermission = 
    auth.isAuthenticated && (
      auth.role === "SUPER_ADMIN" ||
      auth.role === "ADMIN" ||
      (auth.role as string) === "MANAGER" ||
      checkNexusPermission(auth, "nexus.manage") ||
      checkNexusPermission(auth, "users.manage") ||
      Boolean(auth.permissions?.academyAdmin)
    );

  let unlocked = hasAcademyPermission;
  let userRole: "admin" | "manager" =
    auth.role === "SUPER_ADMIN" || auth.role === "ADMIN" ? "admin" : "manager";
  let userEmail: string | undefined = auth.email || undefined;

  // Fallback directo por email si el colaborador está activo en la tabla de colaboradores
  if (!unlocked && auth.email) {
    try {
      const { getCollaboratorByEmail } = await import('@/lib/nexus/collaborators-service');
      const collab = await getCollaboratorByEmail(auth.email);
      if (collab && collab.status === 'ACTIVE') {
        if (collab.role === 'SUPER_ADMIN' || collab.role === 'ADMIN') {
          unlocked = true;
          userRole = 'admin';
        } else if (collab.permissions?.academyAdmin || (collab.role as string) === 'MANAGER') {
          unlocked = true;
          userRole = 'manager';
        }
      }
    } catch {}
  }

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
