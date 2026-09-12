import { NextRequest, NextResponse } from 'next/server';
import { HermesExperienceProvisionerService } from '@/lib/hermes/trial/hermes-experience-provisioner.service';
import { TrialTier } from '@/lib/hermes/trial/hermes-trial-policy.service';
import { consumePortalToken } from '@/lib/platform/portal-auth';

export const dynamic = 'force-dynamic';

const VALID_TIERS: Set<TrialTier> = new Set(['SOFTWARE_ONLY', 'MEDIA_ENABLED', 'FOUNDER']);

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, errorCode: 'INVALID_JSON', message: 'Cuerpo de solicitud JSON inválido.' },
        { status: 400 }
      );
    }

    const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const industry = typeof body.industry === 'string' ? body.industry.trim() : undefined;
    const contactName = typeof body.contactName === 'string' ? body.contactName.trim() : undefined;

    // 1. Mandatory Input Validation
    if (!companyName || companyName.length < 2) {
      return NextResponse.json(
        { ok: false, errorCode: 'VALIDATION_ERROR', message: 'El nombre de la empresa es obligatorio (mínimo 2 caracteres).' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { ok: false, errorCode: 'VALIDATION_ERROR', message: 'El correo corporativo es obligatorio.' },
        { status: 400 }
      );
    }

    // 2. Server-side Whitelist of Trial Tier (never trust client to elevate)
    let trialTier: TrialTier = 'MEDIA_ENABLED';
    if (body.trialTier) {
      if (VALID_TIERS.has(body.trialTier)) {
        trialTier = body.trialTier;
      } else {
        return NextResponse.json(
          { ok: false, errorCode: 'INVALID_TIER', message: 'Nivel de prueba no válido. Opciones: SOFTWARE_ONLY, MEDIA_ENABLED, FOUNDER.' },
          { status: 400 }
        );
      }
    }

    // 3. Resolve Client IP for velocity tracking
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = forwardedFor
      ? forwardedFor.split(',')[0]?.trim()
      : req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || '127.0.0.1';

    // 4. Provision or Idempotently Retrieve Active Trial
    const result = await HermesExperienceProvisionerService.provision({
      email,
      companyName,
      contactName,
      industry,
      trialTier,
      clientIp,
    });

    // 5. Establish Authenticated Portal Session
    let sessionToken = '';
    if (result.portalToken && !result.portalToken.startsWith('mock_portal_')) {
      try {
        const consumed = await consumePortalToken(result.portalToken);
        sessionToken = consumed.sessionToken;
      } catch (consumeErr) {
        console.warn('[API /experience/start] Notice consuming portalToken:', consumeErr);
      }
    }

    const redirectUrl = `/growth-os/organizations/${result.projectSlug}/growth/strategy`;

    const res = NextResponse.json({
      ok: true,
      projectId: result.projectId,
      projectSlug: result.projectSlug,
      organizationId: result.organizationId,
      redirectUrl,
      trialTier,
      trialEndsAt: result.trialEndsAt,
      grantedMediaCredits: result.grantedMediaCredits,
      message: result.message,
    });

    // 6. Set HTTP-Only Portal Session Cookie if sessionToken was minted
    if (sessionToken) {
      res.cookies.set('pandoras_portal_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 72 * 3600, // 72 hours
      });
    }

    return res;
  } catch (err: any) {
    const message = err?.message || 'Error al iniciar Hermes Experience.';
    const isRateLimit =
      message.includes('Límite de solicitudes de prueba alcanzado') ||
      message.includes('Límite de registros alcanzado');
    const isValidation =
      message.includes('Formato de correo') ||
      message.includes('No se permiten dominios') ||
      message.includes('periodo de prueba finalizado');

    const status = isRateLimit ? 429 : isValidation ? 400 : 500;
    const errorCode = isRateLimit ? 'RATE_LIMITED' : isValidation ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR';

    return NextResponse.json(
      { ok: false, errorCode, message },
      { status }
    );
  }
}
