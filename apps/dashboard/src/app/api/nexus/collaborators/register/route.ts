import { NextRequest, NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { nexusCollaborators, users, type NexusProvisionStatus } from '@saasfly/db/schema';
import crypto from 'crypto';
import { eq } from "@saasfly/db-core";
import {
  NEXUS_DEFAULT_PHONE_COUNTRY_CODE,
  describePhoneFailure,
  normalizePhoneE164,
} from '@saasfly/shared/nexus-phone';
import {
  getNexusAuthContext,
  getTrustedClientIp,
  registerRateLimiter,
} from '@saasfly/shared';
import { notifyProvisioningRequest } from '@/lib/nexus/provisioning';

const ADMIN_EMAILS = [
  'admin@pandoras.finance',
  ...(process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || process.env.NEXUS_ADMIN_EMAIL || '')
    .toLowerCase()
    .split(',')
    .map((e) => e.trim())
].filter(Boolean);

// E.164 + normalización de teléfono: una sola fuente de verdad en @saasfly/shared.
const PHONE_OPTIONS = { defaultCountryCode: NEXUS_DEFAULT_PHONE_COUNTRY_CODE };

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 registration attempts per minute per IP
    const ip = getTrustedClientIp(req.headers);
    if (!(await registerRateLimiter.isAllowed(`nexus-collab-register:ip:${ip}`))) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes de registro. Por favor, intenta de nuevo en un minuto.' },
        { status: 429 }
      );
    }

    // Session guard: solo actores autenticados pueden auto-registrarse.
    // Previene que un atacante registre colaboradores arbitrarios con solo conocer email/whatsapp.
    // El token puede venir en el query (magic link legacy) o en el header `x-nexus-token`
    // (transporte vigente: nunca debe reinyectarse un bearer en la URL).
    const tokenParam = req.nextUrl.searchParams.get('token') ?? undefined;
    const presentedToken = tokenParam ?? req.headers.get('x-nexus-token') ?? undefined;
    const auth = await getNexusAuthContext(null, presentedToken);

    if (!auth.isAuthenticated) {
      return NextResponse.json(
        {
          error:
            'Tu sesión de Nexus no está verificada o expiró. Vuelve a firmar con tu billetera o solicita un nuevo magic link.',
        },
        { status: 401 }
      );
    }

    const body: unknown = await req.json();
    const payload = (body !== null && typeof body === 'object' ? body : {}) as Record<string, unknown>;
    const name = typeof payload.name === 'string' ? payload.name.trim() : '';
    const email = typeof payload.email === 'string' ? payload.email.trim() : '';
    // La billetera autoritativa la aporta la sesión (`auth.wallet`), no el body:
    // un `address` enviado por el cliente nunca es autoridad y aquí ya no se exige.
    // Teléfono OPCIONAL: se normaliza sólo si viene provisto. Nunca se fabrica un valor.
    const rawPhone =
      typeof payload.whatsappPhone === 'string' && payload.whatsappPhone.trim()
        ? payload.whatsappPhone
        : null;
    // Borrado EXPLÍCITO del número guardado. Va como bandera separada para que
    // "campo vacío" (conservar) y "quiero eliminar mi número" no se confundan.
    const clearWhatsappPhone = payload.clearWhatsappPhone === true;

    if (!name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let normalizedPhone: string | null = null;
    if (rawPhone !== null) {
      const normalized = normalizePhoneE164(rawPhone, PHONE_OPTIONS);
      if (!normalized.ok) {
        return NextResponse.json(
          { error: describePhoneFailure(normalized.reason, PHONE_OPTIONS) },
          { status: 422 }
        );
      }
      normalizedPhone = normalized.value;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 🛡️ P0 Ownership Guard & Identity Spoofing Protection (Actor !== Target)
    const canManageUsers = Boolean(auth.permissions['users.manage']);
    const targetIsAdminEmail = ADMIN_EMAILS.includes(normalizedEmail);

    // 1. Un actor no autorizado JAMÁS puede registrar ni reclamar un email administrativo
    if (!canManageUsers && targetIsAdminEmail) {
      const actorIsAdmin = auth.email && ADMIN_EMAILS.includes(auth.email.toLowerCase().trim());
      if (!actorIsAdmin) {
        return NextResponse.json(
          { error: 'No autorizado para reclamar un correo institucional administrativo.' },
          { status: 403 }
        );
      }
    }

    // 2. Ownership guard fail-closed: Si el actor ya tiene un email verificado en su sesión,
    // solo puede registrarse para ese mismo email (a menos que tenga users.manage).
    if (!canManageUsers && auth.email && auth.email.toLowerCase().trim() !== normalizedEmail) {
      return NextResponse.json(
        { error: 'Solo puedes completar el registro para tu propio correo verificado.' },
        { status: 403 }
      );
    }

    // 3. Determinación de rol: ÚNICAMENTE calculada sobre el actor autenticado, jamás sobre el target
    const actorRoleIsAdmin = (auth.email && ADMIN_EMAILS.includes(auth.email.toLowerCase().trim())) || auth.role === 'SUPER_ADMIN';
    const assignedRole = actorRoleIsAdmin ? 'SUPER_ADMIN' : 'COLLABORATOR';

    // 4. Provisioning policy: Solo un actor que ya tenga users.manage o sea superadmin activo recibe ACTIVE.
    // Nuevos signups y auto-registros van estrictamente a PENDING.
    const isPrivilegedActor = canManageUsers || (actorRoleIsAdmin && auth.provisionStatus === 'ACTIVE');
    const desiredStatus: NexusProvisionStatus = isPrivilegedActor ? 'ACTIVE' : 'PENDING';

    const [existing] = await db
      .select()
      .from(nexusCollaborators)
      .where(eq(nexusCollaborators.email, normalizedEmail))
      .limit(1);

    if (existing) {
      // 🛡️ P0 Hijack Guard: Una sesión sin email verificado (ej. wallet recién conectada)
      // NO puede secuestrar ni actualizar los datos de un colaborador existente a menos que
      // el actor demuestre control del email o tenga users.manage.
      const hasEmailOwnershipProof = Boolean(auth.email && auth.email.toLowerCase().trim() === normalizedEmail);
      if (!canManageUsers && !hasEmailOwnershipProof) {
        return NextResponse.json(
          { error: 'Este correo ya pertenece a un colaborador. Se requiere validación previa mediante Magic Link.' },
          { status: 403 }
        );
      }

      // Guard: never downgrade an already-approved or already-denied collaborator
      // through a self-registration re-run. PENDING stays PENDING until admin acts.
      const effectiveStatus: NexusProvisionStatus =
        existing.status === 'ACTIVE' || existing.status === 'REJECTED' || existing.status === 'DISABLED'
          ? (existing.status as NexusProvisionStatus)
          : desiredStatus;

      // Fail-safe de datos: un payload SIN teléfono (el operador lo dejó vacío)
      // no debe borrar el número ya almacenado. Sólo se sobrescribe cuando llega
      // un número nuevo ya normalizado, o cuando se pide el borrado explícito.
      const effectivePhone =
        normalizedPhone ?? (clearWhatsappPhone ? null : existing.whatsappPhone ?? null);

      await db.update(nexusCollaborators).set({
        name: name.trim(),
        whatsappPhone: effectivePhone,
        lastAccessAt: new Date(),
        // Solo asciende a SUPER_ADMIN si el actor autenticado tiene esa autoridad
        role: existing.role === 'COLLABORATOR' && isPrivilegedActor ? assignedRole : existing.role,
        status: effectiveStatus,
        statusChangedAt: existing.status !== effectiveStatus ? new Date() : existing.statusChangedAt,
      }).where(eq(nexusCollaborators.email, normalizedEmail));

      // Notify admin queue when a self-registration moves INTO pending (new signup path)
      if (effectiveStatus === 'PENDING' && existing.status !== 'PENDING') {
        void notifyProvisioningRequest({ name: name.trim(), email: normalizedEmail, whatsappPhone: effectivePhone, role: assignedRole });
      }
    } else {
      await db.insert(nexusCollaborators).values({
        name: name.trim(),
        email: normalizedEmail,
        whatsappPhone: normalizedPhone,
        role: assignedRole,
        status: desiredStatus,
        statusChangedAt: desiredStatus === 'PENDING' ? new Date() : null,
        token: crypto.createHash('sha256').update(crypto.randomBytes(32).toString('hex')).digest('hex'),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas (token de reclamación de vigencia acotada)
        lastAccessAt: new Date(),
      });

      if (desiredStatus === 'PENDING') {
        void notifyProvisioningRequest({ name: name.trim(), email: normalizedEmail, whatsappPhone: normalizedPhone, role: assignedRole });
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

    // La cookie de sesión la emite SOLO /api/nexus/session (httpOnly, token de un
    // solo uso). Aquí no se escribe: hacerlo instalaría un token ya canjeado.
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error('[Nexus Register] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
