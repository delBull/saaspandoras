"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { AddToGoogleCalendarButton } from "@/components/meet/AddToGoogleCalendarButton";
import { X, Mic, FileText, CheckCircle2, CloudLightning, Loader2, UploadCloud, Pencil, Trash2, Check } from "lucide-react";

interface ActionItem {
  id: string;
  task: string;
  assigneeName: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
}

interface MeetingDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: {
    id: string;
    title: string;
    date: Date;
    hostName: string;
    status: string;
    isHost?: boolean;
    joinPath?: string | null;
    endsAt?: Date | string | null;
  } | null;
}

export function MeetingDetailsDrawer({ isOpen, onClose, meeting }: MeetingDetailsDrawerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [sendingSummary, setSendingSummary] = useState(false);
  const [summarySendMessage, setSummarySendMessage] = useState<string | null>(null);
  const [summarySendOk, setSummarySendOk] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Edición de tareas (texto y asignado) + borrado
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editTask, setEditTask] = useState("");
  const [editAssignee, setEditAssignee] = useState("");
  const [savingItem, setSavingItem] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);

  // Notas de la sesión (las mismas de la sala) + metadatos para la agenda.
  const [notes, setNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState<boolean | null>(null);
  const [meta, setMeta] = useState<{
    status?: string;
    startsAt?: string | null;
    endsAt?: string | null;
    startedAt?: string | null;
    endedAt?: string | null;
    presentationId?: string | null;
    followUpEnabled?: boolean;
  } | null>(null);

  // Formulario de seguimiento (mensaje + material + correos adicionales).
  const [message, setMessage] = useState("");
  const [includeDeck, setIncludeDeck] = useState(true);
  const [includeProposal, setIncludeProposal] = useState(false);
  const [includeTasks, setIncludeTasks] = useState(true);
  const [includeRecap, setIncludeRecap] = useState(true);
  const [extraEmailsText, setExtraEmailsText] = useState("");
  const [extraEmailsError, setExtraEmailsError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && meeting?.id) {
      setIsLoading(true);
      setSummary(null);
      setActionItems([]);
      setNotes("");
      setNotesSaved(null);
      setMeta(null);
      fetch(`/api/v1/internal/nexus/meets/${meeting.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setSummary(data.summary);
            setActionItems(data.actionItems || []);
            setNotes(typeof data.notes === "string" ? data.notes : "");
            setMeta(data.meeting ?? null);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, meeting?.id]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !meeting) return;

    if (!file.type.startsWith("audio/")) {
      alert("Solo se aceptan archivos de audio (MP3, M4A, WAV, OGG, WebM).");
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("El audio es demasiado grande (máx. 10 MB ≈ 40 min a 32 kbps).");
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("meetingId", meeting.id);
      formData.append("file", file);

      const res = await fetch("/api/v1/internal/nexus/meets/process", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        // Refresh local data with AI result
        setSummary(data.summary);
        
        // Re-fetch to get IDs of created items, or just reload from server
        const listRes = await fetch(`/api/v1/internal/nexus/meets/${meeting.id}`);
        const listData = await listRes.json();
        if (listData.success) {
          setActionItems(listData.actionItems || []);
        }
      } else {
        console.error("AI processing failed:", data.error);
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("Error al subir el archivo.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const saveNotes = async () => {
    if (!meeting) return;
    setNotesSaving(true);
    setNotesSaved(null);
    try {
      const res = await fetch("/api/v1/meet/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ meetingId: meeting.id, notes }),
      });
      setNotesSaved(res.ok);
    } catch {
      setNotesSaved(false);
    } finally {
      setNotesSaving(false);
    }
  };

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const sendSummary = async () => {
    if (!meeting) return;
    const rawExtras = extraEmailsText
      .split(/[,;\s]+/)
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value.length > 0);
    const invalid = rawExtras.filter((value) => !EMAIL_PATTERN.test(value));
    if (invalid.length > 0) {
      setExtraEmailsError(`Correo inválido: ${invalid[0]}`);
      return;
    }
    if (rawExtras.length > 10) {
      setExtraEmailsError("Máximo 10 correos adicionales.");
      return;
    }
    setExtraEmailsError(null);
    setSendingSummary(true);
    setSummarySendMessage(null);
    setSummarySendOk(null);
    try {
      const res = await fetch("/api/v1/meet/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          meetingId: meeting.id,
          message: message.trim(),
          includeDeck,
          includeProposal,
          includeTasks,
          includeRecap,
          extraEmails: Array.from(new Set(rawExtras)),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSummarySendOk(false);
        setSummarySendMessage(
          data.code === "MEETING_NOT_ENDED"
            ? "Finaliza la reunión para enviar el seguimiento."
            : data.error ?? "No se pudo enviar el seguimiento."
        );
        return;
      }
      const total = (data.sent ?? 0) + (data.extras ?? 0);
      const skipped = Number(data.skipped ?? 0);
      const ok = total > 0;
      setSummarySendOk(ok);
      setSummarySendMessage(
        ok
          ? `Enviado a ${total} destinatario${total === 1 ? "" : "s"}.${skipped > 0 ? ` ${skipped} omitido${skipped === 1 ? "" : "s"} (ya lo tenían).` : ""}`
          : skipped > 0
            ? "Esos destinatarios ya habían recibido el seguimiento."
            : "No hay destinatarios con email para enviar."
      );
      if (ok) router.refresh();
    } catch {
      setSummarySendOk(false);
      setSummarySendMessage("Error de red al enviar el seguimiento.");
    } finally {
      setSendingSummary(false);
    }
  };

  const startEditing = (item: ActionItem) => {
    setEditingItemId(item.id);
    setEditTask(item.task);
    setEditAssignee(item.assigneeName ?? "");
    setItemError(null);
  };

  const saveItem = async (item: ActionItem) => {
    if (!editTask.trim()) {
      setItemError("La tarea no puede quedar vacía.");
      return;
    }
    setSavingItem(true);
    setItemError(null);
    try {
      const res = await fetch(`/api/v1/internal/nexus/meets/action-items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ task: editTask, assigneeName: editAssignee }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setItemError(data.error ?? "No se pudo guardar la tarea.");
        return;
      }
      setActionItems((prev) =>
        prev.map((row) =>
          row.id === item.id
            ? {
                ...row,
                task: data.item?.task ?? editTask,
                assigneeName: data.item?.assigneeName ?? editAssignee,
              }
            : row
        )
      );
      setEditingItemId(null);
    } catch {
      setItemError("Error de red al guardar la tarea.");
    } finally {
      setSavingItem(false);
    }
  };

  const removeItem = async (item: ActionItem) => {
    if (!window.confirm("¿Eliminar esta tarea de la minuta?")) return;
    setSavingItem(true);
    setItemError(null);
    try {
      const res = await fetch(`/api/v1/internal/nexus/meets/action-items/${item.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setItemError(data.error ?? "No se pudo eliminar la tarea.");
        return;
      }
      setActionItems((prev) => prev.filter((row) => row.id !== item.id));
    } catch {
      setItemError("Error de red al eliminar la tarea.");
    } finally {
      setSavingItem(false);
    }
  };

  const toggleActionItemStatus = async (item: ActionItem) => {
    const newStatus = item.status === "completed" ? "pending" : "completed";
    
    // Optimistic update
    setActionItems(prev => prev.map(t => t.id === item.id ? { ...t, status: newStatus } : t));
    
    try {
      const res = await fetch(`/api/v1/internal/nexus/meets/action-items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        throw new Error('Failed to update');
      }
    } catch (err) {
      // Revert optimistic update
      setActionItems(prev => prev.map(t => t.id === item.id ? { ...t, status: item.status } : t));
      console.error('Failed to toggle action item', err);
    }
  };

  const sessionStart = meta?.startedAt
    ? new Date(meta.startedAt)
    : meta?.startsAt
      ? new Date(meta.startsAt)
      : null;
  const sessionEnd = meta?.endedAt
    ? new Date(meta.endedAt)
    : meta?.endsAt
      ? new Date(meta.endsAt)
      : null;
  const durationMinutes =
    sessionStart && sessionEnd
      ? Math.max(1, Math.round((sessionEnd.getTime() - sessionStart.getTime()) / 60000))
      : null;
  const durationIsReal = Boolean(meta?.startedAt && meta?.endedAt);

  if (!meeting) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-full md:w-[600px] h-full bg-[#0A0A0E] border-l border-white/10 z-[101] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-mono uppercase tracking-widest">
                    Agenda Soberana
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">
                    {meeting.date.toLocaleDateString()}
                  </span>
                </div>
                <h2 className="text-xl font-light text-white">{meeting.title}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
              
              {meeting.status !== "ended" && (
                <AddToGoogleCalendarButton
                  title={meeting.title}
                  startsAt={meeting.date}
                  endsAt={meeting.endsAt}
                  meetingPath={meeting.joinPath}
                  hostName={meeting.hostName}
                  variant="full"
                />
              )}

              {/* Upload Section — solo el host procesa la minuta */}
              {meeting.isHost !== false && (
              <div className="border border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-white/[0.02]">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                  <Mic className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-white font-medium mb-2">Minuta con IA</h3>
                <p className="text-zinc-500 text-sm max-w-sm mb-6">
                  Sube solo el audio de esta reunión (máx. 10 MB ≈ 40 min a 32 kbps).
                  Gemini extrae resumen y tareas; las tareas manuales se conservan.
                </p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="audio/*" 
                  className="hidden" 
                />
                <button
                  onClick={handleUploadClick}
                  disabled={isUploading}
                  className="px-6 py-2.5 bg-white text-black hover:bg-zinc-200 rounded-lg text-xs font-mono uppercase tracking-widest transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Procesando con IA...</>
                  ) : (
                    <><UploadCloud className="w-4 h-4" /> Subir Grabación</>
                  )}
                </button>
              </div>
              )}

              {isLoading && (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
                </div>
              )}

              {/* AI Summary Section */}
              {!isLoading && summary && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2 text-lime-400 text-xs font-mono uppercase tracking-widest mb-2">
                    <FileText className="w-4 h-4" /> Resumen Ejecutivo
                  </div>
                  <div className="p-5 rounded-xl bg-lime-500/5 border border-lime-500/10 text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {summary}
                  </div>
                </motion.div>
              )}

              {/* Cierre de la sesión: duración y notas (mismas de la sala) */}
              {!isLoading && meeting.isHost !== false && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2 text-sky-300 text-xs font-mono uppercase tracking-widest">
                      <FileText className="w-4 h-4" /> Cierre de la sesión
                    </div>
                    {durationMinutes !== null && (
                      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                        {durationMinutes} min {durationIsReal ? "reales" : "programados"}
                      </span>
                    )}
                  </div>
                  <textarea
                    value={notes}
                    onChange={(event) => {
                      setNotes(event.target.value.slice(0, 8000));
                      setNotesSaved(null);
                    }}
                    rows={4}
                    placeholder="Notas de la sesión: objeciones, acuerdos, quién dijo qué…"
                    className="w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-sky-500/40"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-600">{notes.length}/8000</span>
                    <div className="flex items-center gap-2">
                      {notesSaved === true && (
                        <span className="text-[10px] font-mono uppercase tracking-widest text-lime-400">
                          Guardado
                        </span>
                      )}
                      {notesSaved === false && (
                        <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400">
                          No se guardó
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={saveNotes}
                        disabled={notesSaving}
                        className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-sky-200 hover:bg-sky-500/20 disabled:opacity-50"
                      >
                        {notesSaving ? "Guardando…" : "Guardar notas"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Items Section */}
              {!isLoading && actionItems.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2 text-blue-400 text-xs font-mono uppercase tracking-widest">
                      <CheckCircle2 className="w-4 h-4" /> Tareas Asignadas (Action Items)
                    </div>
                    <span className="text-xs text-zinc-500 font-mono">{actionItems.filter(t => t.status === 'completed').length}/{actionItems.length} completadas</span>
                  </div>
                  
                  <div className="space-y-2">
                    {actionItems.map((item) => (
                      <div key={item.id} className="rounded-lg border border-white/5 bg-white/5 p-3 transition-colors hover:border-white/10">
                        {editingItemId === item.id ? (
                          <div className="space-y-2">
                            <input
                              value={editTask}
                              onChange={(event) => setEditTask(event.target.value.slice(0, 500))}
                              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-sky-500/40"
                              placeholder="Descripción de la tarea"
                            />
                            <input
                              value={editAssignee}
                              onChange={(event) => setEditAssignee(event.target.value.slice(0, 200))}
                              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-zinc-200 outline-none focus:border-sky-500/40"
                              placeholder="Asignado (opcional)"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingItemId(null)}
                                className="rounded-md border border-white/10 px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400 hover:text-white"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => void saveItem(item)}
                                disabled={savingItem}
                                className="flex items-center gap-1 rounded-md border border-lime-500/30 bg-lime-500/15 px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-lime-200 hover:bg-lime-500/25 disabled:opacity-50"
                              >
                                <Check size={12} /> Guardar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <button
                                onClick={() => toggleActionItemStatus(item)}
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                                  item.status === "completed"
                                    ? "border-lime-500/50 bg-lime-500/20 text-lime-500"
                                    : "border-zinc-600 hover:border-zinc-400"
                                }`}
                              >
                                {item.status === "completed" && <CheckCircle2 className="h-3 w-3" />}
                              </button>
                              <span
                                className={`text-sm ${
                                  item.status === "completed" ? "text-zinc-500 line-through" : "text-zinc-200"
                                }`}
                              >
                                {item.task}
                              </span>
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                              <span className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                                {item.assigneeName || "Equipo"}
                              </span>
                              <button
                                type="button"
                                onClick={() => startEditing(item)}
                                title="Editar tarea"
                                className="rounded-md border border-transparent p-1.5 text-zinc-500 hover:border-white/10 hover:bg-white/5 hover:text-white"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => void removeItem(item)}
                                title="Eliminar tarea"
                                className="rounded-md border border-transparent p-1.5 text-zinc-500 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {itemError && (
                      <p className="text-[10px] leading-relaxed text-rose-300">{itemError}</p>
                    )}
                  </div>
                </motion.div>
              )}

              {!isLoading && meeting.isHost !== false && meeting.status === "ended" && (
                <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="flex items-center gap-2 text-lime-400 text-xs font-mono uppercase tracking-widest">
                    <CheckCircle2 className="w-4 h-4" /> Seguimiento a participantes
                  </div>
                  <p className="text-[11px] leading-relaxed text-zinc-500">
                    {summary
                      ? "Incluye el resumen, las tareas y el material que marques."
                      : "Sin resumen IA, el correo sale como seguimiento de la sesión con el material que marques."}
                  </p>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value.slice(0, 2000))}
                    rows={3}
                    placeholder="Mensaje para los participantes (opcional)…"
                    className="w-full resize-y rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[12px] leading-relaxed text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-lime-500/40"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[10px] text-zinc-300">
                      <input type="checkbox" checked={includeDeck} onChange={(e) => setIncludeDeck(e.target.checked)} className="h-3.5 w-3.5 accent-lime-500" />
                      Presentación
                    </label>
                    <label className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[10px] text-zinc-300">
                      <input type="checkbox" checked={includeProposal} onChange={(e) => setIncludeProposal(e.target.checked)} className="h-3.5 w-3.5 accent-lime-500" />
                      Propuesta
                    </label>
                    <label className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[10px] text-zinc-300">
                      <input type="checkbox" checked={includeTasks} onChange={(e) => setIncludeTasks(e.target.checked)} className="h-3.5 w-3.5 accent-lime-500" />
                      Tareas
                    </label>
                    <label className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[10px] text-zinc-300">
                      <input type="checkbox" checked={includeRecap} onChange={(e) => setIncludeRecap(e.target.checked)} className="h-3.5 w-3.5 accent-lime-500" />
                      Lo que vimos
                    </label>
                  </div>
                  <input
                    value={extraEmailsText}
                    onChange={(event) => {
                      setExtraEmailsText(event.target.value);
                      setExtraEmailsError(null);
                    }}
                    placeholder="Correos adicionales (separados por coma)"
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[12px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-lime-500/40"
                  />
                  {extraEmailsError && (
                    <p className="text-[10px] leading-relaxed text-rose-300">{extraEmailsError}</p>
                  )}
                  <p className="text-[10px] leading-relaxed text-zinc-600">
                    Los correos adicionales reciben solo este seguimiento; no reciben recordatorios.
                  </p>
                  <button
                    type="button"
                    onClick={sendSummary}
                    disabled={sendingSummary}
                    className="w-full rounded-lg border border-lime-500/30 bg-lime-500/10 px-3 py-2.5 text-[11px] font-mono uppercase tracking-wider text-lime-200 hover:bg-lime-500/20 disabled:opacity-50"
                  >
                    {sendingSummary ? (
                      <>
                        <Loader2 size={13} className="animate-spin" /> Enviando…
                      </>
                    ) : (
                      <>
                        <CloudLightning size={13} /> Enviar seguimiento
                      </>
                    )}
                  </button>
                  {summarySendMessage && (
                    <p
                      className={`flex items-center justify-center gap-1.5 text-[10px] ${
                        summarySendOk ? "text-lime-300" : "text-rose-300"
                      }`}
                    >
                      {summarySendOk && <Check size={12} />}
                      {summarySendMessage}
                    </p>
                  )}
                </div>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
