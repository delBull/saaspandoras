/**
 * 🎖️ Public Credential Verification Page
 * apps/dashboard/src/app/academy/verify/[certId]/page.tsx
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AcademyStore } from '@/lib/pandoras/core/domains/academy/candidates/candidate-store';
import { getProgramByRoleOrId } from '@/lib/pandoras/core/domains/academy/curriculum/program-registry';
import { CredentialViewerClient } from './CredentialViewerClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata(
  props: { params: Promise<{ certId: string }> }
): Promise<Metadata> {
  const { certId } = await props.params;
  const cert = await AcademyStore.getCertificationAsync(certId);

  if (!cert) {
    return {
      title: 'Credencial No Encontrada | Pandora\'s Academy',
      description: 'El identificador de certificado proporcionado no existe en los registros inmutables de Pandora\'s Academy.'
    };
  }

  return {
    title: `Verificación Oficial (${cert.targetRole}) — ${cert.candidateName || 'Ejecutivo'} | Pandora's Academy`,
    description: `Atestación criptográfica inmutable emitida para ${cert.candidateName || 'Ejecutivo'} con puntaje de ${cert.readinessScore}%.`
  };
}

export default async function CredentialVerificationPage(
  props: { params: Promise<{ certId: string }> }
) {
  const { certId } = await props.params;
  const cert = await AcademyStore.getCertificationAsync(certId);

  // 🛡️ SECURITY GUARD: Never fabricate certificates for invalid/unknown IDs
  if (!cert) {
    notFound();
  }

  const prog = getProgramByRoleOrId(cert.targetRole);

  return (
    <CredentialViewerClient
      cert={{
        ...cert,
        candidateName: cert.candidateName || 'Ejecutivo Pandora\'s',
        programTitle: prog.title
      }}
    />
  );
}
