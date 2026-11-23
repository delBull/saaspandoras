import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNdaConfig, getRoomByPublicId } from "@saasfly/nexus-deals-sdk";
import { PrintTrigger } from "./PrintTrigger";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Acuerdo de confidencialidad",
  robots: { index: false, follow: false },
};

/**
 * Vista imprimible del NDA de una sala.
 *
 * Pública a propósito: el texto ya se muestra antes de firmar y no contiene PII.
 * Objetivo: que el PDF salga centrado, con márgenes reales y sin el chrome oscuro
 * de la aplicación (que era lo que se desbordaba al imprimir desde el modal).
 */
export default async function DealNdaPrintPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const room = await getRoomByPublicId(publicId);
  if (!room) notFound();

  const cfg = getNdaConfig(room.ndaVersion);
  const paragraphs = cfg.fullText.split("\n").filter((line) => line.trim().length > 0);

  return (
    <main className="min-h-screen bg-zinc-100 text-black print:bg-white">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page { size: letter; margin: 2cm; }
            @media print {
              .no-print { display: none !important; }
              body { background: #fff !important; }
              .nda-sheet { box-shadow: none !important; margin: 0 !important; max-width: none !important; }
            }
          `,
        }}
      />

      <div className="no-print flex items-center justify-between gap-3 bg-white px-6 py-3 shadow-sm">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">Documento</p>
          <p className="text-sm font-semibold text-zinc-900">{cfg.title}</p>
        </div>
        <PrintTrigger />
      </div>

      <article className="nda-sheet mx-auto my-8 max-w-[21cm] bg-white px-[2cm] py-[2cm] shadow-lg print:my-0 print:max-w-none print:px-0 print:py-0">
        <header className="mb-8 border-b border-zinc-300 pb-4">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">Pandora&apos;s · AZTECAZ</p>
          <h1 className="mt-2 text-[20px] font-bold leading-snug text-black">{cfg.title}</h1>
          <p className="mt-1 text-[12px] text-zinc-600">{cfg.subtitle}</p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-zinc-600">
            <span>Deal: {room.publicId}</span>
            <span>Versión: {cfg.version}</span>
            <span>Contraparte: {room.counterparty}</span>
          </div>
        </header>

        <div className="space-y-3 text-[12.5px] leading-relaxed text-black">
          {paragraphs.map((line, index) => (
            <p key={index} className={line === line.toUpperCase() && line.length < 120 ? "font-semibold" : ""}>
              {line}
            </p>
          ))}
        </div>

        <footer className="mt-10 border-t border-zinc-300 pt-4 text-[10px] text-zinc-500">
          Documento generado desde el Deal Room de Nexus. La firma electrónica se registra en la
          plataforma con correo, wallet, fecha y hash.
        </footer>
      </article>
    </main>
  );
}
