import { notFound } from "next/navigation";
import { getRoomByPublicId } from "@/lib/nexus-deals/repo";
import { getAuth, isAdmin } from "@/lib/auth";
import { db } from "@/db";
import { nexusNdaAcceptances } from "@/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { NDA_FULL_TEXT, NDA_TITLE } from "@/lib/nexus-deals/nda-content";

export const dynamic = "force-dynamic";

export default async function PrintNdaPage({
  params,
  searchParams,
}: {
  params: Promise<{ publicId: string }>;
  searchParams: Promise<{ unlock?: string }>;
}) {
  const { publicId } = await params;
  const { unlock } = await searchParams;
  const { session, isVerified } = await getAuth();
  
  let authorized = false;
  
  if (isVerified && session?.address && (await isAdmin(session.address))) {
    authorized = true;
  }
  
  if (!authorized && typeof unlock === "string" && unlock) {
    const { verifyUnlockToken } = await import("@/lib/nexus-deals/tokens");
    authorized = await verifyUnlockToken(unlock);
  }
  
  if (!authorized) {
    return <div className="p-8 text-red-500 font-mono">No autorizado</div>;
  }

  const room = await getRoomByPublicId(publicId);
  if (!room || !room.ndaEnabled) notFound();

  const ndaContent = NDA_FULL_TEXT;
  const signerEmails = room.signers.map(s => s.email);

  let acceptances: typeof nexusNdaAcceptances.$inferSelect[] = [];
  
  if (signerEmails.length > 0) {
    acceptances = await db.select()
      .from(nexusNdaAcceptances)
      .where(
        and(
          inArray(nexusNdaAcceptances.email, signerEmails),
          eq(nexusNdaAcceptances.ndaVersion, room.ndaVersion ?? "v1.0")
        )
      );
  }

  // Preserve paragraph breaks
  const formattedContent = ndaContent.split("\n\n").map((p: string, i: number) => (
    <p key={i} className="mb-4">{p}</p>
  ));

  return (
    <div className="bg-white min-h-screen text-black font-sans p-8 print:p-0">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 border-b-2 border-black pb-6">
          <h1 className="text-2xl font-bold uppercase tracking-wide mb-2">{NDA_TITLE}</h1>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm text-gray-600">ID: {room.publicId}</p>
              <p className="text-sm font-semibold mt-1">Contraparte: {room.counterparty}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Fecha de impresión: {new Date().toLocaleDateString('es-ES')}</p>
              <p className="text-sm font-semibold mt-1">Versión NDA: {room.ndaVersion ?? "v1.0"}</p>
            </div>
          </div>
        </header>

        <main className="text-sm text-justify">
          {formattedContent}
        </main>

        <div className="mt-16 break-inside-avoid">
          <h3 className="text-xl font-bold uppercase border-b-2 border-black pb-2 mb-6">Firmas Criptográficas (Aceptaciones NDA)</h3>
          {acceptances.length === 0 ? (
            <p className="text-amber-600 italic">No hay aceptaciones de NDA registradas para los firmantes de este documento.</p>
          ) : (
            <div className="grid grid-cols-2 gap-8">
              {acceptances.map(acc => (
                <div key={acc.id} className="border border-gray-300 p-4 rounded-lg">
                  <p className="font-semibold text-lg">{acc.email}</p>
                  <p className="text-xs text-gray-600 mb-2 font-mono break-all">{acc.wallet || "Wallet no registrada"}</p>
                  <div className="text-xs text-green-700 font-mono space-y-1">
                    <p>✓ ACEPTADO ON-CHAIN / MAGIC LINK</p>
                    <p>Fecha: {new Date(acc.acceptedAt).toLocaleString('es-ES')}</p>
                    <p>IP: {acc.ip || "N/A"}</p>
                  </div>
                  {acc.signature && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Firma EIP-191</p>
                      <p className="text-[9px] font-mono text-gray-700 break-all bg-gray-50 p-2 rounded">{acc.signature}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className="mt-20 pt-8 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>Documento generado desde Pandora's Nexus Console</p>
          <p>ID: {room.publicId}</p>
        </footer>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.onload = function() {
              window.print();
            }
          `
        }}
      />
    </div>
  );
}
