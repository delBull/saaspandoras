export interface MembershipContext {
  role?: string;
  isBoss?: boolean;
  surface?: string;
}

export class CapabilityResolver {
  /**
   * Resolves capabilities based on the user's membership and current surface.
   */
  static resolveEffectiveCapabilities(membership: MembershipContext): string[] {
    const caps = new Set<string>();

    if (membership.surface === 'GROWTH_OS') {
      if (membership.isBoss || membership.role === 'OWNER') {
        caps.add('growth.leads.read');
        caps.add('growth.leads.manage');
        caps.add('growth.analytics.read');
        caps.add('growth.campaigns.plan');
        caps.add('growth.campaigns.approve');
        caps.add('growth.campaigns.distribute');
      } else if (membership.role === 'GESTOR') {
        caps.add('growth.leads.read');
        caps.add('growth.leads.manage');
        caps.add('growth.analytics.read');
        // Gestors cannot approve or distribute campaigns
      } else {
        caps.add('growth.leads.read');
      }
    } else if (membership.surface === 'PORTAL_AMBASSADOR_OPERATOR') {
      caps.add('leads.read');
      caps.add('leads.manage');
      caps.add('followup.propose');
      caps.add('meeting.propose');
      caps.add('content.request');
    } else if (membership.surface === 'PORTAL_CLIENT_CONCIERGE') {
      caps.add('portal.view');
      caps.add('portal.explain');
      caps.add('portal.guide');
      caps.add('portal.propose_meeting');
    } else if (membership.surface === 'ONBOARDING') {
      caps.add('onboarding.view');
      caps.add('onboarding.guide');
      caps.add('onboarding.assess');
      caps.add('onboarding.recommend');
    }

    return Array.from(caps);
  }
}
