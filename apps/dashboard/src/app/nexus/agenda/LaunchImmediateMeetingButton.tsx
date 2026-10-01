"use client";

import { useState } from "react";
import { Video, Loader2 } from "lucide-react";
import { launchImmediateMeetingAction } from "./actions";

export function LaunchImmediateMeetingButton() {
  const [isPending, setIsPending] = useState(false);

  const handleLaunch = async () => {
    setIsPending(true);
    try {
      const res = await launchImmediateMeetingAction();
      if (!res.success) {
        alert("Error al lanzar la reunión: " + res.error);
      }
      // Assuming the join URL logic is on the server, it will re-render and show the new live meeting in the list
      // So the user can click "Iniciar" on the new live meeting right after creation
    } catch (err) {
      console.error(err);
      alert("Error inesperado al lanzar la reunión");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handleLaunch}
      disabled={isPending}
      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-lime-500 text-black hover:bg-lime-400 rounded-lg text-xs font-mono uppercase tracking-widest transition-colors disabled:opacity-50"
    >
      {isPending ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} />}
      Lanzar Meet Inmediata
    </button>
  );
}
