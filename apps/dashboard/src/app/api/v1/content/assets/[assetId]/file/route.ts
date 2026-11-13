import { NextRequest, NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { hermesArtifacts, projects } from '@saasfly/db/schema';
import { and, eq } from '@saasfly/db-core';
import { authorizeDelivery, DeliveryTokenError } from '@/lib/content/delivery/delivery-token';
import {
  DELIVERY_DISABLED_RESPONSE,
  getArtifactRepository,
  isDeliveryEnabled,
} from '@/lib/content/delivery/service-factory';
import { resolveStorageAdapter } from '@/lib/content/storage';
import { StorageNotConfiguredError } from '@/lib/content/storage/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/v1/content/assets/:assetId/file?token=<opaco>&v=<version>
 *
 * Proxy firmado: el ÚNICO camino de entrega de contenido gestionado.
 * No existe URL pública directa.
 *
 * En CADA solicitud se valida:
 *  1. token con firma válida y no expirado
 *  2. token registrado y NO revocado
 *  3. tenant, artefacto y versión del token == recurso solicitado
 *  4. artefacto PUBLICADO y versión VIGENTE
 *  5. objeto físico presente en el proveedor
 *
 * Cualquier fallo ⇒ no se sirve. La revocación es efectiva aunque el token no
 * haya expirado, porque el estado de negocio se consulta en cada petición.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ assetId: string }> }) {
  if (!isDeliveryEnabled()) {
    return NextResponse.json({ success: false, ...DELIVERY_DISABLED_RESPONSE }, { status: 503 });
  }

  const { assetId } = await params;
  const token = new URL(req.url).searchParams.get('token') ?? '';
  const versionRaw = new URL(req.url).searchParams.get('v') ?? '';
  const version = Number(versionRaw);

  if (!assetId || !token || !Number.isInteger(version) || version <= 0) {
    return NextResponse.json(
      { success: false, error: 'Se requieren assetId, token y v (entero positivo).', code: 'BAD_REQUEST' },
      { status: 400 },
    );
  }

  try {
    // Tenant resuelto por el artefacto, no por el cliente.
    const [artifact] = await db
      .select({ tenantId: hermesArtifacts.tenantId })
      .from(hermesArtifacts)
      .where(eq(hermesArtifacts.artifactId, assetId))
      .limit(1);

    if (!artifact) {
      return NextResponse.json({ success: false, error: 'Asset not found.' }, { status: 404 });
    }

    const repo = getArtifactRepository();
    const versions = await repo.listVersions(assetId);
    const published = versions.filter((v) => v.status === 'published');
    const current = published.length
      ? published.reduce((max, v) => (v.version > max.version ? v : max), published[0]!)
      : null;

    const record = await authorizeDelivery({
      token,
      store: repo,
      tenantId: artifact.tenantId,
      artifactId: assetId,
      version,
      context: {
        artifactPublished: published.some((v) => v.version === version),
        currentVersion: current?.version ?? null,
      },
    });

    const storage = await repo.getStorage(assetId, version);
    if (!storage || storage.physicalState !== 'stored') {
      return NextResponse.json(
        {
          success: false,
          error: 'El objeto físico no está disponible para entrega.',
          code: 'STORAGE_NOT_READY',
        },
        { status: 409 },
      );
    }

    // Adaptador resuelto en servidor desde la config del proyecto.
    const [projectRow] = await db
      .select({ id: projects.id, config: projects.tenantRuntimeConfig })
      .from(projects)
      .where(eq(projects.slug, artifact.tenantId))
      .limit(1);

    const rawConfig = projectRow?.config;
    const storageConfig =
      rawConfig !== null && typeof rawConfig === 'object'
        ? ((rawConfig as Record<string, unknown>).storage as { provider?: string } | undefined) ?? null
        : null;

    const adapter = resolveStorageAdapter(storageConfig);
    const object = await adapter.read(storage.storageKey);
    if (!object) {
      // La DB decía `stored` pero el proveedor no lo tiene: incidente explícito.
      await repo.setPhysicalState(
        assetId,
        version,
        'missing',
        'La entrega no encontró el objeto en el proveedor.',
      );
      return NextResponse.json(
        { success: false, error: 'El objeto no existe en el proveedor.', code: 'OBJECT_MISSING' },
        { status: 410 },
      );
    }

    await repo.touch(record.id, Math.floor(Date.now() / 1000));
    await repo.appendEvent({
      id: `delivery_${record.id}_${Date.now()}`,
      artifactId: assetId,
      version,
      type: 'delivered',
      actorKind: 'api_key',
      actorId: record.issuedById,
      previousState: 'published',
      newState: 'published',
      reason: null,
      metadata: { jti: record.id },
      createdAt: new Date().toISOString(),
    });

    return new NextResponse(object.stream, {
      status: 200,
      headers: {
        'Content-Type': object.contentType || storage.contentType || 'application/octet-stream',
        'Content-Disposition': 'inline',
        // La entrega es efímera y autorizada por petición: nunca cachear en CDN.
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
      },
    });
  } catch (error: unknown) {
    if (error instanceof DeliveryTokenError) {
      const status =
        error.code === 'INVALID_FORMAT' || error.code === 'INVALID_SIGNATURE' || error.code === 'EXPIRED'
          ? 401
          : error.code === 'REVOKED'
            ? 403
            : 404;
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status });
    }
    if (error instanceof StorageNotConfiguredError) {
      return NextResponse.json(
        { success: false, error: error.message, code: 'STORAGE_NOT_CONFIGURED' },
        { status: 503 },
      );
    }
    console.error('[ContentAPI] GET /assets/:id/file failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal delivery error.' },
      { status: 500 },
    );
  }
}
