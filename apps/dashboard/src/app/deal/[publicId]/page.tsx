import { notFound } from "next/navigation";
import { getRoomByPublicId, publicRoomView } from "@/lib/nexus-deals/repo";
import { verifyDealToken } from "@/lib/nexus-deals/tokens";
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

  return (
    <DealSignerClient
      publicId={publicId}
      room={publicRoomView(room)}
      initialEmail={signerEmail}
      rawToken={signerEmail ? token ?? null : null}
    />
  );
}
