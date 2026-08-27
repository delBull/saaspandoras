import { NextRequest } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { resend } from '@/lib/resend';
import { SUPER_ADMIN_WALLET } from '@/lib/constants';

/**
 * Resolve the Sovereign Sign JWT secret lazily.
 * Fail closed: no hardcoded fallback. If the secret is not configured, signing
 * throws a clear config error and verification rejects (returns null).
 */
function resolveJWTSecret(): Uint8Array {
  const raw = process.env.SOVEREIGN_SIGN_JWT_SECRET || process.env.JWT_SECRET || '';
  if (!raw) {
    throw new Error('SERVER_CONFIG_ERROR: SOVEREIGN_SIGN_JWT_SECRET (or JWT_SECRET) is not configured');
  }
  return new TextEncoder().encode(raw);
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Pandora's Sovereign Sign <hello@pandoras.finance>";

export interface SovereignSession {
  email: string;
  scope: 'sovereign_sign_session';
  isAdmin: boolean;
}

export class SovereignAuthService {
  /**
   * Generates a 15-minute single-use Magic Link JWT
   */
  public static async generateMagicLinkToken(email: string): Promise<string> {
    const cleanEmail = email.toLowerCase().trim();
    return new SignJWT({ email: cleanEmail, scope: 'sovereign_sign_magic' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(resolveJWTSecret());
  }

  /**
   * Verifies a Magic Link token (signature + scope + explicit expiration).
   */
  public static async verifyMagicLinkToken(token: string): Promise<string | null> {
    return this._verify(token, 'sovereign_sign_magic');
  }

  /**
   * Generates a 14-day persistent session JWT
   */
  public static async generateSessionToken(email: string): Promise<string> {
    const cleanEmail = email.toLowerCase().trim();
    const isAdmin = this.checkIsAdmin(cleanEmail);
    return new SignJWT({ email: cleanEmail, scope: 'sovereign_sign_session', isAdmin })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('14d')
      .sign(resolveJWTSecret());
  }

  /**
   * Test-only: builds a magic-link token issued in the past so its 15-minute TTL
   * has already elapsed (verifies the expiry path without waiting).
   */
  public static async buildExpiredMagicLinkToken(email: string, minutesAgo = 20): Promise<string> {
    const cleanEmail = email.toLowerCase().trim();
    const iatSec = Math.floor(Date.now() / 1000) - minutesAgo * 60;
    // exp explicitly in the past (iat + 15m, which is minutesAgo-15m before now)
    return new SignJWT({ email: cleanEmail, scope: 'sovereign_sign_magic' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(iatSec)
      .setExpirationTime(iatSec + 15 * 60)
      .sign(resolveJWTSecret());
  }

  /**
   * Verifies an active session token (signature + scope + explicit expiration).
   */
  public static async verifySessionToken(token: string): Promise<SovereignSession | null> {
    try {
      const result = await this._verify(token, 'sovereign_sign_session');
      if (!result) return null;
      const isAdmin = this.checkIsAdmin(result);
      return { email: result, scope: 'sovereign_sign_session', isAdmin };
    } catch {
      return null;
    }
  }

  /**
   * Shared verification: verifies the JWT signature and enforces the `exp` claim
   * against the real system clock.
   *
   * ⚠️ SECURITY: jose's jwtVerify does not reliably reject an expired token in this
   * runtime when called without options, so we decode the verified payload and enforce
   * expiration ourselves. Tokens whose `exp` is missing or in the past are rejected.
   */
  private static async _verify(
    token: string,
    expectedScope: 'sovereign_sign_magic' | 'sovereign_sign_session',
  ): Promise<string | null> {
    try {
      const { payload } = await jwtVerify(token, resolveJWTSecret());

      const scope = payload.scope;
      const email = (payload.email as string) || '';
      if (scope !== expectedScope || !email) {
        return null;
      }

      // Enforce expiration explicitly against the system clock.
      if (payload.exp === undefined) return null;
      const nowSec = Math.floor(Date.now() / 1000);
      if (Number(payload.exp) <= nowSec) return null;

      return email.toLowerCase().trim();
    } catch {
      return null;
    }
  }

  /**
   * Resolves session from NextRequest cookies or Authorization header
   */
  public static async getSession(req: NextRequest | Request): Promise<SovereignSession | null> {
    let token: string | null = null;

    if ('cookies' in req) {
      token = (req as NextRequest).cookies.get('__sovereign_sign_session')?.value || null;
    }

    if (!token && req.headers.get('authorization')) {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '').trim();
      }
    }

    if (!token) return null;
    return this.verifySessionToken(token);
  }

  /**
   * Checks if an email or wallet belongs to Super Admin / Marco
   */
  public static checkIsAdmin(emailOrWallet?: string | null): boolean {
    if (!emailOrWallet) return false;
    const clean = emailOrWallet.toLowerCase().trim();

    // Check admin emails
    const adminEmails = [
      'admin@pandoras.finance',
      'marco@pandoras.finance',
      'delbull@pandoras.finance',
      ...(process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.toLowerCase().split(',') : []),
    ];
    if (adminEmails.includes(clean)) return true;

    // Check admin wallets
    const MARCO_ADMIN = (process.env.MARCO_ADMIN_WALLET || '').toLowerCase();
    const SUPER_ADMIN = SUPER_ADMIN_WALLET.toLowerCase();
    if (clean === MARCO_ADMIN || clean === SUPER_ADMIN) return true;

    return false;
  }

  /**
   * Sends the branded Magic Link email via Resend
   */
  public static async sendMagicLinkEmail(params: { to: string; magicUrl: string }): Promise<void> {
    const { to, magicUrl } = params;

    const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>Pandora's Sovereign Sign</title></head>
<body style="margin:0;padding:0;background-color:#08080C;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#08080C;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;margin:0 auto;background:#0F0F18;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.6);">
        <tr>
          <td style="background:linear-gradient(135deg,#1c102b 0%,#090912 100%);padding:30px 32px 24px;text-align:center;">
            <div style="font-size:10px;letter-spacing:2px;font-family:monospace;text-transform:uppercase;color:rgba(245,158,11,0.9);margin-bottom:8px;">PANDORA'S GROWTH OS</div>
            <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Sovereign Sign Portal</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px;">Acceso Seguro & Inviolable con Magic Link</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px;">
            <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.8);text-align:center;">
              Haz clic en el botón inferior para ingresar de forma segura a tu cuenta en el <strong>Portal de Firmas Soberanas</strong>.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="${magicUrl}" target="_blank"
                   style="display:inline-block;background:linear-gradient(135deg,#F59E0B,#10B981);color:#000000;text-decoration:none;font-size:13px;font-weight:700;padding:14px 34px;border-radius:10px;letter-spacing:0.5px;font-family:monospace;">
                  INGRESAR A MI PORTAL →
                </a>
              </td></tr>
            </table>
            <p style="margin:24px 0 0;font-size:11px;color:rgba(255,255,255,0.35);text-align:center;line-height:1.6;font-family:monospace;">
              Este enlace expira en 15 minutos y es de un solo uso.<br/>
              Si no solicitaste este acceso, puedes ignorar este correo.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#080810;padding:14px 28px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
            <div style="font-size:10px;color:rgba(255,255,255,0.3);font-family:monospace;">Pandora's Sovereign Fabric &bull; Zero Platform Dependency</div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    if (process.env.NODE_ENV !== 'production' && !process.env.RESEND_API_KEY) {
      console.log(`ℹ️ [SovereignAuth] Dev Magic Link for ${to}: ${magicUrl}`);
      return;
    }

    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Tu Enlace de Acceso — Pandora's Sovereign Sign",
      html,
    });
  }
}
