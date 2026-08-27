/**
 * 📜 Sovereign Sign Domain Contract & Execution Types
 * 
 * Etapa 1 — Sovereign Sign / Evidence Layer
 * Zero-Platform Dependency Architecture
 */

export type EnvelopeStatus = 
  | 'DRAFT'
  | 'PENDING_SIGNATURES'
  | 'COMPLETED'
  | 'DECLINED'
  | 'REVOKED'
  | 'EXPIRED';

export type SigningPolicy = 
  | 'PARALLEL'     // All signers can sign in any order
  | 'SEQUENTIAL'   // Strict order: signer 0 -> signer 1 -> signer N
  | 'M_OF_N';      // Threshold policy: M valid signatures required

export type SignerRole = 'SIGNER' | 'APPROVER' | 'WITNESS' | 'OBSERVER';

export type SignerStatus = 
  | 'PENDING'
  | 'INVITED'
  | 'VIEWED'
  | 'SIGNED'
  | 'DECLINED';

export type AuthMethod = 
  | 'MAGIC_LINK'
  | 'SIWE_ETHEREUM'
  | 'PASSKEY_WEBAUTHN'
  | 'EMAIL_OTP'
  | 'DEAL_ROOM_INTERNAL';

export type SigningMethod = 
  | 'WALLET_EIP712'        // EVM secp256k1 cryptographic signature
  | 'PASSKEY_P256'         // WebAuthn Passkey signature
  | 'SMART_WALLET_ERC4337' // Account Abstraction smart signature
  | 'E_FIRMA_SAT';         // Stage 2: SAT PKI X.509 signature

export interface SignerAuthentication {
  authMethod: AuthMethod;
  authenticatedAt: string; // ISO string
  ipAddress: string;
  userAgent: string;
  authProofToken?: string;
}

export interface SignatureProof {
  signingMethod: SigningMethod;
  signerAddress: string;
  signature: string;                // Hex string 0x...
  signedDocumentHash: string;       // Canonical SHA-256 of document at sign time
  typedDataPayload: Record<string, any>;
  signedAt: string;                 // ISO string
  visualSignatureSvg?: string;
}

export interface SignerParticipant {
  signerId: string;                 // UUID v4
  email: string;
  name: string;
  role: SignerRole;
  orderIndex: number;
  status: SignerStatus;
  claimedWalletAddress?: string;
  externalIdentifier?: string;      // RFC / CURP / Passport
  authentication?: SignerAuthentication;
  signatureProof?: SignatureProof;
  declinedReason?: string;
  declinedAt?: string;
}

export interface BlockchainEvidence {
  chainId: number;                  // 137, 8453, 84532
  contractAddress: string;
  transactionHash: string;
  blockNumber: number;
  blockTimestamp: number;
  registryEventIndex: number;
  rootEvidenceHash: string;         // SHA-256 of complete Evidence Package
}

export interface PreservationEvidence {
  standard: 'NOM-151-SCFI-2016' | 'RFC-3161' | 'EIDAS';
  provider: string;                 // PSC name accredited by SE
  timestampToken: string;           // ASN.1 DER Base64 RFC 3161 token
  serialNumber: string;
  issuedAt: string;                 // ISO string
  pscCertificateChain?: string[];
}

export interface DocumentEnvelope {
  envelopeId: string;               // UUID v4
  organizationId: string;           // Tenant slug
  title: string;
  description?: string;
  
  // Document Canonical Identity
  documentHash: string;             // SHA-256 canonical hash (lowercase hex)
  canonicalDocumentCid: string;     // Primary IPFS CID (Kubo)
  backupDocumentCid?: string;       // Pinata DR CID
  documentVersion: number;          // 1
  documentSize: number;             // Bytes
  mimeType: 'application/pdf';

  // Execution & Policy
  signingPolicy: SigningPolicy;
  thresholdM?: number;
  signers: SignerParticipant[];
  status: EnvelopeStatus;

  // Evidence Package & On-Chain Proof
  evidencePackageCid?: string;
  blockchainEvidence?: BlockchainEvidence;
  preservationEvidence?: PreservationEvidence; // Stage 2: NOM-151

  // Timestamps
  createdAt: string;
  expiresAt?: string;
  completedAt?: string;
  updatedAt: string;
}

export interface EvidenceManifest {
  manifestVersion: '1.0';
  envelopeId: string;
  organizationId: string;
  title: string;
  documentHash: string;
  documentSize: number;
  documentMimeType: string;
  signingPolicy: SigningPolicy;
  totalSigners: number;
  requiredSignatures: number;
  receivedSignatures: number;
  completionCondition: string; // e.g. "ALL_SIGNERS_SATISFIED" | "2_OF_3_THRESHOLD_MET"
  status: EnvelopeStatus;
  createdAt: string;
  finalizedAt: string;
  primaryCid: string;
  backupCid?: string;
  blockchain?: BlockchainEvidence;
  preservation?: PreservationEvidence;
  legalScopeStatement: string;
}
