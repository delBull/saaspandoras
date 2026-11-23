import { buildNdaPdf } from "./nda-pdf";

/**
 * PDF de una sala completa (contratos, acuerdos, cartas).
 *
 * Reutiliza el mismo compositor que el NDA: carta, márgenes de 2 cm, paginación
 * y numeración propias. El texto sale de las secciones de la sala, así que el
 * PDF y lo que se firma en pantalla son la misma fuente.
 */
export async function buildRoomPdf(input: {
  title: string;
  subtitle: string;
  dealId: string;
  counterparty: string;
  sections: Array<{ title: string; content: string }>;
}): Promise<Uint8Array> {
  const fullText = input.sections
    .map((section) => `## ${section.title}\n\n${section.content}`)
    .join("\n\n");

  return buildNdaPdf({
    title: input.title,
    subtitle: input.subtitle,
    version: "1.0",
    dealId: input.dealId,
    counterparty: input.counterparty,
    fullText,
  });
}
