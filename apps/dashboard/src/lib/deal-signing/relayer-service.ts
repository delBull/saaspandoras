import { db } from '@/db';
import { dealEnvelopes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http, publicActions } from 'viem';
import { base, baseSepolia, polygon } from 'viem/chains';
import { BlockchainEvidence } from './types';

// ABI for anchorDocument in SovereignEvidenceRegistry
export const SOVEREIGN_EVIDENCE_REGISTRY_ABI = [
  {
    type: 'function',
    name: 'anchorDocument',
    inputs: [
      { name: 'envelopeId', type: 'string' },
      { name: 'documentHash', type: 'bytes32' },
      { name: 'rootEvidenceHash', type: 'bytes32' },
      { name: 'evidencePackageCid', type: 'string' },
      { name: 'organizationId', type: 'string' },
      { name: 'signersCount', type: 'uint32' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'verifyDocument',
    inputs: [{ name: 'documentHash', type: 'bytes32' }],
    outputs: [
      { name: 'isAnchored', type: 'bool' },
      { name: 'rootEvidenceHash', type: 'bytes32' },
      { name: 'evidencePackageCid', type: 'string' },
      { name: 'organizationId', type: 'string' },
      { name: 'signersCount', type: 'uint32' },
      { name: 'finalizedAt', type: 'uint64' },
      { name: 'registrar', type: 'address' },
    ],
    stateMutability: 'view',
  },
] as const;

export class SovereignRelayerService {
  /**
   * Resolves the configured Relayer Private Key in priority order
   */
  public static getRelayerKey(): `0x${string}` | null {
    const key = 
      process.env.RELAY_PRIVATE_KEY || 
      process.env.PROTOCOL_ADMIN_PRIVATE_KEY || 
      process.env.ADMIN_PRIVATE_KEY;

    if (!key || key === '0x_production_private_key' || key.length < 64) {
      return null;
    }
    return (key.startsWith('0x') ? key : `0x${key}`) as `0x${string}`;
  }

  /**
   * Resolves the Registry Contract Address
   */
  public static getRegistryAddress(): `0x${string}` {
    const addr = process.env.NEXT_PUBLIC_SOVEREIGN_REGISTRY_ADDRESS || process.env.SOVEREIGN_REGISTRY_ADDRESS;
    return (addr || '0x0000000000000000000000000000000000000000') as `0x${string}`;
  }

  /**
   * Automatically anchors a completed envelope on-chain via Relayer sponsorship
   */
  public static async autoAnchorEnvelope(params: {
    envelopeId: string;
    documentHash: string;
    rootEvidenceHash: string;
    evidencePackageCid: string;
    organizationId: string;
    signersCount: number;
  }): Promise<{ success: boolean; txHash?: string; error?: string }> {
    const relayKey = this.getRelayerKey();
    if (!relayKey) {
      console.log(`ℹ️ [SovereignRelayer] No relay private key configured; skipping auto-anchor for envelope ${params.envelopeId}`);
      return { success: false, error: 'NO_RELAYER_KEY_CONFIGURED' };
    }

    const registryAddress = this.getRegistryAddress();
    if (registryAddress === '0x0000000000000000000000000000000000000000') {
      console.log(`ℹ️ [SovereignRelayer] Registry address not set; skipping auto-anchor for envelope ${params.envelopeId}`);
      return { success: false, error: 'NO_REGISTRY_ADDRESS_CONFIGURED' };
    }

    try {
      const isTestnet = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_CHAIN === 'base-sepolia';
      const targetChain = isTestnet ? baseSepolia : base;
      const account = privateKeyToAccount(relayKey);

      const client = createWalletClient({
        account,
        chain: targetChain,
        transport: http(),
      }).extend(publicActions);

      const docHashHex = (
        params.documentHash.startsWith('0x') 
          ? params.documentHash 
          : `0x${params.documentHash}`
      ) as `0x${string}`;

      const rootHashHex = (
        params.rootEvidenceHash.startsWith('0x') 
          ? params.rootEvidenceHash 
          : `0x${params.rootEvidenceHash}`
      ) as `0x${string}`;

      const txHash = await client.writeContract({
        address: registryAddress,
        abi: SOVEREIGN_EVIDENCE_REGISTRY_ABI,
        functionName: 'anchorDocument',
        args: [
          params.envelopeId,
          docHashHex,
          rootHashHex,
          params.evidencePackageCid,
          params.organizationId,
          params.signersCount,
        ],
      });

      const receipt = await client.waitForTransactionReceipt({ hash: txHash });

      const blockchainEvidence: BlockchainEvidence = {
        chainId: targetChain.id,
        contractAddress: registryAddress,
        transactionHash: txHash,
        blockNumber: Number(receipt.blockNumber),
        blockTimestamp: Math.floor(Date.now() / 1000),
        registryEventIndex: 0,
        rootEvidenceHash: params.rootEvidenceHash,
      };

      // Update database record with blockchain evidence
      await db
        .update(dealEnvelopes)
        .set({
          blockchainEvidence: blockchainEvidence as any,
          updatedAt: new Date(),
        })
        .where(eq(dealEnvelopes.id, params.envelopeId));

      console.log(`✅ [SovereignRelayer] Envelope ${params.envelopeId} anchored on-chain! Tx: ${txHash}`);
      return { success: true, txHash };

    } catch (err: any) {
      console.error(`❌ [SovereignRelayer] Failed to anchor envelope ${params.envelopeId}:`, err?.message);
      return { success: false, error: err?.message || 'Relayer execution failed' };
    }
  }
}
