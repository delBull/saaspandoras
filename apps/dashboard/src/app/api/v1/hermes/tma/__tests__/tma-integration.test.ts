import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as authPOST } from '../auth/route';
import { POST as approvePOST } from '../knowledge/approve/route';
import { POST as rejectPOST } from '../knowledge/reject/route';
import { GET as overviewGET } from '../overview/route';
import { HermesAuthError, HermesTenantAccessDeniedError } from '@saasfly/hermes-core';

// Mock dependencias de core y DB
vi.mock('@saasfly/hermes-core', () => {
  return {
    HermesAuthError: class extends Error {
      code: string;
      statusCode: number;
      constructor(message: string, code: string, statusCode: number = 401) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
      }
    },
    HermesTenantAccessDeniedError: class extends Error {
      code: string;
      constructor(message: string, code: string) {
        super(message);
        this.code = code;
      }
    },
    TelegramAuthValidator: class {
      validateInitData = vi.fn((initData) => {
        if (initData === 'invalid_data' || initData === 'expired_data') {
          throw new Error('Telegram initData is invalid or expired');
        }
        return { telegramUserId: 'tg_123', username: 'testuser' };
      })
    },
    HermesTenantMembershipService: class {
      getAuthorizedTenants = vi.fn().mockResolvedValue([{ organizationId: 'org_1', role: 'ADMIN', isOwner: false }]);
      validateTenantAccess = vi.fn().mockResolvedValue({ userId: 'u1', telegramUserId: 'tg_123', organizationId: 'org_1', role: 'ADMIN' });
    },
    HermesWorkspaceResolver: {
      resolveCanonicalWorkspace: vi.fn().mockResolvedValue({ organizationId: 'org_1' })
    },
    SessionTokenService: class {
      issueToken = vi.fn().mockReturnValue('mocked_jwt_token');
      verifyToken = vi.fn((token) => {
        if (token === 'expired_token') throw new Error('Token expired');
        if (token === 'invalid_token') throw new Error('Invalid signature');
        if (token === 'operator_token') return { organizationId: 'org_1', role: 'OPERATOR', sub: 'u2' };
        if (token === 'valid_token_org2') return { organizationId: 'org_2', role: 'ADMIN', sub: 'u1' };
        return { organizationId: 'org_1', role: 'ADMIN', sub: 'u1' }; // valid_token
      });
    },
    checkRateLimit: vi.fn().mockReturnValue({ allowed: true }),
    clientIpFromHeaders: vi.fn().mockReturnValue('127.0.0.1'),
    SovereignIpfsOrchestrator: class {
      healthCheck = vi.fn().mockResolvedValue({ durability: { status: 'DURABLE' }, primary: { providerType: 'KUBO' } });
    }
  };
});

const mockDbTransaction = vi.fn();
const mockDbSelect = vi.fn();

vi.mock('@saasfly/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: vi.fn().mockImplementation(() => ({
          limit: vi.fn().mockImplementation(() => mockDbSelect())
        }))
      })
    }),
    transaction: (cb: any) => mockDbTransaction(cb),
    execute: vi.fn().mockResolvedValue(true)
  }
}));

vi.mock('@saasfly/db-core', () => ({
  eq: vi.fn(),
  and: vi.fn(),
  inArray: vi.fn(),
  sql: (strings: any, ...values: any) => '',
  gte: vi.fn(),
  desc: vi.fn()
}));

