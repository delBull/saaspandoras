export interface SignMessageInput {
  publicId: string;
  kind: string;
  counterparty: string;
  email: string;
  name: string;
  company?: string;
  role?: string;
}

/**
 * Mensaje determinista que firma el firmante del Deal Room (EIP-191).
 * Debe ser idéntico entre cliente (signMessage) y servidor (verifySignature).
 */
export function buildSignMessage(input: SignMessageInput): string {
  return [
    "Pandora's Nexus · Aceptación Verificada",
    `Room: ${input.publicId}`,
    `Documento: ${input.kind}`,
    `Parte: ${input.counterparty}`,
    `Firmante: ${input.email}`,
    input.company ? `Nombre: ${input.name}, en representación de ${input.company} (${input.role || 'Representante Legal'})` : `Nombre: ${input.name}`,
  ].join("\n");
}
