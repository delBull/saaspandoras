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

    const validBooks = ['constitucion', 'libro-i', 'libro-ii', 'libro-iii', 'libro-iv'];
    if (!validBooks.includes(bookSlug)) {
      return NextResponse.json({ error: 'Invalid book' }, { status: 400 });
    }

    const token = await generateToken(email, bookSlug);
    const link = `${BASE_URL}/libros/${bookSlug}?token=${token}`;

    // Send via Telegram instead of email (uses existing security bot pattern)
    const botToken = process.env.TELEGRAM_SECURITY_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    // Always target personal user chat ID 8605526720 (never bot ID/channel ID)
    const chatId = process.env.TELEGRAM_SECURITY_CHAT_ID || '8605526720';

    if (!botToken) {
      console.warn('⚠️ TELEGRAM_SECURITY_BOT_TOKEN is missing in Vercel environment variables');
      return NextResponse.json({ ok: false, error: 'Telegram Bot Token not configured in Vercel' }, { status: 500 });
    }

    const text = `🔐 <b>Pandoras — Acceso a Documento Institucional</b>\n\n📚 Documento: <b>${bookSlug}</b>\n⏱️ Expira en: <b>2 horas</b>\n\n🔗 Enlace de acceso:\n${link}`;
    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });

    if (!tgRes.ok) {
      const errText = await tgRes.text();
      console.error('❌ Telegram API error:', errText);
      return NextResponse.json({ ok: false, error: errText }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
