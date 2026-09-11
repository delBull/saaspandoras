import { NextRequest, NextResponse } from 'next/server';
import { requireNexusAdmin } from '@/lib/nexus/collaborators-service';
import { sealContactDoctrine, getContactDoctrineSeal } from '@/lib/hermes/identity/contact-doctrine';

/**
 * 🔐 POST /api/v1/identity/contact-doctrine
 * (Admin-protected) Sella la doctrina actual de un contacto (leadId) a la bóveda
 * soberana IPFS (K25 envelope + CID derivable + firma EIP-712) y registra el puntero.
 */
export async function POST(req: NextRequest) {
  if (!(await requireNexusAdmin(req))) {
    return NextResponse.json({ ok: false, error: 'Admin authentication required' }, { status: 403 });
  }
  const body = await req.json().catch(() => ({} as any));
  const leadId = String(body?.leadId || '').trim();
  if (!leadId) {
    return NextResponse.json({ ok: false, error: 'leadId is required' }, { status: 400 });
  }
  try {
    const receipt = await sealContactDoctrine(leadId, { trigger: 'api' });
    return NextResponse.json({ ok: true, receipt });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Seal failed' }, { status: 500 });
  }
}

/**
 * GET /api/v1/identity/contact-doctrine?leadId=...
 * (Admin-protected) Devuelve el último sello registrado del contacto.
 */
export async function GET(req: NextRequest) {
  if (!(await requireNexusAdmin(req))) {
    return NextResponse.json({ ok: false, error: 'Admin authentication required' }, { status: 403 });
  }
  const leadId = new URL(req.url).searchParams.get('leadId') || '';
  if (!leadId) {
    return NextResponse.json({ ok: false, error: 'leadId is required' }, { status: 400 });
  }
  const seal = await getContactDoctrineSeal(leadId);
  return NextResponse.json({ ok: Boolean(seal), seal });
}
