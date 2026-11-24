/**
 * 🏛️ HERMES OS — Multi-Channel Mesh & Clearance Router
 * src/lib/@/channels/channel-mesh.ts
 *
 * Implements Milestone K27.6:
 * 1. Multi-tenant Channel Mesh (Telegram, Web Widget, Authenticated Portal, WhatsApp).
 * 2. Dynamic Channel Maximum Clearance Ceilings (Prevents secret leakage on public channels).
 * 3. Channel-specific rate limits and tenant routing context.
 */

import { KnowledgeDisclosureClearance } from '../knowledge/claim-contract-engine';
import { SecurityAuditLogger } from '../runtime/security-audit-logger';

export type HermesChannelType = 
  | 'TELEGRAM'
  | 'WEB_WIDGET'
  | 'PORTAL_AUTHENTICATED'
  | 'WHATSAPP'
  | 'INTERNAL_DASHBOARD'
  | 'REST_API';

/**
 * K27.6.1 — Single-channel normalization point.
 * Coerces any raw channel identifier (route-provided casing, legacy labels)
 * into a canonical HermesChannelType. Unknown values degrade to WEB_WIDGET
 * (fail-safe ceiling = PUBLIC), never crash and never leak.
 */
const CHANNEL_ALIASES: Record<string, HermesChannelType> = {
  telegram: 'TELEGRAM',
  telegram_tma: 'TELEGRAM',
  whatsap: 'WHATSAPP',
  whatsapp: 'WHATSAPP',
  wa: 'WHATSAPP',
  nexus: 'INTERNAL_DASHBOARD',
  internal_dashboard: 'INTERNAL_DASHBOARD',
  'web-widget': 'WEB_WIDGET',
  web_widget: 'WEB_WIDGET',
  web: 'WEB_WIDGET',
  portal: 'PORTAL_AUTHENTICATED',
  portal_authenticated: 'PORTAL_AUTHENTICATED',
  rest_api: 'REST_API',
  restapi: 'REST_API',
};

const HERMES_CHANNEL_CANONICALS: HermesChannelType[] = [
  'TELEGRAM', 'WEB_WIDGET', 'PORTAL_AUTHENTICATED', 'WHATSAPP', 'INTERNAL_DASHBOARD', 'REST_API',
];

export function normalizeHermesChannel(raw: string | null | undefined): HermesChannelType {
  if (!raw) return 'WEB_WIDGET';
  const cleaned = String(raw).trim().toUpperCase().replace(/[\s-]+/g, '_');
  if ((HERMES_CHANNEL_CANONICALS as string[]).includes(cleaned)) {
    return cleaned as HermesChannelType;
  }
  const alias = String(raw).trim().toLowerCase().replace(/[-\s]+/g, '_');
  return CHANNEL_ALIASES[alias] || 'WEB_WIDGET';
}

export interface ChannelConfig {
  channelType: HermesChannelType;
  maxClearanceCeiling: KnowledgeDisclosureClearance;
  requiresAuthentication: boolean;
  rateLimitPerMinute: number;
}

export const CHANNEL_CONFIGS: Record<HermesChannelType, ChannelConfig> = {
  TELEGRAM: {
    channelType: 'TELEGRAM',
    maxClearanceCeiling: 'PUBLIC',
    requiresAuthentication: false,
    rateLimitPerMinute: 30,
  },
  WEB_WIDGET: {
    channelType: 'WEB_WIDGET',
    maxClearanceCeiling: 'PUBLIC',
    requiresAuthentication: false,
    rateLimitPerMinute: 60,
  },
  PORTAL_AUTHENTICATED: {
    channelType: 'PORTAL_AUTHENTICATED',
    maxClearanceCeiling: 'TENANT_RESTRICTED',
    requiresAuthentication: true,
    rateLimitPerMinute: 120,
  },
  WHATSAPP: {
    channelType: 'WHATSAPP',
    maxClearanceCeiling: 'PUBLIC',
    requiresAuthentication: false,
    rateLimitPerMinute: 30,
  },
  INTERNAL_DASHBOARD: {
    channelType: 'INTERNAL_DASHBOARD',
    maxClearanceCeiling: 'CONFIDENTIAL',
    requiresAuthentication: true,
    rateLimitPerMinute: 300,
  },
  REST_API: {
    channelType: 'REST_API',
    maxClearanceCeiling: 'TENANT_RESTRICTED',
    requiresAuthentication: true,
    rateLimitPerMinute: 180,
  },
};

