// WhatsApp Configuration - Shared across the WhatsApp module
//
// Canonical phone-number mapping (verified against Meta Cloud API):
//   HERMES_PHONE_NUMBER_ID = 685462974640240  → +52 1 322 137 4392 (Pandoras Foundation / Hermes)
//   SOFIA_PHONE_NUMBER_ID  = 1230634130138012 → +1 833-435-4527    (Pandora's Media Co / Sofía)
// Legacy names remain as fallbacks for backward compatibility.
export function resolveMasterPhoneNumberId(): string {
  return (
    process.env.HERMES_PHONE_NUMBER_ID ||
    process.env.WHATSAPP_PHONE_NUMBER_ID ||
    process.env.META_PHONE_NUMBER_ID ||
    process.env.HERMES_WHATSAPP_PHONE_NUMBER_ID ||
    process.env.HERMES_WHATSAPP_PHONE_NUMBER ||
    ''
  ).trim();
}

export function resolveSofiaPhoneNumberId(): string {
  return (
    process.env.SOFIA_PHONE_NUMBER_ID ||
    process.env.META_PHONE_NUMBER_ID_SOFIA ||
    process.env.META_PHONE_NUMBER_ID_MEDIACO ||
    ''
  ).trim();
}

export const WHATSAPP = {
  TOKEN: process.env.WHATSAPP_ACCESS_TOKEN!,
  PHONE_NUMBER_ID: resolveMasterPhoneNumberId(),
  BUSINESS_ACCOUNT_ID: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!,
  VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN!,
  API_URL: 'https://graph.facebook.com/v17.0'
};

// Validation function
export function validateWhatsAppConfig() {
  const required = ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_VERIFY_TOKEN'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`⚠️ WhatsApp config missing env vars: ${missing.join(', ')}`);
    return false;
  }

  console.log('✅ WhatsApp config validated successfully');
  return true;
}