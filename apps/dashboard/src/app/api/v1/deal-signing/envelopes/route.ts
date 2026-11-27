import { NextRequest, NextResponse } from 'next/server';
import { EnvelopeService } from '@/lib/deal-signing/envelope-service';
import { db } from '@saasfly/db';
import { dealEnvelopes } from '@saasfly/db/schema';
import { eq, and, desc } from "@saasfly/db-core";
import { checkRateLimit, clientIpFromHeaders } from '@saasfly/hermes-core';

export const dynamic = 'force-dynamic';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '') || 'sovereign';
}

/**
 * POST /api/v1/deal-signing/envelopes
 * Creates a new Sovereign Document Envelope from PDF upload & signer specifications
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const organizationInput = (formData.get('organizationId') as string | null) || (formData.get('companyName') as string | null);
    const title = formData.get('title') as string | null;
    const description = (formData.get('description') as string) || undefined;
    const signingPolicy = (formData.get('signingPolicy') as any) || 'PARALLEL';
    const thresholdM = formData.get('thresholdM') ? parseInt(formData.get('thresholdM') as string, 10) : undefined;
    const signersRaw = formData.get('signers') as string | null;

    /**
     * Portal público: se acepta tráfico de fuera, pero con topes duros para que
     * no se convierta en un servicio de almacenamiento ajeno.
     */
    const ip = clientIpFromHeaders(req.headers as any) || 'anon';
    const perIp = checkRateLimit(`envelopes-create:${ip}`, 10, 60 * 60 * 1000);
    if (!perIp.allowed) {
      return NextResponse.json(
        { success: false, error: 'RATE_LIMITED', message: 'Demasiadas solicitudes. Intenta más tarde.' },
        { status: 429 },
      );
    }

    const MAX_PDF_BYTES = 10 * 1024 * 1024;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'MISSING_FILE', message: 'PDF file is mandatory.' },
        { status: 400 }
      );
    }
    if (file.size === 0 || file.size > MAX_PDF_BYTES) {
      return NextResponse.json(
        { success: false, error: 'FILE_TOO_LARGE', message: `El PDF debe pesar entre 1 byte y ${MAX_PDF_BYTES / 1024 / 1024} MB.` },
        { status: 413 },
      );
    }
    if (file.type && file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'INVALID_MIME', message: 'Solo se aceptan PDF.' },
        { status: 415 },
      );
    }
    // Cabecera real del archivo: el content-type del cliente no es autoridad.
    const head = Buffer.from(await file.slice(0, 5).arrayBuffer()).toString('latin1');
    if (!head.startsWith('%PDF-')) {
      return NextResponse.json(
        { success: false, error: 'INVALID_PDF', message: 'El archivo no es un PDF válido.' },
        { status: 415 },
      );
    }

    if (!title || title.trim().length < 3 || title.length > 200) {
      return NextResponse.json(
        { success: false, error: 'INVALID_TITLE', message: 'El título debe tener entre 3 y 200 caracteres.' },
        { status: 400 }
      );
    }
    if (description && description.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'DESCRIPTION_TOO_LONG', message: 'La descripción admite hasta 2000 caracteres.' },
        { status: 400 }
      );
    }

    // Auto-generate organization slug if not provided, based on company name or title
    const organizationId = organizationInput ? slugify(organizationInput) : slugify(title);

    // Cuota por organización: un mismo negocio no puede inundar el sistema.
    const quota = checkRateLimit(`envelopes-org:${organizationId}`, 20, 60 * 60 * 1000);
    if (!quota.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'ORG_QUOTA_EXCEEDED',
          message: 'Esta organización alcanzó su límite de sobres por hora.',
        },
        { status: 429 },
      );
    }

    let signers: any[] = [];
    try {
      signers = signersRaw ? JSON.parse(signersRaw) : [];
    } catch {
      return NextResponse.json(
        { success: false, error: 'INVALID_SIGNERS', message: 'Field [signers] must be a valid JSON array.' },
        { status: 400 }
      );
    }
    if (!Array.isArray(signers) || signers.length > 20) {
      return NextResponse.json(
        { success: false, error: 'INVALID_SIGNERS', message: 'Se aceptan hasta 20 firmantes.' },
        { status: 400 },
      );
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const signer of signers) {
      const email = String(signer?.email ?? '').trim().toLowerCase();
      if (!emailRe.test(email)) {
        return NextResponse.json(
          { success: false, error: 'INVALID_SIGNER', message: 'Cada firmante necesita un correo válido.' },
          { status: 400 },
        );
      }
    }
    if (!['PARALLEL', 'SEQUENTIAL', 'M_OF_N'].includes(String(signingPolicy))) {
      return NextResponse.json(
        { success: false, error: 'INVALID_POLICY', message: 'signingPolicy debe ser PARALLEL, SEQUENTIAL o M_OF_N.' },
        { status: 400 },
      );
    }
    if (thresholdM !== undefined && (!Number.isInteger(thresholdM) || thresholdM < 1 || thresholdM > Math.max(1, signers.length))) {
      return NextResponse.json(
        { success: false, error: 'INVALID_THRESHOLD', message: 'thresholdM debe estar entre 1 y el número de firmantes.' },
        { status: 400 },
      );
    }

    if (!Array.isArray(signers) || signers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'EMPTY_SIGNERS', message: 'At least one signer is required.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    const envelope = await EnvelopeService.createEnvelope({
      organizationId,
      title,
      description,
      pdfBuffer,
      signingPolicy,
      thresholdM,
      signers,
    });

    return NextResponse.json({
      success: true,
      envelope,
    }, { status: 201 });

  } catch (error: any) {
    console.error('[DealSigning API] Error creating envelope:', error);
    return NextResponse.json(
      { success: false, error: 'ENVELOPE_CREATION_FAILED', message: error?.message || 'Failed to create envelope' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/deal-signing/envelopes?organizationId=...&status=COMPLETED
 * Lists envelopes for an organization or lists recent sovereign envelopes
 */
export async function GET(req: NextRequest) {
  try {
    /**
     * Este endpoint es público (lo usa el portal de firma), así que no se puede
     * cerrar sin romper el flujo. Lo que sí se corrige:
     *  - límite por IP,
     *  - proyección explícita: antes devolvía `select()` completo, es decir
     *    firmantes (correos), hashes y CIDs de todos los sobres.
     */
    const ip = clientIpFromHeaders(req.headers as any) || 'anon';
    const rl = checkRateLimit(`envelopes-get:${ip}`, 60, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'RATE_LIMITED', message: 'Too many requests.' },
        { status: 429 },
      );
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status');

    const conditions: any[] = [];
    if (organizationId && organizationId !== 'all') {
      conditions.push(eq(dealEnvelopes.organizationId, slugify(organizationId)));
    }
    if (status) {
      conditions.push(eq(dealEnvelopes.status, status));
    }

    const query = db
      .select({
        id: dealEnvelopes.id,
        organizationId: dealEnvelopes.organizationId,
        title: dealEnvelopes.title,
        status: dealEnvelopes.status,
        signingPolicy: dealEnvelopes.signingPolicy,
        createdAt: dealEnvelopes.createdAt,
        completedAt: dealEnvelopes.completedAt,
        expiresAt: dealEnvelopes.expiresAt,
      })
      .from(dealEnvelopes)
      .orderBy(desc(dealEnvelopes.createdAt))
      .limit(50);

    const rows = conditions.length > 0 
      ? await query.where(and(...conditions))
      : await query;

    return NextResponse.json({
      success: true,
      envelopes: rows,
    });
  } catch (error: any) {
    console.error('[DealSigning API] Error listing envelopes:', error);
    return NextResponse.json(
      { success: false, error: 'ENVELOPE_QUERY_FAILED', message: error?.message || 'Failed to query envelopes' },
      { status: 500 }
    );
  }
}
