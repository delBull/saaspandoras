/**
 * 🎓 Pandora's Academy — IPFS & Sovereign EIP-712 Certification Test Suite
 * apps/dashboard/src/lib/pandoras/core/domains/academy/__tests__/academy-ipfs-sovereignty.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CertificationService } from '../certification/certification-service';
import { HermesIdentitySigner } from '../../hermes/identity/identity-signer';
import { AcademyProgram, AssessmentAttemptResult } from '../types';

describe("Pandora's Academy — Sovereign IPFS & EIP-712 Verifiable Credentials", () => {
  let signer: HermesIdentitySigner;

  const mockProgram: AcademyProgram = {
    id: 'prog_coo_internal_v1',
    code: 'COO_INTERNAL_V1',
    title: 'COO Institutional Operations & Governance Certification',
    description: 'Mastery certification for internal operational execution.',
    targetRole: 'COO',
    status: 'ACTIVE',
    version: 1,
    passingScore: 85,
    modules: [
      {
        id: 'mod_1',
        programId: 'prog_coo_internal_v1',
        sequence: 1,
        code: 'MOD_RISK_LATTICE',
        title: 'Risk Lattice & Boundary Management',
        description: 'Enforcing boundary conditions and zero-trust policies.',
        weightPercentage: 100,
        requiredKnowledgeDocs: ['ADR-011', 'K15-LATTICE'],
        assessments: [
          {
            id: 'ass_1',
            moduleId: 'mod_1',
            title: 'Critical Failure Simulation',
            scenarioContext: 'Adversarial prompt injection attempt on customer channel.',
            questionPrompt: 'Describe policy escalation under Tier 4 disclosure.',
            passingThreshold: 85,
            criticalFailureConditions: ['DIRECT_SECRET_DISCLOSURE'],
            rubricCriteria: [
              {
                id: 'crit_1',
                title: 'Policy Enforcement',
                description: 'Correct escalation without leaks.',
                maxScore: 50,
                evaluationGuideline: 'Must cite Lattice Rank ceiling.',
              },
              {
                id: 'crit_2',
                title: 'Forensic Audit Chain',
                description: 'Logging to immutable hash chain.',
                maxScore: 50,
                evaluationGuideline: 'Must emit CRITICAL security event.',
              },
            ],
          },
        ],
      },
    ],
  };

  const mockAttemptResult: AssessmentAttemptResult = {
    attemptId: 'att_candidate_999_2026',
    programId: 'prog_coo_internal_v1',
    candidateId: 'cand_marco_001',
    snapshotId: 'snap_knowledge_k26_master',
    status: 'PASSED',
    moduleScores: { mod_1: 95 },
    overallReadinessScore: 95,
    crossCuttingCompetencies: {
      riskManagement: 98,
      decisionMaking: 94,
      escalationProtocol: 95,
      entitySeparation: 92,
      authorizationRigor: 96,
      auditability: 97,
      humanHandoff: 90,
    },
    criticalFailures: [],
    certified: true,
    completedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    signer = new HermesIdentitySigner('0x0123456789012345678901234567890123456789012345678901234567890123');
  });

  // ─── TEST 1: Immutable Rubric IPFS Anchor ────────────────────────────────────
  it('ACAD-IPFS-01: Anchors Academy assessment rubric to IPFS with EIP-712 signature', async () => {
    const rubricAnchor = await CertificationService.anchorRubricToIpfs({
      program: mockProgram,
      agentSigner: signer,
    });

    expect(rubricAnchor.rubricSnapshotCid).toBeDefined();
    expect(rubricAnchor.rubricSnapshotCid.startsWith('bafkrei')).toBe(true);
    expect(rubricAnchor.ipfsUri).toContain('ipfs://');
    expect(rubricAnchor.rubricHash).toBeDefined();
    expect(rubricAnchor.rubricHash.length).toBe(64);
    expect(rubricAnchor.signedByAddress).toBe(signer.getPublicAddress());
    expect(rubricAnchor.agentSignature.startsWith('0x')).toBe(true);
  });

  // ─── TEST 2: Verifiable Certificate IPFS Anchor ──────────────────────────────
  it('ACAD-IPFS-02: Issues and anchors a verifiable Certificate to IPFS with Agent Wallet signature and rubric CID', async () => {
    // 1. Anchor Rubric First
    const rubricAnchor = await CertificationService.anchorRubricToIpfs({
      program: mockProgram,
      agentSigner: signer,
    });

    // 2. Issue Certificate anchored to IPFS linking Rubric CID
    const cert = await CertificationService.issueAndAnchorCertification({
      programId: mockProgram.id,
      targetRole: mockProgram.targetRole,
      candidateId: mockAttemptResult.candidateId,
      candidateName: 'Marco',
      attemptResult: mockAttemptResult,
      agentSigner: signer,
      rubricSnapshotCid: rubricAnchor.rubricSnapshotCid,
    });

    expect(cert.id).toBeDefined();
    expect(cert.status).toBe('CERTIFIED');
    expect(cert.readinessScore).toBe(95);
    expect(cert.certificateHash).toBeDefined();
    expect(cert.certificateHash.length).toBe(64);
    expect(cert.rubricSnapshotCid).toBe(rubricAnchor.rubricSnapshotCid);
    expect(cert.ipfsCid).toBeDefined();
    expect(cert.ipfsCid!.startsWith('bafkrei')).toBe(true);
    expect(cert.ipfsUri).toBe(`ipfs://${cert.ipfsCid}`);
    expect(cert.signedByAddress).toBe(signer.getPublicAddress());
    expect(cert.agentSignature).toBeDefined();
    expect(cert.agentSignature!.startsWith('0x')).toBe(true);
  });

  // ─── TEST 3: End-to-End Graduation Flow via AcademyStore ─────────────────────
  it('ACAD-IPFS-03: End-to-end candidate graduation through AcademyStore automatically anchors to IPFS with EIP-712 signature', async () => {
    const { AcademyStore } = await import('../candidates/candidate-store');

    // 1. Create a Candidate and Invitation (awaited DB persistence)
    const { candidate, invitation } = await AcademyStore.createCandidateAsync({
      name: 'Elena Vega',
      email: `elena_${Date.now()}@pandoras.finance`,
      targetRole: 'COO',
    });

    // 2. Start Assessment Session
    const { assessment, program } = await AcademyStore.startAssessmentSessionAsync(invitation.token);

    // 3. Submit Answers for each module assessment
    for (let modIdx = 0; modIdx < program.modules.length; modIdx++) {
      const currentAsm = program.modules[modIdx]?.assessments[0];
      if (currentAsm) {
        await AcademyStore.submitCandidateAnswer({
          attemptId: assessment.id,
          moduleIndex: modIdx,
          questionId: currentAsm.id,
          questionPrompt: currentAsm.questionPrompt,
          candidateAnswer: 'Establecer una segregación formal de entidades legales y aplicar límites de divulgación de nivel institucional con auditoría forense inmutable.',
        });
      }
    }

    // 4. Finalize & Certify
    const result = await AcademyStore.finalizeAndCertifyAssessment(assessment.id);

    expect(result.assessment.status).toBe('CERTIFIED');
    expect(result.certification).toBeDefined();
    expect(result.certification!.ipfsCid).toBeDefined();
    expect(result.certification!.ipfsCid!.startsWith('bafkrei')).toBe(true);
    expect(result.certification!.ipfsUri).toBe(`ipfs://${result.certification!.ipfsCid}`);
    expect(result.certification!.signedByAddress).toBeDefined();
    expect(result.certification!.signedByAddress!.startsWith('0x')).toBe(true);
    expect(result.certification!.agentSignature).toBeDefined();
    expect(result.certification!.agentSignature!.startsWith('0x')).toBe(true);

    // 5. Verify Read-Through Persistence
    const retrievedCert = await AcademyStore.getCertificationAsync(result.certification!.id);
    expect(retrievedCert).toBeDefined();
    expect(retrievedCert!.ipfsCid).toBe(result.certification!.ipfsCid);
    expect(retrievedCert!.agentSignature).toBe(result.certification!.agentSignature);
  });
});
