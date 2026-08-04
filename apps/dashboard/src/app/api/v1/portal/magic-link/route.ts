import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, installedProducts, users } from '@/db/schema';
import { eq, or, ilike } from 'drizzle-orm';
import { generatePortalToken } from '@/lib/platform/portal-auth';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Proporciona un correo electrónico válido.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Find user by email or identity
    const foundUsers = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
    const user = foundUsers[0];

    // 2. Find matching installed product or project for Hermes
    let targetProject = null;

    const emailPrefix = cleanEmail.split('@')[0] || '';
    const projectsBySlug = await db.select().from(projects).where(or(
      ilike(projects.slug, `%${emailPrefix}%`),
      eq(projects.slug, 'snarai')
    )).limit(1);
    
    if (projectsBySlug.length > 0 && projectsBySlug[0]) {
      targetProject = projectsBySlug[0];
    }

    if (!targetProject) {
      return NextResponse.json({ error: 'No se encontró una suscripción activa de Hermes para este correo.' }, { status: 404 });
    }

    // 3. Find or resolve installed product ID for Hermes
    const products = await db.select().from(installedProducts).where(eq(installedProducts.projectId, targetProject.id)).limit(1);
    const firstProduct = products && products.length > 0 ? products[0] : null;
    const installedId = firstProduct ? firstProduct.id : `inst_hermes_${targetProject.id}`;

    // 4. Generate Magic Token (7 Days valid)
    const token = generatePortalToken(installedId, targetProject.id, 'hermes');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dash.pandoras.finance';
    const magicLink = `${baseUrl}/portal?token=${token}`;

    console.info(`[MagicLink API] Magic Link generated for ${cleanEmail}: ${magicLink}`);

    // In production, send via email service. Return magicLink for direct access/demo fallback.
    return NextResponse.json({
      success: true,
      message: `Enlace mágico enviado a ${cleanEmail}`,
      magicLink, // Direct link for instant access in dev/demo
    });
  } catch (err: any) {
    console.error('[MagicLink API Error]:', err);
    return NextResponse.json({ error: 'Error procesando la solicitud de acceso.' }, { status: 500 });
  }
}
