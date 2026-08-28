import { NextRequest, NextResponse } from 'next/server';
import { A2AMessageHandler } from '@/lib/pandoras/core/domains/hermes/a2a/a2a-message-handler';
import { A2AMessage } from '@/lib/pandoras/core/domains/hermes/a2a/contracts';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/a2a/messages
 * Ingress endpoint for sovereign Agent-to-Agent communication (Sofía ↔ Hermes).
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const message = rawBody as A2AMessage;

    if (!message || !message.protocol || !message.security) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_A2A_ENVELOPE',
            message: 'Body must be a valid PANDORAS A2A v1.0 message envelope with security signatures',
          },
        },
        { status: 400 }
      );
    }

    const result = await A2AMessageHandler.processIncomingMessage(message);

    if (!result.success) {
      const statusCode = result.error?.code === 'SECURITY_VALIDATION_FAILED' ||
        result.error?.code === 'INVALID_HMAC' ||
        result.error?.code === 'INVALID_WALLET_SIGNATURE'
        ? 401
        : result.error?.code === 'CAPABILITY_DENIED'
        ? 403
        : 400;

      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[API /a2a/messages] Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_INGRESS_ERROR',
          message: err?.message || 'Internal server error processing A2A envelope',
        },
      },
      { status: 500 }
    );
  }
}
