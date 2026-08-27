import { verifyTypedData } from 'viem';

export interface SovereignDocumentAgreementMessage {
  envelopeId: string;
  organizationId: string;
  documentTitle: string;
  documentHash: `0x${string}`;
  signerEmail: string;
  signerRole: string;
  signedAt: bigint;
  statement: string;
}

export const EIP712_DOCUMENT_TYPES = {
  SovereignDocumentAgreement: [
    { name: 'envelopeId', type: 'string' },
    { name: 'organizationId', type: 'string' },
    { name: 'documentTitle', type: 'string' },
    { name: 'documentHash', type: 'bytes32' },
    { name: 'signerEmail', type: 'string' },
    { name: 'signerRole', type: 'string' },
    { name: 'signedAt', type: 'uint256' },
    { name: 'statement', type: 'string' },
  ],
} as const;

export class EIP712Builder {
  public static readonly DEFAULT_STATEMENT = 
    'Declaro mi consentimiento legal y conformidad con el contenido íntegro del documento identificado por el hash anterior.';

  /**
   * Constructs canonical EIP-712 Domain object
   */
  public static buildDomain(chainId = 8453, verifyingContract?: string) {
    return {
      name: 'Pandoras Sovereign Sign',
      version: '1.0',
      chainId: BigInt(chainId),
      verifyingContract: (verifyingContract || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    };
  }

  /**
   * Constructs the Typed Data Payload for a signer
   */
  public static buildTypedData(params: {
    envelopeId: string;
    organizationId: string;
    documentTitle: string;
    documentHash: string;
    signerEmail: string;
    signerRole: string;
    signedAt: number;
    chainId?: number;
    verifyingContract?: string;
    customStatement?: string;
  }) {
    const docHashHex = (
      params.documentHash.startsWith('0x') 
        ? params.documentHash 
        : `0x${params.documentHash}`
    ) as `0x${string}`;

    const domain = this.buildDomain(params.chainId, params.verifyingContract);

    const message: SovereignDocumentAgreementMessage = {
      envelopeId: params.envelopeId,
      organizationId: params.organizationId,
      documentTitle: params.documentTitle,
      documentHash: docHashHex,
      signerEmail: params.signerEmail.toLowerCase().trim(),
      signerRole: params.signerRole,
      signedAt: BigInt(params.signedAt),
      statement: params.customStatement || this.DEFAULT_STATEMENT,
    };

    return {
      domain,
      types: EIP712_DOCUMENT_TYPES,
      primaryType: 'SovereignDocumentAgreement' as const,
      message,
    };
  }

  /**
   * Cryptographically verifies an EIP-712 signature against the expected signer address
   */
  public static async verifySignature(params: {
    signerAddress: string;
    signature: `0x${string}`;
    envelopeId: string;
    organizationId: string;
    documentTitle: string;
    documentHash: string;
    signerEmail: string;
    signerRole: string;
    signedAt: number;
    chainId?: number;
    verifyingContract?: string;
    customStatement?: string;
  }): Promise<{ isValid: boolean; error?: string }> {
    try {
      const typedData = this.buildTypedData({
        envelopeId: params.envelopeId,
        organizationId: params.organizationId,
        documentTitle: params.documentTitle,
        documentHash: params.documentHash,
        signerEmail: params.signerEmail,
        signerRole: params.signerRole,
        signedAt: params.signedAt,
        chainId: params.chainId,
        verifyingContract: params.verifyingContract,
        customStatement: params.customStatement,
      });

      const valid = await verifyTypedData({
        address: params.signerAddress as `0x${string}`,
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
        signature: params.signature,
      });

      return { isValid: valid };
    } catch (err: any) {
      return { isValid: false, error: err?.message || 'Signature verification failed' };
    }
  }
}
