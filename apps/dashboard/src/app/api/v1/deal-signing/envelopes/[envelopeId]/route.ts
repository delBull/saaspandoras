import { NextRequest, NextResponse } from 'next/server';
import { EnvelopeService } from '@/lib/deal-signing/envelope-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/deal-signing/envelopes/[envelopeId]
 * Returns full envelope details including signers and verification status
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ envelopeId: string }> }
) {
  try {
    const { envelopeId } = await params;
    const envelope = await EnvelopeService.getEnvelope(envelopeId);

    if (!envelope) {
      return NextResponse.json(
        { success: false, error: 'ENVELOPE_NOT_FOUND', message: `Envelope '${envelopeId}' does not exist.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      envelope,
    });
  } catch (error: any) {
    console.error('[DealSigning API] Error getting envelope:', error);
    return NextResponse.json(
      { success: false, error: 'ENVELOPE_FETCH_FAILED', message: error?.message || 'Failed to fetch envelope' },
      { status: 500 }
    );
  }
}
