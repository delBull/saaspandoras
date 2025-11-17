export const WHATSAPP = {
  TOKEN: process.env.WHATSAPP_ACCESS_TOKEN!,
  PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID!,
  BUSINESS_ACCOUNT_ID: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!,
  VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN!,
  API_URL: "https://graph.facebook.com/v19.0",
  WEBHOOK_BASE_URL: process.env.NEXT_PUBLIC_URL,
};

// Validación segura de configuración
export function validateWhatsAppConfig() {
  const required = ['TOKEN', 'PHONE_NUMBER_ID', 'VERIFY_TOKEN'] as const;
  const missing = required.filter(key => !WHATSAPP[key]);

  if (missing.length > 0) {
    console.error('❌ Faltan variables de WhatsApp (REQUERIDAS):', missing);
    console.error('🔧 Configura las siguientes variables de entorno:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('🔒 Estas variables deben estar en .env.local y Vercel (encriptadas)');
    return false;
  }

  console.log('✅ Configuración WhatsApp validada y segura');
  return true;
}
