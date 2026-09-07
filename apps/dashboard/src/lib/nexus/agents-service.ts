import { db } from '@/db';
import { hermesAgents } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes, createHash } from 'crypto';

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
  // 1. Generate a strong random plain secret
  const plainSecret = randomBytes(32).toString('hex');

  // 2. Hash it with SHA-256 for DB storage
  // (Since plainSecret is 32 bytes high entropy, standard SHA-256 is secure enough)
  const hash = createHash('sha256').update(plainSecret).digest('hex');

  // 3. Store in DB
  const [newAgent] = await db.insert(hermesAgents).values({
    agentId: data.agentId,
    hmacSecretHash: hash,
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
