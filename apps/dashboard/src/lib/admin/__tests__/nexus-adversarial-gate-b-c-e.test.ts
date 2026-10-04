/**
 * 🛡️ NEXUS ADVERSARIAL CERTIFICATION — Gate B, Gate C, Gate E
 *
 * Certifica los aislamientos pendientes del NEXUS_SUPERCHARGE_PLAN.md:
 *
 * Gate B — Cross-Tenant Denial:
 *   [B-1] Deal A → Deal B (DENY): Actor autenticado no puede leer/escribir en Deal ajeno
 *   [B-2] TMA A → action B (DENY): Actor TMA no puede operar sobre recursos de otro tenant
 *
 * Gate C — Hermes Cognitive Interface:
 *   [C-1] Hermes ≠ Authority: El init de Hermes contextual requiere sesión + canonicalOrgId
 *   [C-2] Hermes PROPOSE_ONLY: La policy devuelta es siempre PROPOSE_ONLY, nunca EXECUTE
 *   [C-3] Hermes ≠ Tenant Escalation: canonicalOrgId en la policy viene del servidor, no del cliente
 *
 * Gate E — TMA (Misma Cadena de Ejecución):
 *   [E-1] TMA auth → Canonical Identity (authCtx.canonicalOrgId requerido)
 *   [E-2] TMA Tasks: Scoped estrictamente a canonicalOrgId de la sesión
 *   [E-3] TMA sin auth → 401 fail-closed
 *
 * Contratos: FC-004 (Hermes), FC-003 (Authorization), FC-006 (Resource Scope)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks de infraestructura ─────────────────────────────────────────────────
vi.mock('@saasfly/db', () => ({
  db: {
    query: {
      nexusDealRooms: { findFirst: vi.fn() },
      nexusDealComments: { findMany: vi.fn() },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{ id: 'comment-1' }]),
      })),
    })),
    select: vi.fn(),
  },
}));

vi.mock('@saasfly/db/schema', () => ({
  nexusDealComments: {},
  nexusDealRooms: {},
  nexusDealSigners: {},
  nexusTasks: {},
  nexusCollaborators: {},
}));

vi.mock('@saasfly/db-core', () => ({
  eq: vi.fn((a, b) => ({ field: a, value: b })),
  and: vi.fn((...args: any[]) => args),
  or: vi.fn((...args: any[]) => args),
  isNull: vi.fn((a: any) => a),
  desc: vi.fn((a: any) => a),
}));

vi.mock('@saasfly/shared', () => ({
  resend: { emails: { send: vi.fn().mockResolvedValue({ id: 'email-1' }) } },
  getNexusAuthContext: vi.fn(),
}));

vi.mock('@saasfly/nexus-deals-sdk', () => ({
  canUserAccessDeal: vi.fn(),
}));

vi.mock('@/emails/NexusDealComment', () => ({
  default: vi.fn(() => null),
}));

vi.mock('@/lib/admin-auth', () => ({
  validateDealRoomAccess: vi.fn(),
}));

import { db } from '@saasfly/db';
import { getNexusAuthContext } from '@saasfly/shared';
import { canUserAccessDeal } from '@saasfly/nexus-deals-sdk';
import { validateDealRoomAccess } from '@/lib/admin-auth';

const ROOM_TENANT_A = {
  id: 'room-tenant-a-uuid',
  createdBy: 'admin@tenant-a.com',
  sharedWith: [{ email: 'collab@tenant-a.com', sharedAt: '', sharedBy: '' }],
  signers: [],
  company: 'Tenant A Corp',
  counterparty: 'Partner',
  publicId: 'pub-a-123',
};

// ─── Gate B-1: Deal Cross-Access ─────────────────────────────────────────────
describe('🛡️ Gate B-1 — Deal A → Deal B (DENY)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('B1-01: GET sin auth → 401 fail-closed', async () => {
    vi.mocked(validateDealRoomAccess).mockResolvedValue({
      errorResponse: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }) as any,
    });

    const { GET } = await import('@/app/api/v1/nexus/deals/[roomId]/comments/route');
    const req = new NextRequest('http://localhost/api/v1/nexus/deals/room-b-uuid/comments');
    const res = await GET(req, { params: Promise.resolve({ roomId: 'room-b-uuid' }) });

    expect(res.status).toBe(401);
    expect(canUserAccessDeal).not.toHaveBeenCalled();
  });

  it('B1-02: GET autenticado pero Deal ajeno → 404 (resource hidden, no info leak)', async () => {
    vi.mocked(validateDealRoomAccess).mockResolvedValue({
      session: {
        userId: 'actor@tenant-b.com',
        address: '0xTenantBAddr',
        email: 'actor@tenant-b.com',
        isVerified: true,
        role: 'ADMIN',
      },
    });
    (db.query.nexusDealRooms.findFirst as any).mockResolvedValue(ROOM_TENANT_A);
    vi.mocked(canUserAccessDeal).mockReturnValue(false);

    const { GET } = await import('@/app/api/v1/nexus/deals/[roomId]/comments/route');
    const req = new NextRequest('http://localhost/api/v1/nexus/deals/room-tenant-a-uuid/comments');
    const res = await GET(req, { params: Promise.resolve({ roomId: 'room-tenant-a-uuid' }) });

    expect(res.status).toBe(404);
    // canUserAccessDeal fue llamado — la verificación ocurrió
    expect(canUserAccessDeal).toHaveBeenCalled();
  });

  it('B1-03: GET Deal propio → 200 (acceso legítimo)', async () => {
    vi.mocked(validateDealRoomAccess).mockResolvedValue({
      session: {
        userId: 'admin@tenant-a.com',
        address: '0xTenantAAddr',
        email: 'admin@tenant-a.com',
        isVerified: true,
        role: 'ADMIN',
      },
    });
    (db.query.nexusDealRooms.findFirst as any).mockResolvedValue(ROOM_TENANT_A);
    vi.mocked(canUserAccessDeal).mockReturnValue(true);
    (db.query.nexusDealComments.findMany as any).mockResolvedValue([]);

    const { GET } = await import('@/app/api/v1/nexus/deals/[roomId]/comments/route');
    const req = new NextRequest('http://localhost/api/v1/nexus/deals/room-tenant-a-uuid/comments');
    const res = await GET(req, { params: Promise.resolve({ roomId: 'room-tenant-a-uuid' }) });

    expect(res.status).toBe(200);
    expect(canUserAccessDeal).toHaveBeenCalled();
  });

  it('B1-04: POST — actor no-autorizado intenta escribir en Deal ajeno → 404 + db.insert NO llamado', async () => {
    vi.mocked(validateDealRoomAccess).mockResolvedValue({
      session: {
        userId: 'attacker@tenant-b.com',
        address: '0xAttacker',
        email: 'attacker@tenant-b.com',
        isVerified: true,
        role: 'OPERATOR',
      },
    });
    (db.query.nexusDealRooms.findFirst as any).mockResolvedValue(ROOM_TENANT_A);
    vi.mocked(canUserAccessDeal).mockReturnValue(false);

    const { POST } = await import('@/app/api/v1/nexus/deals/[roomId]/comments/route');
    const req = new NextRequest('http://localhost/api/v1/nexus/deals/room-tenant-a-uuid/comments', {
      method: 'POST',
      body: JSON.stringify({ author: 'attacker@tenant-b.com', content: 'Cross-deal injection' }),
    });
    const res = await POST(req, { params: Promise.resolve({ roomId: 'room-tenant-a-uuid' }) });

    expect(res.status).toBe(404);
    // CRÍTICO: no debe haberse insertado nada
    expect(db.insert).not.toHaveBeenCalled();
  });
});

// ─── Gate C: Hermes ≠ Authority ───────────────────────────────────────────────
describe('🛡️ Gate C — Hermes PROPOSE_ONLY invariant (FC-004)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('C-01: Sin sesión → 401 (Hermes no puede inicializarse sin identidad canónica)', async () => {
    vi.mocked(getNexusAuthContext).mockResolvedValue({
      isAuthenticated: false,
      canonicalOrgId: null,
    } as any);

    const { POST } = await import('@/app/api/v1/nexus/hermes/contextual/init/route');
    const req = new NextRequest('http://localhost/api/v1/nexus/hermes/contextual/init', {
      method: 'POST',
      body: JSON.stringify({ attentionItemId: 'item-123' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('C-02: Policy devuelta es SIEMPRE PROPOSE_ONLY, nunca EXECUTE', async () => {
    vi.mocked(getNexusAuthContext).mockResolvedValue({
      isAuthenticated: true,
      canonicalOrgId: 'snarai',
      collaboratorId: 42,
      role: 'MANAGER',
    } as any);

    const { POST } = await import('@/app/api/v1/nexus/hermes/contextual/init/route');
    const req = new NextRequest('http://localhost/api/v1/nexus/hermes/contextual/init', {
      method: 'POST',
      body: JSON.stringify({ attentionItemId: 'task-audit-001' }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.policy.actionStatus).toBe('PROPOSE_ONLY');
    expect(body.policy.actionStatus).not.toBe('EXECUTE');
    expect(body.policy.actionStatus).not.toBe('APPROVE');
  });

  it('C-03: canonicalOrgId en policy viene del SERVIDOR, cliente no puede escalarlo', async () => {
    vi.mocked(getNexusAuthContext).mockResolvedValue({
      isAuthenticated: true,
      canonicalOrgId: 'snarai', // servidor resuelve snarai
      collaboratorId: 42,
      role: 'MANAGER',
    } as any);

    const { POST } = await import('@/app/api/v1/nexus/hermes/contextual/init/route');
    const req = new NextRequest('http://localhost/api/v1/nexus/hermes/contextual/init', {
      method: 'POST',
      // Cliente intenta escalar a otro org
      body: JSON.stringify({ attentionItemId: 'task-from-eld', canonicalOrgId: 'eld' }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.policy.canonicalOrgId).toBe('snarai');
    expect(body.policy.canonicalOrgId).not.toBe('eld');
  });

  it('C-04: attentionItemId faltante → 400 (contexto explícito obligatorio)', async () => {
    vi.mocked(getNexusAuthContext).mockResolvedValue({
      isAuthenticated: true,
      canonicalOrgId: 'snarai',
      collaboratorId: 42,
      role: 'MANAGER',
    } as any);

    const { POST } = await import('@/app/api/v1/nexus/hermes/contextual/init/route');
    const req = new NextRequest('http://localhost/api/v1/nexus/hermes/contextual/init', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});

// ─── Gate B-2 + Gate E: TMA Auth Chain ───────────────────────────────────────
describe('🛡️ Gate B-2 & Gate E — TMA auth → Canonical Identity (same execution chain)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('E-01: TMA Tasks GET sin auth → 401 fail-closed', async () => {
    vi.mocked(getNexusAuthContext).mockResolvedValue({
      isAuthenticated: false,
      canonicalOrgId: null,
      collaboratorId: null,
    } as any);

    const { GET } = await import('@/app/api/v1/tma/nexus/tasks/route');
    const req = new NextRequest('http://localhost/api/v1/tma/nexus/tasks');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('E-02: TMA Tasks GET — collaboratorId faltante → 401 (identidad incompleta, fail-closed)', async () => {
    vi.mocked(getNexusAuthContext).mockResolvedValue({
      isAuthenticated: true,
      canonicalOrgId: 'snarai',
      collaboratorId: null, // incompleto
      role: 'COLLABORATOR',
    } as any);

    const { GET } = await import('@/app/api/v1/tma/nexus/tasks/route');
    const req = new NextRequest('http://localhost/api/v1/tma/nexus/tasks');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('E-03: TMA Tasks POST — canonicalOrgId del body del cliente es IGNORADO (servidor resuelve de la sesión)', async () => {
    vi.mocked(getNexusAuthContext).mockResolvedValue({
      isAuthenticated: true,
      canonicalOrgId: 'snarai',
      collaboratorId: 42,
      role: 'COLLABORATOR',
    } as any);

    const insertedValues: any[] = [];
    (db as any).insert = vi.fn(() => ({
      values: (vals: any) => {
        insertedValues.push(vals);
        return { returning: vi.fn().mockResolvedValue([{ ...vals, id: 'new-task-1' }]) };
      },
    }));

    const { POST } = await import('@/app/api/v1/tma/nexus/tasks/route');
    const req = new NextRequest('http://localhost/api/v1/tma/nexus/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Injected Task',
        canonicalOrgId: 'eld', // cliente intenta escribir en otro tenant
      }),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    // CRÍTICO: el task debe insertarse con el canonicalOrgId de la SESIÓN
    expect(insertedValues[0].canonicalOrgId).toBe('snarai');
    expect(insertedValues[0].canonicalOrgId).not.toBe('eld');
  });
});
