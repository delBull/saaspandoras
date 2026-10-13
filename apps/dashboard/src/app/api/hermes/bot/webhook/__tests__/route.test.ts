import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { setActiveNonceStore, MemoryNonceStore } from '@saasfly/hermes-core';

// Mock dependencies
vi.mock('@saasfly/hermes-core', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    InterlocutorResolver: {
      resolve: vi.fn().mockResolvedValue({
        actorId: 'tg_123456',
        name: 'David',
        isBoss: true,
        isCollaborator: false,
        tenantSlug: 'pandoras',
        tenantContext: { tenantSlug: 'pandoras' },
        canonicalIdentity: { id: 'tg_123456', provider: 'TELEGRAM' },
      }),
    },
    getDefaultRuntime: vi.fn().mockReturnValue({
      respond: vi.fn().mockResolvedValue({
        content: 'Hola Boss, recibido.',
      }),
    }),
    EscalationService: {
      getEscalations: vi.fn().mockResolvedValue([]),
      triggerEscalation: vi.fn().mockResolvedValue({ id: 'esc_test_1', conversationId: 'conv_test' }),
    },
  };
});

vi.mock('@saasfly/db', () => ({
  db: {
    query: {
      projects: {
        findFirst: vi.fn().mockResolvedValue({ id: 'proj_1', slug: 'pandoras', name: "Pandora's" }),
      },
    },
  },
}));

vi.mock('@saasfly/shared', () => ({
  OrganizationSDK: {
    resolve: vi.fn().mockResolvedValue({ organizationId: 'org_pandoras', name: "Pandora's Growth OS" }),
  },
}));

