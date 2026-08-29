import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, installedProducts, users, accessRequests, marketingLeads } from '@/db/schema';
import { eq, desc, or, sql } from 'drizzle-orm';
import { generatePortalToken } from '@/lib/platform/portal-auth';
import { sendEmail } from '@/lib/email/client';

const MAGIC_LINK_EMAIL_DAILY_LIMIT = 3;
const MAGIC_LINK_IP_DAILY_LIMIT = 10;

// Simple in-memory rate-limit buckets (per UTC day). Reset on redeploy.
const magicLinkEmailBuckets = new Map<string, { date: string; count: number }>();
const magicLinkIpBuckets = new Map<string, { date: string; count: number }>();

export async function POST(req: NextRequest) {
  try {
    const { email, return: returnPath } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Proporciona un correo electrónico válido.' }, { status: 400 });
    }

    // Only allow internal portal redirects (anti open-redirect)
    const safeReturn = typeof returnPath === 'string' && /^\/portal\/[a-zA-Z0-9-]+/.test(returnPath)
      ? returnPath
      : '';

    const cleanEmail = email.trim().toLowerCase();

    // Rate limiting: anti-spam / anti-enumeration (email + IP buckets, per UTC day)
    const today = new Date().toISOString().slice(0, 10);
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';

    const emailHit = magicLinkEmailBuckets.get(cleanEmail);
    if (!emailHit || emailHit.date !== today) {
      magicLinkEmailBuckets.set(cleanEmail, { date: today, count: 1 });
    } else if (emailHit.count >= MAGIC_LINK_EMAIL_DAILY_LIMIT) {
      return NextResponse.json({ error: 'Demasiados intentos para este correo hoy. Intenta de nuevo mañana.' }, { status: 429 });
    } else {
      emailHit.count += 1;
    }

    const ipHit = magicLinkIpBuckets.get(ip);
    if (!ipHit || ipHit.date !== today) {
      magicLinkIpBuckets.set(ip, { date: today, count: 1 });
    } else if (ipHit.count >= MAGIC_LINK_IP_DAILY_LIMIT) {
      return NextResponse.json({ error: 'Demasiados intentos desde esta conexión hoy. Intenta de nuevo mañana.' }, { status: 429 });
    } else {
      ipHit.count += 1;
    }

    // Protected Project IDs and Slugs (S'Narai and flagship public tokenization projects)
    // NEVER grant portal access to these via generic B2C leads or without explicit operator authorization
    const PROTECTED_PROJECT_IDS = [2, 17, 15];
    const PROTECTED_PROJECT_SLUGS = ['snarai', 'snarai-protocol', 'narai', 'pandoras_access'];
    const PROTECTED_PROJECT_OPERATOR_EMAIL = 'marco.munoz9@gmail.com';

    // 1. Find user or approved access request by email
    const [user] = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
    const [approvedRequest] = await db.select().from(accessRequests).where(eq(accessRequests.email, cleanEmail)).limit(1);

    // 2. Resolve the tenant's project strictly without cross-tenant leakage.
    let project: typeof projects.$inferSelect | undefined;
    let installedId: string | undefined;

    // Priority 1: installedProducts where operator email matches
    const allInstalled = await db.select().from(installedProducts);
    const userProduct = allInstalled.find((p) => {
      const cfg = (p.config as any) || {};
      const manifest = (p.runtimeManifest as any) || {};
      const matchesEmail = (
        (cfg.email && String(cfg.email).trim().toLowerCase() === cleanEmail) ||
        (manifest.context?.adminEmail && String(manifest.context.adminEmail).trim().toLowerCase() === cleanEmail)
      );
      if (!matchesEmail) return false;
      // If matching a protected project (e.g. S'Narai), verify it's the verified admin
      if (PROTECTED_PROJECT_IDS.includes(p.projectId)) {
        return cleanEmail === PROTECTED_PROJECT_OPERATOR_EMAIL;
      }
      return true;
    });

    if (userProduct?.projectId) {
      [project] = await db.select().from(projects).where(eq(projects.id, userProduct.projectId)).limit(1);
      if (project) installedId = userProduct.id;
    }

    // Priority 2: projects.applicantEmail (Direct project owner)
    if (!project) {
      const [matchedProject] = await db.select().from(projects).where(eq(projects.applicantEmail, cleanEmail)).limit(1);
      if (matchedProject) {
        if (!PROTECTED_PROJECT_IDS.includes(matchedProject.id) || cleanEmail === PROTECTED_PROJECT_OPERATOR_EMAIL) {
          project = matchedProject;
        }
      }
    }

    // Priority 3: accessRequests with explicit approved status
    if (!project && approvedRequest) {
      const meta = (approvedRequest.metadata ?? {}) as { projectId?: number; projectSlug?: string };
      if (meta.projectId && !PROTECTED_PROJECT_IDS.includes(Number(meta.projectId))) {
        [project] = await db.select().from(projects).where(eq(projects.id, Number(meta.projectId))).limit(1);
      } else if (meta.projectSlug && !PROTECTED_PROJECT_SLUGS.includes(String(meta.projectSlug).toLowerCase())) {
        [project] = await db.select().from(projects).where(or(
          eq(projects.slug, String(meta.projectSlug)),
          eq(sql`lower(${projects.slug})`, String(meta.projectSlug).toLowerCase())
        )).limit(1);
      }
    }

    // Priority 4: B2B Growth OS leads (ONLY dedicated client workspaces, NEVER protected B2C projects)
    if (!project) {
      const leads = await db
        .select({ projectId: marketingLeads.projectId, metadata: marketingLeads.metadata })
        .from(marketingLeads)
        .where(eq(marketingLeads.email, cleanEmail))
        .orderBy(desc(marketingLeads.createdAt));
      
      const b2bLead = leads.find((l) => {
        const m = (l.metadata as any) || {};
        const isB2B = m.type === 'growth_os_signup' || m.tags?.includes('B2B_GROWTH_OS');
        const notProtected = l.projectId && !PROTECTED_PROJECT_IDS.includes(l.projectId);
        return isB2B && notProtected;
      });

      if (b2bLead?.projectId) {
        [project] = await db.select().from(projects).where(eq(projects.id, b2bLead.projectId)).limit(1);
      }
    }

    const isApproved = Boolean(
      project ||
      user || 
      (approvedRequest && (approvedRequest.status === 'approved' || approvedRequest.status === 'granted'))
    );

    if (!isApproved) {
      return NextResponse.json({ 
        error: 'Si tu acceso ya fue aprobado, recibirás tu enlace en tu correo. Si no lo recibes, contacta a soporte en la página principal.' 
      }, { status: 403 });
    }

    let token = '';
    let activeProjectId = project?.id;
    let activeProjectSlug = project?.slug;

    if (activeProjectId && project && !PROTECTED_PROJECT_IDS.includes(activeProjectId)) {
      // User has an explicit tenant workspace
      if (!installedId) {
        const products = await db.select().from(installedProducts).where(eq(installedProducts.projectId, activeProjectId)).limit(1);
        if (products && products.length > 0) {
          installedId = products[0]!.id;
        } else {
          const [newProduct] = await db.insert(installedProducts).values({
            projectId: activeProjectId,
            product: 'HERMES',
            productFamily: 'GROWTH_OS',
            plan: 'sandbox',
            status: 'trial',
            config: { email: cleanEmail, companyName: project.title },
            runtimeManifest: { context: { adminEmail: cleanEmail } },
          }).returning({ id: installedProducts.id });
          installedId = newProduct!.id;
        }
      }
      
      token = generatePortalToken(installedId, activeProjectId, 'hermes');
    } else {
      // Auto-provision their bootstrap workspace
      const { ensureInitialWorkspace } = await import('@/lib/platform/workspace-bootstrap');
      const bootstrap = await ensureInitialWorkspace(cleanEmail);
      token = bootstrap.portalToken;
      activeProjectId = bootstrap.projectId;
      activeProjectSlug = bootstrap.projectSlug;
      project = {
        id: bootstrap.projectId,
        slug: bootstrap.projectSlug,
        title: 'Workspace',
        status: 'draft',
      } as any;
    }

    // 4. Generate Magic Link with proper return destination
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dash.pandoras.finance';
    const destination = safeReturn || (activeProjectSlug ? `/onboarding/${activeProjectSlug}` : '/portal');
    const magicLink = `${baseUrl}/portal/login?token=${token}&return=${encodeURIComponent(destination)}`;

    console.info(`[MagicLink API] Magic Link generated for ${cleanEmail} (Target: ${destination}): ${magicLink}`);

    // Send the magic link via Resend with mobile-optimized email design
    try {
      const firstName = user?.name?.split(' ')[0] || (project?.title?.split(' ')[0]) || 'Cliente';
      const emailRes = await sendEmail({
        to: cleanEmail,
        from: `Pandora's Group <hello@pandoras.finance>`,
        subject: 'Hermes OS — Tu enlace de acceso está listo',
        html: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Hermes OS — Acceso</title>
</head>
<body style="margin:0;padding:0;background-color:#08080C;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#08080C;margin:0 auto;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;background:#0F0F18;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#1a0533 0%,#0a0a1a 100%);padding:28px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(160,120,255,0.8);margin-bottom:8px;font-weight:600;">PANDORA'S PLATFORM OS</div>
                    <div style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;">Hermes OS</div>
                    <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:4px;">${project?.title || 'Centro de Operaciones'}</div>
                  </td>
                  <td align="right" valign="top">
                    <img src="https://dash.pandoras.finance/apple-touch-icon.png" alt="Pandora's" width="42" height="42" style="border-radius:8px;object-fit:contain;background:#111;display:block;padding:2px;"/>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 6px;font-size:14px;color:rgba(255,255,255,0.5);">Hola,</p>
              <p style="margin:0 0 20px;font-size:20px;font-weight:600;color:#ffffff;">${firstName}</p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.7);">
                Has solicitado acceso a tu consola operativa de 
                <strong style="color:#a78bfa;">Hermes OS</strong>.
                Haz clic en el siguiente botón para iniciar sesión de forma segura:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 16px;">
                    <a href="${magicLink}" target="_blank"
                       style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:10px;letter-spacing:0.3px;">
                      Entrar a Hermes OS →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;font-size:12px;color:rgba(255,255,255,0.35);text-align:center;line-height:1.5;">
                Este enlace es de uso personal y expira en 7 días.<br/>
                Si no solicitaste este acceso, puedes ignorar este correo.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#080810;padding:18px 32px;border-top:1px solid rgba(255,255,255,0.05);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:11px;color:rgba(255,255,255,0.3);line-height:1.6;">
                      <strong style="color:rgba(255,255,255,0.5);">Pandora's Platform OS</strong><br/>
                      <a href="https://pandoras.finance" style="color:rgba(124,58,237,0.8);text-decoration:none;">pandoras.finance</a>
                    </div>
                  </td>
                  <td align="right">
                    <div style="font-size:10px;color:rgba(255,255,255,0.2);letter-spacing:2px;text-transform:uppercase;">HERMES OS</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      });
      console.info(`[MagicLink API] Email dispatched for ${cleanEmail}:`, emailRes);
    } catch (e) {
      console.warn('[MagicLink API] Email dispatch failed:', e);
    }


    return NextResponse.json({
      success: true,
      message: `Enlace mágico enviado a ${cleanEmail}`,
      magicLink: process.env.NODE_ENV === 'development' ? magicLink : undefined,
    });
  } catch (err: any) {
    console.error('[MagicLink API Error]:', err);
    return NextResponse.json({ error: 'Error procesando la solicitud de acceso.' }, { status: 500 });
  }
}
