import { NextRequest, NextResponse } from 'next/server';
import { EnvelopeService } from '@/lib/deal-signing/envelope-service';
import { db } from '@/db';
import { dealEnvelopes } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/deal-signing/envelopes
 * Creates a new Sovereign Document Envelope from PDF upload & signer specifications
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const organizationId = formData.get('organizationId') as string | null;
    const title = formData.get('title') as string | null;
    const description = (formData.get('description') as string) || undefined;
    const signingPolicy = (formData.get('signingPolicy') as any) || 'PARALLEL';
    const thresholdM = formData.get('thresholdM') ? parseInt(formData.get('thresholdM') as string, 10) : undefined;
    const signersRaw = formData.get('signers') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'MISSING_FILE', message: 'PDF file is mandatory.' },
        { status: 400 }
      );
    }
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'MISSING_ORG', message: 'organizationId is mandatory.' },
        { status: 400 }
      );
    }
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'MISSING_TITLE', message: 'title is mandatory.' },
        { status: 400 }
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
 * GET /api/v1/deal-signing/envelopes?organizationId=snarai&status=COMPLETED
 * Lists envelopes for an organization
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'MISSING_ORG', message: 'Query param [organizationId] is required.' },
        { status: 400 }
      );
    }

    const conditions = [eq(dealEnvelopes.organizationId, organizationId)];
    if (status) {
      conditions.push(eq(dealEnvelopes.status, status));
    }

    const rows = await db
      .select()
      .from(dealEnvelopes)
      .where(and(...conditions))
      .orderBy(desc(dealEnvelopes.createdAt))
      .limit(50);

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
