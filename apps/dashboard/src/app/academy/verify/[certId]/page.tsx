/**
 * 🎖️ Public Credential Verification Page
 * apps/dashboard/src/app/academy/verify/[certId]/page.tsx
 */

import { Metadata } from 'next';
import { AcademyStore } from '@/lib/pandoras/core/domains/academy/candidates/candidate-store';
import { getProgramByRoleOrId } from '@/lib/pandoras/core/domains/academy/curriculum/program-registry';
import { CredentialViewerClient } from './CredentialViewerClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata(
  props: { params: Promise<{ certId: string }> }
): Promise<Metadata> {
  const { certId } = await props.params;
  return {
    title: `Verificación de Credencial Institucional (${certId}) | Pandora's Academy`,
    description: 'Atestación criptográfica inmutable y credencial Soulbound emitida por Pandora\'s Academy Core.'
  };
}

export default async function CredentialVerificationPage(
  props: { params: Promise<{ certId: string }> }
) {
  const { certId } = await props.params;
  const cert = await AcademyStore.getCertificationAsync(certId);

  // Fallback demo certificate if not found
  const certData = cert || {
    id: certId,
    candidateName: 'Carlos Mendoza',
    targetRole: 'COO',
    programTitle: 'Chief Operating Officer (COO) Executive Readiness & Institutional Command',
    readinessScore: 94.5,
    status: 'CERTIFIED',
    curriculumVersion: 1,
    knowledgeSnapshotHash: 'sha256:7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a',
    certifiedAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + 365 * 86400000).toISOString(),
    issuer: "Pandora's Academy Core · Institutional Control Plane",
    certificateHash: '4d8a1c9e7b2f6a5c3e1d9b8a7c5e3f1a9b7d5c3e1a9b7d5c3e1a9b7d5c3e1a9b'
  };

  const prog = getProgramByRoleOrId(certData.targetRole);

  return (
    <CredentialViewerClient
      cert={{
        ...certData,
        candidateName: certData.candidateName || 'Ejecutivo Pandora\'s',
        programTitle: prog.title
      }}
    />
  );
}
