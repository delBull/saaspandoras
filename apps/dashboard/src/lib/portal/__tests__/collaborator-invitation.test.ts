/**
 * 🧪 TESTS: invitación de colaboradores (P0.1).
 *
 * Verifican: roles invitables, unicidad por organización, expiración acotada,
 * credencial no expuesta y que un fallo de correo NO se simula como éxito.
 */

import { describe, expect, it } from 'vitest';
import {
  CollaboratorInvitationService,
  InvitationError,
  MAX_INVITATION_TTL_DAYS,
  type CollaboratorRepository,
  type InvitationMailer,
  type InvitableRole,
} from '../collaborator-invitation';

const NOW = new Date('2026-11-13T12:00:00.000Z');

class MemoryRepo implements CollaboratorRepository {
  rows: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
    expiresAt: string | null;
    organizationId: string;
  }> = [];
  tokens: string[] = [];
  projects: Array<{ projectSlug: string; collaboratorId: number }> = [];

  async findByEmail(organizationId: string, email: string) {
    const found = this.rows.find((r) => r.organizationId === organizationId && r.email === email);
    return found ? { id: found.id } : null;
  }
  async create(params: {
    name: string;
    email: string;
    token: string;
    role: InvitableRole;
    canonicalOrgId: string;
    status: 'ACTIVE';
    expiresAt: Date;
  }) {
    const id = this.rows.length + 1;
    this.tokens.push(params.token);
    this.rows.push({
      id,
      name: params.name,
      email: params.email,
      role: params.role,
      status: params.status,
      expiresAt: params.expiresAt.toISOString(),
      organizationId: params.canonicalOrgId,
    });
    return { id };
  }
  async attachToProject(projectSlug: string, collaboratorId: number) {
    this.projects.push({ projectSlug, collaboratorId });
  }
  async listByOrganization(organizationId: string) {
    return this.rows.filter((r) => r.organizationId === organizationId);
  }
  async listProjects(collaboratorId: number) {
    return this.projects.filter((p) => p.collaboratorId === collaboratorId).map((p) => p.projectSlug);
  }
}

class FlakyMailer implements InvitationMailer {
  sent: Array<{ to: string; inviteUrl: string }> = [];
  fail = false;

  async send(params: { to: string; inviteUrl: string }) {
    if (this.fail) throw new Error('SMTP caído');
    this.sent.push({ to: params.to, inviteUrl: params.inviteUrl });
  }
}

function build(overrides: { repo?: MemoryRepo; mailer?: FlakyMailer; baseUrl?: string } = {}) {
  const repo = overrides.repo ?? new MemoryRepo();
  const mailer = overrides.mailer ?? new FlakyMailer();
  const service = new CollaboratorInvitationService({
    repository: repo,
    mailer,
    baseUrl: overrides.baseUrl ?? 'https://dash.pandoras.finance',
    clock: () => NOW,
    newToken: () => `tok_${repo.tokens.length + 1}_${'a'.repeat(40)}`,
  });
  return { service, repo, mailer };
}

function invite(
  service: CollaboratorInvitationService,
  overrides: Partial<Parameters<CollaboratorInvitationService['invite']>[0]> = {},
) {
  return service.invite({
    organizationId: 'org-uuid',
    organizationSlug: 'celeste',
    organizationName: 'Celeste',
    actorId: 'collaborator:1',
    email: 'maria@celeste.mx',
    name: 'María',
    role: 'OPERATOR',
    ...overrides,
  });
}

describe('P0.1 — invitación de colaboradores', () => {
  it('IV-01: invita con rol, expiración y pertenencia; el email se envía y NO se devuelve el token', async () => {
    const { service, repo, mailer } = build();

    const result = await invite(service);

    expect(result.role).toBe('OPERATOR');
    expect(result.emailSent).toBe(true);
    expect(result.expiresAt).toBe('2026-12-13T12:00:00.000Z');
    expect(JSON.stringify(result)).not.toContain('tok_');

    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0]!.inviteUrl).toContain('/api/v1/portal/session/claim?credential=');
    expect(mailer.sent[0]!.inviteUrl).toContain('org=celeste');
    expect(repo.projects).toEqual([{ projectSlug: 'celeste', collaboratorId: 1 }]);
  });

  it('IV-02: no se puede invitar un OWNER (sin escalada de propiedad)', async () => {
    const { service } = build();

    await expect(invite(service, { role: 'OWNER' })).rejects.toMatchObject({
      code: 'ROLE_NOT_INVITABLE',
    });
    await expect(invite(service, { role: 'SUPER_ADMIN' })).rejects.toMatchObject({
      code: 'ROLE_NOT_INVITABLE',
    });
  });

  it('IV-03: email inválido o nombre vacío ⇒ 422', async () => {
    const { service } = build();

    await expect(invite(service, { email: 'no-es-email' })).rejects.toMatchObject({
      code: 'INVALID_EMAIL',
    });
    await expect(invite(service, { name: ' ' })).rejects.toMatchObject({
      code: 'INVALID_NAME',
    });
  });

  it('IV-04: duplicado en la MISMA organización ⇒ 409 sin crear nada', async () => {
    const { service, repo } = build();
    await invite(service);

    await expect(invite(service)).rejects.toMatchObject({ code: 'DUPLICATE_COLLABORATOR' });
    expect(repo.rows).toHaveLength(1);
  });

  it('IV-05: el mismo email puede invitarse en OTRA organización', async () => {
    const { service, repo } = build();
    await invite(service);

    await invite(service, { organizationId: 'org-otra', organizationSlug: 'otra' });

    expect(repo.rows).toHaveLength(2);
  });

  it('IV-06: TTL fuera de rango ⇒ error', async () => {
    const { service } = build();

    await expect(invite(service, { ttlDays: 0 })).rejects.toMatchObject({ code: 'TTL_INVALID' });
    await expect(
      invite(service, { ttlDays: MAX_INVITATION_TTL_DAYS + 1 }),
    ).rejects.toMatchObject({ code: 'TTL_INVALID' });
  });

  it('IV-07: si el correo falla, se reporta `emailSent: false` (nunca se simula)', async () => {
    const mailer = new FlakyMailer();
    mailer.fail = true;
    const { service, repo } = build({ mailer });

    const result = await invite(service);

    expect(result.emailSent).toBe(false);
    expect(repo.rows).toHaveLength(1); // la credencial existe para reintentar
  });

  it('IV-08: cada invitación genera una credencial distinta y suficientemente larga', async () => {
    const { service, repo } = build();
    await invite(service);
    await invite(service, { email: 'jorge@celeste.mx', name: 'Jorge' });

    expect(repo.tokens).toHaveLength(2);
    expect(repo.tokens[0]).not.toBe(repo.tokens[1]);
    for (const token of repo.tokens) expect(token.length).toBeGreaterThanOrEqual(32);
  });

  it('IV-09: el listado no expone credenciales', async () => {
    const { service } = build();
    await invite(service);

    const list = await service.list({ organizationId: 'org-uuid' });

    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ email: 'maria@celeste.mx', role: 'OPERATOR' });
    expect(JSON.stringify(list)).not.toContain('tok_');
  });

  it('IV-10: sin URL base no se puede construir la invitación', async () => {
    const { service } = build({ baseUrl: '' });

    await expect(invite(service)).rejects.toBeInstanceOf(InvitationError);
  });
});
