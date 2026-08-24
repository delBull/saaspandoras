import crypto from 'crypto';
import { 
  TelegramAuthIdentity, 
  HermesInvalidInitDataError, 
  HermesExpiredInitDataError 
} from './hermes-session.types';

export interface TelegramAuthValidatorOptions {
  botToken?: string;
  maxAgeSeconds?: number; // Default 86400 (24 hours)
}

export class TelegramAuthValidator {
  private botToken: string;
  private maxAgeSeconds: number;

  constructor(options: TelegramAuthValidatorOptions = {}) {
    this.botToken = options.botToken || process.env.TELEGRAM_BOT_TOKEN || '';
    this.maxAgeSeconds = options.maxAgeSeconds ?? 86400; // 24 hours max
  }

  /**
   * Validates Telegram WebApp initData string using HMAC-SHA256.
   * 
   * Reference Telegram algorithm:
   * 1. secret_key = HMAC_SHA256("WebAppData", botToken)
   * 2. data_check_string = sorted alphabetically (k=v, joined by \n, excluding hash)
   * 3. calculated_hash = HMAC_SHA256(secret_key, data_check_string).hex()
   * 4. timingSafeEqual(hash, calculated_hash)
   */
  validateInitData(initData: string, overrideBotToken?: string): TelegramAuthIdentity {
    const token = overrideBotToken || this.botToken;
    if (!token) {
      throw new HermesInvalidInitDataError('TELEGRAM_BOT_TOKEN is not configured.');
    }

    if (!initData || typeof initData !== 'string' || !initData.trim()) {
      throw new HermesInvalidInitDataError('initData string is empty or invalid.');
    }

    const params = new URLSearchParams(initData);
    const hash = params.get('hash');

    if (!hash) {
      throw new HermesInvalidInitDataError('hash parameter is missing from initData.');
    }

    // 1. Build sorted data_check_string
    const keys: string[] = [];
    params.forEach((_, key) => {
      if (key !== 'hash') {
        keys.push(key);
      }
    });
    keys.sort();

    const dataCheckString = keys
      .map(key => `${key}=${params.get(key)}`)
      .join('\n');

    // 2. Derive secret key: HMAC_SHA256("WebAppData", botToken)
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(token)
      .digest();

    // 3. Compute expected hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // 4. Constant-time comparison
    const hashBuffer = Buffer.from(hash, 'hex');
    const calculatedBuffer = Buffer.from(calculatedHash, 'hex');

    if (
      hashBuffer.length !== calculatedBuffer.length ||
      !crypto.timingSafeEqual(hashBuffer, calculatedBuffer)
    ) {
      throw new HermesInvalidInitDataError('Cryptographic signature mismatch (HMAC-SHA256 verification failed).');
    }

    // 5. Verify auth_date freshness
    const authDateStr = params.get('auth_date');
    if (!authDateStr) {
      throw new HermesInvalidInitDataError('auth_date parameter is missing.');
    }

    const authDate = parseInt(authDateStr, 10);
    if (isNaN(authDate)) {
      throw new HermesInvalidInitDataError('auth_date parameter is not a valid integer.');
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const ageSeconds = nowSeconds - authDate;

    if (ageSeconds > this.maxAgeSeconds) {
      throw new HermesExpiredInitDataError(ageSeconds);
    }

    // Future replay tolerance (allow up to 60s of clock drift)
    if (ageSeconds < -60) {
      throw new HermesInvalidInitDataError('auth_date is in the future.');
    }

    // 6. Extract user object
    const userStr = params.get('user');
    if (!userStr) {
      throw new HermesInvalidInitDataError('user parameter is missing from initData.');
    }

    try {
      const user = JSON.parse(userStr);
      if (!user.id) {
        throw new HermesInvalidInitDataError('user.id is missing.');
      }

      return {
        telegramUserId: String(user.id),
        username: user.username || undefined,
        firstName: user.first_name || undefined,
        lastName: user.last_name || undefined,
        authDate,
        hash
      };
    } catch (err: any) {
      if (err instanceof HermesInvalidInitDataError) throw err;
      throw new HermesInvalidInitDataError(`Failed to parse user JSON: ${err.message}`);
    }
  }

  /**
   * Helper utility for tests and internal testing to generate valid signed initData strings.
   */
  static generateValidInitData(params: {
    user: { id: number | string; username?: string; first_name?: string; last_name?: string };
    authDate?: number;
    botToken: string;
    extraParams?: Record<string, string>;
  }): string {
    const authDate = params.authDate ?? Math.floor(Date.now() / 1000);
    const searchParams = new URLSearchParams();
    searchParams.set('auth_date', String(authDate));
    searchParams.set('user', JSON.stringify(params.user));

    if (params.extraParams) {
      Object.entries(params.extraParams).forEach(([k, v]) => searchParams.set(k, v));
    }

    const keys: string[] = [];
    searchParams.forEach((_, key) => keys.push(key));
    keys.sort();

    const dataCheckString = keys.map(key => `${key}=${searchParams.get(key)}`).join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(params.botToken).digest();
    const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    searchParams.set('hash', hash);
    return searchParams.toString();
  }
}
