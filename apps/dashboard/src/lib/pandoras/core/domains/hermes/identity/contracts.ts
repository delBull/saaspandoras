/**
 * 🏛️ Hermes OS — Milestone 6.0: K23 Cryptographic Identity Contracts & EIP-712 Schema
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/identity/contracts.ts
 */

export interface HermesActionIntent {
  hermesAddress: string;     // Ethereum address of the Hermes instance (0x...)
  tenantId: string;          // Scoped tenant ID (e.g. 'snarai')
  actorId: string;           // Human actor who initiated the interaction
  actionName: string;        // Tool or operation name (e.g. 'leads.capture_contact')
  resourceId: string;        // Target resource identifier
  policyHash: string;        // SHA-256 hash of active tenant policy configuration
  timestamp: number;         // Unix timestamp in seconds
  nonce: string;             // Ephemeral nonce anti-replay
}

export interface SignedHermesActionIntent {
  intent: HermesActionIntent;
  signature: string;         // EIP-712 signature (0x...)
}

export interface HermesIdentityRecord {
  id: string;
  publicAddress: string;
  tenantId: string;
  instanceId: string;
  capabilities: string[];
  policyHash: string;
  status: 'ACTIVE' | 'REVOKED' | 'ROTATED';
  createdAt: Date;
  expiresAt: Date;
}

export const HERMES_EIP712_DOMAIN = {
  name: 'Pandoras Hermes OS',
  version: '1.0.0',
  chainId: 11155111, // Sepolia / Mainnet Anchor
  verifyingContract: '0x0000000000000000000000000000000000000000' as `0x${string}`,
};

export const HERMES_EIP712_TYPES = {
  HermesActionIntent: [
    { name: 'hermesAddress', type: 'address' },
    { name: 'tenantId', type: 'string' },
    { name: 'actorId', type: 'string' },
    { name: 'actionName', type: 'string' },
    { name: 'resourceId', type: 'string' },
    { name: 'policyHash', type: 'string' },
    { name: 'timestamp', type: 'uint256' },
    { name: 'nonce', type: 'string' },
  ],
};
