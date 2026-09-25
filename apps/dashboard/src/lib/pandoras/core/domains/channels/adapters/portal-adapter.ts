import { ChannelAdapter } from '../channel-adapter';
import { ChannelType, ChannelInboundMessage, ChannelOutboundMessage, ChannelDeliveryResult } from '../channel-types';
import { NormalizedInboundMessage } from '../normalized-message';
import { InvalidChannelPayloadError } from '../channel-errors';
import { ControlPlaneContext } from '../../control-plane/application/context';

export interface PortalRawPayload {
  content: string;
  clientMessageId?: string;
  organizationId?: string; // Explicitly IGNORED for security
  proposedSurfaceContext?: {
    surface: string;
    projectId?: string;
    resourceId?: string;
    route?: string;
  };
}

export class PortalAdapter implements ChannelAdapter {
  readonly channelType: ChannelType = 'portal';

  async receive(
    input: ChannelInboundMessage,
    context?: ControlPlaneContext
  ): Promise<NormalizedInboundMessage> {
    if (!context) {
      throw new InvalidChannelPayloadError('PortalAdapter requires an authenticated ControlPlaneContext');
    }

    const payload = input.rawPayload as PortalRawPayload;
    if (!payload || typeof payload.content !== 'string' || !payload.content.trim()) {
      throw new InvalidChannelPayloadError('Portal message must contain non-empty content');
    }

    // LOCK 6.5.1-A & P2/P3: organizationId ALWAYS comes from authorized ControlPlaneContext
    const primaryOrg = context.authorizedOrganizations[0]?.organizationId;
    if (!primaryOrg) {
      throw new InvalidChannelPayloadError('ControlPlaneContext has no authorized organization');
    }
    const organizationId = primaryOrg;
    const actorId = context.actorId || 'portal_actor_anonymous';

    const externalMessageId = payload.clientMessageId || `msg_portal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const conversationId = `conv_portal_${organizationId}`;
    const correlationId = context.sessionId || `corr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const idempotencyKey = `${organizationId}:portal:${externalMessageId}`;

    // --- AUTHORIZED SURFACE CONTEXT (P0 - Marco's Baseline) ---
    // The frontend proposes a context, but we must authorize it against the user's session
    let authorizedSurfaceContext = undefined;
    if (payload.proposedSurfaceContext) {
      const p = payload.proposedSurfaceContext;
      // TODO: Perform deep resource-level RBAC validation here based on `p.projectId` and `context.capabilities`
      // For now, we trust the tenant/org envelope since we already validated `primaryOrg`
      authorizedSurfaceContext = {
        surface: p.surface as 'nexus' | 'deal_room' | 'academy' | 'admin',
        projectId: p.projectId,
        resourceId: p.resourceId,
        route: p.route
      };
    }
    // --------------------------------------------------------

    return {
      organizationId,
      channel: {
        type: 'portal',
        bindingId: `portal_${organizationId}`,
        externalConversationId: conversationId
      },
      actor: {
        identityId: actorId,
        externalActorId: actorId
      },
      conversation: {
        conversationId
      },
      message: {
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        externalMessageId,
        content: payload.content.trim()
      },
      correlationId,
      idempotencyKey,
      receivedAt: new Date(),
      authorizedSurfaceContext
    };
  }

  async send(input: ChannelOutboundMessage): Promise<ChannelDeliveryResult> {
    console.log(`[PortalAdapter] Outbound message delivered for org ${input.organizationId}: ${input.content}`);
    return {
      success: true,
      messageId: `outbound_portal_${Date.now()}`
    };
  }
}
