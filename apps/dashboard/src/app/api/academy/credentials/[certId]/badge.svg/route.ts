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

    if (!cert) {
      // Fallback demo badge if cert not yet in DB
      const fallbackSvg = generateSoulboundSvg({
        certId: certId || 'cert_demo_executive',
        candidateName: 'Ejecutivo Pandora\'s',
        targetRole: 'COO',
        programTitle: 'Chief Operating Officer (COO) Executive Certification',
        readinessScore: 92,
        certifiedAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 365 * 86400000).toISOString(),
        certificateHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      });

      return new NextResponse(fallbackSvg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600'
        }
      });
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
      certificateHash: cert.certificateHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    });

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
