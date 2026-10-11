import { NextRequest, NextResponse } from 'next/server';
import { db } from '@saasfly/db-core';
import { goldenLinks } from '@saasfly/db-core/schema';
import { eq, and } from '@saasfly/db-core';
import * as crypto from 'crypto';
import * as jose from 'jose';

// Helper to sign a lightweight commercial session
async function signCommercialSession(leadId: string, jti: string) {
  if (!process.env.PANDORAS_SECRET_KEY) {
    throw new Error('PANDORAS_SECRET_KEY is not configured');
  }
  const secret = new TextEncoder().encode(process.env.PANDORAS_SECRET_KEY);
  const alg = 'HS256';
  
  return new jose.SignJWT({ leadId, scope: 'commercial:lead_read commercial:order_create' })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setJti(jti)
    .setExpirationTime('2h') // Limited time session
    .sign(secret);
}

export async function GET(req: NextRequest, context: { params: { token: string } }) {
  try {
    // 🛡️ Await params as required by Next.js 15
    const params = await context.params;
    const rawToken = params.token;
    
    if (!rawToken || rawToken.length < 8) {
      return new NextResponse('Invalid token', { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 1. Fetch the golden link (even if inactive, to allow graceful recovery)
    const link = await db.query.goldenLinks.findFirst({
      where: eq(goldenLinks.slug, tokenHash)
    });

    if (!link) {
      return new NextResponse('Invitation not found', { status: 404 });
    }

    if (link.expiresAt && new Date() > link.expiresAt) {
      return new NextResponse('Invitation expired', { status: 410 });
    }

    const metadata = (link.metadata || {}) as Record<string, any>;
    const leadId = metadata.leadId;

    if (!leadId) {
      return new NextResponse('Invalid invitation context', { status: 400 });
    }

    let jti = crypto.randomUUID();

    // 2. Consume Atomically or Recover
    if (link.isActive) {
      const consumedAt = new Date().toISOString();
      const newMetadata = { ...metadata, consumedAt, consumerJti: jti };

      const [consumed] = await db.update(goldenLinks)
        .set({ 
          isActive: false,
          metadata: newMetadata
        })
        .where(
          and(
            eq(goldenLinks.id, link.id),
            eq(goldenLinks.isActive, true)
          )
        )
        .returning({ id: goldenLinks.id });

      if (!consumed) {
        // Concurrency collision, someone else just consumed it. 
        // We will fall through to the recovery check.
      }
    } else {
      // Recovery phase: if it was consumed recently (e.g. within 5 minutes)
      const consumedAtStr = metadata.consumedAt;
      if (!consumedAtStr) {
        return new NextResponse('Invitation already consumed', { status: 410 });
      }

      const consumedAt = new Date(consumedAtStr);
      const diffMinutes = (new Date().getTime() - consumedAt.getTime()) / 60000;

      if (diffMinutes > 5) {
        return new NextResponse('Invitation already consumed and recovery window expired', { status: 410 });
      }

      // Reuse the JTI to maintain the same session identity
      jti = metadata.consumerJti || jti;
    }

    // 3. Issue Commercial Session
    const sessionJwt = await signCommercialSession(leadId, jti);

    // 4. Redirect to onboarding with cookie
    const url = req.nextUrl.clone();
    url.pathname = '/onboarding';
    // Clean up any sensitive search params before redirect
    url.searchParams.delete('t');

    const response = NextResponse.redirect(url);
    
    response.cookies.set('commercial_session', sessionJwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7200 // 2 hours
    });

    return response;

  } catch (error) {
    console.error('[Commercial Hub] Error resolving invite:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
