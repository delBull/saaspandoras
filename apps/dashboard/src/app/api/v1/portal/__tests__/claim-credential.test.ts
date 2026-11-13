/**
 * 🧪 TESTS: canje de credencial por sesión de portal (P0.1).
 *
 * Fail-closed en todos los bordes: credencial ausente, inválida o de otra
 * organización ⇒ redirección a login, sin cookie.
 */

import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

let sessionResult: any = null;
let belongsResult = false;
let rotationResult = true;
let rotatedIds: number[] = [];

vi.mock('@/lib/portal/collaborator-session', () => ({
  COLLABORATOR_SESSION_TTL_SECONDS: 604800,
  resolveCollaboratorSession: vi.fn(async () => sessionResult),
  collaboratorBelongsToOrganization: vi.fn(async () => belongsResult),
  rotateInvitationCredential: vi.fn(async (collaboratorId: number) => {
    rotatedIds.push(collaboratorId);
    return rotationResult;
  }),
  mintCollaboratorSessionToken: vi.fn(
    (params: { collaboratorId: number; canonicalOrgId: string }) => ({
      token: `pcs.payload_${params.collaboratorId}.signature`,
      expiresAt: 1_900_000_000,
    }),
  ),
}));

const { GET: claim } = await import('../session/claim/route');

function req(query: string) {
  return new NextRequest(`http://localhost/api/v1/portal/session/claim?${query}`);
}

describe('canje de credencial de colaborador (P0.1)', () => {
  it('CL-01: sin credencial ⇒ redirección a login con error y sin cookie', async () => {
    sessionResult = null;

    const res = await claim(req('org=celeste'));

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toContain('/portal/login?error=invalid_credential');
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('CL-02: credencial inválida o expirada ⇒ sin sesión', async () => {
    sessionResult = null;

    const res = await claim(req('credential=tok_invalido&org=celeste'));

    expect(res.headers.get('location')).toContain('error=invalid_credential');
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('CL-03: colaborador de OTRA organización ⇒ sin sesión', async () => {
    sessionResult = { collaboratorId: 7, canonicalOrgId: 'org-uuid', role: 'operator', actorId: 'collaborator:7' };
    belongsResult = false;

    const res = await claim(req('credential=tok_valido&org=celeste'));

    expect(res.headers.get('location')).toContain('error=invalid_credential');
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('CL-04: credencial válida ⇒ la cookie lleva un TOKEN DE SESIÓN y la credencial se rota (un solo uso)', async () => {
    sessionResult = { collaboratorId: 7, canonicalOrgId: 'org-uuid', role: 'operator', actorId: 'collaborator:7' };
    belongsResult = true;
    rotatedIds = [];

    const res = await claim(req('credential=tok_valido&org=celeste'));

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toContain('/portal/celeste');

    const cookie = res.headers.get('set-cookie') ?? '';
    // La cookie NO contiene la credencial de invitación.
    expect(cookie).not.toContain('tok_valido');
    expect(cookie).toContain('pandoras_portal_session=pcs.');
    expect(cookie.toLowerCase()).toContain('httponly');
    expect(cookie.toLowerCase()).toContain('samesite=lax');
    expect(cookie).toContain('Max-Age=604800');

    // El enlace queda inutilizable para siempre.
    expect(rotatedIds).toEqual([7]);
  });

  it('CL-05: si la credencial no puede rotarse, NO se abre sesión (fail-closed)', async () => {
    sessionResult = { collaboratorId: 7, canonicalOrgId: 'org-uuid', role: 'operator', actorId: 'collaborator:7' };
    belongsResult = true;
    rotationResult = false;

    const res = await claim(req('credential=tok_valido&org=celeste'));

    expect(res.headers.get('location')).toContain('error=invalid_credential');
    expect(res.headers.get('set-cookie')).toBeNull();

    rotationResult = true;
  });
});
