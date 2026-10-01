/**
 * 🛡️ Admin — Full Tenant Access REQUEST (Production Testing Tier)
 * apps/dashboard/src/app/api/admin/projects/[slug]/full-access/route.ts
 *
 * POST /api/admin/projects/[slug]/full-access
 *   → ADMIN (session) or x-admin-token creates a REQUEST (operationalIntent,
 *     status='proposed'). Does NOT provision immediately (unless the caller IS the
 *     SUPER_ADMIN, who may self-approve).
 *   → Discord "pandoras-alerts" notification with deep link for the Super Admin
 *     to approve on dash.pandoras.finance.
 *
 * POST /api/admin/projects/[slug]/full-access/approve?intentId=...
 *   → SUPER-ONLY. Executes provisioning via FullAccessProvisionService.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, operationalIntents } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';
import { PlatformAuditLedgerService } from '@/lib/admin/platform-audit-ledger.service';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/hermes/auth/rate-limiter';
import {
  provisionFullAccess,
  FULL_ACCESS_FAMILIES,
} from '@/lib/admin/full-access-provision.service';
// Discord notify via direct webhook fetch

export const runtime = 'nodejs';

/* ── REQUEST: crea la petición + notifica a Discord (no provisiona) ─────── */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const rl = checkRateLimit(`admin-full-access:${clientIpFromHeaders(req.headers)}`, 10, 60_000);
    if (!rl.allowed) return NextResponse.json({ success: false, message: 'RATE_LIMITED' }, { status: 429 });

    const nexus = await getNexusAuthContext();
    const sessionAdmin = nexus.isAuthenticated && (nexus.role === 'SUPER_ADMIN' || nexus.role === 'ADMIN');
    const adminToken = req.headers.get('x-admin-token');
    const tokenOk = Boolean(process.env.ADMIN_TOKEN && adminToken && adminToken === process.env.ADMIN_TOKEN);
    if (!sessionAdmin && !tokenOk) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
    const requestedBy = (tokenOk ? 'admin_token' : null) || nexus.wallet || 'unknown_operator';

    const { slug } = await params;
    const [project] = await db
      .select({ id: projects.id, organizationId: projects.organizationId, title: projects.title })
      .from(projects)
      .where(eq(projects.slug, slug))
      .limit(1);
    if (!project) {
      return NextResponse.json({ success: false, message: 'Project not found' }, { status: 404 });
    }

    const intentId = `intent_full_access_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`;
    await db.insert(operationalIntents).values({
      id: intentId,
      organizationId: project.organizationId,
      missionId: 'admin_full_access_mission',
      packId: 'core_admin_pack',
      packVersion: '1.0.0',
      strategyDecisionId: 'decision_full_access_v1',
      intentType: 'admin.full_access.v1',
      objective: `Full-access provisioning (no-charge) for tenant ${slug}`,
      rationale: `Requested by ${requestedBy}. Families: ${FULL_ACCESS_FAMILIES.map(f => f.family).join(', ')}`,
      status: 'proposed',
    });

    PlatformAuditLedgerService.recordEntry({
      actorId: requestedBy,
      actorWallet: requestedBy,
      actorRole: nexus.role || 'ADMIN',
      actorType: 'ADMIN',
      action: 'TENANT_PROVISIONING_INTENT_CREATED',
      targetResource: 'project',
      resourceId: slug,
      capability: 'admin.full_access_request',
      governance: { isDiscord2faVerified: false, auditReason: 'Full-access REQUEST created — pending Super Admin visto bueno' },
      stateTransition: { previousState: null, newState: { intentId, status: 'proposed' } },
      result: 'SUCCESS',
    } as any);

    // ── Discord "pandoras-alerts" notification with approval deep link ────
    const dashboardBase = process.env.NODE_ENV === 'production'
      ? 'https://dash.pandoras.finance'
      : 'https://staging.dash.pandoras.finance';
    const approvalLink = `${dashboardBase}/admin/full-access-approvals`;
    try {
      const webhook = process.env.DISCORD_WEBHOOK_ALERTS || '';
      const mention = '<@&MANAGER_ROLE_ID>';
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: mention, embeds: [{
        title: `🔐 Full-Access Request: ${project.title} (${slug})`,
        description: `**${requestedBy}** solicitó **FULL ACCESS sin cobro** para el tenant \`${slug}\`.`,
        color: 0xffa500,
        fields: [
          { name: 'Familias', value: FULL_ACCESS_FAMILIES.map(f => f.family).join(', '), inline: true },
          { name: 'Intent ID', value: intentId, inline: false },
          { name: '⚡ Visto Bueno', value: `[👉 Aprobar como Super Admin](${approvalLink})`, inline: false },
        ],
          timestamp: new Date().toISOString(),
          footer: { text: 'Pandoras — Admin Full Access (Production Testing)' },
        }] }),
      });
      void webhook;
    } catch (e: any) {
      console.warn('[FullAccess] Discord notify failed (non-blocking):', e?.message);
    }

    return NextResponse.json({
      success: true,
      requestId: intentId,
      status: 'PENDING_SUPER_ADMIN_APPROVAL',
      approvalLink,
      message: 'Petición creada — pendiente de visto bueno del Super Admin en dash.pandoras.finance/admin/full-access-approvals',
    });
  } catch (error: any) {
    console.error('[Admin API: full-access REQUEST]', error?.message || error);
    return NextResponse.json({ success: false, message: error?.message }, { status: 500 });
  }
}

