import { NextResponse } from 'next/server';
import { db } from '@/db';
import { ambassadors } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendAmbassadorOTPEmail } from '@/lib/email/ambassador-mailer';
import { projects } from '@/db/schema';
import { withSecurity, isValidWalletAddress, isValidEmail, registerRateLimiter } from '@/lib/security-utils';
import crypto from 'crypto';

async function handler(req: Request) {
    const body = await req.json();
    const {
        fullName,
        email,
        phone,
        socialUrl,
        walletAddress,
        origin = "pandoras",
        projectId
    } = body;

    if (!fullName || !email) {
        return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();

    // 🛡️ Input sanitization
    const sanitizedName = fullName.trim().replace(/[<>]/g, '').substring(0, 255);
    const sanitizedPhone = phone?.trim().replace(/[<>]/g, '').substring(0, 50) || null;
    const sanitizedSocial = socialUrl?.trim().replace(/[<>]/g, '').substring(0, 255) || null;

    if (!isValidEmail(emailLower)) {
        return NextResponse.json({ error: 'Formato de correo inválido' }, { status: 400 });
    }

    if (!sanitizedName) {
        return NextResponse.json({ error: 'Nombre inválido' }, { status: 400 });
    }

    if (!walletAddress || !isValidWalletAddress(walletAddress)) {
        return NextResponse.json({ error: 'Cuenta digital requerida. Conecta tu cuenta antes de registrarte.' }, { status: 400 });
    }

    // 1. Check if email already exists
    const existing = await db.query.ambassadors.findFirst({
        where: eq(ambassadors.email, emailLower)
    });

    if (existing) {
        return NextResponse.json({ error: 'Este correo ya está registrado como Gestor Patrimonial/Ambassador' }, { status: 409 });
    }

    // 2. Load project for slug-based referral code prefix
    let projectSlug = '';
    if (projectId) {
        const projectData = await db.query.projects.findFirst({
            where: eq(projects.id, Number(projectId))
        });
        if (projectData) {
            projectSlug = projectData.slug || '';
        }
    }

    // 3. Generate unique referral code with project prefix (e.g., SNARAI-MARIO-1234)
    const namePart = sanitizedName.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '').substring(0, 8);
    const prefix = projectSlug ? `${projectSlug.toUpperCase().replace(/[^A-Z0-9]/g, '')}-` : '';
    const randomNumbers = crypto.randomInt(10000, 99999);
    let referralCode = `${prefix}${namePart}-${randomNumbers}`;

    // Ensure uniqueness
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
        const checkCode = await db.query.ambassadors.findFirst({
            where: eq(ambassadors.referralCode, referralCode)
        });
        if (!checkCode) {
            isUnique = true;
        } else {
            referralCode = `${prefix}${namePart}-${crypto.randomInt(10000, 99999)}`;
            attempts++;
        }
    }
    if (!isUnique) {
        return NextResponse.json({ error: 'Error generando código único, intente de nuevo' }, { status: 500 });
    }

    // 4. Generate OTP (6 digits, cryptographically secure) with 15-minute expiry
    const otp = crypto.randomInt(100000, 999999).toString();
    const verificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // 5. Insert into database
    const [newAmbassador] = await db.insert(ambassadors).values({
        fullName: sanitizedName,
        email: emailLower,
        phone: sanitizedPhone,
        socialUrl: sanitizedSocial,
        walletAddress: walletAddress.toLowerCase(),
        referralCode,
        origin: origin as any,
        projectId: projectId ? Number(projectId) : null,
        status: 'APPLIED',
        emailVerified: false,
        verificationToken: otp,
        verificationExpiresAt
    }).returning();

    if (!newAmbassador) {
        return NextResponse.json({ error: 'Error al crear el registro del embajador' }, { status: 500 });
    }

    // 6. Send OTP Email
    await sendAmbassadorOTPEmail(emailLower, sanitizedName, otp);
    return NextResponse.json({
        success: true,
        message: 'OTP enviado. Por favor verifica tu correo.',
        ambassadorId: newAmbassador.id,
        referralCode: newAmbassador.referralCode,
        email: newAmbassador.email
    });
}

export const POST = withSecurity(handler, { rateLimit: registerRateLimiter });
