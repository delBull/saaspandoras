/**
 * Instagram → WhatsApp: parseo del webhook, texto del DM, verificación y
 * procesamiento con idempotencia real (el índice único vive en la BD; aquí se
 * simula con un Set para probar que un reintento **no** envía dos DMs).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const PROJECT_ROWS: any[] = [
  {
    slug: 'snarai',
    organizationId: '9079ecf5-2162-4078-bddf-66b607e2d32f',
    title: "S'Narai",
    extraConfig: {
      community: { igUserId: '17841400000000001', whatsappNumber: '+1 833 652-9213' },
    },
    runtimeConfig: {},
  },
  {
    slug: 'pandoras',
    organizationId: '9ba63b88-088f-42f9-b67f-28e22c03f0ae',
    title: 'Pandoras Growth OS',
    extraConfig: {},
    runtimeConfig: {},
  },
];

let integrationRows: any[] = [];
let claimed = new Set<string>();
let updates: Array<{ set: any }> = [];

vi.mock('@saasfly/db-core', () => {
  const db = {
    select: () => ({
      from: (table: any) => {
        if (table === 'projects') {
          return { limit: async () => PROJECT_ROWS };
        }
        return {
          where: () => ({
            limit: async () => integrationRows,
          }),
        };
      },
    }),
    insert: () => ({
      values: (row: any) => ({
        onConflictDoNothing: () => ({
          returning: async () => {
            if (claimed.has(row.externalId)) return [];
            claimed.add(row.externalId);
            return [{ id: row.id }];
          },
        }),
      }),
    }),
    update: () => ({
      set: (patch: any) => ({
        where: async () => {
          updates.push({ set: patch });
        },
      }),
    }),
  };

  return {
    db,
    and: (...args: any[]) => args,
    eq: (...args: any[]) => args,
    desc: (...args: any[]) => args,
    projects: { __table: 'projects' },
    socialDmLog: { __table: 'social_dm_log' },
    tenantSocialIntegrations: { __table: 'tenant_social_integrations' },
  };
});

vi.mock('@saasfly/db-core/schema', () => ({
  projects: 'projects',
  socialDmLog: 'social_dm_log',
  tenantSocialIntegrations: 'tenant_social_integrations',
}));

import {
  buildDmText,
  handleInstagramEvent,
  parseInstagramWebhook,
  resolveCommunityWhatsAppNumber,
  resolveInstagramIdentity,
  verifyInstagramChallenge,
  type InstagramIdentity,
} from '../instagram';

const SENTINEL = {
  META_IG_USER_ID_SNARAI: '17841400000000001',
  META_APP_SECRET_SNARAI: 'secreto-snarai',
  META_IG_ACCESS_TOKEN_SNARAI: 'token-snarai',
  INSTAGRAM_WEBHOOK_VERIFY_TOKEN: 'verify-global',
  INSTAGRAM_WEBHOOK_VERIFY_TOKEN_SNARAI: 'verify-snarai',
};

function clearEnv() {
  for (const key of Object.keys(SENTINEL)) delete process.env[key];
  delete process.env.META_IG_USER_ID;
  delete process.env.INSTAGRAM_USER_ID;
  delete process.env.META_IG_ACCESS_TOKEN;
  delete process.env.META_WEBHOOK_VERIFY_TOKEN;
  delete process.env.COMMUNITY_WHATSAPP_NUMBER;
  delete process.env.COMMUNITY_WHATSAPP_NUMBER_SNARAI;
}

beforeEach(() => {
  clearEnv();
  Object.assign(process.env, SENTINEL);
  integrationRows = [];
  claimed = new Set();
  updates = [];
  vi.stubGlobal('fetch', vi.fn(async () =>
    new Response(JSON.stringify({ message_id: 'mid.1' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  ));
});

afterEach(() => {
  vi.unstubAllGlobals();
  clearEnv();
});

// ─── Payload ────────────────────────────────────────────────────────────────

describe('parseInstagramWebhook', () => {
  it('extrae un comentario con su publicación y autor', () => {
    const parsed = parseInstagramWebhook({
      object: 'instagram',
      entry: [{
        id: '17841400000000001',
        changes: [{
          field: 'comments',
          value: { id: 'c-1', text: 'SNARAI god2f7wy', from: { id: 'u-1' }, media: { id: 'm-1' } },
        }],
      }],
    });

    expect(parsed.igUserId).toBe('17841400000000001');
    expect(parsed.events).toEqual([{
      kind: 'comment',
      externalId: 'c-1',
      senderId: 'u-1',
      text: 'SNARAI god2f7wy',
      mediaId: 'm-1',
    }]);
  });

  it('extrae un DM e ignora los ecos del propio negocio', () => {
    const parsed = parseInstagramWebhook({
      entry: [{
        id: '17841400000000001',
        changes: [
          { field: 'messages', value: { sender: { id: 'u-2' }, message: { mid: 'mid.2', text: 'SNARAI' } } },
          { field: 'messages', value: { sender: { id: 'u-2' }, message: { mid: 'mid.3', text: 'eco', is_echo: true } } },
        ],
      }],
    });

    expect(parsed.events).toHaveLength(1);
    expect(parsed.events[0]).toMatchObject({ kind: 'message', externalId: 'mid.2', senderId: 'u-2' });
  });

  it('devuelve cero eventos si el campo no es accionable', () => {
    const parsed = parseInstagramWebhook({
      entry: [{ id: '1', changes: [{ field: 'story_insights', value: { id: 'x' } }] }],
    });
    expect(parsed.events).toHaveLength(0);
  });

  it('no revienta con payloads vacíos', () => {
    expect(parseInstagramWebhook({}).events).toHaveLength(0);
    expect(parseInstagramWebhook(null).igUserId).toBeNull();
  });
});

// ─── Texto del DM ───────────────────────────────────────────────────────────

describe('buildDmText', () => {
  it('arma el enlace wa.me con la keyword y el código de atribución', () => {
    const text = buildDmText({
      projectTitle: "S'Narai",
      whatsappNumber: '+1 (833) 652-9213',
      keyword: 'SNARAI',
      code: 'god2f7wy',
    });

    expect(text).toContain('https://wa.me/18336529213?text=SNARAI%20god2f7wy');
    expect(text).toContain("S'Narai");
  });

  it('sin código no deja espacio suelto en el texto precargado', () => {
    const text = buildDmText({
      projectTitle: "S'Narai",
      whatsappNumber: '18336529213',
      keyword: 'SNARAI',
      code: null,
    });
    expect(text).toContain('?text=SNARAI');
    expect(text).not.toContain('SNARAI+');
    expect(text).not.toContain('%20');
  });
});

// ─── Verificación GET ───────────────────────────────────────────────────────

describe('verifyInstagramChallenge', () => {
  it('acepta el token global y el token propio del tenant', () => {
    expect(verifyInstagramChallenge('verify-global')).toBe(true);
    expect(verifyInstagramChallenge('verify-snarai')).toBe(true);
  });

  it('rechaza tokens ajenos y vacíos', () => {
    expect(verifyInstagramChallenge('otro')).toBe(false);
    expect(verifyInstagramChallenge('')).toBe(false);
    expect(verifyInstagramChallenge(null)).toBe(false);
  });

  it('rechaza todo si no hay token configurado', () => {
    delete process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;
    delete process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN_SNARAI;
    expect(verifyInstagramChallenge('verify-global')).toBe(false);
  });

  it('acepta el verify token de la app de Meta si no hay uno específico', () => {
    delete process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;
    process.env.META_WEBHOOK_VERIFY_TOKEN = 'verify-meta';
    expect(verifyInstagramChallenge('verify-meta')).toBe(true);
    expect(verifyInstagramChallenge('verify-snarai')).toBe(true);
  });
});

// ─── Identidad ──────────────────────────────────────────────────────────────

describe('resolveInstagramIdentity', () => {
  it('resuelve el tenant por la config del proyecto y devuelve su secreto', async () => {
    const identity = await resolveInstagramIdentity('17841400000000001');
    expect(identity).toMatchObject({
      tenantSlug: 'snarai',
      canonicalOrgId: '9079ecf5-2162-4078-bddf-66b607e2d32f',
      apiBase: 'https://graph.instagram.com/v21.0',
      appSecret: 'secreto-snarai',
      secretSource: 'META_APP_SECRET_SNARAI',
      isPlatform: false,
    });
  });

  it('resuelve por integración conectada en el portal', async () => {
    delete process.env.META_IG_USER_ID_SNARAI;
    PROJECT_ROWS[0].extraConfig.community.igUserId = '';
    integrationRows = [{ tenantId: '9079ecf5-2162-4078-bddf-66b607e2d32f', metadata: { igUserId: '17841499999999999' } }];

    const identity = await resolveInstagramIdentity('17841499999999999');
    expect(identity?.tenantSlug).toBe('snarai');

    PROJECT_ROWS[0].extraConfig.community.igUserId = '17841400000000001';
  });

  it('reconoce la cuenta de plataforma', async () => {
    process.env.META_IG_USER_ID = '17900000000000000';
    const identity = await resolveInstagramIdentity('17900000000000000');
    expect(identity).toMatchObject({ tenantSlug: 'pandoras', isPlatform: true, secretSource: 'META_APP_SECRET' });
  });

  it('devuelve null para una cuenta sin dueño (no se inventa tenant)', async () => {
    expect(await resolveInstagramIdentity('123456')).toBeNull();
    expect(await resolveInstagramIdentity('')).toBeNull();
  });

  it('usa el Instagram app secret propio cuando existe', async () => {
    process.env.META_IG_APP_SECRET_SNARAI = 'secreto-instagram';
    const identity = await resolveInstagramIdentity('17841400000000001');
    expect(identity).toMatchObject({
      appSecret: 'secreto-instagram',
      secretSource: 'META_IG_APP_SECRET_SNARAI',
    });
    delete process.env.META_IG_APP_SECRET_SNARAI;
  });

  it('no usa el secreto global para un tenant', async () => {
    delete process.env.META_APP_SECRET_SNARAI;
    process.env.META_APP_SECRET = 'secreto-plataforma';
    const identity = await resolveInstagramIdentity('17841400000000001');
    expect(identity?.appSecret).toBe('');
  });
});

describe('resolveCommunityWhatsAppNumber', () => {
  it('toma el número del tenant, no de un valor por defecto', async () => {
    expect(await resolveCommunityWhatsAppNumber('snarai')).toBe('18336529213');
  });

  it('devuelve null si el tenant no tiene número', async () => {
    expect(await resolveCommunityWhatsAppNumber('pandoras')).toBeNull();
  });
});

// ─── Procesamiento ──────────────────────────────────────────────────────────

const IDENTITY: InstagramIdentity = {
  igUserId: '17841400000000001',
  tenantSlug: 'snarai',
  canonicalOrgId: '9079ecf5-2162-4078-bddf-66b607e2d32f',
  apiBase: 'https://graph.instagram.com/v21.0',
  appSecret: 'secreto-snarai',
  secretSource: 'META_APP_SECRET_SNARAI',
  isPlatform: false,
};

const COMMENT = {
  kind: 'comment' as const,
  externalId: 'c-100',
  senderId: 'u-100',
  text: 'SNARAI god2f7wy',
  mediaId: 'm-1',
};

describe('handleInstagramEvent', () => {
  it('no responde si el comentario no trae la palabra clave', async () => {
    const outcome = await handleInstagramEvent({
      identity: IDENTITY,
      event: { ...COMMENT, text: 'qué bonito edificio' },
    });

    expect(outcome).toBe('SKIPPED_NO_KEYWORD');
    expect(fetch).not.toHaveBeenCalled();
    expect(claimed.size).toBe(0);
  });

  it('responde en privado al comentario con el puente de WhatsApp', async () => {
    const outcome = await handleInstagramEvent({ identity: IDENTITY, event: COMMENT });
    expect(outcome).toBe('SENT');

    const [url, init] = (fetch as any).mock.calls[0];
    expect(url).toBe('https://graph.instagram.com/v21.0/17841400000000001/messages');
    expect(init.headers.Authorization).toBe('Bearer token-snarai');

    const payload = JSON.parse(init.body);
    expect(payload.recipient).toEqual({ comment_id: 'c-100' });
    expect(payload.message.text).toContain('wa.me/18336529213');
    expect(payload.message.text).toContain('SNARAI%20god2f7wy');
    expect(updates.at(-1)?.set.status).toBe('SENT');
  });

  it('un reintento del webhook no envía un segundo DM', async () => {
    const first = await handleInstagramEvent({ identity: IDENTITY, event: COMMENT });
    const second = await handleInstagramEvent({ identity: IDENTITY, event: COMMENT });

    expect(first).toBe('SENT');
    expect(second).toBe('DUPLICATE');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('usa el DM al remitente cuando el evento es un mensaje', async () => {
    const outcome = await handleInstagramEvent({
      identity: IDENTITY,
      event: { kind: 'message', externalId: 'mid.9', senderId: 'u-9', text: 'SNARAI' },
    });

    expect(outcome).toBe('SENT');
    const payload = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(payload.recipient).toEqual({ id: 'u-9' });
  });

  it('usa el host configurado por el tenant (Facebook Login)', async () => {
    PROJECT_ROWS[0].extraConfig.community.igApiBase = 'https://graph.facebook.com/v21.0';

    const identity = await resolveInstagramIdentity('17841400000000001');
    expect(identity?.apiBase).toBe('https://graph.facebook.com/v21.0');

    const outcome = await handleInstagramEvent({
      identity: identity!,
      event: { ...COMMENT, externalId: 'c-fb' },
    });
    expect(outcome).toBe('SENT');
    expect((fetch as any).mock.calls[0][0])
      .toBe('https://graph.facebook.com/v21.0/17841400000000001/messages');

    delete PROJECT_ROWS[0].extraConfig.community.igApiBase;
  });

  it('no inventa credenciales: sin token no envía y lo registra', async () => {
    delete process.env.META_IG_ACCESS_TOKEN_SNARAI;
    const outcome = await handleInstagramEvent({ identity: IDENTITY, event: COMMENT });

    expect(outcome).toBe('SKIPPED_NO_CREDENTIALS');
    expect(fetch).not.toHaveBeenCalled();
    expect(updates.at(-1)?.set.status).toBe('SKIPPED_NO_CREDENTIALS');
    expect(String(updates.at(-1)?.set.detail)).toContain('META_IG_ACCESS_TOKEN_SNARAI');
  });

  it('no inventa el número de WhatsApp del tenant', async () => {
    PROJECT_ROWS[0].extraConfig.community.whatsappNumber = '';
    const outcome = await handleInstagramEvent({ identity: IDENTITY, event: COMMENT });

    expect(outcome).toBe('SKIPPED_NO_CREDENTIALS');
    expect(fetch).not.toHaveBeenCalled();
    expect(String(updates.at(-1)?.set.detail)).toContain('sin número de WhatsApp');

    PROJECT_ROWS[0].extraConfig.community.whatsappNumber = '+1 833 652-9213';
  });

  it('marca FAILED si Meta rechaza el envío', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"error":"rate limit"}', { status: 429 })));

    const outcome = await handleInstagramEvent({ identity: IDENTITY, event: COMMENT });
    expect(outcome).toBe('FAILED');
    expect(String(updates.at(-1)?.set.detail)).toContain('429');
    expect(updates.at(-1)?.set.status).toBe('FAILED');
  });
});
