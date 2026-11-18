import { db } from "@saasfly/db-core";
import { nexusDealRooms } from "@saasfly/db-core/schema";
import { eq } from "@saasfly/db-core";

/**
 * Contexto de Deal Room de una reunión.
 *
 * `meetings.deal_room_id` es la fuente de verdad del vínculo reunión↔deal. Se usa para
 * que los enlaces (propuesta, expediente, seguimiento) se resuelvan server-side en vez
 * de estar hardcodeados en el deck o en los documentos.
 */
export async function resolveDealPublicId(dealRoomId: string | null | undefined): Promise<string | null> {
  if (!dealRoomId) return null;
  try {
    const [room] = await db
      .select({ publicId: nexusDealRooms.publicId })
      .from(nexusDealRooms)
      .where(eq(nexusDealRooms.id, dealRoomId))
      .limit(1);
    return room?.publicId ?? null;
  } catch (error) {
    console.error("[MeetDealContext] No se pudo resolver el Deal Room:", error);
    return null;
  }
}
