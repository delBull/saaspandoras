import crypto from "crypto";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Valida initData de Telegram WebApp usando HMAC-SHA256
 * @param initData Datos crudos recibidos del Mini App
 * @returns Object con isValid y el usuario decodificado si es válido
 */
export function validateTelegramInitData(initData: string): { isValid: boolean; user?: any } {
    if (!BOT_TOKEN) {
        console.error("❌ TELEGRAM_BOT_TOKEN not set");
        return { isValid: false };
    }

    try {
        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get('hash');
        urlParams.delete('hash');

        // Ordenar parámetros alfabéticamente
        const dataCheckString = Array.from(urlParams.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        // Calcular hash
        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
        const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

        if (calculatedHash !== hash) {
            console.warn("⚠️ Telegram hash mismatch");
            return { isValid: false };
        }

        const authDate = Number(urlParams.get('auth_date'));
        if (!authDate) {
            console.warn("⚠️ Telegram auth_date missing");
            return { isValid: false };
        }

        const nowInSeconds = Math.floor(Date.now() / 1000);
        // Expiration: 24 hours (86400 seconds)
        if (nowInSeconds - authDate > 86400) {
            console.warn("⚠️ Telegram initData expired");
            return { isValid: false };
        }

        const userJson = urlParams.get('user');
        const user = userJson ? JSON.parse(userJson) : null;

        return { isValid: true, user };
    } catch (e) {
        console.error("❌ Error validating Telegram initData:", e);
        return { isValid: false };
    }
}
