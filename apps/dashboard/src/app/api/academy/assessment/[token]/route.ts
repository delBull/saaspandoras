/**
 * 🎓 Candidate Assessment Session API (Async Read-Through)
 * apps/dashboard/src/app/api/academy/assessment/[token]/route.ts
 *
 * Serverless-safe Candidate Interface with DB read-through, token validation,
 * expiry checks, out-of-order submit protection, and attempt binding.
 */

import { NextRequest, NextResponse } from 'next/server';
import { AcademyStore } from '@/lib/pandoras/core/domains/academy/candidates/candidate-store';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const invitation = await AcademyStore.getInvitationAsync(token);

    if (!invitation) {
      return NextResponse.json({ success: false, error: 'Enlace de evaluación no válido o no encontrado' }, { status: 404 });
    }

    if (new Date(invitation.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ success: false, error: 'El enlace de evaluación ha expirado.' }, { status: 410 });
    }

    const candidate = await AcademyStore.getCandidateAsync(invitation.candidateId);
    if (!candidate) {
      return NextResponse.json({ success: false, error: 'Candidato no registrado' }, { status: 404 });
    }

    const url = new URL(req.url);
    const emailParam = (url.searchParams.get('email') || '').trim().toLowerCase();

    // Mask helper: p***@gmail.com
    const maskEmail = (e: string) => {
      const parts = e.split('@');
      if (parts.length !== 2) return e;
      const user = parts[0]!;
      const domain = parts[1]!;
      const maskedUser = user.length > 2 ? `${user[0]}***${user[user.length - 1]}` : `${user[0]}***`;
      return `${maskedUser}@${domain}`;
    };

    // If no email provided, request verification
    if (!emailParam) {
      return NextResponse.json({
        success: true,
        requiresVerification: true,
        candidateName: candidate.name,
        targetRole: candidate.targetRole,
        maskedEmail: maskEmail(candidate.email)
      });
    }

    // Verify provided email against registered candidate email
    if (emailParam !== candidate.email.trim().toLowerCase()) {
      return NextResponse.json({
        success: false,
        error: 'El correo electrónico ingresado no coincide con el candidato registrado para esta invitación.'
      }, { status: 403 });
    }

    const { assessment, program } = await AcademyStore.startAssessmentSessionAsync(token);

    return NextResponse.json({
      success: true,
      requiresVerification: false,
      assessment: {
        id: assessment.id,
        candidateName: assessment.candidateName,
        targetRole: assessment.targetRole,
        status: assessment.status,
        currentModuleIndex: assessment.currentModuleIndex,
        totalModules: program.modules.length,
        curriculumVersion: assessment.curriculumVersion,
        responses: assessment.responses
      },
      currentModule: program.modules[assessment.currentModuleIndex] || null,
      isComplete: assessment.currentModuleIndex >= program.modules.length,
      certificationId: assessment.certificationId
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const invitation = await AcademyStore.getInvitationAsync(token);

    // 🛡️ SECURITY GUARD 1: Validate token exists and is active
    if (!invitation) {
      return NextResponse.json({ success: false, error: 'Token de evaluación no válido' }, { status: 404 });
    }

    if (new Date(invitation.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ success: false, error: 'El enlace de evaluación ha expirado' }, { status: 410 });
    }

    if (invitation.status === 'REVOKED') {
      return NextResponse.json({ success: false, error: 'Invitación revocada' }, { status: 403 });
    }

    const body = await req.json();
    const { action, attemptId, moduleIndex, questionId, questionPrompt, candidateAnswer } = body;

    // 🛡️ SECURITY GUARD 2: Attempt must belong to this invitation / candidate
    const assessment = await AcademyStore.getAssessmentAsync(attemptId);
    if (!assessment || assessment.candidateId !== invitation.candidateId) {
      const candidate = await AcademyStore.getCandidateAsync(invitation.candidateId);
      if (!candidate || candidate.latestAttemptId !== attemptId) {
        return NextResponse.json({ success: false, error: 'El intento de evaluación no corresponde a este token' }, { status: 403 });
      }
    }

    if (action === 'SUBMIT_ANSWER') {
      if (!attemptId || moduleIndex === undefined || !questionId || !candidateAnswer) {
        return NextResponse.json({ success: false, error: 'Parámetros incompletos' }, { status: 400 });
      }

      const result = await AcademyStore.submitCandidateAnswer({
        attemptId,
        moduleIndex,
        questionId,
        questionPrompt,
        candidateAnswer
      });

      return NextResponse.json({ success: true, result });
    }

    if (action === 'FINALIZE') {
      if (!attemptId) {
        return NextResponse.json({ success: false, error: 'ID de evaluación requerido' }, { status: 400 });
      }

      const finalizeResult = await AcademyStore.finalizeAndCertifyAssessment(attemptId);

      // If candidate is part of ALL_TRACKS suite and just got certified, find their next track
      let nextSuiteInvitation: { token: string; targetRole: string } | null = null;
      if (finalizeResult.certification && finalizeResult.assessment.candidateId) {
        const completedRole = finalizeResult.assessment.targetRole;
        const candidateId = finalizeResult.assessment.candidateId;
        nextSuiteInvitation = await AcademyStore.getNextSuiteInvitationAsync(candidateId, completedRole);
      }

      return NextResponse.json({
        success: true,
        assessment: finalizeResult.assessment,
        certification: finalizeResult.certification,
        nextSuiteInvitation
      });
    }

    return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
