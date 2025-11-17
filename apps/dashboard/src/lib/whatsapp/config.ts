export const WHATSAPP = {
  TOKEN: process.env.WHATSAPP_ACCESS_TOKEN || 'EAAOo6PmybsEBP5H8EmtrGTLZAkgcBZA4aiGEv1vFrtongatir7NQwzPm38ZBP3j5EhRUmgLWUBh9zMJcTIIklOp8BOoxHaJTVBdnuAnp6xum0FtbnFHPzYOV18LZCIy3mPmwJZBxDO17gPZBhenWdF0kAbpq5KyXHa2B0nVN8E96au6OLqVko2NiMxERpu97XQ6q2jVei59rMZAYdJ8p53qprAfQqAnyf0jpIGzNZBC5ZCoZC5TyW5UwzxRe4ZD',
  PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || '685462974640240',
  BUSINESS_ACCOUNT_ID: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '1263835731804296',
  VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN || 'pandoras_whatsapp_verify_2025',
  API_URL: "https://graph.facebook.com/v19.0",
  WEBHOOK_BASE_URL: process.env.NEXT_PUBLIC_URL,
};

// Validación de configuración
export function validateWhatsAppConfig() {
  const required = ['TOKEN', 'PHONE_NUMBER_ID', 'VERIFY_TOKEN'];
  const missing = required.filter(key => !WHATSAPP[key as keyof typeof WHATSAPP]);

  if (missing.length > 0) {
    console.warn('❌ WhatsApp config missing:', missing);
    return false;
  }

  console.log('✅ WhatsApp config validated');
  return true;
}
