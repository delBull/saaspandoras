/**
 * 🚨 Pandora's Sovereign IPFS Alerting
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/knowledge/ipfs/ipfs-alerting.ts
 *
 * Emits strictly focused, human-actionable alerts for critical infrastructure events:
 * 1. 🔴 Kubo Primary Node Down (Triggered fail-over to Pinata DR)
 * 2. 🟡 Pinata DR Mirror Down (Degraded multi-replica redundancy)
 * 3. 🔴 Content Integrity Mismatch (Corrupted or tampered replica payload)
 * 4. 🔴 L3 Durability Degraded (Claim Contract or Legal Agreement missing required replica)
 */

interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

interface DiscordAlertPayload {
  title: string;
  description?: string;
  color: number;
  fields: DiscordEmbedField[];
  footer?: { text: string };
  timestamp?: string;
}

const DISCORD_COLORS = {
  CRITICAL: 15548997, // Red
  WARNING: 16776960,  // Yellow
  RECOVERY: 5763719,  // Green
  INFO: 5793266,      // Blue
};

type InfrastructureComponentState = 'HEALTHY' | 'DEGRADED' | 'DOWN';

// State-transition tracker per component (ensures 1 alert on degradation, 1 alert on recovery, 0 duplicate noise)
const componentStates = new Map<string, InfrastructureComponentState>();
const alertDedupSet = new Set<string>();

async function postToDiscordWebhook(payload: DiscordAlertPayload, dedupKey?: string): Promise<void> {
  if (dedupKey) {
    if (alertDedupSet.has(dedupKey)) {
      return;
    }
    alertDedupSet.add(dedupKey);
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_IPFS_ALERTS || process.env.DISCORD_WEBHOOK_ALERTS;
  if (!webhookUrl) {
    // Non-blocking in environments without Discord webhooks
    return;
  }

  try {
    const prefix = payload.color === DISCORD_COLORS.CRITICAL 
      ? '🚨 **SOVEREIGN IPFS CRITICAL ALERT**' 
      : payload.color === DISCORD_COLORS.RECOVERY 
        ? '🟢 **SOVEREIGN IPFS RECOVERY**' 
        : '⚠️ **SOVEREIGN IPFS WARNING**';

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: prefix,
        embeds: [payload],
      }),
    });
  } catch (err: any) {
    console.error('[IpfsAlerting] Failed to dispatch Discord notification:', err?.message);
  }
}

