/**
 * 🏛️ HERMES OS — Multi-Channel Mesh & Clearance Router
 * src/lib/pandoras/core/domains/hermes/channels/channel-mesh.ts
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

    const reqLevel = CLEARANCE_LEVELS[requiredClearance] || 1;
    const ceilingLevel = CLEARANCE_LEVELS[config.maxClearanceCeiling] || 1;

    if (reqLevel > ceilingLevel) {
      await SecurityAuditLogger.logEvent({
        organizationId: tenantId,
        eventType: 'DISCLOSURE_BLOCKED',
        severity: 'CRITICAL',
        policyDecision: 'DENY',
        correlationId: `mesh_disc_${Date.now()}`,
        artifactId,
        classification: requiredClearance as any,
        metadata: {
          channelType,
          channelCeiling: config.maxClearanceCeiling,
          requiredClearance,
          reason: `Attempted to disclose [${requiredClearance}] artifact over [${channelType}] channel with maximum ceiling [${config.maxClearanceCeiling}].`,
        },
      });

      return {
        allowed: false,
        reason: `Disclosure blocked: Channel "${channelType}" ceiling "${config.maxClearanceCeiling}" is below artifact classification "${requiredClearance}".`,
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
