import { NextRequest, NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { hermesMediaRequests } from '@saasfly/db/schema';
import { and, eq } from '@saasfly/db-core';
import { authorizeContentClient } from '@/lib/content/tenant-authority';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/v1/content/jobs/:jobId
 *
 * Estado real de un job de producción. Se consulta SIEMPRE acotado al tenant de
 * la API key: un job de otro tenant responde 404 (no se filtra existencia).
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const auth = await authorizeContentClient(req, ['content.asset.read', 'content.asset.create']);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }
  const { client } = auth;

  const { jobId } = await params;
  if (!jobId) {
    return NextResponse.json({ success: false, error: 'Missing jobId.' }, { status: 400 });
  }

  try {
    const [job] = await db
      .select()
      .from(hermesMediaRequests)
      .where(
        and(
          eq(hermesMediaRequests.id, jobId),
          eq(hermesMediaRequests.tenantId, client.tenantId)
        )
      )
      .limit(1);

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        provider: job.provider,
        capability: job.capability,
        artifactId: job.artifactId ?? null,
        failureCode: job.failureCode ?? null,
        failureMessage: job.failureMessage ?? null,
        createdAt: job.createdAt,
        completedAt: job.completedAt ?? null,
        // `briefJson` contiene el payload saneado + metadatos de ejecución.
        brief: (job.briefJson as Record<string, unknown> | null) ?? null,
      },
    });
  } catch (error: unknown) {
    console.error('[ContentAPI] GET /jobs/:jobId failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal error reading job.' },
      { status: 500 }
    );
  }
}
