// WhatsApp Configuration - Shared across the WhatsApp module
export const WHATSAPP = {
  TOKEN: process.env.WHATSAPP_ACCESS_TOKEN!,
  PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID!,
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