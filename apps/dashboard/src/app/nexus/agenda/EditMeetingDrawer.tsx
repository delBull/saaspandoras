"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CalendarClock, Check, Loader2, X } from "lucide-react";
import { NEXUS_PRESENTATIONS } from "@/lib/nexus/presentations-catalog";

interface EditMeetingDrawerProps {
  meetingId: string | null;
  onClose: () => void;
}

interface MeetingData {
  id: string;
  title: string | null;
  startsAt: string | null;
  endsAt: string | null;
  presentationId: string | null;
  status: string;
}

interface ParticipantData {
  id: string;
  email: string | null;
  identityId: string | null;
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const ERROR_MESSAGES: Record<string, string> = {
  MEETING_NOT_FOUND: "La reunión ya no existe.",
  MEETING_NOT_EDITABLE: "Solo se pueden editar reuniones programadas y siendo host.",
  SCHEDULED_FOR_IN_PAST: "La nueva fecha ya pasó.",
  INVALID_SCHEDULED_FOR: "La fecha no es válida.",
  INVALID_DURATION: "La duración debe estar entre 15 y 240 minutos.",
  TITLE_TOO_LONG: "El asunto es demasiado largo (máx. 160).",
  INVALID_PRESENTATION_ID: "Ese deck no existe.",
  INVALID_PARTICIPANT_EMAIL: "Hay emails inválidos.",
  TOO_MANY_PARTICIPANTS: "Máximo 20 participantes.",
  MISSING_CALENDAR_MANAGE: "Tu identidad no tiene calendar.manage.",
};

export function EditMeetingDrawer({ meetingId, onClose }: EditMeetingDrawerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [meeting, setMeeting] = useState<MeetingData | null>(null);
  const [title, setTitle] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [presentationId, setPresentationId] = useState("");
  const [participants, setParticipants] = useState("");
  const [notify, setNotify] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!meetingId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSuccess(null);

    fetch(`/api/v1/nexus/agenda/meet/${encodeURIComponent(meetingId)}`, {
      credentials: "include",
      cache: "no-store",
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(ERROR_MESSAGES[data.code] ?? data.error ?? "No se pudo cargar la reunión.");
        return data;
      })
      .then((data: { meeting: MeetingData; participants: ParticipantData[] }) => {
        if (cancelled) return;
        const m = data.meeting;
        setMeeting(m);
        setTitle(m.title ?? "");
        setScheduledFor(toLocalInput(m.startsAt));
        const start = m.startsAt ? new Date(m.startsAt).getTime() : 0;
        const end = m.endsAt ? new Date(m.endsAt).getTime() : 0;
        setDurationMinutes(start && end ? Math.max(Math.round((end - start) / 60_000), 15) : 30);
        setPresentationId(m.presentationId ?? "");
        setParticipants(
          (data.participants ?? [])
            .map((p) => (p.email || p.identityId || "").trim())
            .filter(Boolean)
            .join(", ")
        );
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [meetingId]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!meetingId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    const start = new Date(scheduledFor);
    if (Number.isNaN(start.getTime())) {
      setError("La fecha no es válida.");
      setSaving(false);
      return;
    }

    const emails = participants
      .split(/[\s,;]+/)
      .map((value) => value.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`/api/v1/nexus/agenda/meet/${encodeURIComponent(meetingId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          scheduledFor: start.toISOString(),
          durationMinutes,
          title,
          presentationId: presentationId || null,
          participants: emails,
          notify,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(ERROR_MESSAGES[data.code] ?? data.error ?? "No se pudo guardar.");
        return;
      }
      const invites = data.invites;
      setSuccess(
        invites
          ? `Reunión actualizada. Invitaciones enviadas: ${invites.sent}${invites.failed ? ` · fallidas: ${invites.failed}` : ""}.`
          : "Reunión actualizada."
      );
      router.refresh();
    } catch {
      setError("Error de red al guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {meetingId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-white/10 bg-[#0A0A0E] p-5 sm:max-w-lg sm:rounded-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-lime-400/80">
                  Agenda soberana
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white">Editar reunión</h2>
              </div>
              <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white" aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 py-10 text-xs text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Cargando reunión…
              </div>
            ) : error && !meeting ? (
              <p className="mt-6 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-200">
                {error}
              </p>
            ) : meeting?.status !== "scheduled" ? (
              <p className="mt-6 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
                Solo las reuniones programadas se pueden editar. Las que ya iniciaron o terminaron no.
              </p>
            ) : (
              <form onSubmit={save} className="mt-5 space-y-3">
                <label className="block space-y-1 text-[11px] font-mono text-zinc-500">
                  <span>Asunto (opcional)</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={160}
                    placeholder="Sovereign Meet"
                    className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-zinc-200 focus:border-lime-500/50 focus:outline-none"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1 text-[11px] font-mono text-zinc-500">
                    <span>Inicio</span>
                    <input
                      type="datetime-local"
                      value={scheduledFor}
                      onChange={(event) => setScheduledFor(event.target.value)}
                      required
                      className="w-full rounded-lg border border-white/10 bg-black/50 px-2 py-2 text-xs text-zinc-200 focus:border-lime-500/50 focus:outline-none"
                    />
                  </label>
                  <label className="block space-y-1 text-[11px] font-mono text-zinc-500">
                    <span>Duración (min)</span>
                    <select
                      value={durationMinutes}
                      onChange={(event) => setDurationMinutes(Number(event.target.value))}
                      className="w-full rounded-lg border border-white/10 bg-black/50 px-2 py-2 text-xs text-zinc-200 focus:border-lime-500/50 focus:outline-none"
                    >
                      {[15, 30, 45, 60, 90, 120, 180, 240].map((minutes) => (
                        <option key={minutes} value={minutes}>
                          {minutes}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block space-y-1 text-[11px] font-mono text-zinc-500">
                  <span>Deck</span>
                  <select
                    value={presentationId}
                    onChange={(event) => setPresentationId(event.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-zinc-200 focus:border-lime-500/50 focus:outline-none"
                  >
                    <option value="">Sin deck</option>
                    {NEXUS_PRESENTATIONS.map((deck) => (
                      <option key={deck.slug} value={deck.slug}>
                        {deck.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1 text-[11px] font-mono text-zinc-500">
                  <span>Participantes (emails separados por coma)</span>
                  <textarea
                    value={participants}
                    onChange={(event) => setParticipants(event.target.value)}
                    rows={3}
                    placeholder="eduardo@celeste.com, comercial@celeste.com"
                    className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-zinc-200 focus:border-lime-500/50 focus:outline-none"
                  />
                  <span className="text-[10px] text-zinc-600">
                    Se agregan o eliminan al guardar. Los que ya entraron no se eliminan.
                  </span>
                </label>

                <label className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-3 text-[11px] text-zinc-300">
                  <input
                    type="checkbox"
                    checked={notify}
                    onChange={(event) => setNotify(event.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 accent-lime-500"
                  />
                  <span>
                    Notificar a los participantes por email.
                    <span className="mt-0.5 block text-[10px] text-zinc-500">
                      Se envía un evento de calendario actualizado (mismo UID, SEQUENCE 1).
                    </span>
                  </span>
                </label>

                {error && (
                  <p className="flex items-start gap-2 text-[11px] text-rose-300">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {error}
                  </p>
                )}
                {success && (
                  <p className="flex items-start gap-2 text-[11px] text-emerald-300">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {success}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-white/10 px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-zinc-400 hover:text-white"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg border border-lime-500/30 bg-lime-500/15 px-4 py-2 text-[11px] font-mono uppercase tracking-wider text-lime-200 hover:bg-lime-500/25 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CalendarClock className="h-3.5 w-3.5" />}
                    {saving ? "Guardando…" : "Guardar cambios"}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
