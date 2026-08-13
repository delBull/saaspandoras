import { ProactiveSignalType } from './signal-registry';

export type ChannelType = 'telegram' | 'whatsapp' | 'email' | 'portal' | 'sms';

export interface QuietHours {
  start: string; // e.g. "22:00"
  end: string;   // e.g. "08:00"
  timezone: string; // e.g. "America/Mexico_City"
}

export interface ProactivePolicy {
  enabled: boolean;
  
  // Which signals Hermes is allowed to react to
  allowedSignals: ProactiveSignalType[];
  
  // Channels authorized by the tenant for outbound messaging
  allowedChannels: ChannelType[];
  
  // Time window where Hermes cannot send messages
  quietHours?: QuietHours;
  
  // Frequency caps
  maxOutboundPerContact: {
    period: '24h' | '7d' | '30d';
    count: number;
  };
  
  // Base cooldown for any signal
  cooldown: {
    defaultHours: number;
  };
  
  // Does every intent require human approval from the dashboard?
  requireApproval: boolean;
  
  // What types of intents Hermes is allowed to execute proactively
  allowedIntentTypes: string[];
}

export const DEFAULT_PROACTIVE_POLICY: ProactivePolicy = {
  enabled: true,
  allowedSignals: ['ABANDONED_ONBOARDING', 'HESITANT_BUYER', 'PORTAL_GHOST', 'HIGH_INTENT'],
  allowedChannels: ['telegram', 'email'],
  quietHours: {
    start: '21:00',
    end: '09:00',
    timezone: 'America/Mexico_City'
  },
  maxOutboundPerContact: {
    period: '24h',
    count: 1
  },
  cooldown: {
    defaultHours: 48
  },
  requireApproval: false, // For testing, assume false. In prod, maybe true for financial claims.
  allowedIntentTypes: ['CONTACT_PROSPECT', 'CONTACT_TENANT_ADMIN']
};