const CLEARANCE_LEVELS: Record<KnowledgeDisclosureClearance, number> = {
  PUBLIC: 1,
  TENANT_RESTRICTED: 2,
  INTERNAL_OPERATIONAL: 3,
  CONFIDENTIAL: 4,
  SECRET: 5,
};

/**
 * Severidad del evento de bloqueo.
 *
 * Un artefacto interno por encima del techo de un canal público es rutina
 * (INFO). Sólo lo sensible —o una clasificación desconocida, que debe fallar
 * ruidosamente— merece CRITICAL y alerta.
 */
export function disclosureSeverity(clearance?: string | null): 'INFO' | 'CRITICAL' {
  const value = String(clearance ?? '').toUpperCase();
  if (!value) return 'CRITICAL';
  if (value === 'CONFIDENTIAL' || value === 'SECRET' || value === 'B2B_RESTRICTED') return 'CRITICAL';
  return 'INFO';
}

export class ChannelMeshService {
  /**
   * Evaluates if a given knowledge clearance can be disclosed over a specific channel.
   * If clearance > channel ceiling => FAIL-CLOSED (DENY) + Security Audit Log.
   */
  public static async validateDisclosureClearance(params: {
    channelType: HermesChannelType;
    requiredClearance: KnowledgeDisclosureClearance;
    tenantId: string;
    artifactId?: string;
  }): Promise<{ allowed: boolean; reason?: string }> {
    const { channelType, requiredClearance, tenantId, artifactId } = params;
    const config = CHANNEL_CONFIGS[channelType] || CHANNEL_CONFIGS.WEB_WIDGET;

    const reqLevel = CLEARANCE_LEVELS[requiredClearance];
    const ceilingLevel = CLEARANCE_LEVELS[config.maxClearanceCeiling];

    if (reqLevel === undefined || ceilingLevel === undefined || reqLevel > ceilingLevel) {
      // Un artefacto interno por encima del techo de un canal público es rutina
      // (p. ej. WhatsApp). Sólo lo verdaderamente sensible —o una clasificación
      // que no se puede determinar— justifica un evento CRITICAL con alerta.
      const severity = disclosureSeverity(reqLevel === undefined ? undefined : requiredClearance);
      const isSensitive = severity === 'CRITICAL';

      await SecurityAuditLogger.logEvent({
        organizationId: tenantId,
        eventType: 'DISCLOSURE_BLOCKED',
        severity,
        policyDecision: 'DENY',
        correlationId: `mesh_disc_${Date.now()}`,
        artifactId,
        classification: requiredClearance as any,
        metadata: {
          channelType,
          channelCeiling: config.maxClearanceCeiling,
          requiredClearance,
          expectedRoutine: !isSensitive && reqLevel !== undefined,
          reason: `Attempted to disclose [${requiredClearance}] artifact over [${channelType}] channel with maximum ceiling [${config.maxClearanceCeiling}].`,
        },
      });

      return {
        allowed: false,
        reason: `Disclosure blocked: Channel "${channelType}" ceiling "${config.maxClearanceCeiling}" is below artifact classification "${requiredClearance}" or clearance is unknown.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Resolves maximum clearance ceiling for a channel.
   */
  public static getMaxClearance(channelType: HermesChannelType): KnowledgeDisclosureClearance {
    const config = CHANNEL_CONFIGS[channelType] || CHANNEL_CONFIGS.WEB_WIDGET;
    return config.maxClearanceCeiling;
  }
}
