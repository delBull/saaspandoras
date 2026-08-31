/**
 * 📦 Dash Contracts — Hermes Identity & Team DTOs
 * src/lib/dash-contracts/identity.ts
 */

export interface TeamMemberDTO {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
}

export interface GetIdentityResponseDTO {
  projectTitle: string;
  applicantName?: string;
  applicantEmail?: string;
  applicantPosition?: string;
  members: TeamMemberDTO[];
}
