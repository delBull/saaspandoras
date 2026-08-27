import crypto from 'crypto';
import { SignerParticipant } from './types';

/**
 * 📜 Canonical Document & Evidence Hasher (RFC-8785 Compliant Determinism)
 * 
 * Computes deterministic SHA-256 digests for raw PDF buffers, canonical JSON structures,
 * and multi-signer evidence trees.
 */
export class DocumentHasher {
  /**
   * Computes lowercase hex SHA-256 for a raw byte buffer (e.g. PDF file)
   */
  public static hashBuffer(buffer: Buffer | Uint8Array): string {
    return crypto.createHash('sha256').update(buffer).digest('hex').toLowerCase();
  }

  /**
   * RFC-8785 Canonical JSON serializer for deterministic hashing
   */
  public static canonicalize(obj: any): string {
    if (obj === null || typeof obj !== 'object') {
      if (typeof obj === 'bigint') return obj.toString();
      return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
      return `[${obj.map(item => this.canonicalize(item)).join(',')}]`;
    }
    const sortedKeys = Object.keys(obj).sort();
    const keyValPairs = sortedKeys.map(
      key => `${JSON.stringify(key)}:${this.canonicalize(obj[key])}`
    );
    return `{${keyValPairs.join(',')}}`;
  }

  /**
   * Computes lowercase hex SHA-256 for a canonical JSON object
   */
  public static hashObject(obj: Record<string, any>): string {
    const canonicalStr = this.canonicalize(obj);
    return crypto.createHash('sha256').update(canonicalStr, 'utf8').digest('hex').toLowerCase();
  }

  /**
   * Computes deterministic canonical digest of all collected signatures:
   * 1. Filters only signers with status 'SIGNED'
   * 2. Sorts signers deterministically by signerAddress (lowercase)
   * 3. Serializes strictly canonical tuple
   */
  public static computeSignaturesDigest(signers: SignerParticipant[]): string {
    const signedList = signers
      .filter(s => s.status === 'SIGNED' && s.signatureProof)
      .map(s => ({
        signerId: s.signerId,
        signerAddress: s.signatureProof!.signerAddress.toLowerCase(),
        signature: s.signatureProof!.signature.toLowerCase(),
        signedAt: s.signatureProof!.signedAt,
        signedDocumentHash: s.signatureProof!.signedDocumentHash.toLowerCase(),
        signingMethod: s.signatureProof!.signingMethod,
      }))
      .sort((a, b) => a.signerAddress.localeCompare(b.signerAddress));

    return this.hashObject({ signatures: signedList });
  }

  /**
   * Computes the Root Evidence Hash:
   * SHA-256(canonicalDocumentHash + ":" + signaturesDigest + ":" + manifestDigest)
   */
  public static computeRootEvidenceHash(
    documentHash: string,
    signaturesDigest: string,
    manifestDigest: string
  ): string {
    const combined = `${documentHash.toLowerCase()}:${signaturesDigest.toLowerCase()}:${manifestDigest.toLowerCase()}`;
    return crypto.createHash('sha256').update(combined, 'utf8').digest('hex').toLowerCase();
  }
}
