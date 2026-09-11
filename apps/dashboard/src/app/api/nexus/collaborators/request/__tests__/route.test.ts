import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

let mockExistingCollaborator: any = null;
let mockIsNexusAdminEmail = false;
let mockRequireNexusAdmin = false;
let createOrUpdateCalls: any[] = [];
let notifyProvisioningCalls: any[] = [];
let sendMagicLinkCalls: any[] = [];

vi.mock('@/lib/nexus/collaborators-service', () => ({
  getCollaboratorByEmail: vi.fn(async (email: string) => mockExistingCollaborator),
  isNexusAdminEmail: vi.fn((email: string) => mockIsNexusAdminEmail),
  requireNexusAdmin: vi.fn(async (req: any) => mockRequireNexusAdmin),
  createOrUpdateCollaborator: vi.fn(async (name: string, email: string, role: string, permissions: any, whatsappPhone?: string) => {
    createOrUpdateCalls.push({ name, email, role, permissions, whatsappPhone });
    return {
      collaborator: {
        id: 1,
        name,
        email,
        role,
        permissions,
        whatsappPhone,
        status: mockExistingCollaborator ? mockExistingCollaborator.status : 'PENDING',
        expiresAt: new Date(Date.now() + 86400000),
      },
      magicLink: 'https://nexus.pandoras.finance/nexus?token=mock_test_token',
    };
  }),
  sendCollaboratorMagicLink: vi.fn(async (name: string, email: string, magicLink: string) => {
    sendMagicLinkCalls.push({ name, email, magicLink });
    return { ok: true };
  }),
}));

vi.mock('@/lib/nexus/provisioning', () => ({
  notifyProvisioningRequest: vi.fn(async (info: any) => {
    notifyProvisioningCalls.push(info);
  }),
}));

import { POST } from '../route';

describe('📧 Nexus Collaborators Request Route (/api/nexus/collaborators/request)', () => {
  beforeEach(() => {
    mockExistingCollaborator = null;
    mockIsNexusAdminEmail = false;
    mockRequireNexusAdmin = false;
    createOrUpdateCalls = [];
    notifyProvisioningCalls = [];
    sendMagicLinkCalls = [];
    vi.clearAllMocks();
  });

  it('REQ-01: Returns 400 when email is missing', async () => {
    const req = new NextRequest('http://localhost/api/nexus/collaborators/request', {
      method: 'POST',
      body: JSON.stringify({ whatsappPhone: '+5215551234567' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Email is required');
  });

  it('REQ-02: Allows email-only magic link requests gracefully without requiring whatsappPhone', async () => {
    mockExistingCollaborator = null;
    mockIsNexusAdminEmail = false;

    const req = new NextRequest('http://localhost/api/nexus/collaborators/request', {
      method: 'POST',
      body: JSON.stringify({ email: 'new_operator@pandoras.finance' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(createOrUpdateCalls.length).toBe(1);
    expect(sendMagicLinkCalls.length).toBe(1);
  });

  it('REQ-03: Allows existing collaborator with stored whatsapp to request magic link without re-entering phone', async () => {
    mockExistingCollaborator = {
      id: 42,
      name: 'Existing Operator',
      email: 'escuelalibredigital@proton.me',
      role: 'COLLABORATOR',
      whatsappPhone: '+5215559876543',
      status: 'ACTIVE',
    };

    const req = new NextRequest('http://localhost/api/nexus/collaborators/request', {
      method: 'POST',
      body: JSON.stringify({ email: 'escuelalibredigital@proton.me' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(createOrUpdateCalls.length).toBe(1);
    expect(createOrUpdateCalls[0].whatsappPhone).toBe('+5215559876543');
    expect(sendMagicLinkCalls.length).toBe(1);
  });

  it('REQ-04: Successfully processes registration when new user provides both email and whatsappPhone', async () => {
    mockExistingCollaborator = null;

    const req = new NextRequest('http://localhost/api/nexus/collaborators/request', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Collaborator',
        email: 'collaborator@external.com',
        whatsappPhone: '+5215551122334',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(createOrUpdateCalls.length).toBe(1);
    expect(createOrUpdateCalls[0].whatsappPhone).toBe('+5215551122334');
    expect(notifyProvisioningCalls.length).toBe(1);
    expect(notifyProvisioningCalls[0].email).toBe('collaborator@external.com');
  });

  it('REQ-05: Non-admin caller cannot escalate privileges to ADMIN or SUPER_ADMIN', async () => {
    mockRequireNexusAdmin = false;
    mockExistingCollaborator = null;

    const req = new NextRequest('http://localhost/api/nexus/collaborators/request', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Attacker',
        email: 'attacker@example.com',
        whatsappPhone: '+5215559998888',
        role: 'SUPER_ADMIN',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(createOrUpdateCalls[0].role).toBe('COLLABORATOR');
  });
});
