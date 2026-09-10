/**
 * 🔐 Canonical CIDv1 Derivation (pure cryptographic math — provider-agnostic)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/knowledge/ipfs/canonical-cid.ts
 *
 * Deterministic RFC4648 CIDv1 base32 derivation (raw codec + sha2-256 multihash).
 * Produces the EXACT same CID a Kubo node computes for the same single raw leaf
 * (add?cid-version=1&raw-leaves=true), enabling content-addressed dual fidelity:
 *   derived CID === pinned CID  ⇒ integrity verified across providers.
 */

import crypto from 'crypto';

const RFC4648_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567';

/**
 * Canonical CIDv1 base32 for an exact raw content string.
 * CID prefix: 0x01 (cidv1) 0x55 (raw codec) 0x12 (sha2-256) 0x20 (32 bytes).
 */
export function computeCanonicalCidV1Raw(content: string): string {
  const hash = crypto.createHash('sha256').update(content, 'utf8').digest();
  const multihash = Buffer.concat([Buffer.from([0x01, 0x55, 0x12, 0x20]), hash]);

  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < multihash.length; i++) {
    value = (value << 8) | (multihash[i] ?? 0);
    bits += 8;
    while (bits >= 5) {
      output += RFC4648_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += RFC4648_ALPHABET[(value << (5 - bits)) & 31];
  }
  return `b${output}`;
}

/**
 * Convenience wrapper: JSON-stabilize arbitrary data then derive its CID
 * using the same serialization contract as pinJson (JSON.stringify pass-through for strings).
 */
export function computeCanonicalCidV1ForData(data: unknown): string {
  const content = typeof data === 'string' ? data : JSON.stringify(data);
  return computeCanonicalCidV1Raw(content);
}
