const MAGIC_LINK_SECRET = process.env.BOOKS_MAGIC_LINK_SECRET ?? 'pandoras_books_secret_2026';

export interface TokenPayload {
  email: string;
  bookSlug: string;
  exp: number;
}

export async function verifyBookToken(token: string): Promise<TokenPayload | null> {
  try {
    const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const raw = atob(padded);
    const payload = JSON.parse(raw) as TokenPayload & { sig: string };

    if (Date.now() > payload.exp) return null;

    const check = `${payload.email}:${payload.bookSlug}:${payload.exp}`;
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
      encoder.encode(check)
    );

    const expectedSig = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (payload.sig !== expectedSig) {
      return null;
    }

    return { email: payload.email, bookSlug: payload.bookSlug, exp: payload.exp };
  } catch {
    return null;
  }
}
