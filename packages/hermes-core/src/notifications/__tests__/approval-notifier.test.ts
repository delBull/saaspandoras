import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const selectLimit = vi.fn();
const insertReturning = vi.fn();

vi.mock('@saasfly/db-core', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: (...args: unknown[]) => selectLimit(...args),
        }),
      }),
    }),
    insert: () => ({
      values: () => ({
        onConflictDoNothing: () => ({
          returning: (...args: unknown[]) => insertReturning(...args),
        }),
      }),
    }),
  },
  and: (...args: unknown[]) => ({ and: args }),
  eq: (...args: unknown[]) => ({ eq: args }),
}));

vi.mock('@saasfly/db-core/schema', () => ({
  hermesTenantNotifications: {
    id: 'id',
    tenantId: 'tenant_id',
  },
  tenantNotificationChannels: {
    canonicalOrgId: 'canonical_org_id',
    kind: 'kind',
    channel: 'channel',
    enabled: 'enabled',
    target: 'target',
  },
}));

const {
  buildApprovalNotice,
  approvalsLink,
  notifyApprovalPending,
} = await import('../approval-notifier');

const fetchMock = vi.fn();

beforeEach(() => {
  selectLimit.mockReset();
  insertReturning.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Approval notifier · aviso', () => {
  it('enlaza a la bandeja del tenant correcto y deduplica por aprobación', () => {
    const notice = buildApprovalNotice({
      canonicalOrgId: 'snarai',
      approvalId: 'APP-1',
      intent: 'Apertura: avisos',
      channels: ['s-narai-anuncios'],
      posts: 1,
    });

    expect(notice.inApp.dedupeKey).toBe('approval:APP-1');
    expect(notice.inApp.body).toContain('#s-narai-anuncios');
    expect(notice.link).toBe(approvalsLink('snarai'));
    expect(notice.link).toContain('/growth-os/organizations/snarai/approvals');
    expect(notice.embed.embeds[0]!.url).toBe(notice.link);
  });

  it('no lleva el texto de la publicación: sólo intención, conteo y canales', () => {
    const notice = buildApprovalNotice({
      canonicalOrgId: 'snarai',
      approvalId: 'APP-2',
      intent: 'Respuesta a duda',
      channels: ['s-narai-preguntas'],
      posts: 2,
    });

    const serialized = JSON.stringify(notice);
    expect(serialized).not.toContain('Título de Propiedad');
    expect(serialized).toContain('2');
  });

  it('un tenant sin canal configurado no publica en ningún webhook global', async () => {
    selectLimit.mockResolvedValueOnce([]); // sin canal
    insertReturning.mockResolvedValueOnce([{ id: 'ntf_1' }]);

    const result = await notifyApprovalPending({
      canonicalOrgId: 'snarai',
      approvalId: 'APP-3',
      intent: 'Apertura',
      channels: ['s-narai-anuncios'],
      posts: 1,
    });

    expect(result).toEqual({ inApp: true, webhook: 'SKIPPED' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('con canal configurado envía el aviso', async () => {
    selectLimit.mockResolvedValueOnce([{ target: 'https://discord.com/api/webhooks/1/abc' }]);
    insertReturning.mockResolvedValueOnce([{ id: 'ntf_2' }]);
    fetchMock.mockResolvedValueOnce({ ok: true, status: 204 });

    const result = await notifyApprovalPending({
      canonicalOrgId: 'snarai',
      approvalId: 'APP-4',
      intent: 'Apertura',
      channels: ['s-narai-anuncios'],
      posts: 1,
    });

    expect(result.webhook).toBe('SENT');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0]!;
    expect(String(init.body)).toContain('Aprobación');
  });

  it('una aprobación ya avisada no reenvía el webhook', async () => {
    selectLimit.mockResolvedValueOnce([{ target: 'https://discord.com/api/webhooks/1/abc' }]);
    insertReturning.mockResolvedValueOnce([]); // conflicto: ya existía el aviso

    const result = await notifyApprovalPending({
      canonicalOrgId: 'snarai',
      approvalId: 'APP-6',
      intent: 'Apertura',
      channels: ['s-narai-anuncios'],
      posts: 1,
    });

    expect(result).toEqual({ inApp: false, webhook: 'SKIPPED' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('un webhook caído no rompe la creación de la aprobación', async () => {
    selectLimit.mockResolvedValueOnce([{ target: 'https://discord.com/api/webhooks/1/abc' }]);
    insertReturning.mockResolvedValueOnce([{ id: 'ntf_3' }]);
    fetchMock.mockRejectedValueOnce(new Error('network down'));

    const result = await notifyApprovalPending({
      canonicalOrgId: 'snarai',
      approvalId: 'APP-5',
      intent: 'Apertura',
      channels: ['s-narai-anuncios'],
      posts: 1,
    });

    expect(result.webhook).toBe('FAILED');
  });
});
