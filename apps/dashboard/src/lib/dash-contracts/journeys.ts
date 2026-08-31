/**
 * 📦 Dash Contracts — Hermes Journeys Domain
 * src/lib/dash-contracts/journeys.ts
 *
 * Pure DTO definitions for Hermes Journey Capability.
 * Zero database imports, zero runtime engine dependencies.
 */

export type JourneyStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'PAUSED';

export interface JourneyStageDTO {
  id: string;
  name: string;
  orderIndex: number;
  objectives: string[];
}

export interface JourneyDTO {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  version: number;
  status: JourneyStatus;
  isDefault: boolean;
  stages: JourneyStageDTO[];
  milestones: string[]; // UI presentation-safe flattened milestone list
  transitionsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetJourneysResponseDTO {
  journeys: JourneyDTO[];
}

export interface ToggleJourneyStatusRequestDTO {
  journeyId: string;
  active: boolean;
}

export interface ToggleJourneyStatusResponseDTO {
  success: boolean;
  journeyId: string;
  status: JourneyStatus;
}

export interface DashApiError {
  code:
    | 'UNAUTHENTICATED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'VALIDATION_ERROR'
    | 'RATE_LIMITED'
    | 'INTERNAL_ERROR';
  message: string;
  requestId?: string;
}
