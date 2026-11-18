/**
 * P0.1 — Invitación de colaboradores al portal (multiusuario).
 *
 * Cada persona recibe su PROPIA credencial (`nexus_collaborators.token`), con
 * expiración, y queda ligada a la organización por pertenencia explícita.
 *
 * Reglas duras:
 *  - Solo se invitan roles operativos: ADMIN, OPERATOR, VIEWER. `OWNER` no se
 *    invita (evita escalada de propiedad por invitación).
 *  - Email duplicado en la organización ⇒ 409, sin crear nada.
 *  - La credencial NO se devuelve en la respuesta ni se registra en logs.
 *  - Si el correo falla, la invitación queda `emailSent: false` y la credencial
 *    existe (se puede reenviar). Nunca se simula un envío exitoso.
 */

import { randomBytes } from 'node:crypto';

export const INVITABLE_ROLES = ['ADMIN', 'OPERATOR', 'VIEWER'] as const;
export type InvitableRole = (typeof INVITABLE_ROLES)[number];

export const DEFAULT_INVITATION_TTL_DAYS = 30;
export const MAX_INVITATION_TTL_DAYS = 90;

export interface CollaboratorRecord {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string | null;
  organizationId: string;
  projects: string[];
}

export interface CollaboratorRepository {
  findByEmail(organizationId: string, email: string): Promise<{ id: number } | null>;
  create(params: {
    name: string;
    email: string;
    token: string;
    role: InvitableRole;
    canonicalOrgId: string;
    status: 'ACTIVE';
    expiresAt: Date;
  }): Promise<{ id: number }>;
  attachToProject(projectSlug: string, collaboratorId: number): Promise<void>;
  listByOrganization(organizationId: string): Promise<Omit<CollaboratorRecord, 'projects'>[]>;
  listProjects(collaboratorId: number): Promise<string[]>;
}

export interface InvitationMailer {
  send(params: {
    to: string;
    name: string;
    organizationName: string;
    role: InvitableRole;
    inviteUrl: string;
    expiresAt: string;
  }): Promise<void>;
}

export type InvitationErrorCode =
  | 'INVALID_EMAIL'
  | 'INVALID_NAME'
  | 'INVALID_ROLE'
  | 'ROLE_NOT_INVITABLE'
  | 'DUPLICATE_COLLABORATOR'
  | 'TTL_INVALID'
  | 'BASE_URL_NOT_CONFIGURED';

export class InvitationError extends Error {
  constructor(
    message: string,
    readonly code: InvitationErrorCode,
    readonly status = 422,
  ) {
    super(message);
    this.name = 'InvitationError';
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface CollaboratorInvitationServiceOptions {
  repository: CollaboratorRepository;
  mailer: InvitationMailer;
  baseUrl: string;
  clock?: () => Date;
  newToken?: () => string;
}

export class CollaboratorInvitationService {
  private readonly repo: CollaboratorRepository;
  private readonly mailer: InvitationMailer;
  private readonly baseUrl: string;
  private readonly clock: () => Date;
  private readonly newToken: () => string;

  constructor(options: CollaboratorInvitationServiceOptions) {
    this.repo = options.repository;
    this.mailer = options.mailer;
    this.baseUrl = options.baseUrl;
    this.clock = options.clock ?? (() => new Date());
    this.newToken = options.newToken ?? (() => randomBytes(32).toString('hex'));
  }

  async invite(params: {
    organizationId: string;
    organizationSlug: string;
    organizationName: string;
    actorId: string;
    email: string;
    name: string;
    role: string;
    ttlDays?: number;
  }): Promise<{
    collaboratorId: number;
    email: string;
    role: InvitableRole;
    expiresAt: string;
    emailSent: boolean;
  }> {
    const email = (params.email ?? '').trim().toLowerCase();
    const name = (params.name ?? '').trim();

    if (!EMAIL_PATTERN.test(email)) {
      throw new InvitationError('Email inválido.', 'INVALID_EMAIL');
    }
    if (name.length < 2) {
      throw new InvitationError('El nombre es obligatorio.', 'INVALID_NAME');
    }

    const role = (params.role ?? '').trim().toUpperCase();
    if (!(INVITABLE_ROLES as readonly string[]).includes(role)) {
      throw new InvitationError(
        `Rol no invitable. Válidos: ${INVITABLE_ROLES.join(', ')}.`,
        'ROLE_NOT_INVITABLE',
      );
    }

    const ttlDays = params.ttlDays ?? DEFAULT_INVITATION_TTL_DAYS;
    if (!Number.isInteger(ttlDays) || ttlDays <= 0 || ttlDays > MAX_INVITATION_TTL_DAYS) {
      throw new InvitationError(
        `TTL inválido: entero positivo ≤ ${MAX_INVITATION_TTL_DAYS} días.`,
        'TTL_INVALID',
      );
    }

    if (!this.baseUrl) {
      throw new InvitationError(
        'Falta la URL base para construir la invitación.',
        'BASE_URL_NOT_CONFIGURED',
        503,
      );
    }

    // Duplicado en la MISMA organización (no se filtra si existe en otra).
    const existing = await this.repo.findByEmail(params.organizationId, email);
    if (existing) {
      throw new InvitationError(
        'Ya existe un colaborador con ese email en esta organización.',
        'DUPLICATE_COLLABORATOR',
        409,
      );
    }

    const now = this.clock();
    const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);
    const token = this.newToken();

    const created = await this.repo.create({
      name,
      email,
      token,
      role: role as InvitableRole,
      canonicalOrgId: params.organizationId,
      status: 'ACTIVE',
      expiresAt,
    });

    try {
      await this.repo.attachToProject(params.organizationSlug, created.id);
    } catch (error) {
      // Sin pertenencia no hay acceso: se propaga para que el llamador lo vea.
      throw new InvitationError(
        `No se pudo vincular al colaborador con la organización: ${
          (error as Error)?.message ?? 'error'
        }`,
        'INVALID_ROLE',
        500,
      );
    }

    const inviteUrl = `${this.baseUrl.replace(/\/+$/, '')}/api/v1/portal/session/claim?credential=${encodeURIComponent(
      token,
    )}&org=${encodeURIComponent(params.organizationSlug)}`;

    let emailSent = true;
    try {
      await this.mailer.send({
        to: email,
        name,
        organizationName: params.organizationName,
        role: role as InvitableRole,
        inviteUrl,
        expiresAt: expiresAt.toISOString(),
      });
    } catch (error) {
      // La credencial existe; el envío se reporta como fallido (nunca simulado).
      emailSent = false;
      console.warn('[PortalInvitation] Envío fallido:', (error as Error)?.message ?? error);
    }

    return {
      collaboratorId: created.id,
      email,
      role: role as InvitableRole,
      expiresAt: expiresAt.toISOString(),
      emailSent,
    };
  }

  async list(params: { organizationId: string }): Promise<CollaboratorRecord[]> {
    const rows = await this.repo.listByOrganization(params.organizationId);

    return Promise.all(
      rows.map(async (row) => ({
        ...row,
        projects: await this.repo.listProjects(row.id),
      })),
    );
  }
}
