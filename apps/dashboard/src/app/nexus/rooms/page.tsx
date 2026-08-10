import { getAuth, isAdmin } from "@/lib/auth";
import { verifyUnlockToken } from "@/lib/nexus-deals/tokens";
import DealRoomAccessGate from "./DealRoomAccessGate";
import DealRoomConsole from "./DealRoomConsole";

export const dynamic = "force-dynamic";

export default async function NexusRoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ unlock?: string }>;
}) {
  const { unlock } = await searchParams;
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

  return unlocked ? <DealRoomConsole /> : <DealRoomAccessGate />;
}
