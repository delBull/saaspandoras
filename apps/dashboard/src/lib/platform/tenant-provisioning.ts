import crypto from 'crypto';
import { db } from '@saasfly/db';
import {
  hermesTenantCredits,
  installedProducts,
  integrationClients,
  projects,
  users,
} from '@saasfly/db/schema';
import { and, eq } from '@saasfly/db-core';
import { CapabilityGrantService } from '@saasfly/hermes-core';

/**
 * Aprovisionamiento de un tenant con acceso completo:
 *
 *   project (slug único) + applicantEmail  →  usuarios + installedProducts
 *   + créditos (saldo 0) + integration client (sk_live, hash) + capability grants
 *
 * Devuelve la API key en claro **una sola vez** (sólo el hash queda en DB).
 *
 * Lo usan:
 *   - POST /api/v1/integrations/tenants/provision  (self-serve, permiso `tenant.provision`)
 *   - scripts/provision-tenant.ts                  (ops)
 *
 * Invariantes:
 *   - El slug lo normaliza el servidor (nunca se confía en el cliente tal cual).
 *   - Slug duplicado ⇒ 409 (no se reutiliza un tenant existente).
 *   - Sin `ownerEmail` no se crea nada: un tenant sin email no puede entrar al Portal.
 */

export const PROVISION_DEFAULT_PERMISSIONS = [
  'content.asset.read',
  'content.asset.create',
  'content.asset.approve',
  'media:generate',
  'hermes_a2a',
  'events:write',
] as const;

export const DEFAULT_CAPABILITIES = ['Media.Image', 'Media.Video', 'Media.Copy'] as const;

/** Slugs con significado propio en la plataforma: no se pueden apropiar. */
const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'app',
  'dash',
  'docs',
  'hermes',
  'login',
  'media',
  'narai',
  'pandoras',
  'pandoras_access',
  'portal',
  'snarai',
  'snarai-protocol',
  'support',
  'www',
]);

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{2,39}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export class TenantProvisioningError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number = 400
  ) {
    super(message);
    this.name = 'TenantProvisioningError';
  }
}

export function normalizeSlug(input: string): string {
  return String(input ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 40);
}

export function assertValidSlug(slug: string): void {
  if (!slug || !SLUG_REGEX.test(slug)) {
    throw new TenantProvisioningError(
      'INVALID_SLUG',
      'El slug debe tener 3-40 caracteres en minúsculas, números o guiones (no puede empezar por guion).'
    );
  }
  if (RESERVED_SLUGS.has(slug)) {
    throw new TenantProvisioningError('RESERVED_SLUG', `El slug '${slug}' está reservado por la plataforma.`);
  }
}

export function assertValidOwnerEmail(email: string): void {
  if (!email || !EMAIL_REGEX.test(email)) {
    throw new TenantProvisioningError(
      'INVALID_OWNER_EMAIL',
      'ownerEmail es obligatorio y debe ser un correo válido: sin email el tenant no puede entrar al Portal.'
    );
  }
}

export interface ProvisionTenantInput {
  name: string;
  slug: string;
  ownerEmail: string;
  description?: string;
  capabilities?: string[];
  actor?: string;
}

export interface ProvisionTenantResult {
  projectId: number;
  slug: string;
  ownerEmail: string;
  /** API key en claro. Se devuelve UNA sola vez; no se persiste. */
  apiKey: string;
  keyFingerprint: string;
  permissions: string[];
  capabilities: string[];
  credits: { balanceUsd: number; markupPercentage: number };
  /** Ruta del Portal a la que debe ir el tenant (no necesita conocerla de antemano). */
  portalUrl: string;
}

export async function provisionTenant(input: ProvisionTenantInput): Promise<ProvisionTenantResult> {
  const title = String(input.name ?? '').trim();
  const ownerEmail = String(input.ownerEmail ?? '').trim().toLowerCase();
  const slug = normalizeSlug(input.slug || title);

  if (!title) {
    throw new TenantProvisioningError('INVALID_NAME', 'El nombre del tenant es obligatorio.');
  }
  assertValidSlug(slug);
  assertValidOwnerEmail(ownerEmail);

  const capabilities = (input.capabilities?.length ? input.capabilities : [...DEFAULT_CAPABILITIES])
    .map((c) => c.trim())
    .filter(Boolean);

  const [existing] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.slug, slug))
    .limit(1);

  if (existing) {
    throw new TenantProvisioningError(
      'SLUG_TAKEN',
      `El slug '${slug}' ya está en uso (project id ${existing.id}).`,
      409
    );
  }

  const rawKey = `sk_live_${crypto.randomBytes(24).toString('hex')}`;
  const apiKeyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const keyFingerprint = `${rawKey.slice(0, 12)}...`;
  const permissions = [...PROVISION_DEFAULT_PERMISSIONS];
  const actor = input.actor || 'api:tenant.provision';

  const project = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(projects)
      .values({
        title,
        slug,
        description: input.description ?? 'Tenant aprovisionado vía API (Media Co / Content API)',
        status: 'live',
        isSimulationMode: false,
        // El email del dueño es lo que habilita el login por magic link.
        applicantEmail: ownerEmail,
      })
      .returning({ id: projects.id, slug: projects.slug });

    if (!created) {
      throw new TenantProvisioningError('PROJECT_CREATE_FAILED', 'No se pudo crear el proyecto.', 500);
    }

    // Usuario del Portal (idempotente si ya existía por email).
    const [existingUser] = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, ownerEmail))
      .limit(1);

    if (!existingUser) {
      await tx.insert(users).values({
        id: `usr_${crypto.randomUUID()}`,
        email: ownerEmail,
        name: title,
        role: 'user',
        status: 'ACTIVE',
      });
    }

    // Producto instalado (HERMES) para que el Portal tenga contexto.
    const [product] = await tx
      .select({ id: installedProducts.id })
      .from(installedProducts)
      .where(
        and(eq(installedProducts.projectId, created.id), eq(installedProducts.product, 'HERMES'))
      )
      .limit(1);

    if (!product) {
      await tx.insert(installedProducts).values({
        projectId: created.id,
        product: 'HERMES',
        productFamily: 'GROWTH_OS',
        plan: 'trial',
        status: 'trial',
        config: { email: ownerEmail, companyName: title },
        runtimeManifest: { context: { adminEmail: ownerEmail } },
      });
    }

    await tx.insert(hermesTenantCredits).values({
      id: `cred_${crypto.randomUUID()}`,
      tenantId: created.slug,
      creditBalanceUsd: '0.0000',
      totalDepositedUsd: '0.0000',
      totalSpentUsd: '0.0000',
      markupPercentage: 35,
      isSandboxEnabled: true,
    });

    await tx.insert(integrationClients).values({
      name: `${title} — S2S (Content API)`,
      environment: 'production',
      apiKeyHash,
      keyFingerprint,
      permissions,
      isActive: true,
      projectId: created.id,
    });

    return created;
  });

  // Los grants se persisten con el servicio canónico (misma ruta que usa la app).
  const granted: string[] = [];
  for (const capability of capabilities) {
    try {
      await CapabilityGrantService.setGrant(project.slug, capability, true, actor);
      granted.push(capability);
    } catch (error: unknown) {
      console.error(`[TenantProvisioning] No se pudo otorgar '${capability}' a '${project.slug}':`, error);
    }
  }

  return {
    projectId: project.id,
    slug: project.slug,
    ownerEmail,
    apiKey: rawKey,
    keyFingerprint,
    permissions,
    capabilities: granted,
    credits: { balanceUsd: 0, markupPercentage: 35 },
    portalUrl: `/portal/${project.slug}/media`,
  };
}
