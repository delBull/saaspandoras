import { NextRequest, NextResponse } from 'next/server';
import { EnvelopeService } from '@/lib/deal-signing/envelope-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/deal-signing/envelopes/[envelopeId]/sign
 * Submits an EIP-712 signature for a specific signer
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ envelopeId: string }> }
) {
  try {
    const { envelopeId } = await params;
    const body = await req.json();

    const {
      signerId,
      signerAddress,
      signature,
      customStatement,
    } = body;

    if (!signerId) {
      return NextResponse.json(
        { success: false, error: 'MISSING_SIGNER_ID', message: 'Field [signerId] is required.' },
        { status: 400 }
      );
    }
    if (!signerAddress || !signature) {
      return NextResponse.json(
        { success: false, error: 'MISSING_SIGNATURE', message: 'Fields [signerAddress] and [signature] are required.' },
        { status: 400 }
      );
    }

    const ipAddress = 
      req.headers.get('x-real-ip') || 
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
      'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    const result = await EnvelopeService.submitSignature({
      envelopeId,
      signerId,
      signerAddress,
      signature: signature as `0x${string}`,
      customStatement,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      envelope: result.envelope,
      isComplete: result.isComplete,
    });

  } catch (error: any) {
    console.error('[DealSigning API] Error submitting signature:', error);
    return NextResponse.json(
      { success: false, error: 'SIGNATURE_SUBMISSION_FAILED', message: error?.message || 'Signature submission failed' },
      { status: 400 }
    );
  }
}
