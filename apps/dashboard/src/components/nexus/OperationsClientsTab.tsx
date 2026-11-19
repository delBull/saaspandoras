'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Building2, Briefcase, Handshake, ArrowUpRight, FolderGit2, CheckCircle2, Calendar, Video, AlertTriangle, Loader2, Check, Copy } from 'lucide-react';
import { getNexusClientHeaders } from '@/lib/nexus/client-auth-headers';
import { NEXUS_PRESENTATIONS, findPresentation } from '@/lib/nexus/presentations-catalog';
import { shortMeetingPath, shareOrCopyMeeting } from '@/lib/meet/meeting-links';

interface Deal {
  id: string;
  roomId: string;
  publicId: string | null;
  presentationId: string | null;
  organization: string;
  project: string;
  stage: 'PROSPECT' | 'NEGOTIATION' | 'DUE_DILIGENCE' | 'CLOSED' | 'LOST';
  value: string;
  owner: string;
  nextAction: string;
  rawData?: unknown;
}

interface ScheduleResult {
  meetingId: string;
  scheduledFor: string;
  endsAt: string | null;
  participants: number;
  joinUrl: string;
  invites: { sent: number; failed: number; errors: string[] };
  dealRoomUrl: string;
  agendaUrl: string;
  audit: 'RECORDED' | 'FAILED';
}

interface OperationsClientsTabProps {
  /** Switches the Operations Hub to the approvals tab (in-app navigation). */
  onOpenApprovals?: () => void;
}

/** Default start: next hour, in the local `datetime-local` format. */
function defaultStart(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: 'Tu sesión expiró. Vuelve a iniciar sesión en Nexus.',
  MISSING_CALENDAR_MANAGE: 'Tu identidad no tiene la capability calendar.manage.',
  DEAL_NOT_FOUND: 'Esta Deal Room ya no existe.',
  DEAL_ACCESS_DENIED: 'No tienes acceso a esta Deal Room.',
  HOST_COLLABORATOR_UNRESOLVED: 'Tu usuario no está vinculado a un colaborador de Nexus; no se puede asignar host.',
  INVALID_SCHEDULED_FOR: 'La fecha no es válida.',
  SCHEDULED_FOR_IN_PAST: 'La fecha ya pasó.',
  INVALID_DURATION: 'La duración debe estar entre 15 y 240 minutos.',
  INVALID_PRESENTATION_ID: 'El identificador del deck no es válido.',
  MEETING_CREATION_FAILED: 'No se pudo crear la reunión en el servidor.',
};

