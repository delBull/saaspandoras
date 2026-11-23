import { buildNdaPdf } from "./nda-pdf";

/**
 * PDF de una sala completa (contratos, acuerdos, cartas).
 *
 * Reutiliza el mismo compositor que el NDA: carta, márgenes de 2 cm, paginación
 * y numeración propias. El texto sale de las secciones de la sala, así que el
 * PDF y lo que se firma en pantalla son la misma fuente.
 *
 * Variables: los textos pueden traer `{{COUNTERPARTY}}` y `{{REPRESENTATIVE}}`.
 * Se resuelven con lo que el firmante escribió al firmar; si aún no firma, con
 * la contraparte de la sala y la leyenda "por el cliente al firmar".
 */

export interface RoomPdfSignature {
  name: string | null;
  company: string | null;
  role: string | null;
  signedAt: string | null;
  wallet: string | null;
  signature: string | null;
}

export async function buildRoomPdf(input: {
  title: string;
  subtitle: string;
  dealId: string;
  counterparty: string;
  /** Parte que presta/emite (AZTECAZ, Marco, Pandora's…). Nunca se asume. */
  provider: string;
  sections: Array<{ title: string; content: string }>;
  signature?: RoomPdfSignature | null;
}): Promise<Uint8Array> {
  const signature = input.signature ?? null;
  const provider = input.provider?.trim() || "Pandora's";
  const counterparty = signature?.company?.trim() || input.counterparty;
  const representative = signature?.name?.trim() || "por el cliente al firmar";

  const substitute = (text: string): string => {
    // Sólo se sustituyen tokens explícitos. Reemplazar la mención literal de la
    // contraparte corrompía salas donde la contraparte es una persona o el
    // activo (p. ej. una propuesta donde el firmante es el propio destinatario).
    return text
      .replace(/{{COUNTERPARTY_COMPANY}}/gi, counterparty)
      .replace(/{{COUNTERPARTY}}/gi, counterparty)
      .replace(/{{REPRESENTATIVE}}/gi, representative);
  };

  const parts = input.sections.map((section) => {
    const title = substitute(section.title);
    const content = substitute(section.content);
    return `## ${title}\n\n${content}`;
  });

  if (signature) {
    const lines = [
      `**Firmado electrónicamente por EL CLIENTE**`,
      ``,
      `Nombre: ${signature.name ?? "—"}`,
      `Denominación: ${signature.company ?? counterparty}`,
      `Cargo: ${signature.role ?? "—"}`,
      `Fecha: ${signature.signedAt ? new Date(signature.signedAt).toLocaleString("es-MX") : "—"}`,
      `Wallet: ${
        signature.wallet
          ? `${signature.wallet.slice(0, 6)}…${signature.wallet.slice(-4)}`
          : "—"
      }`,
      `Firma (hash): ${signature.signature ? signature.signature.slice(0, 42) + "…" : "—"}`,
      ``,
      `**${provider.toUpperCase()}**`,
      ``,
      `Firma autógrafa en el ejemplar físico: ______________________________`,
    ];
    parts.push(`## Registro de firma electrónica\n\n${lines.join("\n")}`);
  }

  return buildNdaPdf({
    title: substitute(input.title),
    subtitle: substitute(input.subtitle),
    version: "1.0",
    dealId: input.dealId,
    counterparty,
    fullText: parts.join("\n\n"),
    // La cabecera es quien emite: AZTECAZ en Village, Marco en el contrato de
    // medios. Evita presentar como Pandora's un contrato de otra parte.
    brand: provider,
  });
}
