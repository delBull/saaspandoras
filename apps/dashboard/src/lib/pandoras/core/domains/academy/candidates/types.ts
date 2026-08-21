/**
 * 👥 Pandora's Academy — Candidate, Invitation & Assessment Entities
 * apps/dashboard/src/lib/pandoras/core/domains/academy/candidates/types.ts
 */

import { CrossCuttingCompetencyScores } from '../types';

export type CandidateRole = 'COO' | 'CHIEF_OF_STAFF' | 'TREASURY_OFFICER' | 'DEAL_LEAD';
export type InvitationStatus = 'PENDING' | 'USED' | 'REVOKED' | 'EXPIRED';
export type CandidateAttendanceStatus = 'INVITED' | 'ATTENDED' | 'IN_PROGRESS' | 'COMPLETED' | 'CERTIFIED' | 'FAILED';

export interface AcademyCandidate {
  id: string; // cand_uuid
  name: string;
  email: string;
  phone?: string;
  targetRole: CandidateRole;
  notes?: string;
  attendanceStatus: CandidateAttendanceStatus;
  invitationCount: number;
  latestAttemptId?: string;
  latestScore?: number;
  latestCertificationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentInvitation {
  token: string; // inv_uuid (Secret single-use / active token)
  candidateId: string;
  candidateName: string;
  programId: string;
  targetRole: CandidateRole;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  usedAt?: string;
}

export interface CandidateResponseItem {
  questionId: string;
  moduleIndex: number;
  questionPrompt: string;
  candidateAnswer: string;
  hermesFeedback?: string;
  submittedAt: string;
}

export interface CandidateAssessmentInstance {
  id: string; // attempt_uuid
  candidateId: string;
  candidateName: string;
  programId: string;
  targetRole: CandidateRole;
  status: CandidateAttendanceStatus;
  
  // Frozen Assessment Snapshot
  curriculumVersion: number;
  rubricVersion: string;
  fatalFailurePolicyVersion: string;
  knowledgeSnapshotHash: string;
  systemPromptHash: string;

  currentModuleIndex: number; // 0 to 3
  responses: CandidateResponseItem[];

  // Deterministic outcomes calculated exclusively on closure
  finalModuleScores?: Record<string, number>;
  overallReadinessScore?: number;
  competencySummary?: CrossCuttingCompetencyScores;
  criticalFailures?: string[];
  certified?: boolean;
  certificationId?: string;

  startedAt: string;
  closedAt?: string;
}
