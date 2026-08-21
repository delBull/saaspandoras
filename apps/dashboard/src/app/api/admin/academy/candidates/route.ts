/**
 * 👥 Academy Candidates & Attendance Admin API
 * apps/dashboard/src/app/api/admin/academy/candidates/route.ts
 *
 * Protected Admin Endpoint for managing candidates and invitations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { AcademyStore } from '@/lib/pandoras/core/domains/academy/candidates/candidate-store';
import { verifyAdminRequest } from '@/lib/pandoras/core/domains/academy/security/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminRequest(req);
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges or valid unlock token required.' }, { status: 401 });
    }

    const candidates = await AcademyStore.listCandidatesAsync();

    const total = candidates.length;
    const attended = candidates.filter(c => c.attendanceStatus !== 'INVITED').length;
    const certified = candidates.filter(c => c.attendanceStatus === 'CERTIFIED').length;
    const failed = candidates.filter(c => c.attendanceStatus === 'FAILED').length;
    const inProgress = candidates.filter(c => c.attendanceStatus === 'IN_PROGRESS').length;

    const scores = candidates.map(c => c.latestScore).filter((s): s is number => s !== undefined);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const attendanceRate = total > 0 ? (attended / total) * 100 : 0;

    return NextResponse.json({
      success: true,
      candidates,
      metrics: {
        total,
        attended,
        attendanceRate,
        certified,
        failed,
        inProgress,
        avgScore
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminRequest(req);
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges or valid unlock token required.' }, { status: 401 });
    }

    const body = await req.json();
    const { action, name, email, phone, targetRole, notes, candidateId } = body;

    if (action === 'REINVITE' && candidateId) {
      const invitation = await AcademyStore.createInvitationAsync(candidateId);
      return NextResponse.json({ success: true, invitation });
    }

    if (!name || !email) {
      return NextResponse.json({ success: false, error: 'Nombre y correo son obligatorios' }, { status: 400 });
    }

    const result = await AcademyStore.createCandidateAsync({
      name,
      email,
      phone,
      targetRole,
      notes
    });

    return NextResponse.json({
      success: true,
      candidate: result.candidate,
      invitation: result.invitation
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
