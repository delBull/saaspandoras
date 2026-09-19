/**
 * 🛡️ Nexus Broadcasts & Central Notification Security Suite (Non-Circular)
 * apps/dashboard/src/app/api/nexus/__tests__/nexus-broadcasts.test.ts
 *
 * Verifies true server-enforced security boundaries:
 * 1. Anti-Spoofing: Client cannot escalate privileges by passing authorRole/authorEmail in body.
 * 2. RBAC Fail-Closed: Unauthenticated or non-admin (VIEWER) tokens are rejected with 403.
 * 3. Anti-Exfiltration: GET ?all=true is strictly forbidden (403) to non-admins.
 * 4. Server Identity Binding: Author fields are strictly derived from verified session/token.
 * 5. Input Validation: Missing fields -> 400, Invalid UUID -> 400 (never 500).
 * 6. Server-Bound Feed: Query parameters cannot be used to spoof identity for targeted broadcasts.
 * 7. WhatsApp Length Guard: Payloads > 3000 chars are protected against Cloud API truncation.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST, PATCH } from '../broadcasts/route';
import { formatBroadcastWhatsAppMessage } from '@/lib/nexus/broadcast-formatter';
import { db } from '@/db';
import { nexusCollaborators, nexusBroadcasts } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

const TEST_ADMIN_TOKEN = 'test_token_super_admin_sec_999';
const TEST_VIEWER_TOKEN = 'test_token_viewer_sec_111';
const TEST_ADMIN_EMAIL = 'verified.superadmin@pandoras.finance';
const TEST_VIEWER_EMAIL = 'unauthorized.viewer@pandoras.finance';

describe('🛡️ Nexus Broadcasts Security & Non-Circular Authorization Suite', () => {
  let createdBroadcastId: string;

  beforeAll(async () => {
    // Clean up any stale test collaborators
    await db.delete(nexusCollaborators).where(
      inArray(nexusCollaborators.email, [TEST_ADMIN_EMAIL, TEST_VIEWER_EMAIL])
    );

    const futureExpiration = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // 1. Seed Verified SUPER_ADMIN Collaborator with Token
    await db.insert(nexusCollaborators).values({
      name: 'Verified Admin Operator',
      email: TEST_ADMIN_EMAIL,
      role: 'SUPER_ADMIN',
      token: TEST_ADMIN_TOKEN,
      status: 'ACTIVE',
      expiresAt: futureExpiration,
    });

    // 2. Seed Non-Admin VIEWER Collaborator with Token
    await db.insert(nexusCollaborators).values({
      name: 'Unauthorized Viewer',
      email: TEST_VIEWER_EMAIL,
      role: 'VIEWER',
      token: TEST_VIEWER_TOKEN,
      status: 'ACTIVE',
      expiresAt: futureExpiration,
    });
  });

  afterAll(async () => {
    // Cleanup seeded collaborators
    await db.delete(nexusCollaborators).where(
      inArray(nexusCollaborators.email, [TEST_ADMIN_EMAIL, TEST_VIEWER_EMAIL])
    );
    // Cleanup created test broadcasts
    if (createdBroadcastId) {
      await db.delete(nexusBroadcasts).where(eq(nexusBroadcasts.id, createdBroadcastId));
    }
  });

  // ── TEST 1: REJECTS CLIENT BODY SPOOFING (FAIL-CLOSED) ─────────────────
  it('SEC-01: Rejects broadcast publish when client passes authorRole in body without auth headers', async () => {
    const req = new NextRequest('http://localhost:3000/api/nexus/broadcasts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Attacker Broadcast',
        content: 'Should be rejected immediately',
        authorRole: 'SUPER_ADMIN', // Spoofed client parameter
        authorEmail: 'marco@pandoras.finance',
        authorName: 'Fake Marco',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Unauthorized: Only authenticated SUPER_ADMIN and ADMIN');
  });

  // ── TEST 2: REJECTS NON-ADMIN COLLABORATOR TOKEN (VIEWER) ─────────────
  it('SEC-02: Rejects broadcast publish when authenticated as a VIEWER collaborator', async () => {
    const req = new NextRequest('http://localhost:3000/api/nexus/broadcasts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-nexus-token': TEST_VIEWER_TOKEN, // Valid token, but role is VIEWER
      },
      body: JSON.stringify({
        title: 'Viewer Attempt',
        content: 'Should not be allowed',
        authorRole: 'SUPER_ADMIN', // Attempting privilege escalation via body
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
  });

  // ── TEST 3: REJECTS UNAUTHENTICATED GET ?all=true (ANTI-EXFILTRATION) ──
  it('SEC-03: Rejects GET ?all=true without admin session to prevent data exfiltration', async () => {
    // 1. Without any token
    const unauthReq = new NextRequest('http://localhost:3000/api/nexus/broadcasts?all=true');
    const unauthRes = await GET(unauthReq);
    expect(unauthRes.status).toBe(403);

    // 2. With non-admin VIEWER token
    const viewerReq = new NextRequest('http://localhost:3000/api/nexus/broadcasts?all=true', {
      headers: { 'x-nexus-token': TEST_VIEWER_TOKEN },
    });
    const viewerRes = await GET(viewerReq);
    expect(viewerRes.status).toBe(403);
  });

  // ── TEST 4: PERMITS VERIFIED SUPER_ADMIN & ENFORCES SERVER IDENTITY ────
  it('SEC-04: Authorizes SUPER_ADMIN via token and binds server-derived identity to DB record', async () => {
    const req = new NextRequest('http://localhost:3000/api/nexus/broadcasts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-nexus-token': TEST_ADMIN_TOKEN, // Verified admin token
      },
      body: JSON.stringify({
        title: '🚀 Anuncio Oficial del Sistema',
        content: 'Detalles operativos importantes.\n\n👉 https://pandoras.finance',
        type: 'ANNOUNCEMENT',
        targetType: 'GLOBAL',
        authorRole: 'MALICIOUS_BODY_ROLE', // Malicious attempt to spoof role
        authorEmail: 'spoofed@evil.com',     // Malicious attempt to spoof email
        authorName: 'Injected Name',
        notifyWhatsApp: false,
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.broadcast).toBeDefined();

    createdBroadcastId = data.broadcast.id;

    // 🔥 SECURITY VERIFICATION: Body spoofing was rejected; identity is server-derived!
    expect(data.broadcast.authorRole).toBe('SUPER_ADMIN');
    expect(data.broadcast.authorEmail).toBe(TEST_ADMIN_EMAIL);
    expect(data.broadcast.authorName).toBe('Verified Admin Operator');
  });

  // ── TEST 5: VALIDATES MISSING REQUIRED FIELDS ─────────────────────────
  it('SEC-05: Rejects payloads with missing title or content with 400 Bad Request', async () => {
    const req = new NextRequest('http://localhost:3000/api/nexus/broadcasts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-nexus-token': TEST_ADMIN_TOKEN,
      },
      body: JSON.stringify({
        title: '',
        content: 'Missing title',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Title is required');
  });

  // ── TEST 6: AUTHORIZES ADMIN TO LIST ALL BROADCASTS ───────────────────
  it('SEC-06: Allows authenticated SUPER_ADMIN to query GET ?all=true', async () => {
    const req = new NextRequest('http://localhost:3000/api/nexus/broadcasts?all=true', {
      headers: { 'x-nexus-token': TEST_ADMIN_TOKEN },
    });

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.broadcasts)).toBe(true);
  });

  // ── TEST 7: REJECTS UNAUTHORIZED PATCH ─────────────────────────────────
  it('SEC-07: Rejects PATCH requests from unauthorized or non-admin callers', async () => {
    const req = new NextRequest('http://localhost:3000/api/nexus/broadcasts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: createdBroadcastId,
        isActive: false,
        authorRole: 'SUPER_ADMIN', // Spoof attempt
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(403);
  });

  // ── TEST 8: PATCH VALIDATES UUID FORMAT (PREVENTS 500 DB CRASHES) ──────
  it('SEC-08: PATCH returns 400 on invalid UUID format instead of database error 500', async () => {
    const req = new NextRequest('http://localhost:3000/api/nexus/broadcasts', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-nexus-token': TEST_ADMIN_TOKEN,
      },
      body: JSON.stringify({
        id: 'invalid-non-uuid-string',
        isActive: false,
      }),
    });

    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid UUID format');
  });

  // ── TEST 9: AUTHORIZED PATCH WITH VALID UUID ──────────────────────────
  it('SEC-09: Successfully archives a broadcast when called by authenticated admin with valid UUID', async () => {
    const req = new NextRequest('http://localhost:3000/api/nexus/broadcasts', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-nexus-token': TEST_ADMIN_TOKEN,
      },
      body: JSON.stringify({
        id: createdBroadcastId,
        isActive: false,
      }),
    });

    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.broadcast.isActive).toBe(false);
  });

  // ── TEST 10: SERVER-BOUND TARGET FEED (IGNORES CLIENT SPOOFING IN GET) ─
  it('SEC-10: GET feed delivers GLOBAL broadcasts and ignores spoofed email query params', async () => {
    // Calling GET without auth headers but with spoofed query param ?email=victim@pandoras.finance
    const req = new NextRequest('http://localhost:3000/api/nexus/broadcasts?email=victim@pandoras.finance&role=SUPER_ADMIN');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    // All returned broadcasts must strictly be GLOBAL because caller is unauthenticated
    for (const b of data.broadcasts) {
      expect(b.targetType).toBe('GLOBAL');
    }
  });

  // ── TEST 11: WHATSAPP LENGTH GUARD (PREVENTS CLOUD API TRUNCATION) ─────
  it('SEC-11: WhatsApp message formatter safely truncates bodies exceeding 3000 characters', () => {
    const hugeContent = 'A'.repeat(4500);
    const formatted = formatBroadcastWhatsAppMessage(
      {
        title: 'Huge Content Test',
        content: hugeContent,
        type: 'ALERT',
        targetType: 'GLOBAL',
        authorName: 'Admin',
        authorRole: 'SUPER_ADMIN',
      },
      'Colleague'
    );

    expect(formatted.length).toBeLessThan(3500);
    expect(formatted).toContain('...[Ver mensaje completo en Nexus]');
  });

  // ── TEST 12: WHATSAPP DISPATCH & REPORTING ────────────────────────────
  it('SEC-12: Dispatches WhatsApp messages to active collaborators and reports summary', async () => {
    const req = new NextRequest('http://localhost:3000/api/nexus/broadcasts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-nexus-token': TEST_ADMIN_TOKEN,
      },
      body: JSON.stringify({
        title: '📢 Security Verified Launch',
        content: 'Notificación de prueba verificada con WhatsApp.',
        type: 'ANNOUNCEMENT',
        targetType: 'GLOBAL',
        notifyWhatsApp: true,
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.whatsappSummary).toBeDefined();
    expect(typeof data.whatsappSummary.dispatched).toBe('number');
    expect(Array.isArray(data.whatsappSummary.errors)).toBe(true);
  });
});
