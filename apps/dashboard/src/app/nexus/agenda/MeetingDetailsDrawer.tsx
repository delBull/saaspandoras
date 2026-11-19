"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AddToGoogleCalendarButton } from "@/components/meet/AddToGoogleCalendarButton";
import { X, Mic, FileText, CheckCircle2, CloudLightning, Loader2, UploadCloud } from "lucide-react";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && meeting?.id) {
      setIsLoading(true);
      setSummary(null);
      setActionItems([]);
      fetch(`/api/v1/internal/nexus/meets/${meeting.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setSummary(data.summary);
            setActionItems(data.actionItems || []);
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

  const sendSummary = async () => {
    if (!meeting) return;
    setSendingSummary(true);
    setSummarySendMessage(null);
    try {
      const res = await fetch("/api/v1/meet/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: meeting.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSummarySendMessage(
          data.code === "NO_SUMMARY"
            ? "Aún no hay resumen. Procesa el audio primero."
            : data.code === "MEETING_NOT_ENDED"
              ? "Finaliza la reunión para enviar el resumen."
              : data.error ?? "No se pudo enviar el resumen."
        );
        return;
      }
      setSummarySendMessage(
        data.sent > 0
          ? `Enviado a ${data.sent} participante${data.sent === 1 ? "" : "s"}.`
          : data.skipped > 0
            ? "El resumen ya se había enviado."
            : "No hay participantes con email para enviar."
      );
    } catch {
      setSummarySendMessage("Error de red al enviar el resumen.");
    } finally {
      setSendingSummary(false);
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
                    {actionItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 group hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => toggleActionItemStatus(item)}
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${item.status === 'completed' ? 'bg-lime-500/20 border-lime-500/50 text-lime-500' : 'border-zinc-600 hover:border-zinc-400'}`}>
                            {item.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                          </button>
                          <span className={`text-sm ${item.status === 'completed' ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                            {item.task}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 bg-zinc-900 rounded text-zinc-400 border border-zinc-800">
                            {item.assigneeName || 'Equipo'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {!isLoading && summary && meeting.isHost !== false && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={sendSummary}
                    disabled={sendingSummary}
                    className="w-full rounded-lg border border-lime-500/30 bg-lime-500/10 px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-lime-200 hover:bg-lime-500/20 disabled:opacity-50"
                  >
                    {sendingSummary ? "Enviando…" : "Enviar resumen a participantes"}
                  </button>
                  <p className="text-[10px] leading-relaxed text-zinc-500">
                    Incluye resumen y tareas. Solo a quienes asistieron y aún no lo hayan recibido.
                  </p>
                  {summarySendMessage && (
                    <p className="text-[10px] text-zinc-300">{summarySendMessage}</p>
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
