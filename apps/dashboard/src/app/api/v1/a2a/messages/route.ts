import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { A2AMessageHandler } from '@/lib/pandoras/core/domains/hermes/a2a/a2a-message-handler';
import { A2ASecurityValidator } from '@/lib/pandoras/core/domains/hermes/a2a/a2a-security-validator';
import { A2AMessage } from '@/lib/pandoras/core/domains/hermes/a2a/contracts';

export const dynamic = 'force-dynamic';

const TRANSPORT_CLOCK_SKEW_S = 5 * 60; // 5 minutes in seconds

/**
 * Validates the transport-layer HMAC headers used by external agents (e.g. Sofía).
 * Scheme (discovered empirically by Pandoras Media Co):
 *   x-hermes-timestamp : unix timestamp in seconds
 *   x-hermes-signature : "sha256=<hex>" where hex = HMAC(A2A_HMAC_SECRET, "<ts>.<rawBody>")
 *
 * Returns null if valid, or an error response to return immediately.
 */
function validateTransportHeaders(
  req: NextRequest,
  rawBody: string,
): NextResponse | null {
  const tsHeader = req.headers.get('x-hermes-timestamp');
  const sigHeader = req.headers.get('x-hermes-signature');

  // If neither header is present, skip transport validation (backwards compat with internal callers)
  if (!tsHeader && !sigHeader) return null;

  // If one is present without the other, reject immediately
  if (!tsHeader || !sigHeader) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_TRANSPORT_HEADERS', message: 'Both x-hermes-timestamp and x-hermes-signature must be provided together' } },
      { status: 401 }
    );
  }

  // Clock-skew check
  const nowS = Math.floor(Date.now() / 1000);
  const tsS = parseInt(tsHeader, 10);
  if (isNaN(tsS) || Math.abs(nowS - tsS) > TRANSPORT_CLOCK_SKEW_S) {
    return NextResponse.json(
      { success: false, error: { code: 'TRANSPORT_TIMESTAMP_EXPIRED', message: `Transport timestamp out of window. Server time: ${nowS}, received: ${tsS}` } },
      { status: 401 }
    );
  }

  // HMAC check: sha256=HMAC(secret, "<ts>.<body>")
  let secret: string;
  try {
    secret = A2ASecurityValidator.getHmacSecret();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'HMAC_SECRET_UNCONFIGURED', message: 'A2A_HMAC_SECRET not configured on server' } },
      { status: 500 }
    );
  }

  const expectedSig = 'sha256=' + createHmac('sha256', secret).update(`${tsS}.${rawBody}`).digest('hex');

  if (sigHeader !== expectedSig) {
    console.warn('[A2A Ingress] Transport HMAC mismatch', { received: sigHeader?.slice(0, 20), expected: expectedSig.slice(0, 20) });
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_TRANSPORT_HMAC', message: 'Transport HMAC header verification failed' } },
      { status: 401 }
    );
  }

  return null; // valid
}

/**
 * POST /api/v1/a2a/messages
 * Ingress endpoint for sovereign Agent-to-Agent communication (Sofía ↔ Hermes).
 *
 * Security layers:
 *   L1 (transport)  — x-hermes-timestamp + x-hermes-signature validated here.
 *   L2 (envelope)   — security.hmac + security.signature validated by A2ASecurityValidator inside the handler.
 */
export async function POST(req: NextRequest) {
  try {
    // Clone the request so we can read the body for transport validation AND pass it on
    const rawBodyText = await req.text();

    // --- L1: Transport Header Validation ---
    const transportError = validateTransportHeaders(req, rawBodyText);
    if (transportError) return transportError;

    // --- Parse envelope ---
    let message: A2AMessage;
    try {
      message = JSON.parse(rawBodyText) as A2AMessage;
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' } },
        { status: 400 }
      );
    }

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

    // --- L2: Payload Envelope Validation + Dispatch ---
    const result = await A2AMessageHandler.processIncomingMessage(message);

    if (!result.success) {
      const statusCode =
        result.error?.code === 'SECURITY_VALIDATION_FAILED' ||
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
