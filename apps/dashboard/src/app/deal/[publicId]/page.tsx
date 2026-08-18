import { notFound } from "next/navigation";
import { getRoomByPublicId, getRoom, publicRoomView } from "@/lib/nexus-deals/repo";
import { verifyDealToken } from "@/lib/nexus-deals/tokens";
import { KIND_LABEL } from "@/lib/nexus-deals/types";
import DealSignerClient from "./DealSignerClient";

export const dynamic = "force-dynamic";

export default async function DealPublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ publicId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { publicId } = await params;
  const { token } = await searchParams;

  const room = await getRoomByPublicId(publicId);
  if (!room) notFound();

  // Token mágico válido → identidad del firmante (solo se muestra a su dueño)
  let signerEmail: string | null = null;
  if (typeof token === "string" && token) {
    const payload = verifyDealToken(token);
    if (payload && payload.sub === publicId && payload.type === "deal_access") {
      signerEmail = payload.email;
    }
  }

  const view = publicRoomView(room);

  // Room chaining: resolve next room's publicId
  if (room.nextRoomId) {
    const nextRoom = await getRoom(room.nextRoomId);
    if (nextRoom) {
      view.nextRoomPublicId = nextRoom.publicId;
      view.nextRoomKind = nextRoom.kind;
      view.nextRoomKindLabel = KIND_LABEL[nextRoom.kind as keyof typeof KIND_LABEL] ?? nextRoom.kind;
    }
  }

  return (
    <DealSignerClient
      publicId={publicId}
      room={view}
      initialEmail={signerEmail}
      rawToken={signerEmail ? token ?? null : null}
    />
  );
}
