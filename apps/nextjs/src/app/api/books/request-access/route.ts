import { NextRequest, NextResponse } from 'next/server';

const ADMIN_EMAIL = 'marco.munoz9@gmail.com';
const MAGIC_LINK_SECRET = process.env.BOOKS_MAGIC_LINK_SECRET ?? 'pandoras_books_secret_2026';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pandoras.finance';
const TOKEN_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export const runtime = 'edge';

async function generateToken(email: string, bookSlug: string): Promise<string> {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `${email}:${bookSlug}:${exp}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(MAGIC_LINK_SECRET);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(payload)
  );

  const sig = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const raw = JSON.stringify({ email, bookSlug, exp, sig });
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function POST(req: NextRequest) {
  try {
    const { email, bookSlug } = await req.json() as { email: string; bookSlug: string };

    if (!email || !bookSlug) {
      return NextResponse.json({ error: 'Missing email or bookSlug' }, { status: 400 });
    }

    // Only allow the admin email
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      // Return 200 anyway to avoid email enumeration
      return NextResponse.json({ ok: true });
    }

    // Delivery Channel: Discord Webhook Only (Private Admin Channel)
    const discordWebhook = process.env.DISCORD_SECURITY_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;

    const validBooks = ['all', 'constitucion', 'libro-i', 'libro-ii', 'libro-iii', 'libro-iv'];
    const targetSlug = bookSlug || 'all';
    if (!validBooks.includes(targetSlug)) {
      return NextResponse.json({ error: 'Invalid book' }, { status: 400 });
    }
    const token = await generateToken(email, targetSlug);
    const destinationPath = targetSlug === 'all' ? '/libros' : `/libros/${targetSlug}`;
    const link = `${BASE_URL}${destinationPath}?token=${token}`;

    if (!discordWebhook) {
      console.warn('⚠️ DISCORD_WEBHOOK_URL is missing in Vercel environment variables');
      return NextResponse.json({ ok: false, error: 'Discord Webhook not configured in Vercel' }, { status: 500 });
    }

    try {
      const discordRes = await fetch(discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🔐 **Pandoras — Acceso a Biblioteca Institucional**\n📚 **Documento:** ${targetSlug === 'all' ? 'Acceso Global (Todos los Libros)' : targetSlug}\n⏱️ **Expira en:** 2 horas\n🔗 **Enlace:** ${link}`,
        }),
      });

      if (!discordRes.ok) {
        const errText = await discordRes.text();
        console.error('❌ Discord Webhook error:', errText);
        return NextResponse.json({ ok: false, error: errText }, { status: 500 });
      }
    } catch (e: any) {
      console.error('❌ Discord fetch error:', e);
      return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
