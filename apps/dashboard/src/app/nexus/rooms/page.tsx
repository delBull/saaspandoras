import { getNexusAuthContext, checkNexusPermission } from "@saasfly/shared";
import { verifyUnlockToken } from "@saasfly/nexus-deals-sdk";
import DealRoomAccessGate from "./DealRoomAccessGate";
import DealRoomConsole from "./DealRoomConsole";

export const dynamic = "force-dynamic";

export default async function NexusRoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ unlock?: string; collaborator?: string; token?: string }>;
}) {
  const { unlock, collaborator, token } = await searchParams;

  const auth = await getNexusAuthContext(null, token || collaborator);

  // RBAC Inheritance: Permitimos SUPER_ADMIN, ADMIN y colaboradores con permiso dealRoom
  let unlocked = Boolean(
    auth.isAuthenticated && (
      (auth.role && ["SUPER_ADMIN", "ADMIN", "MARKETING", "MANAGER", "OPERATOR"].includes(auth.role)) ||
      checkNexusPermission(auth, "dealRoom")
    )
  );

  // Legacy fallback: Token de desbloqueo HMAC (enlace del webhook de Discord, 2h)
  if (!unlocked && typeof unlock === "string" && unlock) {
    unlocked = await verifyUnlockToken(unlock);
  }

  return unlocked ? <DealRoomConsole /> : <DealRoomAccessGate />;
}