export function OperationsClientsTab({ onOpenApprovals }: OperationsClientsTabProps) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Scheduling state
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledFor, setScheduledFor] = useState(defaultStart);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [presentationId, setPresentationId] = useState('');
  const [inviteEmails, setInviteEmails] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleResult, setScheduleResult] = useState<ScheduleResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [deckSaving, setDeckSaving] = useState(false);
  const [deckError, setDeckError] = useState<string | null>(null);
  const schedulePanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDeals = async () => {
      setLoadError(null);
      try {
        const res = await fetch('/api/nexus/deals?scope=all', {
          headers: getNexusClientHeaders(),
          credentials: 'include',
          cache: 'no-store',
        });
        if (!res.ok) {
          setLoadError(res.status === 401 ? 'Sesión de Nexus no válida.' : 'No se pudieron cargar los deals.');
          setDeals([]);
          return;
        }
        const data = await res.json();
        if (Array.isArray(data.rooms)) {
          const mappedDeals: Deal[] = data.rooms.map((r: any) => ({
            id: r.publicId || r.id,
            roomId: r.id,
            publicId: r.publicId ?? null,
            presentationId: r.presentationId ?? null,
            organization: r.company || r.counterparty || 'Desconocida',
            project: r.title || r.kind || 'Proyecto Sin Nombre',
            stage: r.status === 'SIGNED' ? 'CLOSED' : 'NEGOTIATION',
            value: 'N/A',
            owner: r.createdByEmail || 'Nexus',
            nextAction: 'Revisar expediente',
            rawData: r,
          }));
          setDeals(mappedDeals);
        }
      } catch (err) {
        console.error('Error fetching deals', err);
        setLoadError('Error de red al cargar los deals.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDeals();
  }, []);

  // El panel se monta debajo de las acciones rápidas; sin esto, en pantallas
  // chicas el clic parecía no hacer nada porque el formulario quedaba fuera de vista.
  useEffect(() => {
    if (!scheduleOpen) return;
    const id = window.setTimeout(() => {
      schedulePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 40);
    return () => window.clearTimeout(id);
  }, [scheduleOpen]);

  const resetScheduleForm = () => {
    setScheduleOpen(false);
    setScheduleResult(null);
    setScheduleError(null);
    setScheduledFor(defaultStart());
    setDurationMinutes(30);
    setPresentationId('');
    setInviteEmails('');
    setCopied(false);
  };

  const signerEmailsOf = (deal: Deal): string => {
    const raw = deal.rawData as { signers?: Array<{ email?: string | null }> } | undefined;
    const emails = (raw?.signers ?? [])
      .map((signer) => (signer.email ?? '').trim().toLowerCase())
      .filter(Boolean);
    return Array.from(new Set(emails)).join(', ');
  };

  const selectDeal = (deal: Deal) => {
    setSelectedDeal(deal);
    resetScheduleForm();
    setInviteEmails(signerEmailsOf(deal));
  };

  const handleDeckChange = async (deckSlug: string) => {
    if (!selectedDeal) return;
    setDeckSaving(true);
    setDeckError(null);
    try {
      const res = await fetch(`/api/nexus/deals/${encodeURIComponent(selectedDeal.roomId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getNexusClientHeaders() },
        credentials: 'include',
        body: JSON.stringify({ presentationId: deckSlug === '' ? null : deckSlug }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeckError(data.code === 'UNKNOWN_PRESENTATION'
          ? 'Ese deck no existe en el catálogo.'
          : (data.error ?? 'No se pudo guardar el deck del deal.'));
        return;
      }
      const updated = { ...selectedDeal, presentationId: deckSlug === '' ? null : deckSlug };
      setSelectedDeal(updated);
      setDeals((prev) => prev.map((deal) => (deal.roomId === updated.roomId ? updated : deal)));
    } catch {
      setDeckError('Error de red al guardar el deck.');
    } finally {
      setDeckSaving(false);
    }
  };

  const handleSchedule = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedDeal) return;

    setIsScheduling(true);
    setScheduleError(null);
    setScheduleResult(null);

    try {
      const startsAt = new Date(scheduledFor);
      if (Number.isNaN(startsAt.getTime())) {
        setScheduleError('La fecha no es válida.');
        return;
      }

      const res = await fetch(`/api/nexus/deals/${encodeURIComponent(selectedDeal.roomId)}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getNexusClientHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({
          scheduledFor: startsAt.toISOString(),
          durationMinutes,
          ...(presentationId.trim() ? { presentationId: presentationId.trim() } : {}),
          // Participantes ≠ firmantes: la lista de invitados es explícita y editable.
          participantEmails: inviteEmails
            .split(/[\s,;]+/)
            .map((value) => value.trim())
            .filter(Boolean),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setScheduleError(ERROR_MESSAGES[data.code] ?? data.error ?? 'No se pudo agendar la presentación.');
        return;
      }

      setScheduleResult({
        meetingId: data.meetingId,
        scheduledFor: data.scheduledFor,
        endsAt: data.endsAt ?? null,
        participants: data.participants ?? 0,
        joinUrl: data.joinUrl ?? '',
        invites: data.invites ?? { sent: 0, failed: 0, errors: [] },
        dealRoomUrl: data.dealRoomUrl,
        agendaUrl: data.agendaUrl,
        audit: data.audit ?? 'FAILED',
      });
    } catch (err) {
      console.error('Schedule error', err);
      setScheduleError('Error de red al agendar.');
    } finally {
      setIsScheduling(false);
    }
  };

  const copyMeetingId = async (meetingId: string) => {
    try {
      await navigator.clipboard.writeText(meetingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const formattedResultRange = useMemo(() => {
    if (!scheduleResult) return '';
    const start = new Date(scheduleResult.scheduledFor);
    const end = scheduleResult.endsAt ? new Date(scheduleResult.endsAt) : null;
    const fmt = (d: Date) => d.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
    return end ? `${fmt(start)} → ${fmt(end)}` : fmt(start);
  }, [scheduleResult]);

  const getStageStyles = (stage: Deal['stage']) => {
    switch (stage) {
      case 'PROSPECT': return 'border-sky-500/30 bg-sky-500/10 text-sky-400';
      case 'NEGOTIATION': return 'border-amber-500/30 bg-amber-500/10 text-amber-400';
      case 'DUE_DILIGENCE': return 'border-purple-500/30 bg-purple-500/10 text-purple-400';
      case 'CLOSED': return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
      case 'LOST': return 'border-rose-500/30 bg-rose-500/10 text-rose-400';
    }
  };

  return (
    <div className="p-5 overflow-y-auto flex-1 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-sky-500/20 bg-sky-500/[0.04]">
        <div>
          <p className="text-[11px] text-sky-300 font-mono uppercase font-bold flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            <span>CLIENTS & CRM (DEAL ROOMS)</span>
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">
            Superficie operativa para gestionar Organizaciones, Proyectos, Deals y Prospectos.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-zinc-400 text-xs font-mono">
            {isLoading ? 'Cargando...' : `${deals.length} Active Deals`}
          </div>
          <Link
            href="/nexus/rooms"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-[11px] font-mono transition-colors"
          >
            + NEW DEAL
          </Link>
        </div>
      </div>

      {loadError && (
        <div className="flex items-start gap-2 p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{loadError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Deal List */}
        <div className="lg:col-span-1 space-y-3">
          <h4 className="text-xs font-bold text-zinc-500 font-mono uppercase tracking-wider mb-2">
            Pipeline Activo
          </h4>
          <div className="space-y-2">
            {deals.map(deal => (
              <div 
                key={deal.id}
                onClick={() => selectDeal(deal)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedDeal?.id === deal.id ? 'border-sky-500/40 bg-sky-950/20' : 'border-white/5 bg-[#0C0C10] hover:border-white/20'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] text-zinc-500 font-mono">{deal.id}</span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase ${getStageStyles(deal.stage)}`}>
                    {deal.stage}
                  </span>
                </div>
                <h5 className="text-sm font-semibold text-zinc-200">{deal.organization}</h5>
                <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{deal.project}</p>
              </div>
            ))}
            {!isLoading && deals.length === 0 && !loadError && (
              <p className="text-[11px] text-zinc-500 font-mono p-3 border border-white/5 rounded-xl bg-[#0C0C10]">
                Sin deals visibles para tu identidad.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Deal Detail View */}
        <div className="lg:col-span-2">
          {selectedDeal ? (
            <motion.div 
              key={selectedDeal.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="h-full flex flex-col bg-[#0C0C10] border border-white/10 rounded-xl overflow-hidden"
            >
              {/* Deal Header */}
              <div className="p-5 border-b border-white/10 bg-black/20">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${getStageStyles(selectedDeal.stage)}`}>
                        {selectedDeal.stage}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">Owner: {selectedDeal.owner}</span>
                    </div>
                    <h2 className="text-xl font-bold text-white mt-2">{selectedDeal.organization}</h2>
                    <p className="text-sm text-zinc-400 mt-1 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-sky-400" />
                      {selectedDeal.project}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-500 font-mono uppercase">Deal Value</p>
                    <p className="text-xl font-mono text-emerald-400">{selectedDeal.value}</p>
                  </div>
                </div>
              </div>

              {/* Deal Content Grid */}
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                {/* Info Card */}
                <div className="p-4 rounded-xl border border-white/5 bg-black/40 space-y-3">
                  <h4 className="text-[11px] font-mono text-zinc-500 uppercase">Contexto Operativo</h4>
                  <div className="space-y-2 text-xs">
                    <p className="flex justify-between text-zinc-400">
                      <span>Próxima Acción:</span>
                      <span className="text-white text-right w-1/2">{selectedDeal.nextAction}</span>
                    </p>
                    <p className="flex justify-between text-zinc-400">
                      <span>Deal Room:</span>
                      <span className="text-white font-mono">{selectedDeal.publicId ?? 'Sin sala pública'}</span>
                    </p>
                    <label className="flex flex-col gap-1 pt-1">
                      <span className="text-zinc-400 text-[11px]">Deck del deal (se inyecta en la reunión)</span>
                      <select
                        value={selectedDeal.presentationId ?? ''}
                        onChange={(e) => handleDeckChange(e.target.value)}
                        disabled={deckSaving}
                        className="w-full rounded-lg bg-black/50 border border-white/10 px-2 py-1.5 text-[11px] text-zinc-200 focus:outline-none focus:border-sky-500/50 disabled:opacity-50"
                      >
                        <option value="">Sin deck vinculado</option>
                        {NEXUS_PRESENTATIONS.map((deck) => (
                          <option key={deck.slug} value={deck.slug}>{deck.title}</option>
                        ))}
                      </select>
                    </label>
                    {deckError && <p className="text-[10px] text-rose-300">{deckError}</p>}
                    {selectedDeal.presentationId && findPresentation(selectedDeal.presentationId) && (
                      <Link
                        href={`/nexus/presentations/${selectedDeal.presentationId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-mono text-purple-300 hover:text-purple-200"
                      >
                        Ver guión del deck →
                      </Link>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setScheduleOpen((open) => !open);
                      setScheduleResult(null);
                      setScheduleError(null);
                    }}
                    className="w-full p-3 flex items-center justify-between rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-300">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <span className="text-xs text-sky-100">Agendar presentación</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-sky-400/70 group-hover:text-sky-200 transition-colors" />
                  </button>

                  {selectedDeal.publicId ? (
                    <Link
                      href={`/deal/${selectedDeal.publicId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full p-3 flex items-center justify-between rounded-xl border border-white/5 bg-black/40 hover:bg-white/5 hover:border-white/10 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                          <FolderGit2 className="w-4 h-4" />
                        </div>
                        <span className="text-xs text-zinc-300">Abrir Data Room del Deal</span>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                    </Link>
                  ) : (
                    <div className="w-full p-3 flex items-center justify-between rounded-xl border border-white/5 bg-black/20 opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-zinc-500/10 text-zinc-500">
                          <FolderGit2 className="w-4 h-4" />
                        </div>
                        <span className="text-xs text-zinc-500">Data Room no disponible (sin publicId)</span>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => onOpenApprovals?.()}
                    className="w-full p-3 flex items-center justify-between rounded-xl border border-white/5 bg-black/40 hover:bg-white/5 hover:border-white/10 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs text-zinc-300">Ver Aprobaciones Pendientes</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                  </button>
                </div>
              </div>

              {/* Schedule Panel */}
              {(scheduleOpen || scheduleResult) && (
                <div ref={schedulePanelRef} className="border-t border-white/10 p-5 bg-black/30 scroll-mt-6">
                  {scheduleResult ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-mono uppercase text-emerald-300">Presentación agendada</h4>
                      </div>
                      <div className="space-y-1 text-xs text-zinc-300">
                        <p><span className="text-zinc-500">Cuándo:</span> {formattedResultRange}</p>
                        <p>
                          <span className="text-zinc-500">Invitaciones por email:</span>{' '}
                          <span className={scheduleResult.invites.failed > 0 ? 'text-amber-300' : 'text-emerald-300'}>
                            {scheduleResult.invites.sent} enviadas
                          </span>
                          {scheduleResult.invites.failed > 0 && (
                            <span className="text-amber-300"> · {scheduleResult.invites.failed} fallidas</span>
                          )}
                        </p>
                        <p><span className="text-zinc-500">Participantes registrados:</span> {scheduleResult.participants}</p>
                        <p className="flex items-center gap-2">
                          <span className="text-zinc-500">Meeting ID:</span>
                          <code className="font-mono text-[11px] text-zinc-400">{scheduleResult.meetingId}</code>
                          <button
                            type="button"
                            onClick={() => copyMeetingId(scheduleResult.meetingId)}
                            className="text-zinc-500 hover:text-zinc-300 transition-colors"
                            title="Copiar Meeting ID"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </p>
                      </div>

                      {scheduleResult.audit === 'FAILED' && (
                        <p className="flex items-start gap-2 text-[11px] text-amber-300">
                          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          La reunión se creó pero el registro de auditoría falló. Repórtalo antes de continuar.
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 pt-1">
                        <Link
                          href={scheduleResult.dealRoomUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-200 text-[11px] font-mono"
                        >
                          Abrir Deal Room
                        </Link>
                        <button
                          type="button"
                          onClick={async () => {
                            const outcome = await shareOrCopyMeeting({
                              title: `${selectedDeal?.organization ?? 'Reunión'} · Pandora's`,
                              startsAt: scheduleResult.scheduledFor,
                              endsAt: scheduleResult.endsAt,
                              url: `${window.location.origin}${shortMeetingPath(scheduleResult.meetingId)}`,
                            });
                            setCopied(outcome !== 'failed');
                            if (outcome !== 'failed') setTimeout(() => setCopied(false), 2000);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-lime-500/30 bg-lime-500/10 hover:bg-lime-500/20 text-lime-200 text-[11px] font-mono flex items-center gap-1.5"
                        >
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          Compartir invitación
                        </button>
                        <Link
                          href={scheduleResult.agendaUrl}
                          className="px-3 py-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-200 text-[11px] font-mono flex items-center gap-1.5"
                        >
                          <Video className="w-3.5 h-3.5" />
                          Ir a la Agenda
                        </Link>
                        <button
                          type="button"
                          onClick={resetScheduleForm}
                          className="px-3 py-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white text-[11px] font-mono"
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSchedule} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-sky-400" />
                          Nueva presentación para {selectedDeal.organization}
                        </h4>
                        <button
                          type="button"
                          onClick={resetScheduleForm}
                          className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300"
                        >
                          Cancelar
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <label className="text-[11px] font-mono text-zinc-500 space-y-1">
                          <span>Inicio</span>
                          <input
                            type="datetime-local"
                            value={scheduledFor}
                            onChange={(e) => setScheduledFor(e.target.value)}
                            required
                            className="w-full rounded-lg bg-black/50 border border-white/10 px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-sky-500/50"
                          />
                        </label>
                        <label className="text-[11px] font-mono text-zinc-500 space-y-1">
                          <span>Duración (min)</span>
                          <select
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(Number(e.target.value))}
                            className="w-full rounded-lg bg-black/50 border border-white/10 px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-sky-500/50"
                          >
                            {[15, 30, 45, 60, 90, 120].map((minutes) => (
                              <option key={minutes} value={minutes}>{minutes}</option>
                            ))}
                          </select>
                        </label>
                        <label className="text-[11px] font-mono text-zinc-500 space-y-1">
                          <span>{selectedDeal.presentationId ? 'Deck (del deal)' : 'Deck (opcional)'}</span>
                          <select
                            value={selectedDeal.presentationId ?? presentationId}
                            onChange={(e) => setPresentationId(e.target.value)}
                            disabled={Boolean(selectedDeal.presentationId)}
                            className="w-full rounded-lg bg-black/50 border border-white/10 px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-sky-500/50 disabled:opacity-60"
                          >
                            <option value="">Sin deck</option>
                            {NEXUS_PRESENTATIONS.map((deck) => (
                              <option key={deck.slug} value={deck.slug}>{deck.title}</option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <label className="block text-[11px] font-mono text-zinc-500 space-y-1">
                        <span>Invitados al meet (emails separados por coma)</span>
                        <textarea
                          value={inviteEmails}
                          onChange={(e) => setInviteEmails(e.target.value)}
                          rows={2}
                          placeholder="eduardo@celeste.com, comercial@celeste.com"
                          className="w-full rounded-lg bg-black/50 border border-white/10 px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-sky-500/50"
                        />
                        <span className="text-[10px] text-zinc-600">
                          Los firmantes del Deal Room se precargan, pero puedes invitar a más (o a otros).
                        </span>
                      </label>

                      {scheduleError && (
                        <p className="flex items-start gap-2 text-[11px] text-rose-300">
                          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          {scheduleError}
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] text-zinc-500 font-mono">
                          Los invitados son esta lista; el firmante del deal es independiente. El deck del deal manda sobre esta selección.
                        </p>
                        <button
                          type="submit"
                          disabled={isScheduling}
                          className="px-3 py-1.5 rounded-lg border border-sky-500/30 bg-sky-500/15 hover:bg-sky-500/25 disabled:opacity-50 text-sky-200 text-[11px] font-mono flex items-center gap-1.5"
                        >
                          {isScheduling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
                          {isScheduling ? 'Agendando...' : 'Crear reunión'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border border-white/5 border-dashed rounded-xl p-8 text-center bg-black/20">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-4">
                <Handshake className="w-6 h-6 text-zinc-600" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-300">Selecciona un Deal</h3>
              <p className="text-xs text-zinc-500 mt-2 max-w-sm">
                Haz clic en una organización de la lista a la izquierda para visualizar el estado, agendar la presentación y abrir su Deal Room.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
