import { NextResponse } from 'next/server';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { listTenantAssets, uploadTenantAsset } from '@/lib/media/tenant-assets';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Biblioteca de medios del tenant (ADR-020 §2.3-bis).
 *
 *   GET  ?limit=60            → assets del tenant (URLs públicas)
 *   POST multipart `file`     → sube y devuelve la URL https para publicar
 *
 * La organización sale de la sesión del portal; nunca del body.
 */
async function authorize(tenantId: string) {
  const ctx = await resolvePortalContext(tenantId);
  return { ok: true as const, orgId: ctx.organization.slug };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await params;

  try {
    const auth = await authorize(tenantId);
    const limit = Number(new URL(request.url).searchParams.get('limit') || 60);
    const assets = await listTenantAssets(auth.orgId, Number.isFinite(limit) ? limit : 60);
    return NextResponse.json({ ok: true, organization: auth.orgId, assets });
  } catch (err: any) {
    const code = err?.code;
    if (code === 'NO_SESSION' || code === 'INVALID_SESSION') {
      return NextResponse.json({ error: 'Autenticación requerida' }, { status: 401 });
    }
    console.error('[MediaAssets] GET error:', err);
    return NextResponse.json({ error: 'No se pudieron leer los assets' }, { status: 403 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await params;

  try {
    const auth = await authorize(tenantId);

    const form = await request.formData().catch(() => null);
    const file = form?.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Falta el archivo (campo "file").' }, { status: 400 });
    }

    const bytes = Buffer.from(await (file as File).arrayBuffer());
    const asset = await uploadTenantAsset({
      canonicalOrgId: auth.orgId,
      bytes,
      filename: (file as File).name || 'asset.jpg',
      mimeType: (file as File).type,
      title: typeof form?.get('title') === 'string' ? String(form.get('title')) : null,
      source: 'manual',
      createdBy: `portal:${auth.orgId}`,
    });

    return NextResponse.json({ ok: true, asset });
  } catch (err: any) {
    const code = err?.code;
    if (code === 'NO_SESSION' || code === 'INVALID_SESSION') {
      return NextResponse.json({ error: 'Autenticación requerida' }, { status: 401 });
    }
    console.error('[MediaAssets] POST error:', err);
    return NextResponse.json({ error: err?.message || 'No se pudo subir el archivo' }, { status: 400 });
  }
}
