/**
 * 🎓 Pandora's Academy — Domain Types & Contracts
 * apps/dashboard/src/lib/pandoras/core/domains/academy/types.ts
 *
 * Separation of concerns:
 * 1. Curriculum Layer (Programs, Modules, Lessons, Scenarios)
 * 2. Knowledge Snapshot Layer (Immutable versioned documentation)
 * 3. Assessment Layer (Attempts, Responses, Hermes Evaluator Proposal, Deterministic Rubric Scoring)
 * 4. Certification Layer (Credentials, Policy, Audit Trail)
 */

export type ProgramStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'EVALUATED' | 'PASSED' | 'FAILED';
export type CertificationStatus = 'CERTIFIED' | 'REVOKED' | 'EXPIRED';

// ─── 1. CURRICULUM LAYER ──────────────────────────────────────────────────────

export interface AcademyProgram {
  id: string; // uuid or slug 'COO_INTERNAL_V1'
  code: string;
  title: string;
  description: string;
  targetRole: string; // 'COO' | 'OPERATIONS' | 'TREASURY' | 'DEAL_ROOM'
  status: ProgramStatus;
  version: number;
  passingScore: number; // e.g. 80
  modules: AcademyModule[];
}

export interface AcademyModule {
  id: string;
  programId: string;
  sequence: number;
  code: string;
  title: string;
  description: string;
  weightPercentage: number; // Sums to 100% across modules
  requiredKnowledgeDocs: string[]; // Doc references e.g. ['IOM_v1.0', 'LIBRO_0_CONSTITUTION']
  assessments: AcademyAssessment[];
}

export interface RubricCriterion {
  id: string;
  title: string;
  description: string;
  maxScore: number;
  evaluationGuideline: string;
}

export interface AcademyAssessment {
  id: string;
  moduleId: string;
  title: string;
  scenarioContext: string;
  questionPrompt: string;
  rubricCriteria: RubricCriterion[];
  criticalFailureConditions: string[]; // If any condition is met => instant failure
  passingThreshold: number; // e.g. 80
}

// ─── 2. KNOWLEDGE SNAPSHOT LAYER ──────────────────────────────────────────────

export interface KnowledgeDocumentRef {
  docId: string;
  title: string;
  version: string;
  contentHash: string;
  summary: string;
  fullContent: string;
}

export interface AcademyKnowledgeSnapshot {
  id: string;
  snapshotHash: string;
  sourceDocuments: KnowledgeDocumentRef[];
  createdAt: string;
}

// ─── 3. ASSESSMENT & RUBRIC LAYER ─────────────────────────────────────────────

export interface CrossCuttingCompetencyScores {
  riskManagement: number; // 0 - 100
  decisionMaking: number;
  escalationProtocol: number;
  entitySeparation: number;
  authorizationRigor: number;
  auditability: number;
  humanHandoff: number;
}

export interface CandidateResponse {
  assessmentId: string;
  answerText: string;
  submittedAt: string;
}

export interface HermesEvaluationProposal {
  assessmentId: string;
  proposedScore: number; // 0 - 100
  criterionScores: Record<string, number>;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  detectedCriticalFailures: string[];
  competencyAssessment: CrossCuttingCompetencyScores;
}

export interface AssessmentScoreResult {
  assessmentId: string;
  rawAiFeedback: string;
  aiProposedScore: number;
  calculatedScore: number;
  competencyScores: CrossCuttingCompetencyScores;
  hasCriticalFailure: boolean;
  criticalFailureReason?: string;
  passed: boolean;
}

export interface AssessmentAttemptResult {
  attemptId: string;
  programId: string;
  candidateId: string;
  snapshotId: string;
  status: AttemptStatus;
  moduleScores: Record<string, number>;
  overallReadinessScore: number;
  crossCuttingCompetencies: CrossCuttingCompetencyScores;
  criticalFailures: string[];
  certified: boolean;
  certificationId?: string;
  completedAt: string;
}

// ─── 4. CERTIFICATION LAYER ───────────────────────────────────────────────────

export interface AcademyCertification {
  id: string; // cert_uuid
  programId: string;
  candidateId: string;
  candidateName?: string;
  attemptId: string;
  targetRole: string;
  readinessScore: number;
  competencySummary: CrossCuttingCompetencyScores;
  status: CertificationStatus;
  certifiedAt: string;
  validUntil: string;
  issuer: string; // 'Pandora's Academy Core'
  certificateHash: string; // Cryptographic seal
}
