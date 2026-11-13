/**
 * Adaptadores de invitación de colaboradores (P0.1).
 *
 * ⚠️ ESTADO: IMPLEMENTADO — NO VERIFICADO contra base de datos real.
 * Usa tablas EXISTENTES (`nexus_collaborators`, `project_collaborators`): no
 * requiere migración nueva.
 */

import { and, eq } from '@saasfly/db-core';
import { db } from '@saasfly/db';
import { nexusCollaborators, projectCollaborators } from '@saasfly/db/schema';
import type {
  CollaboratorRepository,
  InvitableRole,
  InvitationMailer,
} from './collaborator-invitation';

export class DrizzleCollaboratorRepository implements CollaboratorRepository {
  async findByEmail(organizationId: string, email: string): Promise<{ id: number } | null> {
    const [row] = await db
      .select({ id: nexusCollaborators.id })
      .from(nexusCollaborators)
      .where(
        and(
          eq(nexusCollaborators.canonicalOrgId, organizationId),
          eq(nexusCollaborators.email, email),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async create(params: {
    name: string;
    email: string;
    token: string;
    role: InvitableRole;
    canonicalOrgId: string;
    status: 'ACTIVE';
    expiresAt: Date;
  }): Promise<{ id: number }> {
    const [row] = await db
      .insert(nexusCollaborators)
      .values({
        name: params.name,
        email: params.email,
        token: params.token,
        role: params.role,
        canonicalOrgId: params.canonicalOrgId,
        status: params.status,
        expiresAt: params.expiresAt,
      })
      .returning({ id: nexusCollaborators.id });

    return { id: row!.id };
  }

  async attachToProject(projectSlug: string, collaboratorId: number): Promise<void> {
    await db
      .insert(projectCollaborators)
      .values({ projectId: projectSlug, collaboratorId })
      .onConflictDoNothing();
  }

  async listByOrganization(organizationId: string): Promise<
    Array<{
      id: number;
      name: string;
      email: string;
      role: string;
      status: string;
      expiresAt: string | null;
      organizationId: string;
    }>
  > {
    const rows = await db
      .select({
        id: nexusCollaborators.id,
        name: nexusCollaborators.name,
        email: nexusCollaborators.email,
        role: nexusCollaborators.role,
        status: nexusCollaborators.status,
        expiresAt: nexusCollaborators.expiresAt,
        canonicalOrgId: nexusCollaborators.canonicalOrgId,
      })
      .from(nexusCollaborators)
      .where(eq(nexusCollaborators.canonicalOrgId, organizationId));

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      status: row.status,
      expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
      organizationId: row.canonicalOrgId,
    }));
  }

  async listProjects(collaboratorId: number): Promise<string[]> {
    const rows = await db
      .select({ projectId: projectCollaborators.projectId })
      .from(projectCollaborators)
      .where(eq(projectCollaborators.collaboratorId, collaboratorId));

    return rows.map((row) => row.projectId);
  }
}

/** Envía la invitación con la infraestructura de email existente. */
export class ResendInvitationMailer implements InvitationMailer {
  async send(params: {
    to: string;
    name: string;
    organizationName: string;
    role: InvitableRole;
    inviteUrl: string;
    expiresAt: string;
  }): Promise<void> {
    const { sendEmail } = await import('@/lib/email/client');

    const expiresAt = new Date(params.expiresAt).toISOString().slice(0, 10);

    await sendEmail({
      to: params.to,
      subject: `Acceso al portal de ${params.organizationName}`,
      html: `
        <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
          <h2 style="font-size:20px;margin:0 0 12px">Hola ${params.name},</h2>
          <p style="font-size:15px;line-height:1.6;color:#374151">
            Tienes acceso al portal de <strong>${params.organizationName}</strong> con rol
            <strong>${params.role}</strong>.
          </p>
          <p style="margin:24px 0">
            <a href="${params.inviteUrl}"
               style="background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block">
              Entrar al portal
            </a>
          </p>
          <p style="font-size:13px;color:#6b7280">
            Este enlace es personal e intransferible. Caduca el ${expiresAt}.
            Si no esperabas esta invitación, ignora este mensaje.
          </p>
        </div>
      `,
    });
  }
}
