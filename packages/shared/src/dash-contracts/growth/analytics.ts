/**
 * 📦 Dash Contracts — Growth Analytics & Funnel Tracking
 * src/lib/dash-contracts/growth/analytics.ts
 */

export interface FunnelStepDTO {
  step: string;
  count: number;
  conversionRate: number;
}

export interface GrowthChannelPerformanceDTO {
  channel: string;
  leadsAcquired: number;
  conversions: number;
  cacUsdc: number;
  totalRevenueUsdc: number;
}

export interface GetGrowthAnalyticsResponseDTO {
  totalLeads: number;
  totalConversions: number;
  avgCacUsdc: number;
  estimatedLtvUsdc: number;
  funnel: FunnelStepDTO[];
  channels: GrowthChannelPerformanceDTO[];
}
