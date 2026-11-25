import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const rows = vi.fn();

vi.mock('@saasfly/db-core', () => ({
  db: {
    select: () => ({ from: () => ({ limit: (...args: unknown[]) => rows(...args) }) }),
  },
}));

vi.mock('@saasfly/db-core/schema', () => ({ projects: { slug: 'slug' } }));

const { resolveTenantByPhoneNumberId } = await import('../whatsapp-tenant');

beforeEach(() => {
  rows.mockReset();
  rows.mockResolvedValue([{ slug: 'snarai' }, { slug: 'coffree' }]);
  vi.stubEnv('META_PHONE_NUMBER_ID_SNARAI', '111');
  vi.stubEnv('META_PHONE_NUMBER_ID_COFFREE', '222');
  vi.stubEnv('WHATSAPP_PHONE_NUMBER_ID', '999');
});

afterEach(() => vi.unstubAllEnvs());

describe('Tenant por número de WhatsApp', () => {
  it('resuelve el tenant dueño del número', async () => {
    expect(await resolveTenantByPhoneNumberId('111')).toBe('snarai');
    expect(await resolveTenantByPhoneNumberId('222')).toBe('coffree');
  });

  it('el número maestro es de la plataforma', async () => {
    expect(await resolveTenantByPhoneNumberId('999')).toBe('pandoras');
  });

  it('un número desconocido no se asigna a nadie', async () => {
    expect(await resolveTenantByPhoneNumberId('000')).toBeNull();
    expect(await resolveTenantByPhoneNumberId('')).toBeNull();
  });
});
