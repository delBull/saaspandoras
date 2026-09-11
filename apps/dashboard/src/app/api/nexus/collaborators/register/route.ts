import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { nexusCollaborators, users, type NexusProvisionStatus } from '@/db/schema';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';
import { notifyProvisioningRequest } from '@/lib/nexus/provisioning';

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

    // Provisioning policy:
    // - Privileged actors (wallet SUPER_ADMIN/ADMIN or admin email target) → ACTIVE immediately.
    // - Everything else (self-registration via magic link) → PENDING until an admin approves
    //   from the admin queue (/admin/collaborators). No auto-grant for new signups.
    const isPrivilegedActor =
      auth.role === 'SUPER_ADMIN' || auth.role === 'ADMIN' || isNexusAdmin || auth.provisionStatus === 'ACTIVE';
    const desiredStatus: NexusProvisionStatus = isPrivilegedActor ? 'ACTIVE' : 'PENDING';

    const [existing] = await db
      .select()
      .from(nexusCollaborators)
      .where(eq(nexusCollaborators.email, normalizedEmail))
      .limit(1);

    if (existing) {
      // Guard: never downgrade an already-approved or already-denied collaborator
      // through a self-registration re-run. PENDING stays PENDING until admin acts.
      const effectiveStatus: NexusProvisionStatus =
        existing.status === 'ACTIVE' || existing.status === 'REJECTED' || existing.status === 'DISABLED'
          ? (existing.status as NexusProvisionStatus)
          : desiredStatus;

      await db.update(nexusCollaborators).set({
        name: name.trim(),
        whatsappPhone: normalizedPhone,
        lastAccessAt: new Date(),
        // Solo sube de rol si actualmente es COLLABORATOR; nunca degrada roles elevados
        role: existing.role === 'COLLABORATOR' ? role : existing.role,
        status: effectiveStatus,
        statusChangedAt: existing.status !== effectiveStatus ? new Date() : existing.statusChangedAt,
      }).where(eq(nexusCollaborators.email, normalizedEmail));

      // Notify admin queue when a self-registration moves INTO pending (new signup path)
      if (effectiveStatus === 'PENDING' && existing.status !== 'PENDING') {
        void notifyProvisioningRequest({ name: name.trim(), email: normalizedEmail, whatsappPhone: normalizedPhone, role });
      }
    } else {
      await db.insert(nexusCollaborators).values({
        name: name.trim(),
        email: normalizedEmail,
        whatsappPhone: normalizedPhone,
        role,
        status: desiredStatus,
        statusChangedAt: desiredStatus === 'PENDING' ? new Date() : null,
        token: crypto.randomBytes(32).toString('hex'),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        lastAccessAt: new Date(),
      });

      if (desiredStatus === 'PENDING') {
        void notifyProvisioningRequest({ name: name.trim(), email: normalizedEmail, whatsappPhone: normalizedPhone, role });
      }
    }

    // 🔗 Tie the authenticated wallet to this email on `users` so wallet-based
    // sessions (getNexusAuthContext path 1, incl. SUPER_ADMIN) can resolve
    // name + whatsappPhone — otherwise the completion gate loops forever.
    // Non-blocking: registration must never fail because of this side-write.
    //
    // Conflict tolerance: the email may ALREADY belong to another `users` row
    // (users_email_unique). In that case we DON'T force the email onto this
    // wallet row — the duplicate-key fault that previously made the gate loop
    // ("redirigiendo" forever) — the SUPER_ADMIN auth path falls back to the
    // env admin list + nexusCollaborators record to resolve the profile.
    try {
      const wallet = auth.wallet || null;
      if (wallet && wallet !== '0x0000000000000000000000000000000000000000') {
        const walletLower = wallet.toLowerCase();
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.walletAddress, walletLower))
          .limit(1);

        const [emailOwner] = await db
          .select({ id: users.id, walletAddress: users.walletAddress })
          .from(users)
          .where(eq(users.email, normalizedEmail))
          .limit(1);

        const emailIsFree = !emailOwner;

        if (existingUser) {
          await db.update(users)
            .set({
              ...(emailIsFree ? { email: normalizedEmail } : {}),
              name: name.trim(),
              ...(isPrivilegedActor ? { role: 'super_admin' } : {}),
            })
            .where(eq(users.walletAddress, walletLower));
        } else if (emailIsFree) {
          await db.insert(users).values({
            id: crypto.randomUUID(),
            walletAddress: walletLower,
            email: normalizedEmail,
            name: name.trim(),
            role: isPrivilegedActor ? 'super_admin' : 'user',
          }).onConflictDoNothing();
        } else {
          // Email owned by another row → create an email-less wallet stub so
          // the wallet session still resolves `name`; auth falls back to the
          // collaborator record for the full profile.
          await db.insert(users).values({
            id: crypto.randomUUID(),
            walletAddress: walletLower,
            name: name.trim(),
            role: isPrivilegedActor ? 'super_admin' : 'user',
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