export class SovereignIpfsAlerting {
  /**
   * 1. 🔴 Triggered when Kubo Primary daemon transitions from HEALTHY to DOWN.
   */
  public static async notifyKuboPrimaryDown(details: {
    error: string;
    cidRequested?: string;
    fallbackProvider: string;
  }): Promise<void> {
    const currentState = componentStates.get('kubo_primary') || 'HEALTHY';
    if (currentState === 'DOWN') {
      return; // Already in DOWN state — suppress duplicate alerts
    }
    componentStates.set('kubo_primary', 'DOWN');

    await postToDiscordWebhook({
      title: '🔴 Kubo Primary Node Offline — Fail-Over Engaged',
      description: 'The primary sovereign Kubo node is unreachable. Transparent fail-over to external DR mirror was engaged to preserve availability.',
      color: DISCORD_COLORS.CRITICAL,
      fields: [
        { name: 'Kubo RPC Error', value: details.error.substring(0, 250), inline: false },
        { name: 'Active Fail-Over Provider', value: details.fallbackProvider, inline: true },
        { name: 'CID Target', value: details.cidRequested || 'N/A', inline: true },
        { name: 'Action Required', value: 'Inspect Kubo daemon service & Caddy RPC proxy status.', inline: false },
      ],
      footer: { text: "Pandora's Sovereign Storage Fabric" },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 1b. 🟢 Triggered when Kubo Primary daemon recovers back to HEALTHY.
   */
  public static async notifyKuboPrimaryRecovered(details?: { latencyMs?: number; version?: string }): Promise<void> {
    const currentState = componentStates.get('kubo_primary');
    if (currentState !== 'DOWN' && currentState !== 'DEGRADED') {
      return; // Was already healthy
    }
    componentStates.set('kubo_primary', 'HEALTHY');

    await postToDiscordWebhook({
      title: '🟢 Kubo Primary Node Restored — Full Sovereignty Active',
      description: 'The primary sovereign Kubo node is back online and responding normally. Fail-over disengaged.',
      color: DISCORD_COLORS.RECOVERY,
      fields: [
        { name: 'Daemon Version', value: details?.version || 'Kubo RPC Active', inline: true },
        { name: 'Health Check Latency', value: details?.latencyMs ? `${details.latencyMs}ms` : 'Healthy', inline: true },
        { name: 'Storage State', value: 'Sovereign Primary Serving', inline: false },
      ],
      footer: { text: "Pandora's Sovereign Storage Fabric — Operational Recovery" },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 2. 🟡 Triggered when Pinata DR Mirror transitions from HEALTHY to DOWN/DEGRADED.
   */
  public static async notifyPinataDrDown(details: {
    error: string;
    affectedCategory?: string;
  }): Promise<void> {
    const currentState = componentStates.get('pinata_dr') || 'HEALTHY';
    if (currentState === 'DEGRADED') {
      return; // Already in DEGRADED state
    }
    componentStates.set('pinata_dr', 'DEGRADED');

    await postToDiscordWebhook({
      title: '🟡 Pinata DR Mirror Unreachable',
      description: 'The external Disaster Recovery mirror failed to respond. Primary Kubo node remains operational, but external redundancy is temporarily degraded.',
      color: DISCORD_COLORS.WARNING,
      fields: [
        { name: 'DR Error', value: details.error.substring(0, 250), inline: false },
        { name: 'Affected Storage Category', value: details.affectedCategory || 'L2/L3 Redundancy', inline: true },
        { name: 'Impact', value: 'Dual-pinning queued or operating in single-node mode.', inline: false },
      ],
      footer: { text: "Pandora's Sovereign Storage Fabric" },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 2b. 🟢 Triggered when Pinata DR recovers back to HEALTHY.
   */
  public static async notifyPinataDrRecovered(latencyMs?: number): Promise<void> {
    const currentState = componentStates.get('pinata_dr');
    if (currentState !== 'DEGRADED' && currentState !== 'DOWN') {
      return; // Was already healthy
    }
    componentStates.set('pinata_dr', 'HEALTHY');

    await postToDiscordWebhook({
      title: '🟢 Pinata DR Mirror Restored',
      description: 'The external Disaster Recovery mirror is back online. Multi-replica dual-pinning redundancy fully restored.',
      color: DISCORD_COLORS.RECOVERY,
      fields: [
        { name: 'DR Mirror Status', value: 'Healthy', inline: true },
        { name: 'Latency', value: latencyMs ? `${latencyMs}ms` : 'Operational', inline: true },
      ],
      footer: { text: "Pandora's Sovereign Storage Fabric" },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 3. 🔴 Triggered on cryptographic hash mismatch between replica payload and canonical hash.
   */
  public static async notifyIntegrityMismatch(details: {
    tenantId: string;
    artifactId: string;
    cid: string;
    expectedHash: string;
    receivedHash: string;
  }): Promise<void> {
    await postToDiscordWebhook({
      title: '🚨 KNOWLEDGE_INTEGRITY_MISMATCH Detected',
      description: 'A retrieved IPFS payload failed cryptographic SHA-256 integrity verification. Access was blocked fail-closed.',
      color: DISCORD_COLORS.CRITICAL,
      fields: [
        { name: 'Tenant ID', value: details.tenantId, inline: true },
        { name: 'Artifact ID', value: details.artifactId, inline: true },
        { name: 'CID', value: details.cid, inline: false },
        { name: 'Expected SHA-256', value: `\`${details.expectedHash.substring(0, 16)}...\``, inline: true },
        { name: 'Received SHA-256', value: `\`${details.receivedHash.substring(0, 16)}...\``, inline: true },
      ],
      footer: { text: "Pandora's Sovereign Storage Fabric — Fail-Closed Boundary" },
      timestamp: new Date().toISOString(),
    // K27.x: key includes the received hash so a SECOND tampering event of the
    // same artifact (different divergent content) re-alerts instead of being
    // permanently suppressed. Identical repeated fetches stay deduplicated.
    }, `mismatch_${details.tenantId}_${details.artifactId}_${details.receivedHash.substring(0, 16)}`);
  }

  /**
   * 4. 🔴 Triggered when an L3 artifact (Claim Contract / Legal Agreement) fails mandatory replication.
   */
  public static async notifyL3DurabilityDegraded(details: {
    category: string;
    name: string;
    primaryCid: string;
    reason: string;
  }): Promise<void> {
    await postToDiscordWebhook({
      title: '🔴 Level 3 Artifact Durability Degraded',
      description: `An institutional Level 3 artifact (${details.category}) could not achieve full verified dual-replica durability.`,
      color: DISCORD_COLORS.CRITICAL,
      fields: [
        { name: 'Category', value: details.category, inline: true },
        { name: 'Artifact Name', value: details.name, inline: true },
        { name: 'Primary CID', value: details.primaryCid, inline: false },
        { name: 'Failure Reason', value: details.reason.substring(0, 250), inline: false },
      ],
      footer: { text: "Pandora's Sovereign Storage Fabric" },
      timestamp: new Date().toISOString(),
    }, `l3_degraded_${details.primaryCid}`);
  }
}