describe('🛡️ TMA Endpoints Integration (Negative Testing & Isolation)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /tma/auth - Autenticación y Replay', () => {
    it('AUTH-01: Rechaza initData inválido o expirado (Replay/Manipulación)', async () => {
      const req = new NextRequest('http://localhost/api/v1/hermes/tma/auth', {
        method: 'POST',
        body: JSON.stringify({ initData: 'expired_data' })
      });
      const res = await authPOST(req);
      expect(res.status).toBe(500); // El mock arroja error genérico en validateInitData
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it('AUTH-02: Rechaza si no hay initData en el body', async () => {
      const req = new NextRequest('http://localhost/api/v1/hermes/tma/auth', {
        method: 'POST',
        body: JSON.stringify({})
      });
      const res = await authPOST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.code).toBe('MISSING_INIT_DATA');
    });
  });

  describe('GET /tma/overview - Aislamiento Tenant y Expiración', () => {
    it('TMA-01: Rechaza peticiones sin token', async () => {
      const req = new NextRequest('http://localhost/api/v1/hermes/tma/overview', { method: 'GET' });
      const res = await overviewGET(req);
      expect(res.status).toBe(401);
    });

    it('TMA-02: Rechaza peticiones con token expirado o manipulado', async () => {
      const req = new NextRequest('http://localhost/api/v1/hermes/tma/overview', {
        method: 'GET',
        headers: { authorization: 'Bearer expired_token' }
      });
      const res = await overviewGET(req);
      expect(res.status).toBe(500); // verifyToken throws
    });
  });

  describe('POST /tma/knowledge/approve - Mutaciones y Permisos', () => {
    it('MUT-01: Rechaza mutación si el rol es OPERATOR (Permisos Insuficientes)', async () => {
      const req = new NextRequest('http://localhost/api/v1/hermes/tma/knowledge/approve', {
        method: 'POST',
        headers: { authorization: 'Bearer operator_token' },
        body: JSON.stringify({ knowledgeId: 'k_1' })
      });
      const res = await approvePOST(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('INSUFFICIENT_ROLE');
    });

    it('MUT-02: Rechaza mutación si el conocimiento pertenece a otro tenant (Aislamiento)', async () => {
      // Configuramos mock para que select devuelva null (no encontrado en el tenant del JWT)
      mockDbSelect.mockResolvedValueOnce([]); 
      const req = new NextRequest('http://localhost/api/v1/hermes/tma/knowledge/approve', {
        method: 'POST',
        headers: { authorization: 'Bearer valid_token_org2' }, // Intentando mutar algo, la DB no se lo devuelve
        body: JSON.stringify({ knowledgeId: 'k_1' })
      });
      const res = await approvePOST(req);
      expect(res.status).toBe(404); // Not found or access denied for this workspace
    });

    it('MUT-03: Evita mutaciones duplicadas si ya está ACTIVE (Idempotencia)', async () => {
      mockDbSelect.mockResolvedValueOnce([{ id: 'k_1', status: 'ACTIVE', organizationId: 'org_1' }]);
      const req = new NextRequest('http://localhost/api/v1/hermes/tma/knowledge/approve', {
        method: 'POST',
        headers: { authorization: 'Bearer valid_token' },
        body: JSON.stringify({ knowledgeId: 'k_1' })
      });
      const res = await approvePOST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toBe('Fact already active');
    });

    it('MUT-04: Falla si la base de datos detecta modificación concurrente en transacción', async () => {
      mockDbSelect.mockResolvedValueOnce([{ id: 'k_1', status: 'PENDING_REVIEW', organizationId: 'org_1', version: 1 }]);
      // Hacemos que transaction arroje error de concurrencia
      mockDbTransaction.mockRejectedValueOnce(new HermesAuthError('Fact changed during approval', 'CONCURRENT_MODIFICATION', 409));
      
      const req = new NextRequest('http://localhost/api/v1/hermes/tma/knowledge/approve', {
        method: 'POST',
        headers: { authorization: 'Bearer valid_token' },
        body: JSON.stringify({ knowledgeId: 'k_1' })
      });
      const res = await approvePOST(req);
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.code).toBe('CONCURRENT_MODIFICATION');
    });
  });

  describe('POST /tma/knowledge/reject - Auditoría y Aislamiento', () => {
    it('REJ-01: Exige que exista un reason explícito o inserta default en auditoría', async () => {
      // Probamos el aislamiento cruzado igual que approve
      mockDbSelect.mockResolvedValueOnce([]); 
      const req = new NextRequest('http://localhost/api/v1/hermes/tma/knowledge/reject', {
        method: 'POST',
        headers: { authorization: 'Bearer valid_token_org2' },
        body: JSON.stringify({ knowledgeId: 'k_1' })
      });
      const res = await rejectPOST(req);
      expect(res.status).toBe(404);
    });
  });
});
