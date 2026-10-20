import { headers } from "next/headers";
import { getNexusAuthContext } from "@saasfly/shared";
import { verifyAcademyToken, verifyUnlockToken } from "@saasfly/nexus-deals-sdk";
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

  const authPerms = auth.permissions as unknown as Record<string, boolean> | undefined;

  const hasAcademyPermission = 
    auth.isAuthenticated && (
      auth.role === "SUPER_ADMIN" ||
      auth.role === "ADMIN" ||
      (auth.role as string) === "OWNER" ||
      Boolean(authPerms?.ecosystem) ||
      Boolean(authPerms?.academyAdmin) ||
      Boolean(authPerms?.all)
    );

  let unlocked = hasAcademyPermission;
  let userRole: "admin" | "manager" =
    auth.role === "SUPER_ADMIN" || auth.role === "ADMIN" || (auth.role as string) === "OWNER" ? "admin" : "manager";
  let userEmail: string | undefined = auth.email ?? undefined;

  // Fallback directo por email si el colaborador está activo en la tabla de colaboradores
  if (!unlocked && auth.email) {
    try {
      const { getCollaboratorByEmail } = await import('@saasfly/hermes-core');
      const collab = await getCollaboratorByEmail(auth.email);
      if (collab && collab.status === 'ACTIVE') {
        const collabPerms = collab.permissions as Record<string, boolean> | undefined;
        const roleStr = String(collab.role);
        if (roleStr === 'SUPER_ADMIN' || roleStr === 'ADMIN' || roleStr === 'OWNER' || Boolean(collabPerms?.all) || Boolean(collabPerms?.ecosystem)) {
          unlocked = true;
          userRole = 'admin';
        }
      }
    } catch {
      // Ignorar fallas de resolución opcional
    }
  }

  // Legacy fallback: Token de desbloqueo firmado (Magic Link por email o Discord HMAC)
  if (!unlocked && typeof unlock === "string" && unlock) {
    const academyAuth = await verifyAcademyToken(unlock);
    if (academyAuth.valid) {
      unlocked = true;
      userRole = academyAuth.role ?? "manager";
      userEmail = academyAuth.email;
    } else {
      const isLegacyUnlocked = await verifyUnlockToken(unlock);
      if (isLegacyUnlocked) {
        unlocked = true;
        userRole = "admin";
      }
    }
  }

  const adminEmailsList = [
    (process.env.NEXUS_ADMIN_EMAIL ?? "").toLowerCase(),
    (process.env.ADMIN_EMAIL ?? "").toLowerCase(),
    ...(process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : []),
    "admin@pandoras.finance",
  ].filter(Boolean);

  const isSuperAdmin = Boolean(
    auth.role === "SUPER_ADMIN" ||
    (Boolean(userEmail) && adminEmailsList.includes(userEmail?.toLowerCase().trim() ?? "")) ||
    (Boolean(auth.wallet) && (
      (auth.wallet?.toLowerCase() ?? "") === (process.env.NEXT_PUBLIC_SUPER_ADMIN_WALLET ?? "0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9").toLowerCase() ||
      (auth.wallet?.toLowerCase() ?? "") === (process.env.SUPER_ADMIN_WALLET ?? "").toLowerCase() ||
      (auth.wallet?.toLowerCase() ?? "") === "0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9"
    ))
  );

  return unlocked ? (
    <AcademyConsole 
      role={userRole} 
      userEmail={userEmail} 
      userName={auth.name ?? (isSuperAdmin ? "Super Admin" : undefined)}
      userWallet={auth.wallet ?? undefined}
      isSuperAdmin={isSuperAdmin}
      unlockToken={unlock} 
    />
  ) : (
    <AcademyAccessGate />
  );
}
