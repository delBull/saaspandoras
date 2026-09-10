import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { nexusCollaborators, users } from '@/db/schema';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || process.env.NEXUS_ADMIN_EMAIL || '')
  .toLowerCase()
  .split(',')
  .map((e) => e.trim());

// E.164 basic: + seguido de 7-15 digitos
const E164_REGEX = /^\+?[1-9]\d{6,14}$/;

function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-().]/g, '');
}

export async function POST(req: NextRequest) {
  try {
    // Session guard: solo actores autenticados pueden auto-registrarse.
    // Previene que un atacante registre colaboradores arbitrarios con solo conocer email/whatsapp.
    const tokenParam = req.nextUrl.searchParams.get('token') ?? undefined;
    const auth = await getNexusAuthContext(null, tokenParam);

    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { error: 'Se requiere una sesion activa para completar el registro.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { address, name, email, whatsappPhone } = body;

    if (!address || !name || !email || !whatsappPhone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // E.164 validation
    const normalizedPhone = normalizePhone(String(whatsappPhone).trim());
    if (!E164_REGEX.test(normalizedPhone)) {
      return NextResponse.json(
        { error: 'El numero de WhatsApp debe ser valido e incluir codigo de pais (ej. +521234567890).' },
        { status: 422 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Ownership guard: un actor solo puede completar su propio registro.
    // SUPER_ADMIN puede registrar en nombre de otros.
    if (auth.role !== 'SUPER_ADMIN' && auth.email && auth.email !== normalizedEmail) {
      return NextResponse.json(
        { error: 'Solo puedes completar tu propio registro.' },
        { status: 403 }
      );
    }

    const isNexusAdmin = ADMIN_EMAILS.includes(normalizedEmail);
    const role = isNexusAdmin ? 'SUPER_ADMIN' : 'COLLABORATOR';

    const [existing] = await db
      .select()
      .from(nexusCollaborators)
      .where(eq(nexusCollaborators.email, normalizedEmail))
      .limit(1);

    if (existing) {
      await db.update(nexusCollaborators).set({
        name: name.trim(),
        whatsappPhone: normalizedPhone,
        lastAccessAt: new Date(),
        // Solo sube de rol si actualmente es COLLABORATOR; nunca degrada roles elevados
        role: existing.role === 'COLLABORATOR' ? role : existing.role,
      }).where(eq(nexusCollaborators.email, normalizedEmail));
    } else {
      await db.insert(nexusCollaborators).values({
        name: name.trim(),
        email: normalizedEmail,
        whatsappPhone: normalizedPhone,
        role,
        token: crypto.randomBytes(32).toString('hex'),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        lastAccessAt: new Date(),
      });
    }

    // 🔗 Tie the authenticated wallet to this email on `users` so wallet-based
    // sessions (getNexusAuthContext path 1, incl. SUPER_ADMIN) can resolve
    // name + whatsappPhone — otherwise the completion gate loops forever.
    // Non-blocking: registration must never fail because of this side-write.
    try {
      const wallet = auth.wallet || null;
      if (wallet && wallet !== '0x0000000000000000000000000000000000000000') {
        const walletLower = wallet.toLowerCase();
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.walletAddress, walletLower))
          .limit(1);

        if (existingUser) {
          await db.update(users)
            .set({ email: normalizedEmail, name: name.trim() })
            .where(eq(users.walletAddress, walletLower));
        } else {
          await db.insert(users).values({
            id: crypto.randomUUID(),
            walletAddress: walletLower,
            email: normalizedEmail,
            name: name.trim(),
            role: 'user',
          }).onConflictDoNothing();
        }
      }
    } catch (linkErr) {
      console.warn('[Nexus Register] Wallet→users link skipped (non-blocking):', linkErr);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[Nexus Register] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
