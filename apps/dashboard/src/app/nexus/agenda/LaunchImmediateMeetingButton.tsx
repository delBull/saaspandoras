"use client";

import { useState } from "react";
import { Video, Loader2, CheckCircle2 } from "lucide-react";
import { launchImmediateMeetingAction } from "./actions";

export function LaunchImmediateMeetingButton() {
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleLaunch = async () => {
    setIsPending(true);
    setSuccess(false);
    try {
      const res = await launchImmediateMeetingAction();
      if (!res.success) {
        alert("Error al lanzar la reunión: " + res.error);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
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
      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-lime-500 text-black hover:bg-lime-400 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(132,204,22,0.3)] hover:shadow-[0_0_25px_rgba(132,204,22,0.5)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      {isPending ? (
        <>
          <Loader2 size={16} className="animate-spin text-black" />
          <span>Provisionando Sala...</span>
        </>
      ) : success ? (
        <>
          <CheckCircle2 size={16} className="text-black" />
          <span>¡Sala Creada!</span>
        </>
      ) : (
        <>
          <Video size={16} className="text-black" />
          <span>Lanzar Meet Inmediata</span>
        </>
      )}
    </button>
  );
}
