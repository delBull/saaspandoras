export type ProactiveSignalType = 
  | 'ABANDONED_ONBOARDING'
  | 'HESITANT_BUYER'
  | 'PORTAL_GHOST'
  | 'HIGH_INTENT';

export interface SignalEvidence {
  [key: string]: any;
}

export interface ProactiveSignal {
  id: string;
  type: ProactiveSignalType;
  actorId: string;
  organizationId: string;
  detectedAt: string;
  evidence: SignalEvidence;
}

export interface ProactiveSignalDefinition {
  type: ProactiveSignalType;
  description: string;
  cooldownHours: number;
  requiredEvidence: string[];
  allowedIntentTypes: string[];
}

export class SignalRegistry {
  private static signals: Map<ProactiveSignalType, ProactiveSignalDefinition> = new Map([
    [
      'ABANDONED_ONBOARDING',
      {
        type: 'ABANDONED_ONBOARDING',
        description: 'Tenant started onboarding but has not completed it in 48 hours.',
        cooldownHours: 72,
        requiredEvidence: ['onboardingStartedAt', 'currentStage'],
        allowedIntentTypes: ['CONTACT_TENANT_ADMIN']
      }
    ],
    [
      'HESITANT_BUYER',
      {
        type: 'HESITANT_BUYER',
        description: 'Prospect started checkout but payment is pending for 12 hours.',
        cooldownHours: 48,
        requiredEvidence: ['checkoutId', 'checkoutStartedAt', 'paymentStatus'],
        allowedIntentTypes: ['CONTACT_PROSPECT']
      }
    ],
    [
      'PORTAL_GHOST',
      {
        type: 'PORTAL_GHOST',
        description: 'Active user has not visited the portal in 14 days.',
        cooldownHours: 168, // 7 days
        requiredEvidence: ['lastActivityAt'],
        allowedIntentTypes: ['CONTACT_PROSPECT']
      }
    ],
    [
      'HIGH_INTENT',
      {
        type: 'HIGH_INTENT',
        description: 'User visited portal 3+ times in 7 days but no purchase.',
        cooldownHours: 72,
        requiredEvidence: ['sessionCount', 'firstSessionInPeriodAt'],
        allowedIntentTypes: ['CONTACT_PROSPECT']
      }
    ]
  ]);

  static get(type: ProactiveSignalType): ProactiveSignalDefinition | undefined {
    return this.signals.get(type);
  }

  static listAll(): ProactiveSignalDefinition[] {
    return Array.from(this.signals.values());
  }
}
