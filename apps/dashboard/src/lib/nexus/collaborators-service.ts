/**
 * 📧 Nexus Collaborators Service — Magic Link Email Access
 * src/lib/nexus/collaborators-service.ts
 *
 * Manages collaborator invitations via magic link sent to email.
 * Tokens expire after 24 hours by default.
 */

import { db } from '@/db';
import { nexusCollaborators } from '@/db/schema';
import { eq, lt, or, and, sql } from 'drizzle-orm';
import { resend } from '@/lib/resend';
import crypto from 'crypto';

const TOKEN_EXPIRY_HOURS = 24;
const NEXUS_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://dash.pandoras.finance';

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

  const magicLink = `${NEXUS_BASE_URL}/nexus/rooms?collaborator=${encodeURIComponent(token)}`;

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
 * Send magic link email to a collaborator.
 */
export async function sendCollaboratorMagicLink(
  name: string,
  email: string,
  magicLink: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await resend.emails.send({
      from: 'Pandora\'s Nexus <noreply@pandoras.finance>',
      to: [email],
      subject: 'Acceso a Pandora\'s Nexus — Magic Link',
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #f59e0b; font-weight: 600;">Acceso a Pandora's Nexus</h2>
          <p style="color: #71717a; font-size: 14px;">Hola ${name},</p>
          <p style="color: #71717a; font-size: 14px;">
            Has sido invitado como colaborador en <strong>Pandora's Nexus</strong>.
            Haz clic en el botón de abajo para acceder a las Transaction Rooms:
          </p>
          <a
            href="${magicLink}"
            style="display: inline-block; background-color: #f59e0b; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;"
          >
            Acceder al Nexus
          </a>
          <p style="color: #71717a; font-size: 12px; margin-top: 24px;">
            Este enlace expira en ${TOKEN_EXPIRY_HOURS} horas. Si no solicitaste este acceso, ignora este correo.
          </p>
          <p style="color: #52525b; font-size: 11px; margin-top: 16px;">
            Pandora's Group · Confidential
          </p>
        </div>
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

// Re-export gt from drizzle-orm for convenience
import { gt } from 'drizzle-orm';
