import { NextRequest, NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { hermesArtifacts, projects } from '@saasfly/db/schema';
import { and, eq } from '@saasfly/db-core';
import { authorizeContentClient } from '@/lib/content/tenant-authority';
import { ArtifactLifecycleError, ArtifactLifecycleService } from '@/lib/content/delivery/artifact-lifecycle';
import {
  DELIVERY_DISABLED_RESPONSE,
  getArtifactRepository,
  isDeliveryEnabled,
} from '@/lib/content/delivery/service-factory';
import { resolveStorageAdapter } from '@/lib/content/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/v1/content/assets/:assetId/versions
 *
 * INGESTA de bytes a almacenamiento (Blob privado) y creación de la versión.
 * Permiso: `content.asset.create`.
 *
 * - El tenant se resuelve de la API key; el artefacto debe pertenecerle.
 * - El proveedor se decide en servidor desde la config del proyecto.
 * - Si el almacenamiento no está configurado: 503 UNSTORED (nunca un CID falso).
 * - Compensación: si la persistencia falla tras subir, el objeto se elimina.
 *
 * Body: bytes crudos. `Content-Type` obligatorio. `?version=N` opcional (por
 * defecto, la siguiente versión libre).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ assetId: string }> }) {
  if (!isDeliveryEnabled()) {
    return NextResponse.json({ success: false, ...DELIVERY_DISABLED_RESPONSE }, { status: 503 });
  }

  const auth = await authorizeContentClient(req, ['content.asset.create']);
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

  const contentType = req.headers.get('content-type');
  if (!contentType || contentType.trim().length === 0) {
    return NextResponse.json(
      { success: false, code: 'VALIDATION', error: 'Content-Type es obligatorio.' },
      { status: 422 },
    );
  }

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

  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await req.arrayBuffer());
  } catch {
    return NextResponse.json(
      { success: false, code: 'VALIDATION', error: 'No se pudo leer el cuerpo.' },
      { status: 400 },
    );
  }
  if (bytes.byteLength === 0) {
    return NextResponse.json(
      { success: false, code: 'VALIDATION', error: 'El cuerpo está vacío.' },
      { status: 422 },
    );
  }

  try {
    const repo = getArtifactRepository();
    const versions = await repo.listVersions(assetId);
    const requested = Number(new URL(req.url).searchParams.get('version') ?? '');
    const version =
      Number.isInteger(requested) && requested > 0
        ? requested
        : versions.reduce((max, v) => Math.max(max, v.version), 0) + 1;

    if (versions.some((v) => v.version === version)) {
      return NextResponse.json(
        { success: false, code: 'VERSION_EXISTS', error: `La versión ${version} ya existe.` },
        { status: 409 },
      );
    }

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

    const adapter = resolveStorageAdapter(storageConfig);

    const service = new ArtifactLifecycleService({ repo, storage: adapter });

    const result = await service.storeVersion({
      artifactId: assetId,
      tenantId: client.tenantId,
      version,
      bytes,
      contentType,
      actor: {
        kind: 'api_key',
        id: `integration_client:${client.clientId}`,
        ownerId: null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        assetId,
        version: result.version.version,
        status: result.version.status,
        sha256: result.version.sha256,
        sizeBytes: result.storage.sizeBytes,
        provider: result.storage.provider,
        storageKey: result.storage.storageKey,
        notes: [
          'La versión queda en `draft`: requiere envío a revisión y aprobación humana.',
          'El objeto se almacena en modo privado: no hay URL pública.',
        ],
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    if (error instanceof ArtifactLifecycleError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.code === 'UNSTORED' ? 503 : 422 },
      );
    }
    console.error('[ContentAPI] POST /assets/:id/versions failed:', error);
    return NextResponse.json({ success: false, error: 'Internal error.' }, { status: 500 });
  }
}
