/**
 * @pandoras/identity-sdk — Identity & Brand Specification
 * 
 * Contrato oficial de identidades dinámicas para Tenants en Pandora's Growth OS.
 * Define la marca visual, paleta cromática, voz de IA, canales y pie legal de cada Organización.
 */

export interface BrandInfo {
  /** Nombre completo de la marca / plataforma (ej. "S'Narai", "BMW México") */
  name: string;
  /** Nombre corto o acrónimo para espacios reducidos (ej. "SNARAI", "BMW") */
  shortName: string;
  /** URL pública del logotipo principal */
  logoUrl: string;
  /** URL pública del favicon */
  faviconUrl?: string;
  /** Razón social / entidad legal emisora para pie de página y contratos */
  legalName: string;
}

export interface ColorPalette {
  /** Color primario de marca (hex) */
  primary: string;
  /** Color secundario de marca (hex) */
  secondary: string;
  /** Color de acento / resalte (hex) */
  accent: string;
  /** Color de fondo principal (hex) */
  background: string;
  /** Color de superficie / cards (hex) */
  surface: string;
}

export interface VoiceConfig {
  /** Nombre del agente de IA que interactúa con clientes (ej. "Hermes", "Nova") */
  agentName: string;
  /** Tono de comunicación para el System Prompt del LLM */
  tone: 'luxury' | 'corporate' | 'friendly' | 'minimal';
  /** ID de voz registrado en ElevenLabs para notas de audio */
  elevenLabsVoiceId?: string;
  /** Firma o despedida institucional del agente */
  signature: string;
}

export interface ChannelEndpoints {
  /** Username del bot de Telegram asignado (ej. "snaraiassit_bot") */
  telegramBotUsername?: string;
  /** Número de teléfono o ID de canal WhatsApp */
  whatsappPhone?: string;
  /** Dominio web oficial asignado o custom domain */
  webDomain: string;
}

export interface IdentityPack {
  /** ID único del Tenant / Organización (ej. "snarai", "aztecas-realty") */
  tenantId: string;
  /** Información institucional de marca */
  brand: BrandInfo;
  /** Paleta de colores visuales */
  palette: ColorPalette;
  /** Configuración de personalidad y voz de IA */
  voice: VoiceConfig;
  /** Enlaces de canales activos */
  channels: ChannelEndpoints;
  /** Metadatos adicionales flexibles por Tenant */
  metadata?: Record<string, unknown>;
}

/**
 * IdentityPack default seguro para desarrollo y fallback
 */
export const DEFAULT_IDENTITY_PACK: IdentityPack = {
  tenantId: 'default',
  brand: {
    name: "Pandora's Growth OS",
    shortName: "Pandoras",
    logoUrl: "/images/logo.png",
    legalName: "Pandoras Technologies S.A.P.I. de C.V."
  },
  palette: {
    primary: "#f59e0b",
    secondary: "#6366f1",
    accent: "#10b981",
    background: "#070709",
    surface: "#18181b"
  },
  voice: {
    agentName: "Hermes",
    tone: "luxury",
    signature: "Atentamente, Hermes AI Assistant."
  },
  channels: {
    webDomain: "dash.pandoras.finance"
  }
};

/**
 * Resolver de identidades dinámicas con fallbacks seguros
 */
export class IdentityResolver {
  private static registry = new Map<string, IdentityPack>();

  public static registerPack(pack: IdentityPack): void {
    this.registry.set(pack.tenantId.toLowerCase(), pack);
  }

  public static getPack(tenantId: string): IdentityPack {
    const pack = this.registry.get(tenantId.toLowerCase());
    if (pack) return pack;

    return {
      ...DEFAULT_IDENTITY_PACK,
      tenantId
    };
  }

  public static hasPack(tenantId: string): boolean {
    return this.registry.has(tenantId.toLowerCase());
  }
}