/* ── APPROVE: SOLO Super Admin ejecuta el pase directo ───────────────────── */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const body = await req.json();
    const intentId = body.intentId;
    if (!intentId) return NextResponse.json({ success: false, message: 'intentId required' }, { status: 400 });

    // SUPER-ONLY gate: x-admin-token OR NexusRole SUPER_ADMIN (not ADMIN).
    const nexus = await getNexusAuthContext();
    const adminToken = req.headers.get('x-admin-token');
    const tokenOk = Boolean(process.env.ADMIN_TOKEN && adminToken && adminToken === process.env.ADMIN_TOKEN);
    const superAdmin = nexus.isAuthenticated && nexus.role === 'SUPER_ADMIN';
    if (!tokenOk && !superAdmin) {
      return NextResponse.json({ success: false, message: 'Forbidden — Super Admin only' }, { status: 403 });
    }

    const [intentRow] = await db
      .select()
      .from(operationalIntents)
      .where(eq(operationalIntents.id, intentId))
      .limit(1);
    if (!intentRow) return NextResponse.json({ success: false, message: 'Intent not found' }, { status: 404 });
    if (intentRow.status === 'approved' || intentRow.status === 'executed') {
      return NextResponse.json({ success: true, alreadyProcessed: true, status: intentRow.status });
    }

    // Atomic claim: only one approver can flip proposed→approved
    const claimedIntent = await db.update(operationalIntents)
      .set({ status: 'approved' })
      .where(and(
        eq(operationalIntents.id, intentId),
        eq(operationalIntents.status, 'proposed'),
      ))
      .returning({ id: operationalIntents.id });
    if (claimedIntent.length === 0) {
      return NextResponse.json({ success: false, message: 'Intent already processed by another approver.' }, { status: 409 });
    }

    const approvedBy = tokenOk ? 'admin_token' : (nexus.wallet || 'super_admin');
    const { slug: slug } = await params;
    const { provisionFullAccess } = await import('@/lib/admin/full-access-provision.service');
    const { results } = await provisionFullAccess(slug, approvedBy);

    await db.update(operationalIntents)
      .set({ status: 'executed' })
      .where(eq(operationalIntents.id, intentId));

    PlatformAuditLedgerService.recordEntry({
      actorId: approvedBy,
      actorWallet: approvedBy,
      actorRole: 'SUPER_ADMIN',
      actorType: 'ADMIN',
      action: 'TENANT_PROVISIONING_INTENT_CREATED',
      targetResource: 'project',
      resourceId: slug,
      capability: 'admin.full_access_provision',
      governance: {
        isDiscord2faVerified: false,
        auditReason: `FULL-ACCESS APPROVED by Super Admin (${approvedBy})`,
      },
      stateTransition: { previousState: { intentId, status: 'proposed' }, newState: { intentId, status: 'executed', families: results } },
      result: 'SUCCESS',
    } as any);

    return NextResponse.json({ success: true, intentId, results, approvedBy });
  } catch (error: any) {
    console.error('[Admin API: full-access APPROVE]', error?.message || error);
    return NextResponse.json({ success: false, message: error?.message }, { status: 500 });
  }
}
