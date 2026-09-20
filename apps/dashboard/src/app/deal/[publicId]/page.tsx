import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getRoomByPublicId, getRoom, publicRoomView, hasEmailSignedNda } from "@/lib/nexus-deals/repo";
import { verifyDealToken } from "@/lib/nexus-deals/tokens";
import { KIND_LABEL } from "@/lib/nexus-deals/types";
import { getNexusAuthContext } from "@/lib/nexus/nexus-rbac";
import DealSignerClient from "./DealSignerClient";

export const dynamic = "force-dynamic";

export default async function DealPublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ publicId: string }>;
  searchParams: Promise<{ token?: string; preview?: string }>;
}) {
  const { publicId } = await params;
  const { token, preview } = await searchParams;

  const room = await getRoomByPublicId(publicId);
  if (!room) notFound();

  let signerEmail: string | null = null;
  let expectedWallet: string | null = null;
  let rawTokenForClient: string | null = null;

  // Creator / Admin Preview Bypass
  if (preview === "true") {
    const reqHeaders = await headers();
    const auth = await getNexusAuthContext(reqHeaders);
    
    const isAuthorizedRole = ["SUPER_ADMIN", "ADMIN", "MARKETING", "MANAGER", "OPERATOR"].includes(auth.role || "");
    const isCreator = auth.email === room.createdBy || auth.wallet?.toLowerCase() === room.createdBy?.toLowerCase();
    
    if (auth.isAuthenticated && (isAuthorizedRole || isCreator)) {
      signerEmail = auth.email || "creator@pandoras.finance";
      rawTokenForClient = "creator-preview-token";
    }
  }

  // Regular Magic Link Flow
  if (!signerEmail && typeof token === "string" && token) {
    const payload = verifyDealToken(token);
    if (payload && payload.sub === publicId && payload.type === "deal_access") {
      signerEmail = payload.email;
      rawTokenForClient = token;
      
      const signer = room.signers.find((s) => s.email === signerEmail);
      if (signer?.wallet) {
        expectedWallet = signer.wallet;
      } else {
        const ndaRecord = await hasEmailSignedNda(signerEmail, room.ndaVersion || "v1.0");
        if (ndaRecord?.wallet) {
          expectedWallet = ndaRecord.wallet;
        }
      }
    }
  }

  const view = publicRoomView(room);

  // Filter out the creator from the signers list so it appears as a true B2B agreement
  // where the only public signer required is the counterparty.
  if (room.createdBy) {
    view.signers = view.signers.filter((_, idx) => room.signers[idx]?.email !== room.createdBy);
  }

  // If no magic link token is provided, obscure PII from the signers to prevent unauthorized enumeration
  if (!signerEmail) {
    view.signers = view.signers.map(s => ({
      ...s,
      signatureName: s.signatureName ? s.signatureName.charAt(0) + '***' : null,
      signatureCompany: s.signatureCompany ? s.signatureCompany.charAt(0) + '***' : null,
      signatureRole: s.signatureRole ? s.signatureRole.charAt(0) + '***' : null,
    }));
  }

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
      rawToken={rawTokenForClient}
      expectedWallet={expectedWallet}
    />
  );
}
