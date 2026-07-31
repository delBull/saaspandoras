import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const ADMIN_EMAIL = 'marco.munoz9@gmail.com';
const MAGIC_LINK_SECRET = process.env.BOOKS_MAGIC_LINK_SECRET ?? 'pandoras_books_secret_2026';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pandoras.finance';
const TOKEN_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export const runtime = 'edge';

function generateToken(email: string, bookSlug: string): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `${email}:${bookSlug}:${exp}`;
  const sig = crypto
    .createHmac('sha256', MAGIC_LINK_SECRET)
    .update(payload)
    .digest('hex');
  const raw = JSON.stringify({ email, bookSlug, exp, sig });
  return Buffer.from(raw).toString('base64url');
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

    const token = generateToken(email, bookSlug);
    const link = `${BASE_URL}/libros/${bookSlug}?token=${token}`;

    // Send via Telegram instead of email (uses existing security bot pattern)
    const botToken = process.env.TELEGRAM_SECURITY_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_SECURITY_CHAT_ID ?? '8605526720';

    if (botToken) {
      const text = `🔐 <b>Pandoras — Acceso a Libro Institucional</b>\n\n📚 Libro: <b>${bookSlug}</b>\n⏱️ Expira en: <b>2 horas</b>\n\n🔗 Enlace de acceso:\n<code>${link}</code>`;
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
