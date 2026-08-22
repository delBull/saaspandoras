/**
 * 🏛️ Pandora's Hermes OS — Milestone 8.0: K25 Knowledge Registry Manifest
 * src/lib/pandoras/core/domains/hermes/knowledge/registry-manifest.ts
 *
 * Compiles canonical knowledge registry entries into verifiable Merkle roots and signs
 * institutional EIP-712 attestations with the Hermes Identity Wallet.
 */

import { createHash } from 'crypto';
import type { HermesIdentitySigner } from '../identity/identity-signer';
import type { KnowledgeClassificationTier } from '../runtime/contracts';

export interface KnowledgeRegistryItem {
  id: string;
  tenantId: string;
  domain: string;
  artifactId: string;
  classification: KnowledgeClassificationTier;
  version: number;
  contentHash: string;
  ciphertextHash?: string | null;
  ipfsCid: string;
  ipfsUri: string;
  aadBinding?: string | null;
}

export interface SignedKnowledgeManifest {
  manifestId: string;
  tenantId: string;
  domain: string;
  merkleRoot: string;
  totalArtifacts: number;
  artifactCids: string[];
  signedByAddress: string;
  agentSignature: string;
  createdAt: string;
}

export class KnowledgeRegistryManifestBuilder {
  /**
   * Computes a SHA-256 Merkle root from an array of knowledge registry items.
   */
  public static computeMerkleRoot(items: KnowledgeRegistryItem[]): string {
    if (items.length === 0) {
      return createHash('sha256').update('EMPTY_KNOWLEDGE_VAULT').digest('hex');
    }

    let hashes = items.map(item => {
      const canonical = `${item.tenantId}:${item.domain}:${item.artifactId}:${item.version}:${item.contentHash}:${item.ipfsCid}`;
      return createHash('sha256').update(canonical).digest('hex');
    }).sort();

    while (hashes.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i] || '';
        const right = hashes[i + 1];
        if (right !== undefined) {
          const combined = createHash('sha256').update(left + right).digest('hex');
          nextLevel.push(combined);
        } else {
          nextLevel.push(left);
        }
      }
      hashes = nextLevel;
    }

    return hashes[0] || createHash('sha256').update('EMPTY_KNOWLEDGE_VAULT').digest('hex');
  }

  /**
   * Builds and signs a canonical Knowledge Manifest with the Hermes Identity Wallet.
   */
  public async buildAndSignManifest(
    tenantId: string,
    domain: string,
    items: KnowledgeRegistryItem[],
    signer: HermesIdentitySigner
  ): Promise<SignedKnowledgeManifest> {
    const merkleRoot = KnowledgeRegistryManifestBuilder.computeMerkleRoot(items);
    const manifestId = `man_${tenantId}_${domain}_${Date.now()}`;
    const createdAt = new Date().toISOString();

    const signed = await signer.signIntent({
      tenantId,
      actorId: `hermes_manifest_${domain}`,
      actionName: 'KNOWLEDGE_MANIFEST_ANCHOR',
      resourceId: manifestId,
      policyHash: merkleRoot,
    });

    return {
      manifestId,
      tenantId,
      domain,
      merkleRoot,
      totalArtifacts: items.length,
      artifactCids: items.map(i => i.ipfsCid),
      signedByAddress: signer.getPublicAddress(),
      agentSignature: signed.signature,
      createdAt,
    };
  }
}
