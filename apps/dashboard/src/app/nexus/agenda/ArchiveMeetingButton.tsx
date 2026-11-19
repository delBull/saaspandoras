"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { archiveMeetingAction } from "./actions";

/**
 * Borrado lógico de una reunión pasada desde la agenda del host.
 * No borra historial, minuta, asistencia ni tareas: solo deja de listarse.
 */
export function ArchiveMeetingButton({ meetingId }: { meetingId: string }) {
  const [isArchiving, setIsArchiving] = useState(false);
  const router = useRouter();

  const handleArchive = async () => {
    const confirmed = window.confirm(
      "¿Eliminar esta reunión de tu agenda?\n\nSe conserva el historial, la minuta, la asistencia y las tareas. Solo deja de aparecer en la lista."
    );
    if (!confirmed) return;

    setIsArchiving(true);
    const result = await archiveMeetingAction(meetingId);

    if (result.success) {
      router.refresh();
    } else {
      setIsArchiving(false);
      alert(`No se pudo eliminar la reunión: ${result.error ?? "Error desconocido"}`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleArchive}
      disabled={isArchiving}
      className="flex items-center justify-center gap-2 px-3 py-2.5 bg-transparent border border-zinc-800 text-zinc-500 hover:text-rose-400 hover:border-rose-500/40 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Eliminar de la agenda (conserva historial y minuta)"
    >
      {isArchiving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
      <span className="hidden sm:inline">Eliminar</span>
    </button>
  );
}
