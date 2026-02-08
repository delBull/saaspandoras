import * as crypto from 'crypto';

/**
 * Signs a raw request body using HMAC-SHA256 and the provided secret.
 * @param rawBody The stringified body to sign.
 * @param secret The client's callback secret.
 * @returns Hexadecimal signature.
 */
export function signRawBody(
    rawBody: string,
    secret: string,
): string {
    return crypto
        .createHmac('sha256', secret)
        .update(rawBody, 'utf8')
        .digest('hex');
}
