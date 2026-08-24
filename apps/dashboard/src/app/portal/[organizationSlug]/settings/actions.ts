'use server';

import { db } from '@/db';
import { projects, integrationClients } from '@/db/schema';
import { eq, or, and } from 'drizzle-orm';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { revalidatePath } from 'next/cache';
import { createHash, randomBytes } from 'crypto';

export interface TenantSettingsFormData {
  title?: string;
  tagline?: string;
  description?: string;
  website?: string;
  whatsappPhone?: string;
  telegramUrl?: string;
  language?: string;
  tonePreset?: string;
  humanHandoffContact?: string;
  maxResponseTokens?: number;
}

export async function updateTenantSettingsAction(
  organizationSlug: string,
  data: TenantSettingsFormData
) {
  const ctx = await resolvePortalContext(organizationSlug);
  const projectId = ctx.organization.projectId;

  if (!projectId) {
    throw new Error('Proyecto no encontrado para esta organización');
  }

  // Load existing project to merge tenantRuntimeConfig safely
  const [existing] = await db
    .select({
      id: projects.id,
      tenantRuntimeConfig: projects.tenantRuntimeConfig,
    })
    .from(projects)
    .where(eq(projects.id, Number(projectId)))
    .limit(1);

  const prevConfig = (existing?.tenantRuntimeConfig as Record<string, any>) || {};
  const updatedRuntimeConfig = {
    ...prevConfig,
    language: data.language || prevConfig.language || 'es',
    tonePreset: data.tonePreset || prevConfig.tonePreset || 'institutional_concierge',
    humanHandoffContact: data.humanHandoffContact || prevConfig.humanHandoffContact || '',
    maxResponseTokens: data.maxResponseTokens || prevConfig.maxResponseTokens || 1024,
    updatedAt: new Date().toISOString(),
  };

  await db
    .update(projects)
    .set({
      title: data.title,
      tagline: data.tagline,
      description: data.description,
      website: data.website,
      whatsappPhone: data.whatsappPhone,
      telegramUrl: data.telegramUrl,
      tenantRuntimeConfig: updatedRuntimeConfig,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, Number(projectId)));

  revalidatePath(`/portal/${organizationSlug}/settings`);
  revalidatePath(`/portal/${organizationSlug}`);
  return { success: true };
}

import { SecurityAuditLogger } from '@/lib/pandoras/core/domains/hermes/runtime/security-audit-logger';

export async function generateApiKeyAction(
  organizationSlug: string,
  name: string,
  permissions: string[] = ['hermes.chat', 'knowledge.read']
) {
  const ctx = await resolvePortalContext(organizationSlug);
  const projectId = Number(ctx.organization.projectId);

  if (!projectId) {
    throw new Error('Proyecto no identificado');
  }

  const rawKeySecret = randomBytes(24).toString('hex');
  const apiKey = `pk_live_${rawKeySecret}`;
  const apiKeyHash = createHash('sha256').update(apiKey).digest('hex');
  const keyFingerprint = `pk_live_...${apiKey.slice(-6)}`;

  const [inserted] = await db
    .insert(integrationClients)
    .values({
      name: name || 'API Key de Integración',
      environment: 'production',
      projectId,
      apiKeyHash,
      keyFingerprint,
      permissions: permissions as any,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({
      id: integrationClients.id,
      name: integrationClients.name,
      keyFingerprint: integrationClients.keyFingerprint,
      createdAt: integrationClients.createdAt,
    });

  if (!inserted) {
    throw new Error('Error al registrar la llave de API');
  }

  // K27.1 Immutable Security Event Logging for Credential Issuance
  await SecurityAuditLogger.logEvent({
    organizationId: organizationSlug,
    eventType: 'TOOL_UNAUTHORIZED', // Audit credential event
    severity: 'INFO',
    policyDecision: 'ALLOW',
    correlationId: `key_gen_${inserted.id}`,
    metadata: {
      action: 'API_KEY_GENERATED',
      keyId: inserted.id,
      keyFingerprint,
      name: inserted.name,
      permissions,
      actorRole: ctx.tenant.role,
    },
  }).catch((err) => console.error('[Settings] Failed to log API key creation audit:', err));

  revalidatePath(`/portal/${organizationSlug}/settings`);
  return {
    success: true,
    apiKey, // Return raw key once to display to user
    key: inserted,
  };
}

export async function revokeApiKeyAction(organizationSlug: string, keyId: string) {
  const ctx = await resolvePortalContext(organizationSlug);
  const projectId = Number(ctx.organization.projectId);

  await db
    .update(integrationClients)
    .set({
      isActive: false,
      revokedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(integrationClients.id, keyId),
        eq(integrationClients.projectId, projectId)
      )
    );

  // K27.1 Immutable Security Event Logging for Credential Revocation
  await SecurityAuditLogger.logEvent({
    organizationId: organizationSlug,
    eventType: 'TOOL_UNAUTHORIZED',
    severity: 'WARN',
    policyDecision: 'DENY',
    correlationId: `key_rev_${keyId}`,
    metadata: {
      action: 'API_KEY_REVOKED',
      keyId,
      actorRole: ctx.tenant.role,
    },
  }).catch((err) => console.error('[Settings] Failed to log API key revocation audit:', err));

  revalidatePath(`/portal/${organizationSlug}/settings`);
  return { success: true };
}
