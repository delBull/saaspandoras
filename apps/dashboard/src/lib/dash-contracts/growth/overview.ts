/**
 * 📦 Dash Contracts — Growth Overview & Quick Actions
 * src/lib/dash-contracts/growth/overview.ts
 */

import type { GrowthCapabilityKey } from './capabilities';

export interface GrowthMetricCardDTO {
  id: string;
  title: string;
  value: string | number;
  changePercent?: number;
  trend?: 'UP' | 'DOWN' | 'NEUTRAL';
  status?: 'LIVE' | 'DATABASE' | 'NOT_CONFIGURED' | 'PENDING' | 'UNAVAILABLE';
  capability: GrowthCapabilityKey;
}

export interface GrowthQuickActionDTO {
  id: string;
  label: string;
  href: string;
  capability: GrowthCapabilityKey;
  iconName: string;
}

export interface GrowthRecentActivityDTO {
  id: string;
  title: string;
  description: string;
  capability: GrowthCapabilityKey;
  actor: string;
  timestamp: string;
}

export interface GrowthOverviewDTO {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  planTier?: string;
  hasHermes: boolean;
  enabledCapabilities: GrowthCapabilityKey[];
  metrics: GrowthMetricCardDTO[];
  quickActions: GrowthQuickActionDTO[];
  recentActivities: GrowthRecentActivityDTO[];
}
