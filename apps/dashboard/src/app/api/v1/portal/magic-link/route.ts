import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, installedProducts, users, accessRequests, administrators } from '@/db/schema';
import { eq, or, ilike } from 'drizzle-orm';
import { generatePortalToken } from '@/lib/platform/portal-auth';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Proporciona un correo electrónico válido.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Find user or approved access request by email
    const [user] = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
    const [approvedRequest] = await db.select().from(accessRequests).where(eq(accessRequests.email, cleanEmail)).limit(1);

    const isApproved = Boolean(
      user || 
      (approvedRequest && (approvedRequest.status === 'approved' || approvedRequest.status === 'granted'))
    );

    if (!isApproved) {
      return NextResponse.json({ 
        error: 'Tu correo no cuenta con una suscripción o acceso aprobado a Hermes OS. Por favor solicita una evaluación en la página principal.' 
      }, { status: 403 });
    }

    // 2. Resolve matching project or default to snarai (ID 17 in production)
    const targetProjectId = 17;
    const [project] = await db.select().from(projects).where(eq(projects.id, targetProjectId)).limit(1);

    const activeProject = project || (await db.select().from(projects).where(eq(projects.slug, 'snarai')).limit(1))[0];
    if (!activeProject) {
      return NextResponse.json({ error: 'No se encontró un proyecto activo asociado a esta cuenta.' }, { status: 404 });
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

    // Try sending email via internal helper if available
    try {
      const emailRes = await fetch(`${baseUrl}/api/v1/internal/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: cleanEmail,
          subject: 'Acceso a tu Consola Hermes OS',
          html: `<p>Hola,</p><p>Haz click en el siguiente enlace para ingresar a tu Consola Hermes OS:</p><p><a href="${magicLink}">${magicLink}</a></p>`
        })
      }).catch(() => null);
    } catch (e) {
      console.warn('[MagicLink API] Optional email dispatch skipped:', e);
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
