/**
 * 🖼️ Soulbound SVG Badge API Route
 * apps/dashboard/src/app/api/academy/credentials/[certId]/badge.svg/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { AcademyStore } from '@/lib/pandoras/core/domains/academy/candidates/candidate-store';
import { generateSoulboundSvg } from '@/lib/pandoras/core/domains/academy/certification/badge-generator';
import { getProgramByRoleOrId } from '@/lib/pandoras/core/domains/academy/curriculum/program-registry';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ certId: string }> }
) {
  const { certId } = await context.params;

  try {
    const cert = await AcademyStore.getCertificationAsync(certId);

    // 🛡️ SECURITY GUARD: Return 404 if certificate does not exist (never fake demo badges for unknown IDs)
    if (!cert) {
      return NextResponse.json(
        { success: false, error: `Certificate '${certId}' not found in registry.` },
        { status: 404 }
      );
    }

    const prog = getProgramByRoleOrId(cert.targetRole);

    const svg = generateSoulboundSvg({
      certId: cert.id,
      candidateName: cert.candidateName || 'Ejecutivo Certificado',
      targetRole: cert.targetRole,
      programTitle: prog.title,
      readinessScore: cert.readinessScore,
      certifiedAt: cert.certifiedAt,
      validUntil: cert.validUntil || new Date(Date.now() + 365 * 86400000).toISOString(),
      certificateHash: cert.certificateHash || ''
    });

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'private, no-cache, no-store, must-revalidate'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
