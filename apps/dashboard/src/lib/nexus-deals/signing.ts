export interface SignMessageInput {
  publicId: string;
  kind: string;
  counterparty: string;
  email: string;
  name: string;
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
    `Nombre: ${input.name}`,
  ].join("\n");
}
