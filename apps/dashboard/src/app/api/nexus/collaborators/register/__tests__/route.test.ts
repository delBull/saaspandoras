import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { getNexusAuthContext } from '@saasfly/shared';

let mockAuthContext: any = {
  isAuthenticated: true,
  role: null,
  wallet: '0x1111111111111111111111111111111111111111',
  email: null,
  provisionStatus: 'PENDING',
  permissions: { 'users.manage': false },
};

let mockExistingCollaborator: any = null;
let updateCalls: any[] = [];
let insertCalls: any[] = [];
let notifyCalls: any[] = [];

let mockRateLimiterAllowed = true;
let registerRateLimitCalls = 0;

vi.mock('@saasfly/shared', () => ({
  getNexusAuthContext: vi.fn(async () => mockAuthContext),
  getTrustedClientIp: vi.fn(() => '127.0.0.1'),
  registerRateLimiter: {
    isAllowed: vi.fn(async () => {
      registerRateLimitCalls++;
      return mockRateLimiterAllowed;
    }),
  },
}));

vi.mock('@/lib/nexus/provisioning', () => ({
  notifyProvisioningRequest: vi.fn(async (data: any) => {
    notifyCalls.push(data);
  }),
}));

let collaboratorInsertCalls: any[] = [];
let userInsertCalls: any[] = [];

vi.mock('@saasfly/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn((table: any) => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => (mockExistingCollaborator ? [mockExistingCollaborator] : [])),
        })),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn((data: any) => ({
        where: vi.fn(async () => {
          updateCalls.push(data);
          return [data];
        }),
      })),
    })),
    insert: vi.fn((table: any) => ({
      values: vi.fn((data: any) => {
        // `users` siempre lleva walletAddress; `nexusCollaborators` nunca lo lleva.
        // Discriminar por `whatsappPhone` era incorrecto: el teléfono es opcional.
        if (data.walletAddress) {
          userInsertCalls.push(data);
        } else {
          collaboratorInsertCalls.push(data);
        }
        return {
          onConflictDoNothing: vi.fn(async () => [data]),
          then: (resolve: any) => Promise.resolve([data]).then(resolve),
        };
      }),
    })),
  },
}));

vi.mock('@saasfly/db-core', () => ({
  eq: vi.fn((a: any, b: any) => ({ a, b })),
}));

import { POST } from '../route';

