/**
 * 📢 Nexus Broadcasts & Central Notification Suite
 * apps/dashboard/src/app/api/nexus/__tests__/nexus-broadcasts.test.ts
 *
 * Verifies:
 * 1. Authorization: Only ADMIN and SUPER_ADMIN can post broadcasts.
 * 2. Payload Validation: Title and content required, handles emojis & newlines.
 * 3. Targeting: Supports GLOBAL, USER, and ROLE scoping.
 * 4. Deactivation: Archiving broadcasts via PATCH.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST, PATCH, formatBroadcastWhatsAppMessage } from '../broadcasts/route';

describe('📢 Nexus Broadcasts & Central Notifications API Suite', () => {

  // ── TEST 1: REJECTS NON-ADMIN BROADCAST CREATION ─────────────────────
  it('Test 1: Rejects broadcast publishing if author is not ADMIN or SUPER_ADMIN', async () => {
    const req = new NextRequest('http://localhost:3000/api/nexus/broadcasts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Unauthorized Message',
        content: 'Should be rejected',
        authorRole: 'VIEWER',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Only SUPER_ADMIN and ADMIN can publish Nexus broadcasts');
  });

  // ── TEST 2: REJECTS EMPTY TITLE OR CONTENT ───────────────────────────
  it('Test 2: Rejects payloads with missing title or content', async () => {
    const req = new NextRequest('http://localhost:3000/api/nexus/broadcasts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '',
        content: 'Some content',
        authorRole: 'ADMIN',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Title is required');
  });

  // ── TEST 3: CREATES GLOBAL BROADCAST WITH EMOJIS & ENTERS ────────────
  it('Test 3: Allows SUPER_ADMIN to publish a broadcast with emojis and paragraphs', async () => {
    const multilineContent = '🚀 Anuncio Oficial:\n\nPárrafo 1 con emojis 🎉.\n\n👉 [Ver Litepaper](https://pandoras.finance/litepaper)';
    
    const req = new NextRequest('http://localhost:3000/api/nexus/broadcasts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '📢 Lanzamiento del Sistema Operativo',
        content: multilineContent,
        type: 'ANNOUNCEMENT',
        targetType: 'GLOBAL',
        authorName: 'Marco',
        authorRole: 'SUPER_ADMIN',
        expiresInDays: 7,
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.broadcast).toBeDefined();
    expect(data.broadcast.title).toContain('📢');
    expect(data.broadcast.content).toBe(multilineContent);
    expect(data.broadcast.targetType).toBe('GLOBAL');
    expect(data.broadcast.isActive).toBe(true);
  });

  // ── TEST 4: TARGETED BROADCAST (USER & ROLE) ─────────────────────────
  it('Test 4: Publishes a targeted broadcast for a specific user email', async () => {
    const req = new NextRequest('http://localhost:3000/api/nexus/broadcasts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '🔔 Revisión de Propuesta Asignada',
        content: 'Hola, por favor revisa el Deal Room asignado:\nhttps://nexus.pandoras.finance/rooms',
        type: 'ALERT',
        targetType: 'USER',
        targetEmail: 'collab@pandoras.finance',
        authorName: 'Ops Admin',
        authorRole: 'ADMIN',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.broadcast.targetType).toBe('USER');
    expect(data.broadcast.targetEmail).toBe('collab@pandoras.finance');
  });

  // ── TEST 5: GET ENDPOINT RETRIEVES MATCHING BROADCASTS ───────────────
  it('Test 5: GET /api/nexus/broadcasts filters matching global and targeted broadcasts', async () => {
    const req = new NextRequest('http://localhost:3000/api/nexus/broadcasts?email=collab@pandoras.finance&role=COLLABORATOR');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.broadcasts)).toBe(true);
    // Should include the global and user-targeted broadcast created above
    expect(data.broadcasts.length).toBeGreaterThan(0);
  });

  // ── TEST 6: PATCH DEACTIVATES A BROADCAST ───────────────────────────
  it('Test 6: PATCH deactivates an active broadcast', async () => {
    // First get a broadcast ID from list
    const listReq = new NextRequest('http://localhost:3000/api/nexus/broadcasts?all=true');
    const listRes = await GET(listReq);
    const listData = await listRes.json();
    const target = listData.broadcasts[0];

    expect(target).toBeDefined();

    const patchReq = new NextRequest('http://localhost:3000/api/nexus/broadcasts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: target.id,
        isActive: false,
        authorRole: 'SUPER_ADMIN',
      }),
    });

    const patchRes = await PATCH(patchReq);
    const patchData = await patchRes.json();

    expect(patchRes.status).toBe(200);
    expect(patchData.success).toBe(true);
    expect(patchData.broadcast.isActive).toBe(false);
  });

  // ── TEST 7: FORMATTING VALIDATION FOR EMOJIS & ENTERS ────────────────
  it('Test 7: Preserves multiline paragraphs and emojis in broadcast retrieval', async () => {
    const multiline = '🚨 URGENTE:\n\nEstimados miembros:\nFavor de revisar la plataforma.\n\n👉 https://pandoras.finance';
    const postReq = new NextRequest('http://localhost:3000/api/nexus/broadcasts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '🚨 Test Format',
        content: multiline,
        type: 'URGENT',
        authorRole: 'ADMIN',
      }),
    });
    const postRes = await POST(postReq);
    const postData = await postRes.json();
    expect(postRes.status).toBe(200);

    const getReq = new NextRequest('http://localhost:3000/api/nexus/broadcasts');
    const getRes = await GET(getReq);
    const getData = await getRes.json();
    const found = getData.broadcasts.find((b: any) => b.id === postData.broadcast.id);

    expect(found).toBeDefined();
    expect(found.content).toContain('\n\n');
    expect(found.content).toContain('🚨');
    expect(found.content).toContain('https://pandoras.finance');
  });

  // ── TEST 8: WHATSAPP MESSAGE FORMATTER ENFORCES ORIGIN & DETAILS ────
  it('Test 8: Formats WhatsApp message with Nexus origin, author and alert badge', () => {
    const waText = formatBroadcastWhatsAppMessage(
      {
        title: '💎 Nuevo Protocolo RWA Desplegado',
        content: 'Detalles de la inversión en el Data Room.',
        type: 'ALERT',
        targetType: 'GLOBAL',
        authorName: 'Marco',
        authorRole: 'SUPER_ADMIN',
      },
      'Carlos'
    );

    expect(waText).toContain('NEXUS OPERATIONS HUB');
    expect(waText).toContain('⚠️ AVISO IMPORTANTE');
    expect(waText).toContain('Hola *Carlos*');
    expect(waText).toContain('💎 Nuevo Protocolo RWA Desplegado');
    expect(waText).toContain('👤 *De parte de:* Marco (SUPER_ADMIN)');
    expect(waText).toContain('https://nexus.pandoras.finance');
  });

  // ── TEST 9: POST INCLUDES WHATSAPP SUMMARY IN RESPONSE ───────────────
  it('Test 9: POST returns whatsappSummary with dispatch reporting', async () => {
    const postReq = new NextRequest('http://localhost:3000/api/nexus/broadcasts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '📢 Anuncio con WhatsApp Deshabilitado para Test',
        content: 'Contenido de prueba.',
        type: 'ANNOUNCEMENT',
        authorRole: 'ADMIN',
        notifyWhatsApp: false, // Explicitly false to test opt-out
      }),
    });

    const postRes = await POST(postReq);
    const postData = await postRes.json();

    expect(postRes.status).toBe(200);
    expect(postData.success).toBe(true);
    expect(postData.whatsappSummary).toBeDefined();
    expect(postData.whatsappSummary.dispatched).toBe(0);
    expect(Array.isArray(postData.whatsappSummary.errors)).toBe(true);
  });
});
