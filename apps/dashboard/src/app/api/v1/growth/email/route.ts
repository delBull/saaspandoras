/**
 * 🛰️ Growth OS API Boundary — Email Marketing Service
 * /api/v1/growth/email
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/hermes/auth/rate-limiter';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';
import { SessionTokenService } from '@/lib/hermes/auth/session-token.service';
import { isWalletAuthorizedForTenant } from '@/lib/hermes/auth/wallet-tenant-membership';
import { capabilityRegistry } from '@/lib/growth/capability-registry.service';
import type { 
  GetEmailMarketingResponseDTO, 
  EmailTemplateDTO, 
  EmailCampaignDTO 
} from '@/lib/dash-contracts/growth';

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

    const campaigns: EmailCampaignDTO[] = [
      {
        id: 'camp_referral_warm',
        name: 'Campaña Referidos Cálidos Q3',
        templateId: 'tmpl_welcome_vip',
        status: 'SENT',
        recipientsCount: 142,
        openRate: 68.4,
        clickRate: 34.1,
        sentAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      },
      {
        id: 'camp_token_announcement',
        name: 'Lanzamiento Fase 2 Tokens',
        templateId: 'tmpl_token_offering',
        status: 'SCHEDULED',
        recipientsCount: 320,
        openRate: 0,
        clickRate: 0,
        scheduledAt: new Date(Date.now() + 86400000 * 2).toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];

    const response: GetEmailMarketingResponseDTO = {
      templates,
      campaigns,
      stats: {
        totalSent: 142,
        avgOpenRate: 68.4,
        avgClickRate: 34.1,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[Growth API: email GET] Error:', error);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: error.message }, { status: 500 });
  }
}
