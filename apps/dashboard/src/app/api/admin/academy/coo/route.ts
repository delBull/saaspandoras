/**
 * 🎓 Internal Admin Academy API Route
 * apps/dashboard/src/app/api/admin/academy/coo/route.ts
 *
 * Internal Control Plane endpoint for Pandora's Academy:
 * - GET: Returns COO Program Curriculum, Modules, Rubrics and Knowledge Snapshot.
 * - POST: Evaluates single response or full exam attempt deterministically.
 */

import { NextResponse } from 'next/server';
import { AssessmentEngine } from '@/lib/pandoras/core/domains/academy/assessment/assessment-engine';
import { CANONICAL_KNOWLEDGE_DOCS } from '@/lib/pandoras/core/domains/academy/curriculum/knowledge-sources';
import { KnowledgeSnapshotManager } from '@/lib/pandoras/core/domains/academy/snapshots/snapshot-manager';

export async function GET() {
  try {
    const program = AssessmentEngine.getProgram('COO_INTERNAL_V1');
    const snapshot = KnowledgeSnapshotManager.createFullProgramSnapshot();

    return NextResponse.json({
      success: true,
      program,
      knowledgeSources: Object.values(CANONICAL_KNOWLEDGE_DOCS),
      currentSnapshot: {
        snapshotId: snapshot.id,
        snapshotHash: snapshot.snapshotHash,
        documentsCount: snapshot.sourceDocuments.length
      }
    });
  } catch (error: any) {
    console.error('❌ [Academy API GET]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action || 'evaluate_single';

    // 1. Single Question Live Evaluation
    if (action === 'evaluate_single') {
      const { assessmentId, candidateAnswer } = body;
      if (!assessmentId || !candidateAnswer) {
        return NextResponse.json({ success: false, error: 'Falta assessmentId o candidateAnswer' }, { status: 400 });
      }

      const scoreResult = await AssessmentEngine.evaluateSingleAssessment({
        assessmentId,
        candidateAnswer
      });

      return NextResponse.json({
        success: true,
        scoreResult
      });
    }

    // 2. Full Attempt Evaluation
    if (action === 'evaluate_full') {
      const { attemptId, candidateId, candidateName, answers } = body;
      if (!candidateId || !answers) {
        return NextResponse.json({ success: false, error: 'Falta candidateId o answers' }, { status: 400 });
      }

      const result = await AssessmentEngine.evaluateFullAttempt({
        attemptId: attemptId || `att_${Date.now()}`,
        candidateId,
        candidateName,
        answers
      });

      return NextResponse.json({
        success: true,
        ...result
      });
    }

    return NextResponse.json({ success: false, error: 'Acción no soportada' }, { status: 400 });
  } catch (error: any) {
    console.error('❌ [Academy API POST]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
