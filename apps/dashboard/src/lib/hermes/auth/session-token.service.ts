import crypto from 'crypto';
import { 
  HermesSession, 
  HermesTokenPayload, 
  HermesAuthError 
} from './hermes-session.types';

export class SessionTokenService {
  private secret: string;

  constructor(overrideSecret?: string) {
    this.secret = overrideSecret || 
      process.env.HERMES_SESSION_SECRET || 
      (process.env.NODE_ENV === 'test' ? (process.env.JWT_SECRET || process.env.AUTH_SECRET || '') : '');
  }

  private getSigningKey(): Buffer {
    if (!this.secret) {
      throw new HermesAuthError('HERMES_SESSION_SECRET is not configured in environment.', 'MISSING_SESSION_SECRET', 500);
    }
    return crypto.createHash('sha256').update(this.secret).digest();
  }

  private base64UrlEncode(str: string | Buffer): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  private base64UrlDecode(str: string): string {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    return Buffer.from(str, 'base64').toString('utf8');
  }

  /**
   * Issues a compact, cryptographically signed JWT for the HermesSession.
   */
  issueToken(session: HermesSession): string {
    const key = this.getSigningKey();

    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const payload: HermesTokenPayload = {
      sub: session.actorId,
      telegramUserId: session.subject.telegramUserId,
      organizationId: session.tenant.organizationId,
      role: session.role,
      sessionId: session.sessionId,
      source: 'TELEGRAM',
      iat: Math.floor(session.issuedAt / 1000),
      exp: Math.floor(session.expiresAt / 1000)
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    const signature = crypto
      .createHmac('sha256', key)
      .update(signingInput)
      .digest();
    const encodedSignature = this.base64UrlEncode(signature);

    return `${signingInput}.${encodedSignature}`;
  }

  /**
   * Verifies and decodes a Hermes session token with tamper detection and mandatory expiry verification.
   */
  verifyToken(token: string): HermesTokenPayload {
    if (!token || typeof token !== 'string') {
      throw new HermesAuthError('Session token is missing or malformed.', 'INVALID_TOKEN', 401);
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new HermesAuthError('Invalid JWT token structure.', 'MALFORMED_TOKEN', 401);
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    if (!encodedHeader || !encodedPayload || !encodedSignature) {
      throw new HermesAuthError('Invalid JWT token structure.', 'MALFORMED_TOKEN', 401);
    }
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const key = this.getSigningKey();

    // 1. Verify header alg
    try {
      const header = JSON.parse(this.base64UrlDecode(encodedHeader));
      if (header.alg !== 'HS256') {
        throw new HermesAuthError(`Unsupported JWT algorithm: ${header.alg}`, 'UNSUPPORTED_ALGORITHM', 401);
      }
    } catch (err: any) {
      if (err instanceof HermesAuthError) throw err;
      throw new HermesAuthError(`Invalid token header: ${err.message}`, 'MALFORMED_HEADER', 401);
    }

    // 2. Verify signature
    const expectedSignature = this.base64UrlEncode(
      crypto.createHmac('sha256', key).update(signingInput).digest()
    );

    const sigBuffer = Buffer.from(encodedSignature);
    const expectedSigBuffer = Buffer.from(expectedSignature);

    if (
      sigBuffer.length !== expectedSigBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)
    ) {
      throw new HermesAuthError('Session token signature verification failed (tampered token).', 'INVALID_SIGNATURE', 401);
    }

    // 3. Parse and verify payload (with mandatory exp and required authority fields)
    try {
      const payload: HermesTokenPayload = JSON.parse(this.base64UrlDecode(encodedPayload));

      const nowSeconds = Math.floor(Date.now() / 1000);
      if (!payload.exp || typeof payload.exp !== 'number') {
        throw new HermesAuthError('Session token is missing mandatory exp timestamp.', 'MISSING_EXP', 401);
      }

      if (payload.exp < nowSeconds) {
        throw new HermesAuthError('Session token has expired.', 'EXPIRED_TOKEN', 401);
      }

      if (!payload.organizationId || !payload.telegramUserId || !payload.sub) {
        throw new HermesAuthError('Session token payload is missing required authority fields.', 'INCOMPLETE_PAYLOAD', 401);
      }

      return payload;
    } catch (err: any) {
      if (err instanceof HermesAuthError) throw err;
      throw new HermesAuthError(`Failed to decode token payload: ${err.message}`, 'PAYLOAD_DECODE_ERROR', 401);
    }
  }
}