describe('🛡️ P0 Security Suite: /api/nexus/collaborators/register Adversarial Tests', () => {
  beforeEach(() => {
    mockAuthContext = {
      isAuthenticated: true,
      role: null,
      wallet: '0x1111111111111111111111111111111111111111',
      email: null,
      provisionStatus: 'PENDING',
      permissions: { 'users.manage': false },
    };
    mockExistingCollaborator = null;
    mockRateLimiterAllowed = true;
    registerRateLimitCalls = 0;
    updateCalls = [];
    insertCalls = [];
    collaboratorInsertCalls = [];
    userInsertCalls = [];
    notifyCalls = [];
    vi.clearAllMocks();
  });

  it('SEC-P0-01: Rejects unauthenticated caller immediately (fail-closed)', async () => {
    mockAuthContext = { isAuthenticated: false, permissions: {} };
    const req = new NextRequest('http://localhost/api/nexus/collaborators/register', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.1' },
      body: JSON.stringify({
        address: '0x1111111111111111111111111111111111111111',
        name: 'Attacker',
        email: 'attacker@example.com',
        whatsappPhone: '+5215551234567',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('SEC-P0-02: Adversarial check — A non-admin wallet CANNOT escalate to SUPER_ADMIN by declaring an admin email target', async () => {
    // Caller is a raw wallet with no verified email and no users.manage
    mockAuthContext = {
      isAuthenticated: true,
      role: null,
      wallet: '0x1111111111111111111111111111111111111111',
      email: null,
      provisionStatus: 'PENDING',
      permissions: { 'users.manage': false },
    };

    const req = new NextRequest('http://localhost/api/nexus/collaborators/register', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.2' },
      body: JSON.stringify({
        address: '0x1111111111111111111111111111111111111111',
        name: 'Attacker Impersonator',
        email: 'admin@pandoras.finance',
        whatsappPhone: '+5215551234567',
      }),
    });

    const res = await POST(req);
    // Must be rejected with 403 Forbidden
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('No autorizado');
    expect(insertCalls.length).toBe(0);
    expect(updateCalls.length).toBe(0);
  });

  it('SEC-P0-03: Adversarial check — A wallet without verified email CANNOT hijack an existing collaborator profile', async () => {
    // Target is an existing active collaborator profile
    mockExistingCollaborator = {
      id: 42,
      email: 'operator@pandoras.finance',
      name: 'Legit Operator',
      role: 'OPERATOR',
      status: 'ACTIVE',
      whatsappPhone: '+5219999999999',
    };

    // Caller is a disconnected wallet trying to overwrite operator@pandoras.finance
    mockAuthContext = {
      isAuthenticated: true,
      role: null,
      wallet: '0x2222222222222222222222222222222222222222',
      email: null, // No ownership proof
      provisionStatus: 'PENDING',
      permissions: { 'users.manage': false },
    };

    const req = new NextRequest('http://localhost/api/nexus/collaborators/register', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.3' },
      body: JSON.stringify({
        address: '0x2222222222222222222222222222222222222222',
        name: 'Hijacker',
        email: 'operator@pandoras.finance',
        whatsappPhone: '+5218888888888',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('validación previa mediante Magic Link');
    expect(updateCalls.length).toBe(0);
  });

  it('SEC-P0-04: Adversarial check — A user with verified email A cannot register on behalf of email B', async () => {
    mockAuthContext = {
      isAuthenticated: true,
      role: 'COLLABORATOR',
      wallet: '0x3333333333333333333333333333333333333333',
      email: 'alice@example.com',
      provisionStatus: 'ACTIVE',
      permissions: { 'users.manage': false },
    };

    const req = new NextRequest('http://localhost/api/nexus/collaborators/register', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.4' },
      body: JSON.stringify({
        address: '0x3333333333333333333333333333333333333333',
        name: 'Alice',
        email: 'bob@example.com', // Attempting to register Bob's email
        whatsappPhone: '+5215551234567',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('propio correo verificado');
    expect(insertCalls.length).toBe(0);
    expect(updateCalls.length).toBe(0);
  });

  it('SEC-P0-05: Legitimate new applicant is registered as COLLABORATOR with status PENDING', async () => {
    mockAuthContext = {
      isAuthenticated: true,
      role: null,
      wallet: '0x4444444444444444444444444444444444444444',
      email: null,
      provisionStatus: 'PENDING',
      permissions: { 'users.manage': false },
    };

    const req = new NextRequest('http://localhost/api/nexus/collaborators/register', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.5' },
      body: JSON.stringify({
        address: '0x4444444444444444444444444444444444444444',
        name: 'New Candidate',
        email: 'candidate@company.com',
        whatsappPhone: '+5215551234567',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(collaboratorInsertCalls.length).toBe(1);
    expect(collaboratorInsertCalls[0].role).toBe('COLLABORATOR');
    expect(collaboratorInsertCalls[0].status).toBe('PENDING'); // Strictly pending approval

    // 🛡️ P1: Token expiration must be bounded to 24 hours (not 365 days)
    const now = Date.now();
    const expiresAt = new Date(collaboratorInsertCalls[0].expiresAt).getTime();
    expect(expiresAt - now).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 5000);
    expect(expiresAt - now).toBeGreaterThan(23 * 60 * 60 * 1000);

    expect(notifyCalls.length).toBe(1);
  });

  it('SEC-P0-06: Privileged admin caller with users.manage can provision collaborators directly', async () => {
    mockAuthContext = {
      isAuthenticated: true,
      role: 'SUPER_ADMIN',
      wallet: '0x5555555555555555555555555555555555555555',
      email: 'admin@pandoras.finance',
      provisionStatus: 'ACTIVE',
      permissions: { 'users.manage': true },
    };

    const req = new NextRequest('http://localhost/api/nexus/collaborators/register', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.6' },
      body: JSON.stringify({
        address: '0x6666666666666666666666666666666666666666',
        name: 'Onboarded Team Member',
        email: 'member@company.com',
        whatsappPhone: '+5215551234567',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(collaboratorInsertCalls.length).toBe(1);
    expect(collaboratorInsertCalls[0].status).toBe('ACTIVE');
  });

  it('SEC-P1-07: Rate limiter restricts excess registration attempts (returns 429)', async () => {
    // When rate limiter rejects the attempt
    mockRateLimiterAllowed = false;

    const reqExceeded = new NextRequest('http://localhost/api/nexus/collaborators/register', {
      method: 'POST',
      headers: { 'x-forwarded-for': '198.51.100.99' },
      body: JSON.stringify({
        address: '0x9999999999999999999999999999999999999999',
        name: 'Spammer',
        email: 'spam_blocked@example.com',
        whatsappPhone: '+5215551234567',
      }),
    });

    const resBlocked = await POST(reqExceeded);
    expect(resBlocked.status).toBe(429);
    const body = await resBlocked.json();
    expect(body.error).toContain('Demasiadas solicitudes de registro');
    expect(registerRateLimitCalls).toBeGreaterThan(0);
  });

  it('REG-P1-08: Re-registro SIN teléfono conserva el número ya guardado (no lo borra)', async () => {
    mockAuthContext = {
      isAuthenticated: true,
      role: 'COLLABORATOR',
      wallet: '0x7777777777777777777777777777777777777777',
      email: 'operator@pandoras.finance',
      provisionStatus: 'PENDING',
      permissions: { 'users.manage': false },
    };
    mockExistingCollaborator = {
      id: 42,
      email: 'operator@pandoras.finance',
      name: 'Legit Operator',
      role: 'COLLABORATOR',
      status: 'PENDING',
      whatsappPhone: '+5219999999999',
      statusChangedAt: null,
    };

    const req = new NextRequest('http://localhost/api/nexus/collaborators/register', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.7' },
      body: JSON.stringify({ name: 'Legit Operator', email: 'operator@pandoras.finance' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    // El mock de `select` devuelve la misma fila para cualquier tabla, así que el
    // side-write de wallet→users también genera un update: filtramos por payload.
    const collaboratorUpdates = updateCalls.filter((call) => 'whatsappPhone' in call);
    expect(collaboratorUpdates.length).toBe(1);
    // El teléfono existente se preserva: ausencia en el payload ≠ borrar el dato.
    expect(collaboratorUpdates[0].whatsappPhone).toBe('+5219999999999');
  });

  it('REG-P1-09: Un colaborador nuevo sin teléfono guarda NULL, no un valor fabricado', async () => {
    mockAuthContext = {
      isAuthenticated: true,
      role: null,
      wallet: '0x8888888888888888888888888888888888888888',
      email: null,
      provisionStatus: 'PENDING',
      permissions: { 'users.manage': false },
    };

    const req = new NextRequest('http://localhost/api/nexus/collaborators/register', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.8' },
      body: JSON.stringify({ name: 'Sin Telefono', email: 'sin.telefono@company.com' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(collaboratorInsertCalls.length).toBe(1);
    expect(collaboratorInsertCalls[0].whatsappPhone).toBeNull();
  });

  it('REG-P1-10: 10 dígitos nacionales se normalizan a +52 y se declara la suposición', async () => {
    mockAuthContext = {
      isAuthenticated: true,
      role: null,
      wallet: '0x9999999999999999999999999999999999999999',
      email: null,
      provisionStatus: 'PENDING',
      permissions: { 'users.manage': false },
    };

    const req = new NextRequest('http://localhost/api/nexus/collaborators/register', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.9' },
      body: JSON.stringify({
        name: 'Nacional MX',
        email: 'mx@company.com',
        whatsappPhone: '3324158568',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(collaboratorInsertCalls[0].whatsappPhone).toBe('+523324158568');
  });

  it('REG-P1-11: Un número con código de país explícito NO se reescribe como +52', async () => {
    mockAuthContext = {
      isAuthenticated: true,
      role: null,
      wallet: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      email: null,
      provisionStatus: 'PENDING',
      permissions: { 'users.manage': false },
    };

    const req = new NextRequest('http://localhost/api/nexus/collaborators/register', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.10' },
      body: JSON.stringify({
        name: 'US Operator',
        email: 'us@company.com',
        whatsappPhone: '+1 415 555 1234',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(collaboratorInsertCalls[0].whatsappPhone).toBe('+14155551234');
  });

  it('REG-P1-12: Dígitos sin código de país se rechazan como ambiguos (nunca se adivina el país)', async () => {
    mockAuthContext = {
      isAuthenticated: true,
      role: null,
      wallet: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      email: null,
      provisionStatus: 'PENDING',
      permissions: { 'users.manage': false },
    };

    const req = new NextRequest('http://localhost/api/nexus/collaborators/register', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.11' },
      body: JSON.stringify({
        name: 'Ambigue',
        email: 'ambiguous@company.com',
        whatsappPhone: '14155551234',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toContain('código de país');
    expect(collaboratorInsertCalls.length).toBe(0);
    expect(updateCalls.length).toBe(0);
  });

  it('REG-P1-14: El borrado explícito del teléfono SÍ elimina el número guardado', async () => {
    mockAuthContext = {
      isAuthenticated: true,
      role: 'COLLABORATOR',
      wallet: '0xcccccccccccccccccccccccccccccccccccccccc',
      email: 'operator@pandoras.finance',
      provisionStatus: 'PENDING',
      permissions: { 'users.manage': false },
    };
    mockExistingCollaborator = {
      id: 43,
      email: 'operator@pandoras.finance',
      name: 'Legit Operator',
      role: 'COLLABORATOR',
      status: 'PENDING',
      whatsappPhone: '+5219999999999',
      statusChangedAt: null,
    };

    const req = new NextRequest('http://localhost/api/nexus/collaborators/register', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.13' },
      body: JSON.stringify({
        name: 'Legit Operator',
        email: 'operator@pandoras.finance',
        whatsappPhone: null,
        clearWhatsappPhone: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const collaboratorUpdates = updateCalls.filter((call) => 'whatsappPhone' in call);
    expect(collaboratorUpdates.length).toBe(1);
    expect(collaboratorUpdates[0].whatsappPhone).toBeNull();
  });

  it('REG-P1-13: El token viaja por header y el response NO lo refleja en el body', async () => {
    mockAuthContext = {
      isAuthenticated: true,
      role: 'COLLABORATOR',
      wallet: null,
      email: 'token@company.com',
      provisionStatus: 'PENDING',
      permissions: { 'users.manage': false },
    };

    const req = new NextRequest('http://localhost/api/nexus/collaborators/register', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.12', 'x-nexus-token': 'tok_header_123' },
      body: JSON.stringify({ name: 'Token User', email: 'token@company.com' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(vi.mocked(getNexusAuthContext)).toHaveBeenCalledWith(null, 'tok_header_123');
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.token).toBeUndefined();
  });
});
