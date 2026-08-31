/**
 * 📦 Dash Contracts — Hermes Add-Ons & Capabilities Domain
 * src/lib/dash-contracts/addons.ts
 */

export interface AddonStatusDTO {
  addonId: string;
  name: string;
  category: string;
  description: string;
  status: 'AVAILABLE' | 'ACTIVE' | 'DEACTIVATED';
  version: string;
  installedAt?: string;
  configuration?: Record<string, unknown>;
}

export interface GetAddonsResponseDTO {
  addons: AddonStatusDTO[];
}

export interface ToggleAddonRequestDTO {
  addonId: string;
  active: boolean;
}

export interface ToggleAddonResponseDTO {
  success: boolean;
  addonId: string;
  active: boolean;
}
