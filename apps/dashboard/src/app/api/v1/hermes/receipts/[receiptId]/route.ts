/**
 * 🏛️ HERMES OS — Public Receipt Explorer API Route
 * apps/dashboard/src/app/api/v1/hermes/receipts/[receiptId]/route.ts
 *
 * GET /api/v1/hermes/receipts/[receiptId]
 * Verifies and returns details of a ClaimProvenanceReceipt.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ReceiptExplorerService } from '@/lib/pandoras/core/domains/hermes/receipts/receipt-explorer';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ receiptId: string }> }
) {
  try {
    const { receiptId } = await params;

    if (!receiptId) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'receiptId is required' },
        { status: 400 }
      );
    }

    const verification = await ReceiptExplorerService.verifyReceipt(receiptId);

    if (!verification.isValid && verification.error) {
      return NextResponse.json(
        {
          error: 'RECEIPT_NOT_FOUND',
          message: verification.error,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        verification,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[API:hermes/receipts/[receiptId]] Error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_SERVER_ERROR',
        message: error?.message || 'Failed to verify receipt.',
      },
      { status: 500 }
    );
  }
}
