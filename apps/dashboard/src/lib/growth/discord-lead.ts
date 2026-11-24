import { db } from "@saasfly/db";
import { marketingLeads } from "@saasfly/db/schema";
import { and, eq } from "@saasfly/db-core";

export interface DiscordLeadInput {
  projectId: number;
  tenantId: string;
  discordUserId: string;
  discordUsername?: string | null;
  wallet: string;
  phone?: string | null;
  membership: { isParticipant: boolean; tier: string | null; certificates: number };
}

/**
 * Convierte una verificación de Discord en un lead del Growth OS.
 *
 * Reglas:
 *  - No duplica: si ya existe un lead del proyecto con esa wallet, se actualiza.
 *  - No retrocede el embudo: sólo escribe `crm_stage` cuando el lead es nuevo;
 *    si alguien ya lo movió a "contactado", esta verificación no lo regresa.
 *  - Guarda la identidad de Discord y la membresía en `metadata` para poder
 *    segmentar por nivel sin tocar el esquema.
 */
export async function upsertDiscordLead(input: DiscordLeadInput): Promise<{ leadId: string | null; created: boolean }> {
  const wallet = input.wallet.toLowerCase();
  if (!/^0x[a-f0-9]{40}$/.test(wallet)) return { leadId: null, created: false };

  const [existing] = await db
    .select({ id: marketingLeads.id, metadata: marketingLeads.metadata })
    .from(marketingLeads)
    .where(and(eq(marketingLeads.projectId, input.projectId), eq(marketingLeads.walletAddress, wallet)))
    .limit(1);

  const discordMeta = {
    discord: {
      userId: input.discordUserId,
      username: input.discordUsername ?? null,
      verifiedAt: new Date().toISOString(),
    },
    membership: {
      isParticipant: input.membership.isParticipant,
      tier: input.membership.tier,
      certificates: input.membership.certificates,
    },
  };

  if (existing) {
    const merged = { ...((existing.metadata as Record<string, unknown>) ?? {}), ...discordMeta };
    await db
      .update(marketingLeads)
      .set({
        metadata: merged,
        phoneNumber: input.phone ?? undefined,
        source: "discord",
        origin: "discord",
        lastEngagementAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(marketingLeads.id, existing.id));
    return { leadId: existing.id, created: false };
  }

  // Prioridad comercial inicial: un participante confirmado pesa más que un curioso.
  const score = input.membership.isParticipant ? (input.membership.tier ? 70 : 55) : 20;

  const [inserted] = await db
    .insert(marketingLeads)
    .values({
      projectId: input.projectId,
      name: input.discordUsername ? `Discord @${input.discordUsername}` : `Discord ${input.discordUserId}`,
      walletAddress: wallet,
      phoneNumber: input.phone ?? null,
      source: "discord",
      origin: "discord",
      status: "active",
      crmStage: "LEAD",
      intent: "explore",
      score,
      quality: input.membership.isParticipant ? "high" : "low",
      leadType: input.membership.isParticipant ? "investor" : "user_prospect",
      metadata: { ...discordMeta, tenantId: input.tenantId },
      lastEngagementAt: new Date(),
    })
    .returning({ id: marketingLeads.id });

  return { leadId: inserted?.id ?? null, created: true };
}
