import { NextRequest, NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { hermesArtifacts, projects } from '@saasfly/db/schema';
import { and, eq } from '@saasfly/db-core';
import { authorizeContentClient } from '@/lib/content/tenant-authority';
import { issueDeliveryToken } from '@/lib/content/delivery/delivery-token';
import {
  DELIVERY_DISABLED_RESPONSE,
  getArtifactRepository,
  isDeliveryEnabled,
} from '@/lib/content/delivery/service-factory';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/v1/content/assets/:assetId/delivery-token
 *
 * Emite un token de entrega de alcance limitado para un artefacto PUBLICADO.
 *
 * El token NO es una API key y NO hereda sus permisos: solo permite descargar
 * esa versión mientras siga vigente, no revocada y no expirada.
 *
 * Permiso: `content.token.issue`.
 * Body: { version?: number, ttlSeconds?: number }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ assetId: string }> }) {
  if (!isDeliveryEnabled()) {
    return NextResponse.json(
      { success: false, ...DELIVERY_DISABLED_RESPONSE },
      { status: 503 },
    );
  }

  const auth = await authorizeContentClient(req, ['content.token.issue']);
  if (!auth.ok) {
    return NextResponse.json(
      { success: false, error: auth.error, code: auth.code },
      { status: auth.status },
    );
  }
  const { client } = auth;

  const { assetId } = await params;
  if (!assetId) {
    return NextResponse.json({ success: false, error: 'Missing assetId.' }, { status: 400 });
  }

  let body: { version?: unknown; ttlSeconds?: unknown } = {};
  try {
    body = (await req.json()) as { version?: unknown; ttlSeconds?: unknown };
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const requestedVersion =
    typeof body.version === 'number' && Number.isInteger(body.version) && body.version > 0
      ? body.version
      : null;
  const ttlSeconds =
    typeof body.ttlSeconds === 'number' && Number.isInteger(body.ttlSeconds)
      ? body.ttlSeconds
      : undefined;

  try {
    // Aislamiento: el artefacto debe pertenecer al tenant resuelto desde la key.
    const [artifact] = await db
      .select({ artifactId: hermesArtifacts.artifactId })
      .from(hermesArtifacts)
      .where(
        and(
          eq(hermesArtifacts.tenantId, client.tenantId),
          eq(hermesArtifacts.artifactId, assetId),
        ),
      )
      .limit(1);

    if (!artifact) {
      return NextResponse.json({ success: false, error: 'Asset not found.' }, { status: 404 });
    }

    const repo = getArtifactRepository();
    const versions = await repo.listVersions(assetId);
    const published = versions.filter((v) => v.status === 'published');

    if (published.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'El artefacto no tiene ninguna versión publicada.',
          code: 'NOT_PUBLISHED',
        },
        { status: 409 },
      );
    }

    const current = published.reduce((max, v) => (v.version > max.version ? v : max), published[0]!);
    const targetVersion = requestedVersion ?? current.version;

    if (targetVersion !== current.version) {
      return NextResponse.json(
        {
          success: false,
          error: 'Solo se emiten tokens para la versión vigente.',
          code: 'VERSION_NOT_CURRENT',
        },
        { status: 409 },
      );
    }

    const target = published.find((v) => v.version === targetVersion);
    if (!target) {
      return NextResponse.json(
        { success: false, error: 'La versión solicitada no está publicada.', code: 'NOT_PUBLISHED' },
        { status: 409 },
      );
    }

    const storage = await repo.getStorage(assetId, targetVersion);
    if (!storage || storage.physicalState !== 'stored') {
      return NextResponse.json(
        {
          success: false,
          error: 'El almacenamiento de la versión no está disponible.',
          code: 'STORAGE_NOT_READY',
        },
        { status: 409 },
      );
    }

    // El storage resuelto por tenant se valida también aquí: si el tenant no
    // tiene almacenamiento configurado, no se emite un token que no podrá servir.
    const [projectRow] = await db
      .select({ config: projects.tenantRuntimeConfig })
      .from(projects)
      .where(eq(projects.id, client.projectId))
      .limit(1);
    const rawConfig = projectRow?.config;
    const storageConfig =
      rawConfig !== null && typeof rawConfig === 'object'
        ? ((rawConfig as Record<string, unknown>).storage as { provider?: string } | undefined) ?? null
        : null;

    const provider = (storageConfig?.provider ?? storage.provider ?? '').toLowerCase();
    if (provider === 'ipfs') {
      return NextResponse.json(
        {
          success: false,
          error: 'IPFS no está habilitado en P0.3.',
          code: 'STORAGE_PROVIDER_UNAVAILABLE',
        },
        { status: 503 },
      );
    }

    const { token, record } = await issueDeliveryToken({
      store: repo,
      artifactId: assetId,
      version: targetVersion,
      tenantId: client.tenantId,
      issuedByKind: 'api_key',
      issuedById: `integration_client:${client.clientId}`,
      ttlSeconds,
    });

    return NextResponse.json({
      success: true,
      token,
      expiresAt: new Date(record.expiresAt * 1000).toISOString(),
      artifactId: assetId,
      version: targetVersion,
      deliveryPath: `/api/v1/content/assets/${encodeURIComponent(assetId)}/file?token=${encodeURIComponent(
        token,
      )}&v=${targetVersion}`,
      notes: [
        'El token es una credencial independiente: no es una API key ni hereda sus permisos.',
        'El token deja de servir si el artefacto se despublica, se reemplaza o se revoca, aunque no haya expirado.',
      ],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error issuing delivery token.';
    const code = (error as { code?: string } | null)?.code;
    if (code === 'SECRET_NOT_CONFIGURED' || code === 'TTL_INVALID') {
      return NextResponse.json({ success: false, error: message, code }, { status: 422 });
    }
    console.error('[ContentAPI] POST /assets/:id/delivery-token failed:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
