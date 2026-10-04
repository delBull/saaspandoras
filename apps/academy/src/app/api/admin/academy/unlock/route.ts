/**
 * 🎓 Academy Control Plane Unlock API
 * apps/academy/src/app/api/admin/academy/unlock/route.ts
 *
 * Auth decision (§3 of ACADEMY_PHASE_A_AUDIT.md):
 * Same auth chain as dash.pandoras.finance and nexus.pandoras.finance:
 *   1. Web3 wallet session via getAuth() (isAdmin check → wallets de administradores)
 *   2. Nexus collaborator session via getNexusAuthContext() (mismo token/cookie que Nexus/Dashboard)
 *   3. Role resolution via nexus_collaborators table (roles: SUPER_ADMIN, ADMIN, MANAGER, etc.)
 *   4. Fallback: Magic Link email si no hay sesión activa (MANAGER_EMAILS env var)
 *
 * Roles soportados:
 *   admin   → SUPER_ADMIN, ADMIN, ecosystem permission
 *   manager → MARKETING, OPERATOR, MANAGER, academyAdmin permission
 *
 * Migrated from: apps/dashboard/src/app/api/admin/academy/unlock/route.ts
 * Committed as part of: Academy Standalone Migration — A2
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAuth, isAdmin } from '@saasfly/auth-sdk';
import { generateAcademyToken, sendAcademyUnlockEmbed } from '@saasfly/nexus-deals-sdk';
import { getNexusAuthContext, checkNexusPermission } from '@saasfly/shared';
import { getCollaboratorByEmail } from '@saasfly/hermes-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── Environment Configuration ──────────────────────────────────────────────────
// ACADEMY_BASE_URL: the public URL of the academy app itself (for magic link)
const ACADEMY_BASE_URL =
  process.env.NEXT_PUBLIC_ACADEMY_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  'https://academy.pandoras.finance';

const ADMIN_EMAILS = [
  (process.env.NEXUS_ADMIN_EMAIL ?? '').toLowerCase(),
  (process.env.ADMIN_EMAIL ?? '').toLowerCase(),
].filter(Boolean);

const MANAGER_EMAILS = [
  ...(process.env.ACADEMY_MANAGERS
    ? process.env.ACADEMY_MANAGERS.split(',').map((e) => e.trim().toLowerCase())
    : []),
].filter(Boolean);
// ──────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── Gate 1: Web3 Wallet Session (getAuth) ─────────────────────────────────
    // Same mechanism as dash.pandoras.finance — wallet-based JWT session.
    const { session, isVerified } = await getAuth(await headers());
    const address = session?.address;

    if (isVerified && address && (await isAdmin(address))) {
      return NextResponse.json({
        ok: true,
        unlocked: true,
        role: 'admin',
        reason: 'admin-session',
      });
    }

    // ── Gate 2: Nexus Collaborator Session (getNexusAuthContext) ───────────────
    // Same token/cookie mechanism used by nexus.pandoras.finance and dashboard.
    // A collaborator who is already authenticated doesn't need a magic link.
    const auth = await getNexusAuthContext(req.headers);

    if (
      auth.isAuthenticated &&
      (checkNexusPermission(auth, 'ecosystem') ||
        checkNexusPermission(auth, 'nexus.manage') ||
        checkNexusPermission(auth, 'users.manage') ||
        Boolean(auth.permissions?.academyAdmin))
    ) {
      const inheritedRole = checkNexusPermission(auth, 'ecosystem') ? 'admin' : 'manager';
      return NextResponse.json({
        ok: true,
        unlocked: true,
        role: inheritedRole,
        email: auth.email,
        reason: 'nexus-session',
      });
    }
    // ──────────────────────────────────────────────────────────────────────────

    // ── Gate 3: Email-based Role Resolution (Magic Link Fallback) ─────────────
    let targetEmail = '';
    try {
      const body = await req.json();
      if (body?.email && typeof body.email === 'string') {
        targetEmail = body.email.trim().toLowerCase();
      }
    } catch {
      // Body may be empty (auto-unlock attempt on page load)
    }

    if (!targetEmail && auth.email) {
      targetEmail = auth.email.toLowerCase();
    } else if (!targetEmail && ADMIN_EMAILS[0]) {
      targetEmail = ADMIN_EMAILS[0];
    }

    // Resolve role from environment config or nexus_collaborators table
    let resolvedRole: 'admin' | 'manager' | null = null;

    if (ADMIN_EMAILS.includes(targetEmail)) {
      resolvedRole = 'admin';
    } else if (MANAGER_EMAILS.includes(targetEmail)) {
      resolvedRole = 'manager';
    } else {
      // Live lookup in nexus_collaborators — same authority as Nexus/Dashboard
      const collab = await getCollaboratorByEmail(targetEmail);
      if (collab && collab.status === 'ACTIVE') {
        if (
          collab.permissions?.ecosystem ||
          collab.role === 'SUPER_ADMIN' ||
          collab.role === 'ADMIN'
        ) {
          resolvedRole = 'admin';
        } else if (
          collab.permissions?.academyAdmin ||
          collab.role === 'MARKETING' ||
          collab.role === 'OPERATOR' ||
          (collab.role as string) === 'MANAGER'
        ) {
          resolvedRole = 'manager';
        }
      }
    }

    if (!resolvedRole) {
      return NextResponse.json(
        { ok: false, error: "El correo no está autorizado para acceder a Pandora's Academy." },
        { status: 403 }
      );
    }

    // If the user already has an active Nexus session for this email, unlock immediately
    if (auth.isAuthenticated && auth.email && auth.email.toLowerCase() === targetEmail) {
      return NextResponse.json({
        ok: true,
        unlocked: true,
        role: resolvedRole,
        email: targetEmail,
        reason: 'collaborator-session-verified',
      });
    }

    // ── Gate 4: Issue Magic Link Token ─────────────────────────────────────────
    const token = await generateAcademyToken(targetEmail, resolvedRole);
    const link = `${ACADEMY_BASE_URL}/console?unlock=${encodeURIComponent(token)}`;

    // Send email via Resend (fail-gracefully — audit the failure but don't block)
    let emailSent = false;
    try {
      const { sendEmail } = await import('@/lib/email');
      const roleName = resolvedRole === 'admin' ? 'Administrador' : 'Academy Manager';
      await sendEmail({
        to: targetEmail,
        from: "Pandora's Academy <hello@pandoras.finance>",
        subject: `Pandora's Academy — Tu enlace de acceso (${roleName})`,
        html: buildMagicLinkEmail(link, roleName),
      });
      emailSent = true;
    } catch (err) {
      console.warn('[Academy Unlock] Failed to send email:', err);
    }

    // Optional: Discord audit dispatch
    await sendAcademyUnlockEmbed({
      email: targetEmail,
      link,
      requestedAt: new Date().toISOString(),
    }).catch(() => null);

    return NextResponse.json({
      ok: true,
      unlocked: false,
      sent: emailSent,
      role: resolvedRole,
      email: targetEmail,
      message: `Enlace mágico enviado a ${targetEmail}`,
    });
    // ──────────────────────────────────────────────────────────────────────────
  } catch (err: any) {
    console.error('[Academy Unlock API Error]:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Error al procesar la solicitud.' },
      { status: 500 }
    );
  }
}

// ── Email Template ─────────────────────────────────────────────────────────────
function buildMagicLinkEmail(link: string, roleName: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Pandora's Academy — Acceso</title>
</head>
<body style="margin:0;padding:0;background-color:#08080A;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#08080A;margin:0 auto;">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;background:#0F0F16;border:1px solid rgba(168,85,247,0.2);border-radius:20px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.6);">
          <tr>
            <td style="background:linear-gradient(135deg,#1f0a38 0%,#090914 100%);padding:32px 36px;">
              <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(192,132,252,0.9);margin-bottom:8px;font-weight:700;">PANDORA'S PLATFORM · CONTROL PLANE</div>
              <div style="font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;">Pandora's Academy</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.6);margin-top:4px;">Acceso Autorizado · Nivel ${roleName}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 36px 28px 36px;">
              <p style="font-size:15px;color:#e4e4e7;line-height:1.6;margin:0 0 20px 0;">
                Hola, se ha generado tu enlace de acceso seguro a la consola de <strong>Pandora's Academy</strong> con privilegios de <strong>${roleName}</strong>.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
                <tr>
                  <td align="center">
                    <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#a855f7 0%,#7c3aed 100%);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:12px;box-shadow:0 8px 24px rgba(168,85,247,0.35);letter-spacing:0.3px;">
                      Ingresar a Pandora's Academy →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size:12px;color:#71717a;line-height:1.5;margin:24px 0 0 0;text-align:center;">
                Este enlace es seguro y de uso personal. Si no solicitaste este acceso, puedes ignorar este correo.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 36px;background:rgba(255,255,255,0.02);border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <span style="font-size:11px;color:#52525b;letter-spacing:1px;text-transform:uppercase;">Pandoras Group · Confidential Executive Suite</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
