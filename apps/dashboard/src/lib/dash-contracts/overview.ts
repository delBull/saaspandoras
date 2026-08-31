/**
 * 📦 Dash Contracts — Hermes Overview DTOs
 * src/lib/dash-contracts/overview.ts
 */

import type { HermesOverviewView } from '@/lib/portal/portal-types';

export interface GetOverviewResponseDTO {
  overview: HermesOverviewView;
  organizationName: string;
}
