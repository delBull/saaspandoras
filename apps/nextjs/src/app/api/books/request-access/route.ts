import { NextRequest, NextResponse } from 'next/server';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? process.env.NEXUS_ADMIN_EMAIL ?? 'marco.munoz9@gmail.com').toLowerCase();
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

// Simple in-memory rate limiting map for edge runtime (IP -> timestamp)
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_COOLDOWN_MS = 3000; // 3 seconds cooldown

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown-ip';
    const lastRequest = rateLimitMap.get(ip);
    const now = Date.now();

    if (lastRequest && now - lastRequest < RATE_LIMIT_COOLDOWN_MS) {
      return NextResponse.json({ ok: false, error: 'Demasiadas solicitudes. Por favor espera unos segundos.' }, { status: 429 });
    }

    rateLimitMap.set(ip, now);

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

    // Always issue token with 'all' scope so requesting access unlocks all books globally for 2 hours
    const targetSlug = 'all';
    const token = await generateToken(email, targetSlug);
    const destinationPath = `/libros?token=${token}`;
    const link = `${BASE_URL}${destinationPath}`;

    if (!discordWebhook) {
      console.warn('⚠️ DISCORD_WEBHOOK_URL is missing in Vercel environment variables');
      return NextResponse.json({ ok: false, error: 'Discord Webhook not configured in Vercel' }, { status: 500 });
    }

    try {
      const bookTitles: Record<string, string> = {
        'all': '📚 Acceso Global (Todos los Libros 0–VIII & Standards)',
        'constitucion': '📖 Libro 0 — Constitution (Documento Supremo)',
        'libro-i': '📖 Libro I — Corporate Charter',
        'libro-ii': '📖 Libro II — Corporate Governance',
        'libro-iii': '📖 Libro III — Institutional Treasury',
        'libro-iv': '📖 Libro IV — IP & Asset Register',
        'libro-v': '📖 Libro V — Licensing Framework',
        'libro-vi': '📖 Libro VI — Technology Platform & Capital Engine',
        'libro-vii': '📖 Libro VII — Growth & Expansion',
        'libro-viii': '📖 Libro VIII — Institutional Doctrine',
      };

      const displayTitle = bookTitles[bookSlug] || bookSlug;

      const discordRes = await fetch(discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'Pandoras Institutional Governance',
          avatar_url: 'https://pandoras.finance/favicon.ico',
          embeds: [
            {
              title: '🔐 Token de Acceso Firmado — Pandoras Institutional Library',
              description: `Se ha generado un token de acceso seguro para la lectura de la documentación institucional.`,
              color: 0xd97706, // Amber gold
              fields: [
                { name: '👤 Usuario Autorizado', value: email, inline: true },
                { name: '📚 Recurso Solicitado', value: displayTitle, inline: true },
                { name: '⏱️ Validez del Enlace', value: '2 Horas (TTL Hmac SHA-256)', inline: false },
                { name: '🔗 Enlace Único de Acceso', value: `[👉 Haz clic para acceder a la Biblioteca](${link})` },
              ],
              footer: {
                text: 'Pandoras Group Holdings · Protocolo de Seguridad Corporativa',
              },
              timestamp: new Date().toISOString(),
            },
          ],
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