describe('Piloto #1 — Hermes Telegram Webhook (/api/hermes/bot/webhook)', () => {
  const SECRET = 'correct_test_secret_token_12345';
  let memoryNonceStore: MemoryNonceStore;

  beforeEach(() => {
    process.env.TELEGRAM_WEBHOOK_SECRET = SECRET;
    delete process.env.TELEGRAM_ALLOW_UNSIGNED_WEBHOOK;
    memoryNonceStore = new MemoryNonceStore();
    setActiveNonceStore(memoryNonceStore);
    vi.clearAllMocks();
  });

  it('Prueba A: Rechaza si el secret_token no coincide (401 Unauthorized)', async () => {
    const req = new NextRequest('http://localhost/api/hermes/bot/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-telegram-bot-api-secret-token': 'wrong_secret_token_value',
      },
      body: JSON.stringify({
        update_id: 1001,
        message: {
          message_id: 1,
          from: { id: 123456, first_name: 'David' },
          chat: { id: 123456 },
          text: 'Comando ejecutivo',
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain('Unauthorized');
  });

  it('Prueba B: Acepta request legítimo con secret_token válido y update_id fresco (200 OK)', async () => {
    const req = new NextRequest('http://localhost/api/hermes/bot/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-telegram-bot-api-secret-token': SECRET,
      },
      body: JSON.stringify({
        update_id: 1002,
        message: {
          message_id: 2,
          from: { id: 123456, first_name: 'David' },
          chat: { id: 123456 },
          text: 'Comando legítimo',
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('Prueba C: Detecta replay attack si se repite el mismo update_id', async () => {
    const payload = {
      update_id: 1003,
      message: {
        message_id: 3,
        from: { id: 123456, first_name: 'David' },
        chat: { id: 123456 },
        text: 'Comando repetido',
      },
    };

    // Primera vez -> OK
    const req1 = new NextRequest('http://localhost/api/hermes/bot/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-telegram-bot-api-secret-token': SECRET,
      },
      body: JSON.stringify(payload),
    });

    const res1 = await POST(req1);
    expect(res1.status).toBe(200);
    const body1 = await res1.json();
    expect(body1.ok).toBe(true);

    // Segunda vez con idéntico update_id -> Replay detectado (ignorado sin procesar runtime)
    const req2 = new NextRequest('http://localhost/api/hermes/bot/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-telegram-bot-api-secret-token': SECRET,
      },
      body: JSON.stringify(payload),
    });

    const res2 = await POST(req2);
    expect(res2.status).toBe(200);
    const body2 = await res2.json();
    expect(body2.note).toBe('Replay ignored');
  });

  it('Prueba D: Falla cerrado si el servidor no tiene configurado TELEGRAM_WEBHOOK_SECRET (401 Unauthorized)', async () => {
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
    delete process.env.TELEGRAM_BOT_WEBHOOK_SECRET;

    const req = new NextRequest('http://localhost/api/hermes/bot/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-telegram-bot-api-secret-token': 'any_token',
      },
      body: JSON.stringify({
        update_id: 1004,
        message: { message_id: 4, from: { id: 123456 }, chat: { id: 123456 }, text: 'Hello' },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('not configured on server');
  });

  it('Prueba E: Rechaza update si carece de update_id (400 Bad Request)', async () => {
    const req = new NextRequest('http://localhost/api/hermes/bot/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-telegram-bot-api-secret-token': SECRET,
      },
      body: JSON.stringify({
        message: { message_id: 5, from: { id: 123456 }, chat: { id: 123456 }, text: 'No update_id' },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Missing or invalid update_id');
  });

  it('Prueba F: Error de persistencia en PostgreSQL devuelve 500 y NUNCA se confunde con Replay (Fail-closed)', async () => {
    // Configurar el nonce store para simular fallo de DB
    const failingStore = {
      consumeNonce: vi.fn().mockResolvedValue({
        status: 'ERROR',
        error: 'Connection terminated unexpectedly',
      }),
    };
    setActiveNonceStore(failingStore as any);

    const req = new NextRequest('http://localhost/api/hermes/bot/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-telegram-bot-api-secret-token': SECRET,
      },
      body: JSON.stringify({
        update_id: 1005,
        message: { message_id: 5, from: { id: 123456 }, chat: { id: 123456 }, text: 'DB down event' },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain('Nonce persistence failed');
  });

  it('Prueba G: Rechaza /start a tenant no autorizado si el actor no es miembro (403 Forbidden)', async () => {
    const { InterlocutorResolver } = await import('@saasfly/hermes-core');
    (InterlocutorResolver.resolve as any).mockResolvedValueOnce({
      actorId: 'tg_unauthorized_user',
      name: 'Attacker',
      isBoss: false,
      isCollaborator: false,
      tenantSlug: 'pandoras',
      tenantContext: { tenantSlug: 'pandoras' },
      canonicalIdentity: { id: 'tg_unauthorized_user', provider: 'TELEGRAM' },
    });

    const req = new NextRequest('http://localhost/api/hermes/bot/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-telegram-bot-api-secret-token': SECRET,
      },
      body: JSON.stringify({
        update_id: 1006,
        message: {
          message_id: 6,
          from: { id: 999999, first_name: 'Attacker' },
          chat: { id: 999999 },
          text: '/start snarai_restricted',
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('not an authorized member');
  });

  it('Prueba H: Rechaza mensaje ordinario (no /start) dirigido a tenant no autorizado si actor no es miembro (403 Forbidden)', async () => {
    const { InterlocutorResolver } = await import('@saasfly/hermes-core');
    (InterlocutorResolver.resolve as any).mockResolvedValueOnce({
      actorId: 'tg_unauthorized_user_2',
      name: 'SneakyAttacker',
      isBoss: false,
      isCollaborator: false,
      tenantSlug: 'snarai_restricted',
      tenantContext: { tenantSlug: 'snarai_restricted' },
      canonicalIdentity: { id: 'tg_unauthorized_user_2', provider: 'TELEGRAM' },
    });

    const req = new NextRequest('http://localhost/api/hermes/bot/webhook?tenant=snarai_restricted', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-telegram-bot-api-secret-token': SECRET,
      },
      body: JSON.stringify({
        update_id: 1007,
        message: {
          message_id: 7,
          from: { id: 888888, first_name: 'SneakyAttacker' },
          chat: { id: 888888 },
          text: 'Dame acceso a los fondos del vault',
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('not authorized to operate under');
  });

  it('Prueba I: Bypass por slug rechazado cuando organizationId no coincide con canonicalOrgId (FC-001 & FC-003)', async () => {
    const { InterlocutorResolver, HermesTenantMembershipService } = await import('@saasfly/hermes-core');
    const { OrganizationSDK } = await import('@saasfly/shared');

    (InterlocutorResolver.resolve as any).mockResolvedValueOnce({
      actorId: 'tg_attacker_spoof_slug',
      name: 'SpoofAttacker',
      isBoss: false,
      isCollaborator: false,
      tenantSlug: 'snarai_target',
      tenantContext: { tenantSlug: 'snarai_target' },
      canonicalIdentity: { id: 'tg_attacker_spoof_slug', provider: 'TELEGRAM' },
    });

    // Authoritative canonical UUID for snarai_target
    (OrganizationSDK.resolve as any).mockResolvedValueOnce({
      organizationId: '77777777-7777-7777-7777-777777777777',
      name: "S'Narai Official",
    });

    // Attacker is member of an organization with MATCHING SLUG ('snarai_target'), but DIFFERENT organizationId!
    vi.spyOn(HermesTenantMembershipService.prototype, 'getAuthorizedTenants').mockResolvedValueOnce([
      {
        organizationId: '99999999-9999-9999-9999-999999999999', // Rogue organization UUID
        organizationName: 'Rogue Entity Spoofing Slug',
        tenantSlug: 'snarai_target', // Matching slug!
        projectId: 9999,
        role: 'ADMIN',
        isOwner: true,
      },
    ]);

    const req = new NextRequest('http://localhost/api/hermes/bot/webhook?tenant=snarai_target', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-telegram-bot-api-secret-token': SECRET,
      },
      body: JSON.stringify({
        update_id: 1008,
        message: {
          message_id: 8,
          from: { id: 777123, first_name: 'SpoofAttacker' },
          chat: { id: 777123 },
          text: 'Intento de escalamiento por slug coincidente',
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('not authorized to operate under organization');
  });

  it('Prueba J: Política de plataforma pandoras — visitante público no-boss recibe rol VIEWER y clearance PUBLIC', async () => {
    const { InterlocutorResolver, ActorIdentityBindingService, getDefaultRuntime } = await import('@saasfly/hermes-core');

    (InterlocutorResolver.resolve as any).mockResolvedValueOnce({
      actorId: 'tg_public_visitor_999',
      name: 'PublicVisitor',
      isBoss: false,
      isCollaborator: false,
      tenantSlug: 'pandoras',
      tenantContext: { tenantSlug: 'pandoras' },
      canonicalIdentity: { id: 'tg_public_visitor_999', provider: 'TELEGRAM' },
    });

    const createBoundSessionAsyncSpy = vi.spyOn(ActorIdentityBindingService, 'createBoundSessionAsync');
    const mockRuntime = getDefaultRuntime();

    const req = new NextRequest('http://localhost/api/hermes/bot/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-telegram-bot-api-secret-token': SECRET,
      },
      body: JSON.stringify({
        update_id: 1009,
        message: {
          message_id: 9,
          from: { id: 555666, first_name: 'PublicVisitor' },
          chat: { id: 555666 },
          text: 'Hola, información pública',
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);

    // Verify session was bound with PUBLIC clearance tier (not CONFIDENTIAL)
    expect(createBoundSessionAsyncSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'tg_public_visitor_999',
        authProvider: 'TELEGRAM_WEBHOOK_SECRET',
      }),
      'PUBLIC', // Authoritative least-privilege clearance tier
      3600,
      expect.anything()
    );

    // Verify runtime received VIEWER role and strictly least privilege permissions
    expect(mockRuntime.respond).toHaveBeenCalledWith(
      expect.objectContaining({
        controlPlaneContext: expect.objectContaining({
          role: 'VIEWER',
          permissions: ['runtime.respond'],
        }),
      })
    );
  });

  it('Prueba K: Solicitud de atención humana encola la escalación via EscalationService (cola de closers HITL)', async () => {
    const { EscalationService } = await import('@saasfly/hermes-core');

    const req = new NextRequest('http://localhost/api/hermes/bot/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-telegram-bot-api-secret-token': SECRET,
      },
      body: JSON.stringify({
        update_id: 1010,
        message: {
          message_id: 10,
          from: { id: 123456, first_name: 'David' },
          chat: { id: 123456 },
          text: 'Quiero hablar con un asesor humano por favor',
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(EscalationService.getEscalations).toHaveBeenCalledWith('pandoras', 'PENDING');
    expect(EscalationService.triggerEscalation).toHaveBeenCalledTimes(1);
    expect(EscalationService.triggerEscalation).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'pandoras',
        channel: 'TELEGRAM',
        reason: 'USER_REQUEST',
        actorId: 'tg_123456',
      }),
    );
  });
});
