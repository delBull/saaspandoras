import { NextRequest, NextResponse } from 'next/server';
import { SovereignAuthService } from '@/lib/deal-signing/auth';
import { checkRateLimit } from '@/lib/deal-signing/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/deal-signing/auth/magic
 * Requests a Magic Link access email for Sovereign Sign
 */
export async function POST(req: NextRequest) {
  try {
    const ip = 
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
      req.headers.get('x-real-ip') || 
      'anonymous';

    // Distributed rate limit: 5 requests per 10 minutes per IP (Redis-backed)
    const rl = await checkRateLimit(`sovereign-sign:magic:${ip}`, 5, 10 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'RATE_LIMITED', message: 'Demasiadas solicitudes. Por favor intenta en 10 minutos.' },
        { status: 429, headers: { 'Retry-After': Math.ceil(rl.retryAfterMs / 1000).toString() } }
      );
    }

    const body = await req.json();
    const email = body.email as string | undefined;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'INVALID_EMAIL', message: 'Ingresa un correo electrónico válido.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const token = await SovereignAuthService.generateMagicLinkToken(cleanEmail);

    const origin = req.headers.get('origin') || 
      req.headers.get('x-forwarded-host') || 
      'https://sign.pandoras.finance';
    
    const baseUrl = origin.startsWith('http') ? origin : `https://${origin}`;
    const magicUrl = `${baseUrl}/deal/sign?token=${encodeURIComponent(token)}`;

    await SovereignAuthService.sendMagicLinkEmail({
      to: cleanEmail,
      magicUrl,
    });

    return NextResponse.json({
      success: true,
      message: 'Enlace de acceso enviado a tu correo.',
      // In development mode, return token for fast testing
      ...(process.env.NODE_ENV !== 'production' ? { devMagicUrl: magicUrl, devToken: token } : {}),
    });

  } catch (error: any) {
    console.error('[DealSigning Auth API] Error sending magic link:', error);
    return NextResponse.json(
      { success: false, error: 'MAGIC_LINK_FAILED', message: error?.message || 'Error al enviar magic link' },
      { status: 500 }
    );
  }
}
