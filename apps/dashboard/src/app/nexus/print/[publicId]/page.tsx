import { notFound } from "next/navigation";
import { getRoomByPublicId } from "@/lib/nexus-deals/repo";
import { getAuth, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PrintDealRoomPage({
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
  if (!room) notFound();

  // Mapear secciones
  const sections = room.sections;

  // Determinar nombre dinámico para el PDF
  let dynamicPartyName = room.company || room.counterparty || "[CONTRAPARTE]";
  if (room.status === "DRAFT") {
    dynamicPartyName = "[NOMBRE / RAZÓN SOCIAL DE LA CONTRAPARTE]";
  } else if (room.signers && room.signers.length > 0) {
    const signer = room.signers.find(s => s.signatureCompany || s.signatureName);
    if (signer) {
      dynamicPartyName = signer.signatureCompany || signer.signatureName || dynamicPartyName;
    }
  }

  const resolveText = (text: string) => {
    if (!text) return "";
    let result = text
      .replace(/{{COUNTERPARTY_COMPANY}}/gi, dynamicPartyName)
      .replace(/{{COUNTERPARTY}}/gi, dynamicPartyName)
      .replace(/Pandora's LLC/gi, "marca Pandora's y sus servicios bajo la umbrela de MXHUB ECOSISTEMA BLOCKCHAIN S.A. DE C.V.");

    if (room.counterparty && dynamicPartyName !== room.counterparty) {
      const originalName = room.counterparty.trim();
      const firstName = originalName.split(' ')[0] || '';
      const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const fullRegex = new RegExp(escapeRegExp(originalName), 'g');
      result = result.replace(fullRegex, dynamicPartyName);
      if (firstName.length > 3) {
        const firstRegex = new RegExp(escapeRegExp(firstName), 'g');
        result = result.replace(firstRegex, dynamicPartyName);
      }
    }
    
    // Quick markdown parser for the print view
    result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/### (.*?)(?=\n|$)/g, '<h3 class="text-sm font-semibold mt-3 mb-1">$1</h3>');
    result = result.replace(/## (.*?)(?=\n|$)/g, '<h2 class="text-base font-bold mt-4 mb-2">$1</h2>');
    
    return result;
  };

  return (
    <div className="bg-white min-h-screen text-black font-sans p-8 print:p-0">
      <style dangerouslySetInnerHTML={{ __html: `
        @page { margin: 2.54cm; }
      `}} />
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 border-b-2 border-black pb-6">
          <h1 className="text-3xl font-bold uppercase tracking-wide mb-2">{room.kind}</h1>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm text-gray-600">ID: {room.publicId}</p>
              <p className="text-sm font-semibold mt-1">Contraparte: {room.status === "DRAFT" ? "[POR DEFINIR]" : room.counterparty}</p>
              <p className="text-sm text-gray-600">Compañía: {room.status === "DRAFT" ? "[POR DEFINIR]" : (room.company || "N/A")}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Fecha: {new Date().toLocaleDateString('es-ES')}</p>
              <p className="text-sm font-semibold mt-1">Status: {room.status}</p>
            </div>
          </div>
        </header>

        <main className="space-y-12">
          {sections.map((sec, idx) => (
            <section key={sec.id} className="break-inside-avoid">
              <div className="mb-4">
                <h2 className="text-xl font-bold uppercase tracking-wider">{idx + 1}. {resolveText(sec.title)}</h2>
                {sec.subtitle && <p className="text-sm text-gray-600 italic">{resolveText(sec.subtitle)}</p>}
              </div>
              <div 
                className="prose prose-sm max-w-none text-black whitespace-pre-wrap prose-p:text-black prose-headings:text-black prose-strong:text-black prose-a:text-black prose-li:text-black"
                dangerouslySetInnerHTML={{ __html: resolveText(sec.content) }}
              />
            </section>
          ))}
        </main>

        {room.signers && room.signers.length > 0 && (
          <div className="mt-16 break-inside-avoid">
            <h3 className="text-xl font-bold uppercase border-b-2 border-black pb-2 mb-6">Firmas</h3>
            <div className="grid grid-cols-2 gap-8">
              {room.signers.map(s => (
                <div key={s.id} className="border border-gray-300 p-4 rounded-lg">
                  {s.signatureCompany ? (
                    <>
                      <p className="font-bold text-lg uppercase">{s.signatureCompany}</p>
                      <p className="text-sm text-gray-700 font-medium">Representante Legal: {s.signatureName} ({s.signatureRole || "Representante Legal"})</p>
                    </>
                  ) : (
                    <p className="font-semibold text-lg">{s.signatureName || s.email}</p>
                  )}
                  <p className="text-xs text-gray-500 mb-4 font-mono mt-1">Wallet: {s.wallet || "Pendiente"}</p>
                  {s.status === "SIGNED" ? (
                    <div className="text-sm text-green-700 font-mono">
                      <p>✓ FIRMADO ON-CHAIN</p>
                      <p>Fecha: {new Date(s.signedAt!).toLocaleString('es-ES')}</p>
                    </div>
                  ) : (
                    <div className="text-sm text-amber-600 font-mono italic">
                      <p>Pendiente de firma</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="mt-20 pt-8 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>Documento generado desde Pandora's Nexus Console</p>
          <p>ID: {room.publicId}</p>
        </footer>
      </div>

      {/* Auto-print script */}
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
