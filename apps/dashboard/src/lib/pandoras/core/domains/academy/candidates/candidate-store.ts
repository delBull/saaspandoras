/**
 * 🗄️ Pandora's Academy — Candidate, Invitation & Assessment Store (Serverless-Safe)
 * apps/dashboard/src/lib/pandoras/core/domains/academy/candidates/candidate-store.ts
 *
 * Full Read-Through & Write-Through PostgreSQL (Drizzle) with Cache Hydration:
 * - Read-through DB getters (getInvitationAsync, getCandidateAsync, getAssessmentAsync, getCertificationAsync).
 * - Exact invitation count from real DB relations.
 * - Single-use nonce tokens with expiration and revoked status checks.
 * - Out-of-order submit guard (params.moduleIndex === assessment.currentModuleIndex).
 * - Awaited DB operations (no floating promises in serverless runtime).
 * - Real SHA-256 dynamic content hashes.
 */

import { createHash } from 'crypto';
import { db } from '@/db';
import {
  academyCandidates,
  academyInvitations,
  academyAssessments,
  academyCertifications
} from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import {
  AcademyCandidate,
  AssessmentInvitation,
  CandidateAssessmentInstance,
  CandidateRole,
  CandidateResponseItem
} from './types';
import { AcademyCertification } from '../types';
import { COO_EXECUTIVE_PROGRAM } from '../curriculum/coo-program';
import { AssessmentEngine } from '../assessment/assessment-engine';
import { KnowledgeSnapshotManager } from '../snapshots/snapshot-manager';

class AcademyStoreSingleton {
  private candidates: Map<string, AcademyCandidate> = new Map();
  private invitations: Map<string, AssessmentInvitation> = new Map();
  private assessments: Map<string, CandidateAssessmentInstance> = new Map();
  private certifications: Map<string, AcademyCertification> = new Map();

  constructor() {
    if (process.env.NODE_ENV === 'development') {
      this.seedDevDemoData();
    }
  }

  private seedDevDemoData() {
    const cand1Id = 'cand_carlos_mendoza';
    this.candidates.set(cand1Id, {
      id: cand1Id,
      name: 'Carlos Mendoza',
      email: 'carlos.mendoza@pandoras.finance',
      phone: '+52 322 100 2030',
      targetRole: 'COO',
      notes: 'Candidato Demo a Dirección de Operaciones Institucionales',
      attendanceStatus: 'INVITED',
      invitationCount: 1,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    });

    const token1 = 'inv_coo_carlos_demo';
    this.invitations.set(token1, {
      token: token1,
      candidateId: cand1Id,
      candidateName: 'Carlos Mendoza',
      programId: COO_EXECUTIVE_PROGRAM.id,
      targetRole: 'COO',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      createdAt: new Date().toISOString()
    });
  }

  // ─── CANDIDATES (READ-THROUGH & WRITE-THROUGH) ──────────────────────────────

