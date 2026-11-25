import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@saasfly/db', () => ({ db: {} }));
vi.mock('@saasfly/db/schema', () => ({ installedProducts: {}, projects: {} }));
vi.mock('@saasfly/db-core', () => ({ eq: () => ({}), and: () => ({}) }));
vi.mock('jsonwebtoken', () => ({ default: { sign: () => 'jwt', verify: () => null } }));

const { signVirtualSessionToken, verifyVirtualSessionToken } = await import('../portal-auth');

const HASH = 'a'.repeat(32);
const SECRET = 'secreto-de-prueba';

beforeEach(() => {
  vi.stubEnv('PORTAL_JWT_SECRET', SECRET);
  vi.stubEnv('NEXTAUTH_SECRET', SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Portal · sesiones virtuales firmadas', () => {
  it('firma y valida una sesión virtual', () => {
    const token = signVirtualSessionToken(17, HASH);
    expect(token).toMatch(/^ps_v_17_[a-f0-9]{32}_[a-f0-9]{32}$/);
    expect(verifyVirtualSessionToken(token)).toEqual({ projectId: 17, hash: HASH });
  });

  it('rechaza el token sin firma (el bypass cerrado)', () => {
    // Antes: `ps_v_17_<32 hex al azar>` daba sesión de cualquier proyecto.
    expect(verifyVirtualSessionToken(`ps_v_17_${HASH}`)).toBeNull();
    expect(verifyVirtualSessionToken(`ps_v_148_${'b'.repeat(32)}`)).toBeNull();
  });

  it('rechaza una firma alterada', () => {
    const token = signVirtualSessionToken(17, HASH);
    const last = token.slice(-1);
    const tampered = token.slice(0, -1) + (last === '0' ? '1' : '0');
    expect(verifyVirtualSessionToken(tampered)).toBeNull();
  });

  it('rechaza cambiar el projectId conservando la firma', () => {
    const token = signVirtualSessionToken(17, HASH);
    const parts = token.split('_');
    parts[2] = '148';
    expect(verifyVirtualSessionToken(parts.join('_'))).toBeNull();
  });

  it('rechaza una firma hecha con otro secreto', () => {
    const token = signVirtualSessionToken(17, HASH);
    vi.stubEnv('PORTAL_JWT_SECRET', 'otro-secreto');
    vi.stubEnv('NEXTAUTH_SECRET', 'otro-secreto');
    expect(verifyVirtualSessionToken(token)).toBeNull();
  });

  it('sin secreto configurado no valida nada (fail-closed)', () => {
    const token = signVirtualSessionToken(17, HASH);
    vi.stubEnv('PORTAL_JWT_SECRET', '');
    vi.stubEnv('NEXTAUTH_SECRET', '');
    expect(verifyVirtualSessionToken(token)).toBeNull();
  });

  it('la firma es estable para el mismo proyecto y hash', () => {
    expect(signVirtualSessionToken(17, HASH)).toBe(signVirtualSessionToken(17, HASH));
  });
});
