import { db } from '@/db';
import { hermesAgents } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes, createHash, createCipheriv, createDecipheriv } from 'crypto';

// ─── Encryption Utilities (AES-256-GCM) ───────────────────────────────────────
// Requires A2A_AGENT_ENCRYPTION_KEY env var: 64-hex-char string (32 bytes / 256 bit).

function getEncryptionKey(): Buffer {
  const key = process.env.A2A_AGENT_ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error(
      '[agents-service] A2A_AGENT_ENCRYPTION_KEY must be a 64-char hex string (32 bytes). Generate with: openssl rand -hex 32'
    );
  }
  return Buffer.from(key, 'hex');
}

export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag(); // 128-bit auth tag
  // Format: iv:tag:ciphertext — all hex
  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
}

export function decryptSecret(encrypted: string): string {
  const key = getEncryptionKey();
  const parts = encrypted.split(':');
  if (parts.length !== 3) throw new Error('[agents-service] Invalid encrypted secret format');
  const iv = Buffer.from(parts[0]!, 'hex');
  const tag = Buffer.from(parts[1]!, 'hex');
  const ciphertext = Buffer.from(parts[2]!, 'hex');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(ciphertext) + decipher.final('utf8');
}

// ─── Agent CRUD ────────────────────────────────────────────────────────────────

export interface AgentCreationData {
  agentId: string;
  name: string;
  walletAddress?: string;
}

export async function listAgents() {
  const agents = await db.select({
    agentId: hermesAgents.agentId,
    name: hermesAgents.name,
    walletAddress: hermesAgents.walletAddress,
    isActive: hermesAgents.isActive,
    createdAt: hermesAgents.createdAt,
    updatedAt: hermesAgents.updatedAt,
  }).from(hermesAgents);
  return agents;
}

export async function createAgent(data: AgentCreationData) {
  // 1. Generate strong random plain secret (256-bit)
  const plainSecret = randomBytes(32).toString('hex');

  // 2. SHA-256 hash for identity fingerprint (one-way, used for logging/audit)
  const hash = createHash('sha256').update(plainSecret).digest('hex');

  // 3. AES-256-GCM encryption for bilateral HMAC validation (reversible with server key)
  const encrypted = encryptSecret(plainSecret);

  // 4. Store in DB — never store plaintext
  const [newAgent] = await db.insert(hermesAgents).values({
    agentId: data.agentId,
    hmacSecretHash: hash,
    hmacSecretEncrypted: encrypted,
    name: data.name,
    walletAddress: data.walletAddress || null,
    isActive: true,
  }).returning();

  return { agent: newAgent, plainSecret };
}

export async function revokeAgent(agentId: string) {
  const [updated] = await db.update(hermesAgents)
    .set({ isActive: false })
    .where(eq(hermesAgents.agentId, agentId))
    .returning();
  return updated;
}

