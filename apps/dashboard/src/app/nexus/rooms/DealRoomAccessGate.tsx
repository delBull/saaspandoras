"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Handshake, Lock, RefreshCw, Mail } from "lucide-react";

export default function DealRoomAccessGate() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/nexus/deals/unlock", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.ok) {
        if (data.unlocked) {
          window.location.reload();
          return;
        }
        setSent(true);
      } else {
        setError(data.error ?? "No se pudo procesar la solicitud.");
      }
    } catch (e: any) {
      setError(e.message ?? "Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#08080A] flex items-center justify-center px-6">
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.018]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-center max-w-lg w-full"
      >
        <p className="text-[9px] uppercase tracking-[0.6em] text-zinc-700 mb-10">
          Pandora's Nexus · Transaction Rooms
        </p>

        <div className="mx-auto mb-8 w-14 h-14 rounded-full border border-amber-500/20 bg-amber-500/10 flex items-center justify-center">
          <Lock className="w-5 h-5 text-amber-300" />
        </div>

        <h1 className="text-4xl font-thin text-white tracking-tight mb-3">
          Deal Room Restringido
        </h1>
        <p className="text-sm text-zinc-600 font-light mb-2">
          Transaction Rooms · Nivel 2
        </p>
        <p className="text-xs text-zinc-700 mb-12">
          El acceso de edición es exclusivo para administradores.
          Solicita el desbloqueo: se genera un enlace único en el canal privado de Discord.
        </p>

        {!sent ? (
          <div className="space-y-3 w-full">
            <button
              onClick={handleRequest}
              disabled={loading}
              className="w-full bg-amber-500/[0.08] hover:bg-amber-500/[0.14] border border-amber-500/20 rounded-xl px-4 py-3.5 text-sm text-amber-200 transition-all duration-200 disabled:opacity-40 font-light tracking-wide flex items-center justify-center gap-2"
            >
              <Handshake className="w-4 h-4" />
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Solicitando...
                </>
              ) : (
                "Desbloquear Deal Room"
              )}
            </button>

            <a
              href="/nexus/settings"
              className="w-full bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3.5 text-sm text-zinc-300 transition-all duration-200 font-light tracking-wide flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Acceso de Colaborador
            </a>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border border-amber-500/20 rounded-xl px-6 py-5 bg-amber-500/[0.04]"
          >
            <p className="text-amber-200 text-sm font-light mb-1">Desbloqueo Solicitado</p>
            <p className="text-zinc-500 text-xs">
              Revisa tu canal privado en Discord. El enlace de acceso expira en 2 horas.
            </p>
          </motion.div>
        )}

        {error && (
          <p className="mt-4 text-xs text-rose-400">{error}</p>
        )}

        <p className="mt-10 text-[10px] text-zinc-800 tracking-widest uppercase">
          Pandoras Group · Confidential
        </p>
      </motion.div>
    </main>
  );
}
