/**
 * 📦 Dash Contracts — Hermes Epistemic Policies Domain
 * src/lib/dash-contracts/policies.ts
 */

export interface PolicyDTO {
  id: string;
  key: string;
  content: string;
  dimension: string;
  status: string;
  authority: string;
  updatedAt: string;
}

export interface GetPoliciesResponseDTO {
  policies: PolicyDTO[];
}

export interface SavePolicyRequestDTO {
  key: string;
  content: string;
}

export interface SavePolicyResponseDTO {
  success: boolean;
  key: string;
}
