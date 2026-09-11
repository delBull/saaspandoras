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
import { WhatsAppAdapter } from '@/lib/pandoras/core/domains/channels/adapters/whatsapp-adapter';
import type { NexusProvisionStatus } from '@/db/schema';

const TOKEN_EXPIRY_HOURS = 24;
const NEXUS_BASE_URL = process.env.NEXT_PUBLIC_NEXUS_URL || 'https://nexus.pandoras.finance';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || process.env.NEXUS_ADMIN_EMAIL || '')
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

import type { NexusPermissionsOverride } from '@/db/schema';

export interface CollaboratorDTO {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions?: NexusPermissionsOverride;
  whatsappPhone?: string | null;
  status?: NexusProvisionStatus | null;
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
  email: string,
  role: string = 'COLLABORATOR',
  permissions: NexusPermissionsOverride = {},
  whatsappPhone?: string

): Promise<{ collaborator: CollaboratorDTO; magicLink: string }> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  // Provisioning policy: brand-new collaborators default to PENDING so no magic
  // link auto-grants access. Elevated roles (SUPER_ADMIN/ADMIN) are explicit
  // admin grants → ACTIVE. Existing rows (renewal) PRESERVE their current status.
  const status: NexusProvisionStatus = role === 'SUPER_ADMIN' || role === 'ADMIN' ? 'ACTIVE' : 'PENDING';

  const records = await db
    .insert(nexusCollaborators)
    .values({
      name,
      email: email.toLowerCase(),
      token,
      role,
      permissions,
      whatsappPhone,
      status,
      statusChangedAt: status === 'PENDING' ? new Date() : null,
      expiresAt,
      lastAccessAt: null,
    })
    .onConflictDoUpdate({
      target: nexusCollaborators.email,
      set: {
        token,
        role,
        permissions,
        whatsappPhone,
        expiresAt,
        lastAccessAt: null,
      },
    })
    .returning();

  const record = records[0];
  if (!record) {
    throw new Error('Failed to create/update collaborator');
  }

  const magicLink = `${NEXUS_BASE_URL}/nexus?token=${encodeURIComponent(token)}`;

  return {
    collaborator: {
      id: record.id,
      name: record.name,
      email: record.email,
      role: record.role || 'COLLABORATOR',
      permissions: (record.permissions as NexusPermissionsOverride) || {},
      whatsappPhone: record.whatsappPhone,
      status: (record.status as NexusProvisionStatus) || 'ACTIVE',
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

  if (record.whatsappPhone) {
    notifyCollaboratorViaWhatsApp(record.whatsappPhone, record.name, 'access_confirmed').catch(console.warn);
  }

  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role || 'COLLABORATOR',
    permissions: (record.permissions as NexusPermissionsOverride) || {},
    whatsappPhone: record.whatsappPhone,
    status: (record.status as NexusProvisionStatus) || 'ACTIVE',
    expiresAt: record.expiresAt,
    lastAccessAt: record.lastAccessAt,
    createdAt: record.createdAt,
  };
}

/**
 * Get a collaborator by email (expired or not) for self-renewal auth.
 */
export async function getCollaboratorByEmail(
  email: string
): Promise<CollaboratorDTO | null> {
  const [record] = await db
    .select()
    .from(nexusCollaborators)
    .where(eq(nexusCollaborators.email, email.toLowerCase()))
    .limit(1);

  if (!record) return null;

  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role || 'COLLABORATOR',
    permissions: (record.permissions as NexusPermissionsOverride) || {},
    whatsappPhone: record.whatsappPhone,
    status: (record.status as NexusProvisionStatus) || 'ACTIVE',
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
  try {
    await db.delete(nexusCollaborators).where(lt(nexusCollaborators.expiresAt, now));
  } catch (error) {
    console.warn('[NexusCollaborators] Failed to clean up expired tokens:', error);
  }

  const rows = await db
    .select()
    .from(nexusCollaborators)
    .where(gt(nexusCollaborators.expiresAt, now))
    .orderBy(nexusCollaborators.createdAt);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role || 'COLLABORATOR',
    permissions: (r.permissions as NexusPermissionsOverride) || {},
    whatsappPhone: r.whatsappPhone,
    status: (r.status as NexusProvisionStatus) || 'ACTIVE',
    expiresAt: r.expiresAt,
    lastAccessAt: r.lastAccessAt,
    createdAt: r.createdAt,
  }));
}

