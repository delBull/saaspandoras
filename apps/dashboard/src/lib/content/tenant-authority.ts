import type { NextRequest } from 'next/server';
import { db } from '@saasfly/db';
import { projects } from '@saasfly/db/schema';
import { eq } from '@saasfly/db-core';
import { IntegrationKeyService } from '@/lib/integrations/auth';
import { TenantAuthorityService } from '@saasfly/hermes-core';

/**
 * Autoridad de la Content API (Media Co).
 *
 * El tenant NUNCA viene del body: se resuelve desde la API key
 * (`integration_clients.projectId`) → proyecto → identidad canónica.
 * Si la key no está atada a un proyecto, no puede operar contenido.
 */

export interface AuthorizedContentClient {
  clientId: string;
  keyType: 'public' | 'secret';
  environment: string;
  permissions: string[];
  /** Slug canónico usado por el orquestador de media (hermes_media_requests.tenant_id). */
  tenantId: string;
  canonicalOrgId: string;
  projectId: number;
  projectTitle: string;
}

export type ContentAuthResult =
  | { ok: true; client: AuthorizedContentClient }
  | { ok: false; status: number; error: string; code?: string };

/** Tipos de contenido aceptados → capability del orquestador. */
export const CONTENT_TYPE_CAPABILITIES: Record<string, string> = {
  image: 'Media.Image',
  image_render: 'Media.Image',
  poster: 'Media.Image',
  video: 'Media.Video',
  video_render: 'Media.Video',
  reel: 'Media.Video',
  copy: 'Media.Copy',
  copy_render: 'Media.Copy',
  caption: 'Media.Copy',
  editorial: 'Media.Editorial',
  newsletter: 'Media.Editorial',
  audio: 'Media.Audio',
  podcast: 'Media.Audio',
  research: 'Media.Research',
  research_report: 'Media.Research',
};

export function resolveContentCapability(type: string): string | null {
  const key = (type || '').trim().toLowerCase();
  return CONTENT_TYPE_CAPABILITIES[key] ?? null;
}

function readBearer(req: NextRequest): string | null {
  const header = req.headers.get('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() ?? null;
}

/**
 * @param requiredPermissions el cliente debe tener al menos uno de estos.
 */
export async function authorizeContentClient(
  req: NextRequest,
  requiredPermissions: string[]
): Promise<ContentAuthResult> {
  const rawKey = readBearer(req);
  if (!rawKey) {
    return { ok: false, status: 401, error: 'Missing Authorization header (Bearer <sk_live_...>).' };
  }
  if (rawKey.startsWith('pk_')) {
    return {
      ok: false,
      status: 403,
      error: 'Public keys (pk_) cannot access the Content API. Use a secret key (sk_).',
      code: 'SECRET_KEY_REQUIRED',
    };
  }

  let client: Awaited<ReturnType<typeof IntegrationKeyService.validateKey>>;
  try {
    client = await IntegrationKeyService.validateKey(rawKey);
  } catch (error: unknown) {
    console.error('[ContentAPI] Key validation failed:', error);
    return { ok: false, status: 401, error: 'Failed to validate API key.' };
  }

  if (!client) {
    return { ok: false, status: 401, error: 'Invalid API Key.' };
  }

  const permissions = (client.permissions as string[]) ?? [];
  const authorized =
    permissions.includes('*') || requiredPermissions.some((permission) => permissions.includes(permission));
  if (!authorized) {
    return {
      ok: false,
      status: 403,
      error: `Missing required permission: ${requiredPermissions.join(' or ')}.`,
      code: 'FORBIDDEN_PERMISSION',
    };
  }

  if (!client.projectId) {
    return {
      ok: false,
      status: 403,
      error: 'This API key is not bound to a project/tenant, so it cannot operate Content.',
      code: 'KEY_NOT_TENANT_BOUND',
    };
  }

  const [project] = await db
    .select({ id: projects.id, slug: projects.slug, title: projects.title })
    .from(projects)
    .where(eq(projects.id, client.projectId))
    .limit(1);

  if (!project) {
    return {
      ok: false,
      status: 403,
      error: 'The project bound to this API key no longer exists.',
      code: 'TENANT_NOT_FOUND',
    };
  }

  const canonical = await TenantAuthorityService.resolveCanonicalTenant(project.slug);
  if (!canonical) {
    return {
      ok: false,
      status: 403,
      error: `Tenant '${project.slug}' could not be resolved to a canonical identity.`,
      code: 'TENANT_NOT_CANONICAL',
    };
  }

  return {
    ok: true,
    client: {
      clientId: client.id,
      keyType: client.keyType as 'public' | 'secret',
      environment: client.environment,
      permissions,
      tenantId: canonical.projectSlug.toLowerCase(),
      canonicalOrgId: canonical.canonicalOrgId,
      projectId: project.id,
      projectTitle: project.title,
    },
  };
}
