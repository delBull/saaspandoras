"use client";

import { useState } from "react";
import { XCircle, Loader2 } from "lucide-react";
import { cancelMeetingAction } from "./actions";
import { toast } from "sonner"; // Assuming sonner is used for toasts, if not, window.alert

export function CancelMeetingButton({ meetingId }: { meetingId: string }) {
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    if (!window.confirm("¿Estás seguro de cancelar esta reunión?")) return;
    
    setIsCancelling(true);
    const result = await cancelMeetingAction(meetingId);
    
    if (result.success) {
      // Success, server action will revalidate path
    } else {
      setIsCancelling(false);
      alert(`Error al cancelar la reunión: ${result.error}`);
    }
  };

  return (
    <button
      onClick={handleCancel}
      disabled={isCancelling}
      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-transparent border border-zinc-800 text-zinc-400 hover:text-red-500 hover:border-red-500/50 rounded-lg text-xs font-mono uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isCancelling ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
      Cancelar
    </button>
  );
}