/**
 * Update role and granular permissions override for an existing collaborator.
 */
export async function updateCollaboratorPermissions(
  email: string,
  role: string,
  permissions: NexusPermissionsOverride
): Promise<{ success: boolean; collaborator?: CollaboratorDTO }> {
  const [record] = await db
    .update(nexusCollaborators)
    .set({
      role,
      permissions,
    })
    .where(eq(nexusCollaborators.email, email.toLowerCase()))
    .returning();

  if (!record) {
    return { success: false };
  }

  return {
    success: true,
    collaborator: {
      id: record.id,
      name: record.name,
      email: record.email,
      role: record.role,
      permissions: (record.permissions as NexusPermissionsOverride) || {},
      whatsappPhone: record.whatsappPhone,
      status: (record.status as NexusProvisionStatus) || 'ACTIVE',
      expiresAt: record.expiresAt,
      lastAccessAt: record.lastAccessAt,
      createdAt: record.createdAt,
    },
  };
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

/**
 * Fire-and-forget WhatsApp notification for Nexus Collaborators
 */
async function notifyCollaboratorViaWhatsApp(
  phone: string,
  name: string,
  templateType: 'welcome' | 'access_confirmed'
): Promise<void> {
  try {
    const text = templateType === 'welcome' 
      ? `Hola ${name} 👋 \n\nSoy Hermes, el asistente operativo de Pandoras Growth OS.\n\nTu invitación al Nexus está en camino por correo — revisa tu bandeja de entrada.\n\nUna vez que accedas, puedes escribirme aquí directamente para cualquier cosa. 🚀`
      : `✅ Acceso confirmado, ${name}.\n\nYa eres parte del equipo en Nexus. \n\nPuedes escribirme aquí en cualquier momento para consultas, reportes o actualizaciones del proyecto. Estoy disponible 24/7.`;

    const waAdapter = new WhatsAppAdapter();
    await waAdapter.send({
      organizationId: 'pandoras',
      conversationId: `conv_wa_pandoras_${phone.replace(/\D/g, '')}`,
      channelType: 'whatsapp',
      content: text,
      correlationId: `nexus_auth_${Date.now()}`
    });
  } catch (err) {
    console.warn('[NexusCollaborators] Failed to send WhatsApp notification:', err);
  }
}

/**
 * Resolve the full CollaboratorDTO for the currently authenticated Nexus operator.
 *
 * Resolution order:
 *  1. If `walletAddress` is a Super Admin → return a synthetic SUPER_ADMIN identity
 *     by looking for the admin email in DB (ADMIN_EMAILS env) first.
 *  2. If `email` is provided directly (e.g. from cookie/session) → getCollaboratorByEmail.
 *  3. Fallback: null (operator is identified as wallet-only admin with no DB record).
 *
 * Used by the Settings page server component to inject full identity into the terminal.
 */
export async function getCollaboratorForOperator(
  walletAddress: string | null | undefined,
  emailHint?: string | null
): Promise<CollaboratorDTO | null> {
  // 1. Try by email hint (fastest path, used when available)
  if (emailHint) {
    const byEmail = await getCollaboratorByEmail(emailHint);
    if (byEmail) return byEmail;
  }

  // 2. Try admin email(s) from env — first valid match wins
  for (const adminEmail of ADMIN_EMAILS) {
    if (!adminEmail) continue;
    const record = await getCollaboratorByEmail(adminEmail);
    if (record) return record;
  }

  // 3. If we have a walletAddress but no DB record, synthesize a minimal identity
  if (walletAddress) {
    return {
      id: 0,
      name: 'Administrador',
      email: walletAddress.toLowerCase(),
      role: 'SUPER_ADMIN',
      status: 'ACTIVE' as NexusProvisionStatus,
      permissions: {
        dealRoom: true,
        academyAdmin: true,
        settings: true,
        hermesQa: true,
      },
      whatsappPhone: null,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      lastAccessAt: null,
      createdAt: new Date(),
    };
  }

  return null;
}
