/**
 * 📧 Nexus Collaborators Service — Magic Link Email Access
 * src/lib/nexus/collaborators-service.ts
 *
 * Manages collaborator invitations via magic link sent to email.
 * Tokens expire after 24 hours by default.
 */

import { db } from '@saasfly/db-core';
import { nexusCollaborators } from '@saasfly/db-core';
import { eq, lt, or, and, sql, gt } from "@saasfly/db-core";
import {
  sendEmail,
  resolveEmailBranding,
  renderEmailAsync,
  MagicLinkEmailTemplate,
} from '@saasfly/shared';
import crypto from 'crypto';

// Dynamic require for next/headers without triggering direct-eval bundler warning
let nextHeaders: any;
if (typeof process !== "undefined" && typeof window === "undefined") {
    try {
        const req = (globalThis as any)["__non_webpack_require__"] || (typeof require !== "undefined" ? require : null);
        if (req) {
            const mod = req("next/headers");
            nextHeaders = mod.headers;
        }
    } catch (e) {
        // Ignore
    }
}
import { WhatsAppAdapter } from '../channels/adapters/whatsapp-adapter';
import type { NexusProvisionStatus } from '@saasfly/db-core';

const TOKEN_EXPIRY_HOURS = 24;
const NEXUS_BASE_URL = process.env.NEXT_PUBLIC_NEXUS_URL || 'https://nexus.pandoras.finance';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || process.env.NEXUS_ADMIN_EMAIL || '')
  .toLowerCase()
  .split(',')
  .map((e) => e.trim());

import { getNexusAuthContext } from '@saasfly/shared';

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

    // 🛡️ Fail-Closed Surface Boundary: Explicitly enforce NEXUS surface context.
    // Client-injected headers (e.g. x-invoke-path: /api/academy) cannot spoof authority.
    const auth = await getNexusAuthContext(reqHeaders, null, 'NEXUS');
    if (!auth.isAuthenticated) {
      return false;
    }

    // An Academy or TMA surface token can NEVER fulfill requireNexusAdmin
    if (auth.surface === 'ACADEMY' || auth.surface === 'TMA') {
      return false;
    }

    if (auth.permissions['nexus.manage'] || auth.permissions['users.manage']) {
      return true;
    }

    return false;
  } catch (err) {
    console.error('[requireNexusAdmin] Check error:', err);
    return false;
  }
}

import type { NexusPermissionsOverride } from '@saasfly/db-core';

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
  const rawToken = generateToken();
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
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
      token: tokenHash,
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
        token: tokenHash,
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

  const magicLink = `${NEXUS_BASE_URL}/nexus?token=${encodeURIComponent(rawToken)}`;

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
    const branding = await resolveEmailBranding({
      explicitBrand: {
        name: "Pandora's Nexus",
        accentColor: "#f59e0b",
        isPandorasPlatform: true,
      },
    });

    const rendered = await renderEmailAsync({
      template: MagicLinkEmailTemplate,
      props: {
        branding,
        magicUrl: magicLink,
        portalName: "Pandora's Nexus · Sovereign Plane",
        expirationMinutes: TOKEN_EXPIRY_HOURS * 60,
      },
    });

    const result = await sendEmail({
      to: [email],
      from: "Pandora's Nexus <noreply@pandoras.finance>",
      subject: "Acceso a Pandora's Nexus — Sovereign Magic Link",
      html: rendered.html,
      text: rendered.text,
    });

    if (!result.success) {
      return { ok: false, error: result.error || 'Failed to send email' };
    }

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
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const consumedSentinel = `consumed_${crypto.randomBytes(16).toString('hex')}`;

  // 🛡️ Atomic One-Time Burn: Verifies SHA-256 hash in reposo.
  // Rotates token to unguessable consumed sentinel and sets expiresAt to 0 (1970).
  // Any concurrent or subsequent invocation fails closed immediately (replay impossible).
  // Also enforces fail-closed if status is REJECTED or DISABLED.
  const [record] = await db
    .update(nexusCollaborators)
    .set({
      token: consumedSentinel,
      expiresAt: new Date(0),
      lastAccessAt: now,
    })
    .where(
      and(
        eq(nexusCollaborators.token, tokenHash),
        gt(nexusCollaborators.expiresAt, now),
        sql`${nexusCollaborators.token} NOT LIKE 'consumed_%'`,
        sql`${nexusCollaborators.status} NOT IN ('REJECTED', 'DISABLED')`
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
export async function listCollaborators(canonicalOrgId: string): Promise<CollaboratorDTO[]> {
  const now = new Date();
  try {
    // Only clean up expired unapproved PENDING invitations, NEVER active collaborators
    await db.delete(nexusCollaborators).where(
      and(
        eq(nexusCollaborators.status, 'PENDING'),
        lt(nexusCollaborators.expiresAt, now),
        eq(nexusCollaborators.canonicalOrgId, canonicalOrgId)
      )
    );
  } catch (error) {
    console.warn('[NexusCollaborators] Failed to clean up expired tokens:', error);
  }

  const rows = await db
    .select()
    .from(nexusCollaborators)
    .where(
      and(
        eq(nexusCollaborators.canonicalOrgId, canonicalOrgId),
        or(eq(nexusCollaborators.status, 'ACTIVE'), eq(nexusCollaborators.status, 'PENDING'))
      )
    )
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
  permissions: NexusPermissionsOverride,
  canonicalOrgId?: string
): Promise<{ success: boolean; collaborator?: CollaboratorDTO }> {
  const cleanEmail = email.toLowerCase().trim();
  const whereClause = canonicalOrgId
    ? and(eq(nexusCollaborators.email, cleanEmail), eq(nexusCollaborators.canonicalOrgId, canonicalOrgId))
    : eq(nexusCollaborators.email, cleanEmail);

  const [record] = await db
    .update(nexusCollaborators)
    .set({
      role,
      permissions,
    })
    .where(whereClause)
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
export async function removeCollaborator(email: string, canonicalOrgId?: string): Promise<boolean> {
  const cleanEmail = email.toLowerCase().trim();
  const whereClause = canonicalOrgId
    ? and(eq(nexusCollaborators.email, cleanEmail), eq(nexusCollaborators.canonicalOrgId, canonicalOrgId))
    : eq(nexusCollaborators.email, cleanEmail);

  const result = await db
    .delete(nexusCollaborators)
    .where(whereClause)
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
