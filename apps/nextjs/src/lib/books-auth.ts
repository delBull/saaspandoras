import crypto from 'crypto';

const MAGIC_LINK_SECRET = process.env.BOOKS_MAGIC_LINK_SECRET ?? 'pandoras_books_secret_2026';

export interface TokenPayload {
  email: string;
  bookSlug: string;
  exp: number;
}

export function verifyBookToken(token: string): TokenPayload | null {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf-8');
    const payload = JSON.parse(raw) as TokenPayload & { sig: string };

    if (Date.now() > payload.exp) return null;

    const check = `${payload.email}:${payload.bookSlug}:${payload.exp}`;
    const expectedSig = crypto
      .createHmac('sha256', MAGIC_LINK_SECRET)
      .update(check)
      .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(payload.sig), Buffer.from(expectedSig))) {
      return null;
    }

    return { email: payload.email, bookSlug: payload.bookSlug, exp: payload.exp };
  } catch {
    return null;
  }
}
