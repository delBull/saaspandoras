import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

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

vi.mock('@saasfly/shared', () => ({
  getNexusAuthContext: vi.fn(async () => mockAuthContext),
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
        if (data.whatsappPhone) {
          collaboratorInsertCalls.push(data);
        } else {
          userInsertCalls.push(data);
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
    const spammerIp = '198.51.100.99';
    mockAuthContext = {
      isAuthenticated: false,
      permissions: {},
    };

    // Fire 5 requests to exhaust the limit
    for (let i = 0; i < 5; i++) {
      const req = new NextRequest('http://localhost/api/nexus/collaborators/register', {
        method: 'POST',
        headers: { 'x-forwarded-for': spammerIp },
        body: JSON.stringify({
          address: '0x9999999999999999999999999999999999999999',
          name: 'Spammer',
          email: `spam_${i}@example.com`,
          whatsappPhone: '+5215551234567',
        }),
      });
      await POST(req);
    }

    // 6th request from the same IP must be rejected with 429 Too Many Requests
    const reqExceeded = new NextRequest('http://localhost/api/nexus/collaborators/register', {
      method: 'POST',
      headers: { 'x-forwarded-for': spammerIp },
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
  });
});
