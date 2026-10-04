/**
 * 🛰️ Growth OS API Boundary — Email Marketing Service
 * /api/v1/growth/email
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { projects, marketingCampaigns, marketingExecutions } from '@saasfly/db/schema';
import { eq, or, desc, sql } from "@saasfly/db-core";
import { getAuth } from '@saasfly/auth-sdk';
import { checkRateLimit, clientIpFromHeaders } from '@saasfly/hermes-core';
import { validatePortalSession } from '@saasfly/shared';
import { OrganizationSDK } from '@saasfly/shared';
import { SessionTokenService } from '@saasfly/hermes-core';
import { isWalletAuthorizedForTenant } from '@saasfly/hermes-core';
import { capabilityRegistry } from '@/lib/growth/capability-registry.service';
import type { 
  GetEmailMarketingResponseDTO, 
  EmailTemplateDTO, 
  EmailCampaignDTO 
} from '@saasfly/shared';

export const dynamic = 'force-dynamic';

const sessionTokenService = new SessionTokenService();

async function resolveTenant(req: NextRequest, requestedOrg?: string | null): Promise<{
  organizationId: string;
  organizationSlug: string;
  projectId?: number;
} | null> {
  const cleanSlug = requestedOrg ? requestedOrg.replace(/^org_/, '').trim() : '';
  if (!cleanSlug) return null;

  // 1. Portal Session Cookie
  const portalCookie = req.cookies.get('pandoras_portal_session')?.value;
  if (portalCookie) {
    const session = await validatePortalSession(portalCookie);
    if (session) {
      const org = await OrganizationSDK.resolve(session.projectId, session.product as any);
      if (org) {
        if (cleanSlug !== org.slug && cleanSlug !== org.organizationId) {
          return null;
        }
        return {
          organizationId: org.organizationId,
          organizationSlug: org.slug,
          projectId: session.projectId,
        };
      }
    }
  }

  // 2. Web Wallet Session (Anti-IDOR)
  const auth = await getAuth();
  if (auth.isVerified && auth.session?.address) {
    const isAuth = await isWalletAuthorizedForTenant(auth.session.address, cleanSlug);
    if (!isAuth) return null;
    return {
      organizationId: requestedOrg || `org_${cleanSlug}`,
      organizationSlug: cleanSlug,
    };
  }

  // 3. Bearer Token
  const authHeader = req.headers.get('authorization') || '';
  const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (bearerToken) {
    try {
      const payload = sessionTokenService.verifyToken(bearerToken);
      const tenant = payload.organizationId.toLowerCase().replace(/^org_/, '');
      if (cleanSlug !== tenant && cleanSlug !== payload.organizationId) {
        return null;
      }
      return {
        organizationId: payload.organizationId,
        organizationSlug: tenant,
      };
    } catch {
      return null;
    }
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`growth-email-get:${ip}`, 60, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const orgParam = searchParams.get('organizationId') || '';
    const cleanSlug = orgParam.replace(/^org_/, '').trim();

    const auth = await resolveTenant(req, orgParam);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Authentication required.' }, { status: 401 });
    }

    // 🔒 Capability Assertion Enforcement (Fail-Closed)
    try {
      await capabilityRegistry.assertCapability(auth.organizationId, 'growth.email');
    } catch (err: any) {
      return NextResponse.json({ code: 'CAPABILITY_DISABLED', message: err.message }, { status: 403 });
    }

    const [project] = await db
      .select()
      .from(projects)
      .where(or(eq(projects.slug, cleanSlug), eq(projects.slug, orgParam)))
      .limit(1);

    const projectName = project?.title || cleanSlug.toUpperCase();

    const templates: EmailTemplateDTO[] = [
      {
        id: 'tmpl_welcome_vip',
        name: 'Bienvenida Concierge VIP',
        category: 'WELCOME',
        subject: `Bienvenido a la comunidad privada de ${projectName}`,
        previewText: 'Acceso prioritario a documentación y etapas privadas.',
        contentHtml: `<p>Hola {{name}},</p><p>Gracias por tu interés en <strong>${projectName}</strong>. Hermes ha preparado tu expediente personalizado.</p>`,
        variables: ['name', 'project_name', 'portal_link'],
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'tmpl_token_offering',
        name: 'Oportunidad de Tokenización & Yield',
        category: 'TOKEN_OFFERING',
        subject: `Nueva etapa de participación abierta en ${projectName}`,
        previewText: 'Conoce los certificados de participación respaldados en RWA.',
        contentHtml: `<p>Estimado/a {{name}},</p><p>Te compartimos los detalles de la nueva fase de <strong>${projectName}</strong>.</p>`,
        variables: ['name', 'price_per_token', 'available_supply'],
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'tmpl_investor_update',
        name: 'Reporte Trimestral de Transparencia',
        category: 'INVESTOR_UPDATE',
        subject: `Actualización de progreso y rendimientos — ${projectName}`,
        previewText: 'Resumen notarizado y avance de obra verificado.',
        contentHtml: `<p>Hola miembro de DAO,</p><p>Consulta el reporte de avance de <strong>${projectName}</strong> anclado en IPFS.</p>`,
        variables: ['name', 'yield_distributed', 'report_ipfs_url'],
        updatedAt: new Date().toISOString(),
      },
    ];

    // ─── REAL CAMPAIGNS (Production Truth) ──────────────────────────────
    // Campaigns are persisted in marketing_campaigns with the tenant's
    // canonicalOrgId stored SERVER-SIDE inside config.organizationId
    // (set at POST time). Metrics come from real marketing_executions —
    // no synthetic open/close rates.
    const campaigns: EmailCampaignDTO[] = [];
    let campaignRows: any[] = [];
    try {
      campaignRows = await db
        .select()
        .from(marketingCampaigns)
        .where(sql`config->>'organizationId' = ${auth.organizationId}`)
        .orderBy(desc(marketingCampaigns.createdAt))
        .limit(30);

      for (const c of campaignRows) {
        const cfg = (c.config as any) || {};
        const execs = await db
          .select({ status: marketingExecutions.status })
          .from(marketingExecutions)
          .where(eq(marketingExecutions.campaignId, c.id));
        const completed = execs.filter(e => e.status === 'completed').length;
        const active = execs.filter(e => e.status === 'active').length;
        campaigns.push({
          id: String(c.id),
          name: c.name,
          templateId: cfg.templateId || null,
          status: active > 0 ? 'SCHEDULED' : (completed > 0 ? 'SENT' : 'DRAFT'),
          recipientsCount: execs.length,
          openRate: null as any,
          clickRate: null as any,
          scheduledAt: cfg.scheduledAt || null,
          createdAt: c.createdAt.toISOString(),
        });
      }
    } catch (campaignsErr: any) {
      console.warn('[Growth Email] Campaign fetch notice (fallback to empty):', campaignsErr?.message);
      campaignRows = [];
    }

    const response: GetEmailMarketingResponseDTO = {
      templates,
      campaigns,
      stats: {
        totalSent: campaigns.reduce((acc: number, c: EmailCampaignDTO) => acc + (c.recipientsCount || 0), 0),
        avgOpenRate: null as any,
        avgClickRate: null as any,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[Growth API: email GET] Error:', error);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`growth-email-post:${ip}`, 15, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const body = await req.json();
    const { organizationId: orgParam, name, templateId, subject, scheduledAt } = body;
    const cleanSlug = (orgParam || '').replace(/^org_/, '').trim();
    if (!cleanSlug) {
      return NextResponse.json({ code: 'INVALID_REQUEST', message: 'organizationId is required.' }, { status: 400 });
    }
    if (!name || !String(name).trim()) {
      return NextResponse.json({ code: 'INVALID_REQUEST', message: 'Campaign name is required.' }, { status: 400 });
    }

    const auth = await resolveTenant(req, orgParam);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Authentication required.' }, { status: 401 });
    }

    try {
      await capabilityRegistry.assertCapability(auth.organizationId, 'growth.email');
    } catch (err: any) {
      return NextResponse.json({ code: 'CAPABILITY_DISABLED', message: err.message }, { status: 403 });
    }

    // Production Truth: the campaign is PERSISTED in `marketing_campaigns`
    // with the canonicalOrgId stamped SERVER-SIDE inside config.organizationId
    // (correlation-only metadata is ignored for authorization). Reads filter
    // by it so tenants and pandoras never mix campaigns.
    const [createdCampaign] = await db
      .insert(marketingCampaigns)
      .values({
        name: String(name).trim(),
        triggerType: 'manual' as any,
        isActive: !scheduledAt ? true : false,
        config: {
          organizationId: auth.organizationId,
          templateId: templateId || null,
          subject: subject ? String(subject).trim() : null,
          scheduledAt: scheduledAt || null,
          status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
          createdVia: 'growth_os_email_modal',
        } as any,
      })
      .returning();

    if (!createdCampaign) {
      return NextResponse.json({ code: 'INSERT_FAILED', message: 'Failed to persist campaign.' }, { status: 500 });
    }

    const cfg = (createdCampaign.config as any) || {};
    const campaign = {
      id: String(createdCampaign.id),
      name: createdCampaign.name,
      templateId: cfg.templateId || null,
      subject: cfg.subject || null,
      status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
      scheduledAt: scheduledAt || null,
      organizationId: auth.organizationId,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, campaign }, { status: 201 });
  } catch (error: any) {
    console.error('[Growth API: email POST] Error:', error);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: error.message }, { status: 500 });
  }
}
