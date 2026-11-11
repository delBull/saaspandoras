import { NextRequest, NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { hermesArtifacts } from '@saasfly/db/schema';
import { and, eq, or } from '@saasfly/db-core';
import { authorizeContentClient } from '@/lib/content/tenant-authority';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_STATUS = new Set(['approved', 'rejected', 'pending']);

/**
 * POST /api/v1/content/assets/:assetId/approval
 *
 * Registra la aprobación editorial de un artefacto del tenant.
 *
 * Se guarda en `hermes_artifacts.metadata_json.approval` con quién la hizo y
 * cuándo. **No** se firma on-chain todavía: eso requiere llave/anclaje en el
 * Knowledge Vault y no se simula (la respuesta lo dice explícitamente).
 *
 * Permiso: `content.asset.approve` o `content.asset.create`.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ assetId: string }> }) {
  const auth = await authorizeContentClient(req, ['content.asset.approve', 'content.asset.create']);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }
  const { client } = auth;

  const { assetId } = await params;
  if (!assetId) {
    return NextResponse.json({ success: false, error: 'Missing assetId.' }, { status: 400 });
  }

  let body: { status?: unknown; note?: unknown } = {};
  try {
    body = (await req.json()) as { status?: unknown; note?: unknown };
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const status = typeof body.status === 'string' ? body.status.trim().toLowerCase() : '';
  if (!ALLOWED_STATUS.has(status)) {
    return NextResponse.json(
      { success: false, error: "status must be one of: 'approved' | 'rejected' | 'pending'." },
      { status: 422 }
    );
  }
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 1000) : null;

  try {
    // `assetId` puede ser el artifactId público o el id interno de la fila.
    const [row] = await db
      .select()
      .from(hermesArtifacts)
      .where(
        and(
          eq(hermesArtifacts.tenantId, client.tenantId),
          or(eq(hermesArtifacts.artifactId, assetId), eq(hermesArtifacts.id, assetId))
        )
      )
      .limit(1);

    if (!row) {
      return NextResponse.json({ success: false, error: 'Asset not found.' }, { status: 404 });
    }

    const currentMetadata = (row.metadataJson as Record<string, unknown> | null) ?? {};
    const approval = {
      status,
      note,
      approvedBy: `integration_client:${client.clientId}`,
      approvedAt: new Date().toISOString(),
      onChain: null as string | null,
    };

    await db
      .update(hermesArtifacts)
      .set({ metadataJson: { ...currentMetadata, approval } })
      .where(
        and(eq(hermesArtifacts.id, row.id), eq(hermesArtifacts.tenantId, client.tenantId))
      );

    return NextResponse.json({
      success: true,
      assetId: row.artifactId,
      approval,
      anchoring: {
        anchored: false,
        reason:
          'La aprobación queda registrada en el sistema. El anclaje criptográfico on-chain (Knowledge Vault) no está habilitado en este endpoint.',
      },
    });
  } catch (error: unknown) {
    console.error('[ContentAPI] POST /assets/:id/approval failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal error recording approval.' },
      { status: 500 }
    );
  }
}
