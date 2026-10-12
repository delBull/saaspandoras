/**
 * Canonical Types for Email Engine & Sovereign Communications
 * Frozen Contracts: FC-001 (Canonical Identity), FC-005 (Runtime Config), FC-014 (Presentation Boundary)
 */

export type EmailFooterProfile = 
  | 'transactional' // Compras, inversiones, certificados RWA, hash on-chain, disclaimers regulatorios
  | 'tenant'        // Comunicaciones generales de la organización / citas de clientes
  | 'platform'      // Notificaciones institucionales de Pandoras Growth OS / Billing / Hermes alerts
  | 'identity'      // Magic links, reseteo de credenciales, seguridad, avisos de no compartir
  | 'marketing';     // Nurture, deal rooms, newsletter, con 1-click unsubscribe

export interface CanonicalEmailBranding {
  tenantId?: string;
  name: string;
  logoUrl?: string;
  accentColor: string;
  supportEmail?: string;
  isPandorasPlatform?: boolean;
  legalUrls?: {
    terms?: string;
    privacy?: string;
    agreement?: string;
    riskDisclosure?: string;
    phaseDynamics?: string;
  };
}

export interface EmailRenderOptions<T = any> {
  template: React.ComponentType<T>;
  props: T;
  branding?: CanonicalEmailBranding;
  footerProfile?: EmailFooterProfile;
}

export interface RenderedEmailOutput {
  html: string;
  text?: string;
}

export interface SendEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  attachments?: {
    filename: string;
    content: string; // Base64 encoded content
    content_type?: string;
  }[];
}
