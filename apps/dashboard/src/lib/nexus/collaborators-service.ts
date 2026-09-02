/**
 * 📧 Nexus Collaborators Service — Magic Link Email Access
 * src/lib/nexus/collaborators-service.ts
 *
 * Manages collaborator invitations via magic link sent to email.
 * Tokens expire after 24 hours by default.
 */

import { db } from '@/db';
import { nexusCollaborators } from '@/db/schema';
import { eq, lt, or, and, sql, gt } from 'drizzle-orm';
import { resend } from '@/lib/resend';
import crypto from 'crypto';
import { getAuth, isAdmin } from '@/lib/auth';
import { headers as nextHeaders } from 'next/headers';

const TOKEN_EXPIRY_HOURS = 24;
const NEXUS_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL || 'https://pandoras.finance';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || process.env.NEXUS_ADMIN_EMAIL || 'marco.munoz9@gmail.com')
  .toLowerCase()
  .split(',')
  .map((e) => e.trim());

export function isNexusAdminEmail(email: string): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export async function requireNexusAdmin(req?: Request | Headers): Promise<boolean> {
  try {
    let reqHeaders: Headers;
    if (req instanceof Headers) {
      reqHeaders = req;
    } else if (req && 'headers' in req) {
      reqHeaders = req.headers as Headers;
    } else {
      reqHeaders = await nextHeaders();
    }

    const { session, isVerified } = await getAuth(reqHeaders);
    if (isVerified && session?.address && await isAdmin(session.address)) return true;

    // Fallback: check thirdweb/wallet headers
    const walletHeader = reqHeaders.get('x-thirdweb-address') || reqHeaders.get('x-wallet-address') || reqHeaders.get('x-user-address');
    if (walletHeader && await isAdmin(walletHeader)) return true;

    return false;
  } catch (err) {
    console.error('[requireNexusAdmin] Check error:', err);
    return false;
  }
}

export interface CollaboratorDTO {
  id: number;
  name: string;
  email: string;
  expiresAt: Date;
  lastAccessAt?: Date | null;
  createdAt: Date;
}

/**
 * Generate a secure random token for magic link authentication.
 */
function generateToken(): string {
  return `nx_${crypto.randomBytes(32).toString('hex')}`;
}

/**
 * Create or update a collaborator record with a fresh token.
 */
export async function createOrUpdateCollaborator(
  name: string,
  email: string
): Promise<{ collaborator: CollaboratorDTO; magicLink: string }> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  const records = await db
    .insert(nexusCollaborators)
    .values({
      name,
      email: email.toLowerCase(),
      token,
      expiresAt,
      lastAccessAt: null,
    })
    .onConflictDoUpdate({
      target: nexusCollaborators.email,
      set: {
        token,
        expiresAt,
        lastAccessAt: null,
      },
    })
    .returning();

  const record = records[0];
  if (!record) {
    throw new Error('Failed to create/update collaborator');
  }

  const magicLink = `${NEXUS_BASE_URL}/en/nexus?token=${encodeURIComponent(token)}`;

  return {
    collaborator: {
      id: record.id,
      name: record.name,
      email: record.email,
      expiresAt: record.expiresAt,
      lastAccessAt: record.lastAccessAt,
      createdAt: record.createdAt,
    },
    magicLink,
  };
}

/**
 * Send magic link email to a collaborator with Pandora's Nexus Obsidian Branding.
 */
export async function sendCollaboratorMagicLink(
  name: string,
  email: string,
  magicLink: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await resend.emails.send({
      from: "Pandora's Nexus <noreply@pandoras.finance>",
      to: [email],
      subject: "Acceso a Pandora's Nexus — Sovereign Magic Link",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Acceso a Pandora's Nexus</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #060608; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
          <div style="max-width: 580px; margin: 0 auto; padding: 40px 20px;">
            <!-- Brand Header -->
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-block; padding: 6px 14px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 9999px; margin-bottom: 12px;">
                <span style="color: #f59e0b; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;">Pandoras Nexus · Sovereign Plane</span>
              </div>
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.02em;">Acceso Institucional al Nexus</h1>
            </div>

            <!-- Main Card -->
            <div style="background-color: #0d0d12; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; padding: 32px 28px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);">
              <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6; margin-top: 0;">
                Hola <strong style="color: #ffffff;">${name}</strong>,
              </p>
              <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">
                Has sido autorizado para acceder a la infraestructura institucional y consola operativa de <strong style="color: #ffffff;">Pandora's Nexus</strong>.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${magicLink}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #000000; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35); letter-spacing: 0.02em;">
                  Ingresar a Pandora's Nexus →
                </a>
              </div>

              <!-- Security Notice -->
              <div style="background: rgba(255, 255, 255, 0.02); border: 1px dashed rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 14px 16px; margin-top: 24px;">
                <p style="color: #71717a; font-size: 12px; line-height: 1.5; margin: 0;">
                  ⏳ <strong>Vigencia:</strong> Este Magic Link es personal e intransferible. Expira en <strong>${TOKEN_EXPIRY_HOURS} horas</strong>.
                </p>
              </div>

              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                <p style="color: #52525b; font-size: 11px; margin: 0; word-break: break-all;">
                  Si el botón no funciona, copia y pega esta URL en tu navegador:<br>
                  <a href="${magicLink}" style="color: #f59e0b; text-decoration: none;">${magicLink}</a>
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 32px;">
              <p style="color: #52525b; font-size: 11px; margin: 0;">
                Pandoras Group · Sovereign Growth OS & Institutional Mesh<br>
                Si no reconoces esta solicitud, puedes ignorar este correo de forma segura.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    return { ok: true };
  } catch (error: any) {
    console.error('[NexusCollaborators] Email send error:', error?.message || error);
    return { ok: false, error: error?.message || 'Failed to send email' };
  }
}

/**
 * Verify a collaborator token and mark last access.
 * Returns the collaborator record if valid, null otherwise.
 */
export async function verifyCollaboratorToken(
  token: string
): Promise<CollaboratorDTO | null> {
  const now = new Date();

  const [record] = await db
    .update(nexusCollaborators)
    .set({ lastAccessAt: now })
    .where(
      and(
        eq(nexusCollaborators.token, token),
        gt(nexusCollaborators.expiresAt, now)
      )
    )
    .returning();

  if (!record) return null;

  return {
    id: record.id,
    name: record.name,
    email: record.email,
    expiresAt: record.expiresAt,
    lastAccessAt: record.lastAccessAt,
    createdAt: record.createdAt,
  };
}

/**
 * List all active collaborators (not expired).
 */
export async function listCollaborators(): Promise<CollaboratorDTO[]> {
  const now = new Date();
  const rows = await db
    .select()
    .from(nexusCollaborators)
    .where(gt(nexusCollaborators.expiresAt, now))
    .orderBy(nexusCollaborators.createdAt);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    expiresAt: r.expiresAt,
    lastAccessAt: r.lastAccessAt,
    createdAt: r.createdAt,
  }));
}

/**
 * Remove a collaborator by email.
 */
export async function removeCollaborator(email: string): Promise<boolean> {
  const result = await db
    .delete(nexusCollaborators)
    .where(eq(nexusCollaborators.email, email.toLowerCase()))
    .execute();

  return (result?.rowCount ?? 0) > 0;
}
