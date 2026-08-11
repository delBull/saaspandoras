import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, installedProducts, users, accessRequests, marketingLeads } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generatePortalToken } from '@/lib/platform/portal-auth';
import { sendEmail } from '@/lib/email/client';

const MAGIC_LINK_EMAIL_DAILY_LIMIT = 3;
const MAGIC_LINK_IP_DAILY_LIMIT = 10;

// Simple in-memory rate-limit buckets (per UTC day). Reset on redeploy.
const magicLinkEmailBuckets = new Map<string, { date: string; count: number }>();
const magicLinkIpBuckets = new Map<string, { date: string; count: number }>();

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Proporciona un correo electrónico válido.' }, { status: 400 });
    }

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

    // 1. Find user or approved access request by email
    const [user] = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
    const [approvedRequest] = await db.select().from(accessRequests).where(eq(accessRequests.email, cleanEmail)).limit(1);

    const isApproved = Boolean(
      user || 
      (approvedRequest && (approvedRequest.status === 'approved' || approvedRequest.status === 'granted'))
    );

    if (!isApproved) {
      // Generic anti-enumeration message: never reveal whether the account exists
      return NextResponse.json({ 
        error: 'Si tu acceso ya fue aprobado, recibirás tu enlace en tu correo. Si no lo recibes, contacta a soporte en la página principal.' 
      }, { status: 403 });
    }

    // 2. Resolve the tenant's project WITHOUT hardcoded defaults.
    //    Priority: metadata on the approved request → lead record (email).
    const meta = (approvedRequest?.metadata ?? {}) as { projectId?: number; projectSlug?: string };
    let project: typeof projects.$inferSelect | undefined;

    if (meta.projectId) {
      [project] = await db.select().from(projects).where(eq(projects.id, Number(meta.projectId))).limit(1);
    } else if (meta.projectSlug) {
      [project] = await db.select().from(projects).where(eq(projects.slug, String(meta.projectSlug))).limit(1);
    }

    if (!project) {
      const [lead] = await db
        .select({ projectId: marketingLeads.projectId })
        .from(marketingLeads)
        .where(eq(marketingLeads.email, cleanEmail))
        .limit(1);
      if (lead?.projectId) {
        [project] = await db.select().from(projects).where(eq(projects.id, lead.projectId)).limit(1);
      }
    }

    const activeProject = project;
    if (!activeProject) {
      return NextResponse.json({ error: 'No se encontró un proyecto activo asociado a esta cuenta. Usa el enlace de invitación que recibiste por correo.' }, { status: 404 });
    }

    // 3. Resolve installed product ID for Hermes
    const products = await db.select().from(installedProducts).where(eq(installedProducts.projectId, activeProject.id)).limit(1);
    const firstProduct = products && products.length > 0 ? products[0] : null;
    const installedId = firstProduct ? firstProduct.id : `inst_hermes_${activeProject.id}`;

    // 4. Generate Magic Token (7 Days valid)
    const token = generatePortalToken(installedId, activeProject.id, 'hermes');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dash.pandoras.finance';
    const magicLink = `${baseUrl}/growth-os/hermes/portal?token=${token}`;

    console.info(`[MagicLink API] Magic Link generated for ${cleanEmail}: ${magicLink}`);

    // Send the magic link via Resend with the Hermes branded identity + design
    try {
      const firstName = user?.name?.split(' ')[0] || 'Cliente';
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
<body style="margin:0;padding:0;background-color:#08080C;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#08080C;min-height:100vh;">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table width="580" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;width:100%;background:#0F0F18;border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#1a0533 0%,#0a0a1a 100%);padding:32px 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:rgba(160,120,255,0.7);margin-bottom:10px;">PANDORA'S PLATFORM OS</div>
                    <div style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;">Hermes OS</div>
                    <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-top:6px;letter-spacing:0.5px;">Tu Centro de Operaciones</div>
                  </td>
                  <td align="right" valign="top">
                    <img src="https://dash.pandoras.finance/apple-touch-icon.png" alt="Pandora's" width="48" height="48" style="border-radius:10px;object-fit:contain;background:#111;display:block;padding:4px;"/>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:15px;color:rgba(255,255,255,0.5);letter-spacing:0.3px;">Hola,</p>
              <p style="margin:0 0 28px;font-size:22px;font-weight:600;color:#ffffff;">${firstName},</p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);">
                Has solicitado acceso a tu consola de
                <strong style="color:#a78bfa;">Hermes OS</strong>.
                Usa el botón de abajo para entrar de forma segura:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${magicLink}" target="_blank"
                       style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:16px 40px;border-radius:10px;letter-spacing:0.3px;">
                      Entrar a Hermes OS →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:12px;color:rgba(255,255,255,0.3);text-align:center;line-height:1.6;">
                Este enlace es de un solo uso y expira en 7 días.<br/>
                Si no solicitaste este acceso, puedes ignorar este correo.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#080810;padding:24px 40px;border-top:1px solid rgba(255,255,255,0.05);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:12px;color:rgba(255,255,255,0.25);line-height:1.7;">
                      <strong style="color:rgba(255,255,255,0.4);">Pandora's Platform OS</strong><br/>
                      Enterprise Infrastructure for Intelligent Assets<br/>
                      <a href="https://pandoras.finance" style="color:rgba(124,58,237,0.7);text-decoration:none;">pandoras.finance</a>
                    </div>
                  </td>
                  <td align="right">
                    <div style="font-size:10px;color:rgba(255,255,255,0.18);letter-spacing:2px;text-transform:uppercase;">Hermes OS</div>
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
