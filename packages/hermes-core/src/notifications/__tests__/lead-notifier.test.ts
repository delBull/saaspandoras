import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const selectLimit = vi.fn();
const insertReturning = vi.fn();

vi.mock('@saasfly/db-core', () => ({
  db: {
    select: () => ({ from: () => ({ where: () => ({ limit: (...a: unknown[]) => selectLimit(...a) }) }) }),
    insert: () => ({
      values: () => ({ onConflictDoNothing: () => ({ returning: (...a: unknown[]) => insertReturning(...a) }) }),
    }),
  },
  and: (...args: unknown[]) => ({ and: args }),
  eq: (...args: unknown[]) => ({ eq: args }),
}));

vi.mock('@saasfly/db-core/schema', () => ({
  hermesTenantNotifications: { id: 'id', tenantId: 'tenant_id' },
  tenantNotificationChannels: {
    canonicalOrgId: 'canonical_org_id',
    kind: 'kind',
    channel: 'channel',
    enabled: 'enabled',
    target: 'target',
  },
}));

const { notifyLeadCaptured } = await import('../lead-notifier');
const fetchMock = vi.fn();

beforeEach(() => {
  selectLimit.mockReset();
  insertReturning.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe('Aviso de lead capturado', () => {
  it('sin canal del tenant sólo deja el aviso in-app', async () => {
    insertReturning.mockResolvedValueOnce([{ id: 'ntf_1' }]);
    selectLimit.mockResolvedValueOnce([]);

    const result = await notifyLeadCaptured({
      canonicalOrgId: 'snarai',
      leadId: 'lead-1',
      name: 'Ana',
      source: 'god2f7wy',
    });

    expect(result).toEqual({ inApp: true, webhook: 'SKIPPED' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('con canal configurado avisa al canal del tenant', async () => {
    insertReturning.mockResolvedValueOnce([{ id: 'ntf_2' }]);
    selectLimit.mockResolvedValueOnce([{ target: 'https://discord.com/api/webhooks/1/abc' }]);
    fetchMock.mockResolvedValueOnce({ ok: true, status: 204 });

    const result = await notifyLeadCaptured({
      canonicalOrgId: 'snarai',
      leadId: 'lead-2',
      name: 'Ana',
      source: 'god2f7wy',
    });

    expect(result.webhook).toBe('SENT');
    const [, init] = fetchMock.mock.calls[0]!;
    const body = String(init.body);
    expect(body).toContain('snarai');
    expect(body).toContain('god2f7wy');
  });

  it('un lead ya avisado no reenvía nada', async () => {
    insertReturning.mockResolvedValueOnce([]); // conflicto de dedupe

    const result = await notifyLeadCaptured({
      canonicalOrgId: 'snarai',
      leadId: 'lead-1',
      name: 'Ana',
    });

    expect(result).toEqual({ inApp: false, webhook: 'SKIPPED' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
