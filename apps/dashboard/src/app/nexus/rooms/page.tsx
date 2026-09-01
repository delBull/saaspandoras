import { getAuth, isAdmin } from "@/lib/auth";
import { verifyUnlockToken } from "@/lib/nexus-deals/tokens";
import { verifyCollaboratorToken } from "@/lib/nexus/collaborators-service";
import DealRoomAccessGate from "./DealRoomAccessGate";
import DealRoomConsole from "./DealRoomConsole";

export const dynamic = "force-dynamic";

export default async function NexusRoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ unlock?: string; collaborator?: string }>;
}) {
  const { unlock, collaborator } = await searchParams;
  const { session, isVerified } = await getAuth();

  let unlocked = false;
  // 1) Sesión admin autenticada → acceso directo
  if (isVerified && session?.address && (await isAdmin(session.address))) {
    unlocked = true;
  }
  // 2) Token de desbloqueo HMAC (enlace del webhook de Discord, 2h)
  if (!unlocked && typeof unlock === "string" && unlock) {
    unlocked = await verifyUnlockToken(unlock);
  }
  // 3) Magic link de colaborador (correo, 24h)
  if (!unlocked && typeof collaborator === "string" && collaborator) {
    const collab = await verifyCollaboratorToken(collaborator);
    unlocked = !!collab;
  }

  return unlocked ? <DealRoomConsole /> : <DealRoomAccessGate />;
}
