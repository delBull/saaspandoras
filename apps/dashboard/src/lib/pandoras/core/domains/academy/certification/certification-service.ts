/**
 * 🎖️ Pandora's Academy — Certification Service
 * apps/dashboard/src/lib/pandoras/core/domains/academy/certification/certification-service.ts
 *
 * Generates and signs institutional credentials upon passing the assessment.
 */

import { createHash } from 'crypto';
import { AcademyCertification, AssessmentAttemptResult } from '../types';

export class CertificationService {
  /**
   * Issues a signed institutional certificate for a successful assessment attempt.
   */
  static issueCertification(params: {
    programId: string;
    targetRole: string;
    candidateId: string;
    candidateName?: string;
    attemptResult: AssessmentAttemptResult;
  }): AcademyCertification {
    const { programId, targetRole, candidateId, candidateName, attemptResult } = params;

    const certId = `cert_${createHash('sha256').update(`${candidateId}_${programId}_${attemptResult.attemptId}_${Date.now()}`).digest('hex').substring(0, 16)}`;
    const now = new Date();
    const validUntil = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year validity

    const certPayload = [
      `CERT_ID:${certId}`,
      `PROGRAM:${programId}`,
      `ROLE:${targetRole}`,
      `CANDIDATE:${candidateId}`,
      `SCORE:${attemptResult.overallReadinessScore}`,
      `SNAPSHOT:${attemptResult.snapshotId}`,
      `DATE:${now.toISOString()}`
    ].join('|');

    const certificateHash = createHash('sha256').update(certPayload).digest('hex');

    return {
      id: certId,
      programId,
      candidateId,
      candidateName: candidateName || 'Ejecutivo Pandora\'s',
      attemptId: attemptResult.attemptId,
      targetRole,
      readinessScore: attemptResult.overallReadinessScore,
      competencySummary: attemptResult.crossCuttingCompetencies,
      status: 'CERTIFIED',
      curriculumVersion: 1,
      rubricVersion: '1.0',
      fatalFailurePolicyVersion: '1.0',
      knowledgeSnapshotHash: attemptResult.snapshotId,
      certifiedAt: now.toISOString(),
      validUntil: validUntil.toISOString(),
      issuer: "Pandora's Academy Core · Institutional Control Plane",
      certificateHash
    };
  }
}
