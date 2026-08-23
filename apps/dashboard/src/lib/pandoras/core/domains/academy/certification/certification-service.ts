import { createHash } from 'crypto';
import { AcademyCertification, AssessmentAttemptResult, AcademyProgram } from '../types';
import { HermesIdentitySigner } from '../../hermes/identity/identity-signer';
import { TenantIpfsVaultService } from '../../hermes/knowledge/ipfs-vault';

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
    rubricSnapshotCid?: string;
  }): AcademyCertification {
    const { programId, targetRole, candidateId, candidateName, attemptResult, rubricSnapshotCid } = params;

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
      certificateHash,
      rubricSnapshotCid,
    };
  }

  /**
   * Issues an institutional certificate AND anchors it to IPFS signed with Hermes Agent Wallet (EIP-712).
   */
  static async issueAndAnchorCertification(params: {
    programId: string;
    targetRole: string;
    candidateId: string;
    candidateName?: string;
    attemptResult: AssessmentAttemptResult;
    agentSigner: HermesIdentitySigner;
    rubricSnapshotCid?: string;
    vaultService?: TenantIpfsVaultService;
  }): Promise<AcademyCertification> {
    const { agentSigner, vaultService, ...issueParams } = params;

    if (!agentSigner) {
      throw new Error('[CertificationService] HermesIdentitySigner is mandatory to anchor Academy certificates.');
    }

    const baseCert = this.issueCertification(issueParams);

    // 1. Pin verifiable certificate to IPFS
    const vault = vaultService || new TenantIpfsVaultService();
    const ipfsCid = await vault.pinJsonToIpfs(baseCert, `academy_cert_${baseCert.id}`);

    // 2. Sign EIP-712 attestation with Agent Wallet
    const signedIntent = await agentSigner.signIntent({
      tenantId: 'pandoras_academy',
      actorId: `academy_evaluator_${params.programId}`,
      actionName: 'academy.certification_issue',
      resourceId: ipfsCid,
      policyHash: baseCert.certificateHash,
    });

    return {
      ...baseCert,
      ipfsCid,
      ipfsUri: `ipfs://${ipfsCid}`,
      signedByAddress: agentSigner.getPublicAddress(),
      agentSignature: signedIntent.signature,
    };
  }

  /**
   * Anchors an immutable version of an Academy Assessment Rubric to IPFS signed via EIP-712.
   */
  static async anchorRubricToIpfs(params: {
    program: AcademyProgram;
    agentSigner: HermesIdentitySigner;
    vaultService?: TenantIpfsVaultService;
  }): Promise<{
    rubricSnapshotCid: string;
    rubricHash: string;
    ipfsUri: string;
    signedByAddress: string;
    agentSignature: string;
  }> {
    const { program, agentSigner, vaultService } = params;

    if (!agentSigner) {
      throw new Error('[CertificationService] HermesIdentitySigner is mandatory to anchor Academy rubrics.');
    }

    const rubricCanonicalPayload = JSON.stringify({
      programId: program.id,
      code: program.code,
      title: program.title,
      targetRole: program.targetRole,
      version: program.version,
      passingScore: program.passingScore,
      modules: program.modules.map(m => ({
        id: m.id,
        code: m.code,
        title: m.title,
        weightPercentage: m.weightPercentage,
        assessments: m.assessments.map(a => ({
          id: a.id,
          title: a.title,
          passingThreshold: a.passingThreshold,
          criticalFailureConditions: a.criticalFailureConditions,
          rubricCriteria: a.rubricCriteria,
        })),
      })),
    });

    const rubricHash = createHash('sha256').update(rubricCanonicalPayload, 'utf8').digest('hex');

    // 1. Pin canonical rubric to IPFS
    const vault = vaultService || new TenantIpfsVaultService();
    const rubricSnapshotCid = await vault.pinJsonToIpfs(
      JSON.parse(rubricCanonicalPayload),
      `academy_rubric_${program.code}_v${program.version}`
    );

    // 2. Sign EIP-712 attestation with Agent Wallet
    const signedIntent = await agentSigner.signIntent({
      tenantId: 'pandoras_academy',
      actorId: `academy_governance_${program.code}`,
      actionName: 'academy.rubric_anchor',
      resourceId: rubricSnapshotCid,
      policyHash: rubricHash,
    });

    return {
      rubricSnapshotCid,
      rubricHash,
      ipfsUri: `ipfs://${rubricSnapshotCid}`,
      signedByAddress: agentSigner.getPublicAddress(),
      agentSignature: signedIntent.signature,
    };
  }
}

