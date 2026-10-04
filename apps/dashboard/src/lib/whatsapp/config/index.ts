// WhatsApp configuration exports
export {
  LANDING_FLOW_CONFIG,
  getWhatsAppUrl,
  getLandingConfigByUrl,
  LANDING_ANALYTICS,
  FLOW_RESTRICTIONS
} from './landingConfig';

// WhatsApp Cloud API configuration
import { resolveMasterPhoneNumberId } from '@saasfly/shared';

export const WHATSAPP = {
  API_URL: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
  TOKEN: process.env.WHATSAPP_ACCESS_TOKEN || '',
  PHONE_NUMBER_ID: resolveMasterPhoneNumberId(),
  BUSINESS_PHONE: process.env.WHATSAPP_BUSINESS_PHONE || '+5213321373984',
  VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN || 'pandoras_whatsapp_verify_2025'
};
