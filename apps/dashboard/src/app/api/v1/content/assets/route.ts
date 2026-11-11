import { NextRequest, NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { hermesArtifacts, projects } from '@saasfly/db/schema';
import { and, desc, eq } from '@saasfly/db-core';
import { authorizeContentClient } from '@/lib/content/tenant-authority';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/v1/content/assets
 *
 * Lista los artefactos reales del tenant (tabla `hermes_artifacts`), ya anclados
 * con CID/IPFS y SHA-256 por el orquestador.
 *
 * Query: limit (1-100, default 25), offset, type (artifact_type), status
 * (approved | rejected | pending, leído de metadata_json.approval.status).
 */
export async function GET(req: NextRequest) {
  const auth = await authorizeContentClient(req, ['content.asset.read']);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }
  const { client } = auth;

  const url = new URL(req.url);
  const limitRaw = Number(url.searchParams.get('limit') ?? '25');
  const offsetRaw = Number(url.searchParams.get('offset') ?? '0');
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.trunc(limitRaw), 1), 100) : 25;
  const offset = Number.isFinite(offsetRaw) ? Math.max(Math.trunc(offsetRaw), 0) : 0;
  const typeFilter = (url.searchParams.get('type') ?? '').trim();
  const statusFilter = (url.searchParams.get('status') ?? '').trim().toLowerCase();

  try {
    // Base pública declarada por el tenant (su gateway/CDN). Nunca se comparte
    // infraestructura de otro tenant.
    const [projectRow] = await db
      .select({ config: projects.tenantRuntimeConfig })
      .from(projects)
      .where(eq(projects.id, client.projectId))
      .limit(1);
    const config = projectRow?.config;
    const rawBase =
      config !== null && typeof config === 'object'
        ? (config as Record<string, unknown>).assetsPublicBaseUrl
        : null;
    const publicBase = typeof rawBase === 'string' ? rawBase.replace(/\/+$/, '') : null;

    const conditions = [eq(hermesArtifacts.tenantId, client.tenantId)];
    if (typeFilter) conditions.push(eq(hermesArtifacts.artifactType, typeFilter));

    // Se pide un registro extra para saber si hay página siguiente.
    const rows = await db
      .select()
      .from(hermesArtifacts)
      .where(and(...conditions))
      .orderBy(desc(hermesArtifacts.createdAt))
      .limit(limit + 1)
      .offset(offset);

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    const assets = page.map((row) => {
      const metadata = (row.metadataJson ?? {}) as Record<string, unknown>;
      const approval = metadata.approval ?? null;
      // Un CID `mock_` no está en IPFS: no se inventa una URL pública.
      const isPinned = row.cid !== null && row.cid.length > 0 && !row.cid.startsWith('mock_');
      const publicUrl =
        isPinned && row.cid && publicBase ? `${publicBase}/${encodeURIComponent(row.cid)}` : null;
      return {
        assetId: row.artifactId,
        id: row.id,
        type: row.artifactType,
        title: row.title,
        cid: row.cid,
        ipfsUri: row.ipfsUri,
        sha256: row.sha256,
        mimeType: row.mimeType,
        sizeBytes: row.sizeBytes,
        producer: row.producer,
        createdAt: row.createdAt,
        approval,
        publicUrl,
        publicUrlUnavailableReason: publicUrl
          ? null
          : isPinned
            ? 'TENANT_BASE_URL_NOT_CONFIGURED'
            : 'ARTIFACT_NOT_PINNED',
      };
    });

    const approvalStatus = (value: unknown): string => {
      if (value === null || typeof value !== 'object') return 'pending';
      const status = (value as { status?: unknown }).status;
      return typeof status === 'string' ? status : 'pending';
    };

    const filtered = statusFilter
      ? assets.filter((asset) => approvalStatus(asset.approval) === statusFilter)
      : assets;

    return NextResponse.json({
      success: true,
      assets: filtered,
      pagination: { limit, offset, hasMore },
    });
  } catch (error: unknown) {
    console.error('[ContentAPI] GET /assets failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal error listing assets.' },
      { status: 500 }
    );
  }
}
