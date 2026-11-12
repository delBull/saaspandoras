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
import {
  DEFAULT_PROVISION_PRODUCT,
  getProductEntryPath,
  normalizeProductList,
  productFamilyOf,
  type ProvisionableProduct,
} from '@saasfly/shared';

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

/** Productos para los que tienen sentido las capabilities de media. */
const MEDIA_PRODUCTS: ProvisionableProduct[] = ['HERMES', 'MEDIA_CO'];

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
  /** Productos a instalar. Si se omite o llega vacío ⇒ ['HERMES']. */
  products?: string[];
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
  /** Productos realmente instalados (keys canónicas). */
  products: ProvisionableProduct[];
  /** Entrada por producto para el hub. */
  productEntries: Array<{ product: ProvisionableProduct; family: string; path: string }>;
  /** Hub del tenant: aquí aterriza, sin conocer rutas. */
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

  // Productos a instalar: se normalizan alias (HERMES_OS, RWA, …) y se
  // deduplican. Lista vacía/ausente ⇒ HERMES por defecto. Desconocido ⇒ 400.
  const requestedProducts = normalizeProductList(input.products);
  const invalidProducts = Array.isArray(input.products)
    ? input.products.filter(
        (raw) => typeof raw === 'string' && raw.trim().length > 0 && !normalizeProductList([raw]).length
      )
    : [];
  if (invalidProducts.length > 0) {
    throw new TenantProvisioningError(
      'INVALID_PRODUCT',
      `Producto(s) desconocido(s): ${invalidProducts.join(', ')}. Válidos: HERMES, GROWTH_OS, TOKENIZATION, MEDIA_CO.`
    );
  }
  const products: ProvisionableProduct[] =
    requestedProducts.length > 0 ? requestedProducts : [DEFAULT_PROVISION_PRODUCT];

  const mediaEnabled = products.some((p) => MEDIA_PRODUCTS.includes(p));
  const capabilities = (input.capabilities?.length
    ? input.capabilities
    : mediaEnabled
      ? [...DEFAULT_CAPABILITIES]
      : []
  )
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

    // Instalar SOLO los productos elegidos por el tenant.
    for (const product of products) {
      const [existingProduct] = await tx
        .select({ id: installedProducts.id })
        .from(installedProducts)
        .where(
          and(eq(installedProducts.projectId, created.id), eq(installedProducts.product, product))
        )
        .limit(1);

      if (!existingProduct) {
        await tx.insert(installedProducts).values({
          projectId: created.id,
          product,
          productFamily: productFamilyOf(product),
          // El proyecto nace 'live' con tenant_type PRODUCTION (default de la DB).
          // Si el producto quedara en trial, el portal lo rechazaría con
          // "sesión trial sobre tenant de producción". Pay-as-you-go ⇒ plan
          // sandbox + status active.
          plan: 'sandbox',
          status: 'active',
          config: { email: ownerEmail, companyName: title },
          runtimeManifest: { context: { adminEmail: ownerEmail } },
        });
      }
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
    products,
    productEntries: products.map((product) => ({
      product,
      family: productFamilyOf(product),
      path: getProductEntryPath(product, project.slug),
    })),
    // El hub: desde aquí se entra a cualquier producto instalado.
    portalUrl: `/portal/${project.slug}/overview`,
  };
}
