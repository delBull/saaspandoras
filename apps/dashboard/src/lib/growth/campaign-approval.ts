import { db } from "@saasfly/db";
import { nexusApprovals, marketingCampaigns } from "@saasfly/db/schema";
import { and, eq } from "@saasfly/db-core";
import crypto from "crypto";

/**
 * Aprobación de campañas de email del Growth OS.
 *
 * El Community Manager puede crear campañas, pero **no programarlas**: al crear
 * queda en `PENDING_APPROVAL`, se registra una aprobación gobernada
 * (`nexus_approvals`) y se avisa por el webhook del proyecto. Sólo cuando el
 * admin aprueba, la campaña pasa a `SCHEDULED`.
 *
 * La decisión siempre se valida en el servidor con la sesión del admin: el botón
 * del webhook no autoriza nada por sí mismo.
 */

export const CAMPAIGN_APPROVAL_PREFIX = "email_campaign:";

function webhookUrl(): string | null {
  return (
    process.env.DISCORD_WEBHOOK_NARAI_BUCERIAS ||
    process.env.DISCORD_WEBHOOK_APPROVALS ||
    null
  );
}

async function notifyDiscord(payload: Record<string, unknown>): Promise<void> {
  const url = webhookUrl();
  if (!url) {
    console.warn("[CampaignApproval] Sin webhook configurado (DISCORD_WEBHOOK_NARAI_BUCERIAS); no se envía aviso.");
    return;
  }
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch (err: any) {
    console.warn("[CampaignApproval] No se pudo enviar el aviso:", err?.message || err);
  }
}

export async function requestCampaignApproval(input: {
  organizationId: string;
  organizationSlug: string;
  campaignId: string | number;
  campaignName: string;
  subject?: string | null;
  scheduledAt?: string | null;
  requestedBy?: string | null;
}): Promise<{ approvalId: string | null }> {
  const actionToken = crypto.randomBytes(16).toString("hex");
  const what = `${CAMPAIGN_APPROVAL_PREFIX}${input.campaignId}`;

  // `resource_scope` es varchar(256): se guarda un resumen compacto, no un JSON.
  const scope = `campaign:${input.campaignId}|org:${input.organizationSlug}`.slice(0, 256);
  const proposerId = input.requestedBy && /^\d+$/.test(input.requestedBy) ? Number(input.requestedBy) : null;

  const [approval] = await db
    .insert(nexusApprovals)
    .values({
      id: `APP-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`.slice(0, 64),
      canonicalOrgId: input.organizationId,
      actionToken,
      proposerId,
      proposerName: input.requestedBy ?? "Growth OS",
      what,
      why: `Campaña "${input.campaignName}"${input.subject ? ` · ${input.subject}` : ""}`.slice(0, 500),
      resourceScope: scope,
      capabilityRequired: "marketing.manage",
      riskLevel: "MEDIUM",
      status: "PENDING",
      nextAction: "SCHEDULE_CAMPAIGN",
    })
    .returning({ id: nexusApprovals.id });

  await notifyDiscord({
    username: "Pandora's · Aprobaciones",
    embeds: [
      {
        title: "Campaña pendiente de aprobación",
        description: `**${input.campaignName}**${input.subject ? `\nAsunto: ${input.subject}` : ""}`,
        color: 0xfbbf24,
        fields: [
          { name: "Organización", value: input.organizationSlug, inline: true },
          { name: "Campaña", value: String(input.campaignId), inline: true },
          { name: "Solicitó", value: input.requestedBy || "—", inline: true },
          { name: "Programada para", value: input.scheduledAt || "sin fecha", inline: false },
        ],
        footer: { text: "Se aprueba en el portal (Aprobaciones). Este mensaje no autoriza por sí mismo." },
        timestamp: new Date().toISOString(),
      },
    ],
  });

  return { approvalId: approval?.id ? String(approval.id) : null };
}

/** Aprobado → programada; rechazado → rechazada. Idempotente. */
export async function resolveCampaignApproval(input: {
  organizationSlug: string;
  what: string | null | undefined;
  status: "APPROVED" | "REJECTED";
  resolvedBy?: string | null;
}): Promise<void> {
  if (!input.what || !input.what.startsWith(CAMPAIGN_APPROVAL_PREFIX)) return;
  const campaignId = input.what.slice(CAMPAIGN_APPROVAL_PREFIX.length);
  if (!campaignId) return;

  const [campaign] = await db
    .select({ id: marketingCampaigns.id, config: marketingCampaigns.config })
    .from(marketingCampaigns)
    .where(eq(marketingCampaigns.id, Number(campaignId)))
    .limit(1);

  if (!campaign) return;

  const cfg = (campaign.config as Record<string, unknown> | null) ?? {};
  const scheduledAt = (cfg.scheduledAt as string | null) ?? null;
  const approved = input.status === "APPROVED";

  await db
    .update(marketingCampaigns)
    .set({
      // Sin fecha no se programa: queda lista (isActive=true) para envío manual.
      isActive: approved,
      config: {
        ...cfg,
        status: approved ? (scheduledAt ? "SCHEDULED" : "READY") : "REJECTED",
        approvalStatus: input.status,
        approvalResolvedBy: input.resolvedBy ?? null,
        approvalResolvedAt: new Date().toISOString(),
      },
      updatedAt: new Date(),
    })
    .where(eq(marketingCampaigns.id, campaign.id));

  await notifyDiscord({
    username: "Pandora's · Aprobaciones",
    embeds: [
      {
        title: approved ? "Campaña aprobada" : "Campaña rechazada",
        description: `Campaña ${campaign.id} · ${input.organizationSlug}`,
        color: approved ? 0x34d399 : 0xef4444,
        fields: [
          { name: "Decisión", value: approved ? (scheduledAt ? "Programada" : "Lista para envío") : "Rechazada", inline: true },
          { name: "Resolvió", value: input.resolvedBy || "—", inline: true },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

/** Bandeja de campañas esperando decisión (para UI y para auditoría). */
export async function listPendingCampaignApprovals(organizationSlug: string) {
  return db
    .select({
      id: nexusApprovals.id,
      what: nexusApprovals.what,
      why: nexusApprovals.why,
      status: nexusApprovals.status,
      createdAt: nexusApprovals.createdAt,
    })
    .from(nexusApprovals)
    .where(and(
      eq(nexusApprovals.canonicalOrgId, organizationSlug),
      eq(nexusApprovals.status, "PENDING" as any),
    ));
}
