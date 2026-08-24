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
  INFO: 5793266,      // Blue
};

// 5-minute cooldown per alert key to prevent alert storming during outages
const alertCooldowns = new Map<string, number>();
const COOLDOWN_MS = 5 * 60 * 1000;

function shouldSendAlert(key: string): boolean {
  const now = Date.now();
  const last = alertCooldowns.get(key) || 0;
  if (now - last < COOLDOWN_MS) {
    return false;
  }
  alertCooldowns.set(key, now);
  return true;
}

async function postToDiscordWebhook(payload: DiscordAlertPayload, cooldownKey?: string): Promise<void> {
  if (cooldownKey && !shouldSendAlert(cooldownKey)) {
    return;
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_IPFS_ALERTS || process.env.DISCORD_WEBHOOK_ALERTS;
  if (!webhookUrl) {
    // Non-blocking in environments without Discord webhooks
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: payload.color === DISCORD_COLORS.CRITICAL ? '🚨 **SOVEREIGN IPFS CRITICAL ALERT**' : '⚠️ **SOVEREIGN IPFS WARNING**',
        embeds: [payload],
      }),
    });
  } catch (err: any) {
    console.error('[IpfsAlerting] Failed to dispatch Discord notification:', err?.message);
  }
}

export class SovereignIpfsAlerting {
  /**
   * 1. 🔴 Triggered when Kubo Primary daemon is offline/unreachable and fail-over is engaged.
   */
  public static async notifyKuboPrimaryDown(details: {
    error: string;
    cidRequested?: string;
    fallbackProvider: string;
  }): Promise<void> {
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
    }, 'kubo_primary_down');
  }

  /**
   * 2. 🟡 Triggered when Pinata DR Mirror is unreachable during dual-pinning or health checks.
   */
  public static async notifyPinataDrDown(details: {
    error: string;
    affectedCategory?: string;
  }): Promise<void> {
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
    }, 'pinata_dr_down');
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
    }, `mismatch_${details.tenantId}_${details.artifactId}`);
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
