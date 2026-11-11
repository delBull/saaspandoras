import { NextRequest, NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { projects } from '@saasfly/db/schema';
import { eq } from '@saasfly/db-core';
import { isPinningSecretConfigured, sealPinningSecret } from '@saasfly/hermes-core';
import { authorizeContentClient } from '@/lib/content/tenant-authority';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET/PUT /api/v1/content/settings
 *
 * Configuración de entrega y almacenamiento del tenant:
 *  - `assetsPublicBaseUrl`: base pública donde se sirven los assets (`<base>/<cid>`).
 *  - `ipfsPinning`: `{ mode: "managed" }` (Hermes pinnea y cobra GB-mes) o
 *    `{ mode: "byo", pinApiUrl, pinApiToken }` (nodo propio del tenant).
 *
 * El token BYO se guarda **cifrado** (AES-256-GCM, `HERMES_KMS_KEK`/`ENCRYPTION_KEY`)
 * y jamás se devuelve en la respuesta.
 *
 * Permisos: `content.asset.read` (GET) · `content.asset.create` (PUT).
 */

const URL_REGEX = /^https:\/\/[a-z0-9.-]+(:\d+)?(\/[^\s]*)?$/i;

function asConfig(config: unknown): Record<string, unknown> {
  return config !== null && typeof config === 'object' ? { ...(config as Record<string, unknown>) } : {};
}

function describePinning(config: Record<string, unknown>): {
  mode: 'managed' | 'byo';
  pinApiUrl: string | null;
  hasPinToken: boolean;
} {
  const ipfs = config.ipfsPinning;
  if (ipfs !== null && typeof ipfs === 'object') {
    const raw = ipfs as Record<string, unknown>;
    const mode = raw.mode === 'byo' ? 'byo' : 'managed';
    return {
      mode,
      pinApiUrl: typeof raw.pinApiUrl === 'string' ? raw.pinApiUrl : null,
      hasPinToken: typeof raw.pinApiTokenSealed === 'string' && raw.pinApiTokenSealed.length > 0,
    };
  }
  return { mode: 'managed', pinApiUrl: null, hasPinToken: false };
}

export async function GET(req: NextRequest) {
  const auth = await authorizeContentClient(req, ['content.asset.read']);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }

  const [project] = await db
    .select({ config: projects.tenantRuntimeConfig })
    .from(projects)
    .where(eq(projects.id, auth.client.projectId))
    .limit(1);

  const config = asConfig(project?.config);
  const base = typeof config.assetsPublicBaseUrl === 'string' ? config.assetsPublicBaseUrl : null;

  return NextResponse.json({
    success: true,
    tenant: auth.client.tenantId,
    assetsPublicBaseUrl: base,
    ipfsPinning: describePinning(config),
    instructions: {
      assetsPublicBaseUrl:
        'Base HTTPS pública sin barra final (ej. https://cdn.tudominio.com). Los assets se publican como <base>/<cid>.',
      byoPinning:
        'Para pinning propio: mode="byo", pinApiUrl=https://tu-nodo/api/v0 (Kubo) y pinApiToken (se guarda cifrado).',
      managedPinning:
        'mode="managed": Hermes pinnea en su nodo y factura el almacenamiento por GB-mes.',
    },
  });
}

export async function PUT(req: NextRequest) {
  const auth = await authorizeContentClient(req, ['content.asset.create']);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }

  let body: {
    assetsPublicBaseUrl?: unknown;
    ipfsPinning?: unknown;
  } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const [project] = await db
    .select({ id: projects.id, config: projects.tenantRuntimeConfig })
    .from(projects)
    .where(eq(projects.id, auth.client.projectId))
    .limit(1);

  if (!project) {
    return NextResponse.json({ success: false, error: 'Tenant not found.' }, { status: 404 });
  }

  const current = asConfig(project.config);
  const next: Record<string, unknown> = { ...current };

  // ── Base pública de entrega ─────────────────────────────────────────────────
  if (body.assetsPublicBaseUrl !== undefined) {
    const raw = typeof body.assetsPublicBaseUrl === 'string' ? body.assetsPublicBaseUrl.trim() : '';
    if (raw && !URL_REGEX.test(raw)) {
      return NextResponse.json(
        { success: false, error: 'assetsPublicBaseUrl must be a public https:// URL (no trailing slash).' },
        { status: 422 }
      );
    }
    next.assetsPublicBaseUrl = raw ? raw.replace(/\/+$/, '') : null;
  }

  // ── Pinning (gestionado o BYO) ──────────────────────────────────────────────
  if (body.ipfsPinning !== undefined) {
    const incoming =
      body.ipfsPinning !== null && typeof body.ipfsPinning === 'object'
        ? (body.ipfsPinning as Record<string, unknown>)
        : {};
    const mode = incoming.mode === 'byo' ? 'byo' : incoming.mode === 'managed' ? 'managed' : null;

    if (!mode) {
      return NextResponse.json(
        { success: false, error: 'ipfsPinning.mode must be "managed" or "byo".' },
        { status: 422 }
      );
    }

    if (mode === 'managed') {
      next.ipfsPinning = { mode: 'managed' };
    } else {
      const pinApiUrl = typeof incoming.pinApiUrl === 'string' ? incoming.pinApiUrl.trim() : '';
      if (!URL_REGEX.test(pinApiUrl)) {
        return NextResponse.json(
          { success: false, error: 'ipfsPinning.pinApiUrl must be a public https:// URL (Kubo API).' },
          { status: 422 }
        );
      }

      const currentPinning =
        current.ipfsPinning !== null && typeof current.ipfsPinning === 'object'
          ? (current.ipfsPinning as Record<string, unknown>)
          : {};
      let sealed = typeof currentPinning.pinApiTokenSealed === 'string' ? currentPinning.pinApiTokenSealed : null;

      const rawToken = typeof incoming.pinApiToken === 'string' ? incoming.pinApiToken.trim() : '';
      if (rawToken) {
        if (!isPinningSecretConfigured()) {
          return NextResponse.json(
            {
              success: false,
              error:
                'El servidor no tiene HERMES_KMS_KEK (o ENCRYPTION_KEY) configurada, así que no puede guardar tu token de forma segura.',
              code: 'SECRETS_KEY_NOT_CONFIGURED',
            },
            { status: 503 }
          );
        }
        sealed = sealPinningSecret(rawToken);
      }

      if (!sealed) {
        return NextResponse.json(
          {
            success: false,
            error: 'ipfsPinning.pinApiToken es requerido la primera vez que configuras tu nodo (se guarda cifrado).',
          },
          { status: 422 }
        );
      }

      next.ipfsPinning = { mode: 'byo', pinApiUrl, pinApiTokenSealed: sealed };
    }
  }

  await db
    .update(projects)
    .set({ tenantRuntimeConfig: next, updatedAt: new Date() })
    .where(eq(projects.id, project.id));

  return NextResponse.json({
    success: true,
    tenant: auth.client.tenantId,
    assetsPublicBaseUrl: typeof next.assetsPublicBaseUrl === 'string' ? next.assetsPublicBaseUrl : null,
    ipfsPinning: describePinning(next),
  });
}
