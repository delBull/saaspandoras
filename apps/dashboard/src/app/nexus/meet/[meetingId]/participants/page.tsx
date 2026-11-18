import React from 'react';
import { redirect } from 'next/navigation';
import { getNexusAuthContext } from '@saasfly/shared';
import { ParticipantInjector } from './ParticipantInjector';

export const dynamic = 'force-dynamic';

/**
 * /nexus/meet/[meetingId]/participants
 *
 * El host inyecta participantes por email. Al guardarlos:
 *  - se crea el cliente en el CRM (status negotiating) ligado al Deal Room,
 *  - se les envía el enlace al Deal Room con el documento de aceptación.
 */
export default async function MeetParticipantsPage({ params }: { params: Promise<{ meetingId: string }> }) {
  const headers = await import('next/headers').then((m) => m.headers());
  const auth = await getNexusAuthContext(await headers);
  const { meetingId } = await params;
  if (!auth.isAuthenticated) redirect(`/auth?return=/nexus/meet/${meetingId}/participants`);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-10 text-zinc-200">
      <header className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.2em] text-purple-300">Nexus · Reunión</p>
        <h1 className="text-2xl font-semibold text-white">Participantes</h1>
        <p className="text-sm text-zinc-400">
          Reunión <code className="text-zinc-300">{meetingId}</code>. Añade correos para invitar y enviar el
          documento de aceptación del Deal Room asociado.
        </p>
      </header>
      <ParticipantInjector meetingId={meetingId} />
    </div>
  );
}