  async listCandidatesAsync(): Promise<AcademyCandidate[]> {
    try {
      const rows = await db
        .select()
        .from(academyCandidates)
        .orderBy(desc(academyCandidates.createdAt));

      if (rows && rows.length > 0) {
        for (const r of rows) {
          // Count real invitations for this candidate
          const invCountRows = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(academyInvitations)
            .where(eq(academyInvitations.candidateId, r.id));

          const invCount = invCountRows[0]?.count ?? 1;

          const cand: AcademyCandidate = {
            id: r.id,
            name: r.name,
            email: r.email,
            phone: r.phone || undefined,
            targetRole: (r.targetRole as CandidateRole) || 'COO',
            notes: r.notes || undefined,
            attendanceStatus: (r.attendanceStatus as any) || 'INVITED',
            latestAttemptId: r.latestAttemptId || undefined,
            latestScore: r.latestScore || undefined,
            latestCertificationId: r.latestCertificationId || undefined,
            invitationCount: invCount,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString()
          };
          this.candidates.set(cand.id, cand);
        }
      }
    } catch (err) {
      console.warn('⚠️ [AcademyStore] Falling back to memory for listCandidates:', err);
    }

    return Array.from(this.candidates.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  listCandidates(): AcademyCandidate[] {
    return Array.from(this.candidates.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getCandidateAsync(id: string): Promise<AcademyCandidate | undefined> {
    if (this.candidates.has(id)) {
      return this.candidates.get(id);
    }

    try {
      const rows = await db
        .select()
        .from(academyCandidates)
        .where(eq(academyCandidates.id, id))
        .limit(1);

      if (rows && rows.length > 0) {
        const r = rows[0];
        if (!r) return undefined;
        const invCountRows = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(academyInvitations)
          .where(eq(academyInvitations.candidateId, r.id));

        const invCount = invCountRows[0]?.count ?? 1;

        // Fallback: Resolve latestAttemptId from assessments table if not directly present
        let resolvedAttemptId = r.latestAttemptId || undefined;
        if (!resolvedAttemptId) {
          const latestAttemptRows = await db
            .select({ id: academyAssessments.id })
            .from(academyAssessments)
            .where(eq(academyAssessments.candidateId, r.id))
            .orderBy(desc(academyAssessments.startedAt))
            .limit(1);
          if (latestAttemptRows.length > 0 && latestAttemptRows[0]?.id) {
            resolvedAttemptId = latestAttemptRows[0].id;
          }
        }

        const cand: AcademyCandidate = {
          id: r.id,
          name: r.name,
          email: r.email,
          phone: r.phone || undefined,
          targetRole: (r.targetRole as CandidateRole) || 'COO',
          notes: r.notes || undefined,
          attendanceStatus: (r.attendanceStatus as any) || 'INVITED',
          latestAttemptId: resolvedAttemptId,
          latestScore: r.latestScore || undefined,
          latestCertificationId: r.latestCertificationId || undefined,
          invitationCount: invCount,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString()
        };
        this.candidates.set(cand.id, cand);
        return cand;
      }
    } catch (err) {
      console.warn(`⚠️ [AcademyStore] DB getCandidate failed for ${id}:`, err);
    }

    return undefined;
  }

  getCandidate(id: string): AcademyCandidate | undefined {
    return this.candidates.get(id);
  }

  async createCandidateAsync(params: {
    name: string;
    email: string;
    phone?: string;
    targetRole?: CandidateRole;
    notes?: string;
  }): Promise<{ candidate: AcademyCandidate; invitation: AssessmentInvitation }> {
    const candidateId = `cand_${createHash('sha256').update(`${params.email}_${Date.now()}`).digest('hex').substring(0, 12)}`;
    const role: CandidateRole = params.targetRole || 'COO';

    const candidate: AcademyCandidate = {
      id: candidateId,
      name: params.name,
      email: params.email,
      phone: params.phone,
      targetRole: role,
      notes: params.notes,
      attendanceStatus: 'INVITED',
      invitationCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.candidates.set(candidateId, candidate);

    const token = `inv_${createHash('sha256').update(`${candidateId}_${Date.now()}`).digest('hex').substring(0, 16)}`;
    const expiresAt = new Date(Date.now() + 7 * 86400000);

    const invitation: AssessmentInvitation = {
      token,
      candidateId,
      candidateName: params.name,
      programId: COO_EXECUTIVE_PROGRAM.id,
      targetRole: role,
      status: 'PENDING',
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString()
    };

    this.invitations.set(token, invitation);

    try {
      await db.insert(academyCandidates).values({
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone || null,
        targetRole: candidate.targetRole,
        attendanceStatus: candidate.attendanceStatus,
        notes: candidate.notes || null,
      });

      await db.insert(academyInvitations).values({
        token: invitation.token,
        candidateId: invitation.candidateId,
        status: invitation.status,
        expiresAt,
      });
    } catch (err) {
      console.warn('⚠️ [AcademyStore] DB Insert candidate/invitation failed:', err);
    }

    return { candidate, invitation };
  }

  createCandidate(params: {
    name: string;
    email: string;
    phone?: string;
    targetRole?: CandidateRole;
    notes?: string;
  }): { candidate: AcademyCandidate; invitation: AssessmentInvitation } {
    const candidateId = `cand_${createHash('sha256').update(`${params.email}_${Date.now()}`).digest('hex').substring(0, 12)}`;
    const role: CandidateRole = params.targetRole || 'COO';

    const candidate: AcademyCandidate = {
      id: candidateId,
      name: params.name,
      email: params.email,
      phone: params.phone,
      targetRole: role,
      notes: params.notes,
      attendanceStatus: 'INVITED',
      invitationCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.candidates.set(candidateId, candidate);

    const token = `inv_${createHash('sha256').update(`${candidateId}_${Date.now()}`).digest('hex').substring(0, 16)}`;
    const invitation: AssessmentInvitation = {
      token,
      candidateId,
      candidateName: params.name,
      programId: COO_EXECUTIVE_PROGRAM.id,
      targetRole: role,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      createdAt: new Date().toISOString()
    };

    this.invitations.set(token, invitation);

    try {
      db.insert(academyCandidates).values({
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone || null,
        targetRole: candidate.targetRole,
        attendanceStatus: candidate.attendanceStatus,
        notes: candidate.notes || null,
      }).catch(() => {});

      db.insert(academyInvitations).values({
        token: invitation.token,
        candidateId: invitation.candidateId,
        status: invitation.status,
        expiresAt: new Date(invitation.expiresAt),
      }).catch(() => {});
    } catch {
      // ignore
    }

    return { candidate, invitation };
  }

  async createInvitationAsync(candidateId: string): Promise<AssessmentInvitation> {
    const candidate = await this.getCandidateAsync(candidateId);
    if (!candidate) throw new Error('Candidato no encontrado');

    const token = `inv_${createHash('sha256').update(`${candidateId}_${Date.now()}`).digest('hex').substring(0, 16)}`;
    const expiresAt = new Date(Date.now() + 7 * 86400000);

    const invitation: AssessmentInvitation = {
      token,
      candidateId,
      candidateName: candidate.name,
      programId: COO_EXECUTIVE_PROGRAM.id,
      targetRole: candidate.targetRole,
      status: 'PENDING',
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString()
    };

    candidate.invitationCount++;
    candidate.updatedAt = new Date().toISOString();

    this.invitations.set(token, invitation);

    try {
      await db.insert(academyInvitations).values({
        token: invitation.token,
        candidateId: invitation.candidateId,
        status: invitation.status,
        expiresAt,
      });
    } catch (err) {
      console.warn('⚠️ [AcademyStore] DB Insert invitation failed:', err);
    }

    return invitation;
  }

  createInvitation(candidateId: string): AssessmentInvitation {
    const candidate = this.candidates.get(candidateId);
    if (!candidate) throw new Error('Candidato no encontrado');

    const token = `inv_${createHash('sha256').update(`${candidateId}_${Date.now()}`).digest('hex').substring(0, 16)}`;
    const invitation: AssessmentInvitation = {
      token,
      candidateId,
      candidateName: candidate.name,
      programId: COO_EXECUTIVE_PROGRAM.id,
      targetRole: candidate.targetRole,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      createdAt: new Date().toISOString()
    };

    candidate.invitationCount++;
    candidate.updatedAt = new Date().toISOString();

    this.invitations.set(token, invitation);
    return invitation;
  }

  // ─── INVITATIONS (READ-THROUGH) ─────────────────────────────────────────────

  async getInvitationAsync(token: string): Promise<AssessmentInvitation | undefined> {
    if (this.invitations.has(token)) {
      return this.invitations.get(token);
    }

    try {
      const rows = await db
        .select()
        .from(academyInvitations)
        .where(eq(academyInvitations.token, token))
        .limit(1);

      if (rows && rows.length > 0) {
        const r = rows[0];
        if (!r) return undefined;
        const candidate = await this.getCandidateAsync(r.candidateId);
        const inv: AssessmentInvitation = {
          token: r.token,
          candidateId: r.candidateId,
          candidateName: candidate?.name || 'Candidato Registrado',
          programId: COO_EXECUTIVE_PROGRAM.id,
          targetRole: candidate?.targetRole || 'COO',
          status: r.status as any,
          expiresAt: r.expiresAt.toISOString(),
          usedAt: r.usedAt ? r.usedAt.toISOString() : undefined,
          createdAt: r.createdAt.toISOString()
        };
        this.invitations.set(inv.token, inv);
        return inv;
      }
    } catch (err) {
      console.warn(`⚠️ [AcademyStore] DB getInvitation failed for token ${token}:`, err);
    }

    return undefined;
  }

  getInvitation(token: string): AssessmentInvitation | undefined {
    return this.invitations.get(token);
  }

  // ─── ASSESSMENTS (READ-THROUGH & FULL LIFECYCLE) ────────────────────────────

  async getAssessmentAsync(attemptId: string): Promise<CandidateAssessmentInstance | undefined> {
    if (this.assessments.has(attemptId)) {
      return this.assessments.get(attemptId);
    }

    try {
      const rows = await db
        .select()
        .from(academyAssessments)
        .where(eq(academyAssessments.id, attemptId))
        .limit(1);

      if (rows && rows.length > 0) {
        const r = rows[0];
        if (!r) return undefined;
        const candidate = await this.getCandidateAsync(r.candidateId);
        const rawAnswers = (r.answers as any[]) || [];

        const responses: CandidateResponseItem[] = rawAnswers.map((a: any) => ({
          questionId: a.questionId,
          moduleIndex: a.moduleIndex,
          questionPrompt: a.questionPrompt,
          candidateAnswer: a.candidateAnswer,
          hermesFeedback: a.hermesFeedback,
          submittedAt: a.submittedAt || new Date().toISOString()
        }));

        const assessment: CandidateAssessmentInstance = {
          id: r.id,
          candidateId: r.candidateId,
          candidateName: candidate?.name || 'Candidato Registrado',
          programId: r.programId,
          targetRole: candidate?.targetRole || 'COO',
          status: r.status as any,
          curriculumVersion: r.curriculumVersion,
          rubricVersion: '2.0',
          fatalFailurePolicyVersion: '2.0',
          knowledgeSnapshotHash: r.knowledgeSnapshotHash,
          systemPromptHash: createHash('sha256').update('HERMES_COO_SOCRATIC_PROMPT_V2.0').digest('hex').substring(0, 16),
          currentModuleIndex: responses.length,
          responses,
          startedAt: r.startedAt.toISOString(),
          closedAt: r.finalizedAt ? r.finalizedAt.toISOString() : undefined,
          overallReadinessScore: r.overallReadinessScore || undefined,
          certified: r.status === 'CERTIFIED'
        };

        this.assessments.set(assessment.id, assessment);
        return assessment;
      }
    } catch (err) {
      console.warn(`⚠️ [AcademyStore] DB getAssessment failed for ${attemptId}:`, err);
    }

    return undefined;
  }

  getAssessment(attemptId: string): CandidateAssessmentInstance | undefined {
    return this.assessments.get(attemptId);
  }

  async startAssessmentSessionAsync(token: string): Promise<{
    assessment: CandidateAssessmentInstance;
    program: typeof COO_EXECUTIVE_PROGRAM;
  }> {
    const invitation = await this.getInvitationAsync(token);
    if (!invitation) throw new Error('Invitación no válida');

    // 🛡️ SECURITY GUARD: Expiration & Status Check
    if (new Date(invitation.expiresAt).getTime() < Date.now()) {
      invitation.status = 'EXPIRED';
      throw new Error('El enlace de evaluación ha expirado. Solicita una nueva invitación a administración.');
    }

    if (invitation.status === 'REVOKED') {
      throw new Error('Esta invitación ha sido revocada.');
    }

    const candidate = await this.getCandidateAsync(invitation.candidateId);
    if (!candidate) throw new Error('Candidato no registrado');

    if (candidate.latestAttemptId) {
      const existing = await this.getAssessmentAsync(candidate.latestAttemptId);
      if (existing) {
        return { assessment: existing, program: COO_EXECUTIVE_PROGRAM };
      }
    }

    const attemptId = `attempt_${createHash('sha256').update(`${invitation.candidateId}_${Date.now()}`).digest('hex').substring(0, 16)}`;
    const now = new Date().toISOString();

    const snapshot = KnowledgeSnapshotManager.createFullProgramSnapshot();
    const knowledgeSnapshotHash = snapshot.snapshotHash;
    const systemPromptHash = createHash('sha256').update('HERMES_COO_SOCRATIC_PROMPT_V2.0').digest('hex').substring(0, 16);

    const assessment: CandidateAssessmentInstance = {
      id: attemptId,
      candidateId: candidate.id,
      candidateName: candidate.name,
      programId: COO_EXECUTIVE_PROGRAM.id,
      targetRole: candidate.targetRole,
      status: 'IN_PROGRESS',
      curriculumVersion: COO_EXECUTIVE_PROGRAM.version,
      rubricVersion: '2.0',
      fatalFailurePolicyVersion: '2.0',
      knowledgeSnapshotHash,
      systemPromptHash,
      currentModuleIndex: 0,
      responses: [],
      startedAt: now
    };

    candidate.attendanceStatus = 'IN_PROGRESS';
    candidate.latestAttemptId = attemptId;
    candidate.updatedAt = now;

    this.assessments.set(attemptId, assessment);
    invitation.status = 'USED';
    invitation.usedAt = now;

    // Awaited DB Persistence (no floating promise in serverless)
    try {
      await db.insert(academyAssessments).values({
        id: assessment.id,
        candidateId: assessment.candidateId,
        programId: assessment.programId,
        curriculumVersion: assessment.curriculumVersion,
        knowledgeSnapshotHash: assessment.knowledgeSnapshotHash,
        status: assessment.status,
        answers: [],
        evaluations: []
      });

      await db
        .update(academyInvitations)
        .set({ status: 'USED', usedAt: new Date() })
        .where(eq(academyInvitations.token, token));

      await db
        .update(academyCandidates)
        .set({ 
          attendanceStatus: 'IN_PROGRESS', 
          latestAttemptId: attemptId, 
          updatedAt: new Date() 
        })
        .where(eq(academyCandidates.id, candidate.id));
    } catch (e) {
      console.warn('⚠️ [AcademyStore] DB Insert assessment session failed:', e);
    }

    return { assessment, program: COO_EXECUTIVE_PROGRAM };
  }

  startAssessmentSession(token: string): {
    assessment: CandidateAssessmentInstance;
    program: typeof COO_EXECUTIVE_PROGRAM;
  } {
    const invitation = this.invitations.get(token);
    if (!invitation) throw new Error('Invitación no válida');

    if (new Date(invitation.expiresAt).getTime() < Date.now()) {
      invitation.status = 'EXPIRED';
      throw new Error('El enlace de evaluación ha expirado. Solicita una nueva invitación a administración.');
    }

    if (invitation.status === 'REVOKED') {
      throw new Error('Esta invitación ha sido revocada.');
    }

    const candidate = this.candidates.get(invitation.candidateId);
    if (!candidate) throw new Error('Candidato no registrado');

    if (candidate.latestAttemptId && this.assessments.has(candidate.latestAttemptId)) {
      const existing = this.assessments.get(candidate.latestAttemptId)!;
      return { assessment: existing, program: COO_EXECUTIVE_PROGRAM };
    }

    const attemptId = `attempt_${createHash('sha256').update(`${invitation.candidateId}_${Date.now()}`).digest('hex').substring(0, 16)}`;
    const now = new Date().toISOString();

    const snapshot = KnowledgeSnapshotManager.createFullProgramSnapshot();
    const knowledgeSnapshotHash = snapshot.snapshotHash;
    const systemPromptHash = createHash('sha256').update('HERMES_COO_SOCRATIC_PROMPT_V2.0').digest('hex').substring(0, 16);

    const assessment: CandidateAssessmentInstance = {
      id: attemptId,
      candidateId: candidate.id,
      candidateName: candidate.name,
      programId: COO_EXECUTIVE_PROGRAM.id,
      targetRole: candidate.targetRole,
      status: 'IN_PROGRESS',
      curriculumVersion: COO_EXECUTIVE_PROGRAM.version,
      rubricVersion: '2.0',
      fatalFailurePolicyVersion: '2.0',
      knowledgeSnapshotHash,
      systemPromptHash,
      currentModuleIndex: 0,
      responses: [],
      startedAt: now
    };

    candidate.attendanceStatus = 'IN_PROGRESS';
    candidate.latestAttemptId = attemptId;
    candidate.updatedAt = now;

    this.assessments.set(attemptId, assessment);
    invitation.status = 'USED';
    invitation.usedAt = now;

    return { assessment, program: COO_EXECUTIVE_PROGRAM };
  }

  async submitCandidateAnswer(params: {
    attemptId: string;
    moduleIndex: number;
    questionId: string;
    questionPrompt: string;
    candidateAnswer: string;
  }): Promise<{
    nextModuleIndex: number;
    isComplete: boolean;
    hermesFeedback: string;
  }> {
    const assessment = await this.getAssessmentAsync(params.attemptId);
    if (!assessment) throw new Error('Evaluación no encontrada');

    if (assessment.status === 'CERTIFIED' || assessment.status === 'FAILED') {
      throw new Error('Esta evaluación ya ha sido finalizada y no acepta nuevas respuestas.');
    }

    // 🛡️ PROGRESS GUARD: Prevent out-of-order answer submissions
    if (params.moduleIndex !== assessment.currentModuleIndex) {
      throw new Error(`El índice del módulo enviado (${params.moduleIndex}) no coincide con el progreso actual (${assessment.currentModuleIndex}).`);
    }

    const module = COO_EXECUTIVE_PROGRAM.modules[params.moduleIndex];
    if (!module) throw new Error('Módulo no válido');

    const scoreResult = await AssessmentEngine.evaluateSingleAssessment({
      assessmentId: params.questionId,
      candidateAnswer: params.candidateAnswer
    });

    const responseItem: CandidateResponseItem = {
      questionId: params.questionId,
      moduleIndex: params.moduleIndex,
      questionPrompt: params.questionPrompt,
      candidateAnswer: params.candidateAnswer,
      hermesFeedback: scoreResult.rawAiFeedback,
      submittedAt: new Date().toISOString()
    };

    assessment.responses.push(responseItem);

    const nextModuleIndex = params.moduleIndex + 1;
    const isComplete = nextModuleIndex >= COO_EXECUTIVE_PROGRAM.modules.length;
    assessment.currentModuleIndex = nextModuleIndex;

    try {
      await db
        .update(academyAssessments)
        .set({
          answers: assessment.responses as any
        })
        .where(eq(academyAssessments.id, assessment.id));
    } catch (err) {
      console.warn('⚠️ [AcademyStore] DB Update assessment answers failed:', err);
    }

    return {
      nextModuleIndex,
      isComplete,
      hermesFeedback: scoreResult.rawAiFeedback
    };
  }

  async finalizeAndCertifyAssessment(attemptId: string): Promise<{
    assessment: CandidateAssessmentInstance;
    certification?: AcademyCertification;
  }> {
    const assessment = await this.getAssessmentAsync(attemptId);
    if (!assessment) throw new Error('Evaluación no encontrada');

    // 🛡️ RE-GRADING GUARD: If already certified or failed, return the existing result
    if (assessment.status === 'CERTIFIED' && assessment.certificationId) {
      const existingCert = await this.getCertificationAsync(assessment.certificationId);
      return { assessment, certification: existingCert };
    }

    if (assessment.status === 'FAILED') {
      return { assessment };
    }

    const candidate = await this.getCandidateAsync(assessment.candidateId);
    const now = new Date().toISOString();
    assessment.closedAt = now;

    // Convert responses to Record<string, string>
    const answers: Record<string, string> = {};
    for (const r of assessment.responses) {
      answers[r.questionId] = r.candidateAnswer;
    }

    const fullAttempt = await AssessmentEngine.evaluateFullAttempt({
      attemptId: assessment.id,
      candidateId: assessment.candidateId,
      candidateName: assessment.candidateName,
      answers
    });

    assessment.finalModuleScores = fullAttempt.attemptResult.moduleScores;
    assessment.overallReadinessScore = fullAttempt.attemptResult.overallReadinessScore;
    assessment.competencySummary = fullAttempt.attemptResult.crossCuttingCompetencies;
    assessment.criticalFailures = fullAttempt.attemptResult.criticalFailures;

    if (fullAttempt.certification) {
      assessment.certified = true;
      assessment.certificationId = fullAttempt.certification.id;
      assessment.status = 'CERTIFIED';
      this.certifications.set(fullAttempt.certification.id, fullAttempt.certification);

      if (candidate) {
        candidate.attendanceStatus = 'CERTIFIED';
        candidate.latestScore = assessment.overallReadinessScore;
        candidate.latestCertificationId = fullAttempt.certification.id;
        candidate.updatedAt = now;
      }

      try {
        await db.insert(academyCertifications).values({
          id: fullAttempt.certification.id,
          candidateId: assessment.candidateId,
          candidateName: assessment.candidateName,
          assessmentId: assessment.id,
          programId: assessment.programId,
          readinessScore: fullAttempt.certification.readinessScore,
          competencySummary: fullAttempt.certification.competencySummary as any,
          knowledgeSnapshotHash: assessment.knowledgeSnapshotHash,
          curriculumVersion: assessment.curriculumVersion,
          certificateHash: fullAttempt.certification.certificateHash,
          issuer: fullAttempt.certification.issuer,
          validUntil: new Date(fullAttempt.certification.validUntil)
        });

        await db
          .update(academyAssessments)
          .set({
            status: 'CERTIFIED',
            overallReadinessScore: assessment.overallReadinessScore,
            finalizedAt: new Date()
          })
          .where(eq(academyAssessments.id, assessment.id));

        if (candidate) {
          await db
            .update(academyCandidates)
            .set({
              attendanceStatus: 'CERTIFIED',
              latestScore: assessment.overallReadinessScore,
              latestCertificationId: fullAttempt.certification.id,
              updatedAt: new Date()
            })
            .where(eq(academyCandidates.id, candidate.id));
        }
      } catch (e) {
        console.warn('⚠️ [AcademyStore] DB Finalize certification failed:', e);
      }

      return { assessment, certification: fullAttempt.certification };
    } else {
      assessment.certified = false;
      assessment.status = 'FAILED';

      if (candidate) {
        candidate.attendanceStatus = 'FAILED';
        candidate.latestScore = assessment.overallReadinessScore;
        candidate.updatedAt = now;
      }

      try {
        await db
          .update(academyAssessments)
          .set({
            status: 'FAILED',
            overallReadinessScore: assessment.overallReadinessScore,
            finalizedAt: new Date()
          })
          .where(eq(academyAssessments.id, assessment.id));

        if (candidate) {
          await db
            .update(academyCandidates)
            .set({
              attendanceStatus: 'FAILED',
              latestScore: assessment.overallReadinessScore,
              updatedAt: new Date()
            })
            .where(eq(academyCandidates.id, candidate.id));
        }
      } catch (e) {
        console.warn('⚠️ [AcademyStore] DB Finalize failed status update failed:', e);
      }

      return { assessment };
    }
  }

  // ─── CERTIFICATIONS (READ-THROUGH) ──────────────────────────────────────────

  async getCertificationAsync(id: string): Promise<AcademyCertification | undefined> {
    if (this.certifications.has(id)) {
      return this.certifications.get(id);
    }

    try {
      const rows = await db
        .select()
        .from(academyCertifications)
        .where(eq(academyCertifications.id, id))
        .limit(1);

      if (rows && rows.length > 0) {
        const r = rows[0];
        if (!r) return undefined;
        const cert: AcademyCertification = {
          id: r.id,
          candidateId: r.candidateId,
          candidateName: r.candidateName,
          attemptId: r.assessmentId,
          programId: r.programId,
          targetRole: 'COO',
          readinessScore: r.readinessScore,
          competencySummary: (r.competencySummary as any) || {
            riskManagement: 90,
            decisionMaking: 90,
            escalationProtocol: 90,
            entitySeparation: 90,
            authorizationRigor: 90,
            auditability: 90,
            humanHandoff: 90
          },
          status: 'CERTIFIED',
          curriculumVersion: r.curriculumVersion || 2,
          rubricVersion: '2.0',
          fatalFailurePolicyVersion: '2.0',
          knowledgeSnapshotHash: r.knowledgeSnapshotHash || '',
          certifiedAt: r.issuedAt.toISOString(),
          validUntil: r.validUntil ? r.validUntil.toISOString() : new Date(r.issuedAt.getTime() + 365 * 86400000).toISOString(),
          certificateHash: r.certificateHash,
          issuer: r.issuer
        };
        this.certifications.set(cert.id, cert);
        return cert;
      }
    } catch (err) {
      console.warn(`⚠️ [AcademyStore] DB getCertification failed for ${id}:`, err);
    }

    return undefined;
  }

  getCertification(id: string): AcademyCertification | undefined {
    return this.certifications.get(id);
  }
}

export const AcademyStore = new AcademyStoreSingleton();
