"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Lock, RefreshCw, Mail, ArrowRight, CheckCircle2 } from "lucide-react";

export default function AcademyAccessGate() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleRequest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/academy/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        if (data.unlocked) {
          window.location.reload();
          return;
        }
        setSentEmail(data.email || email.trim() || "tu correo registrado");
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
    <main className="min-h-screen bg-[#08080A] flex items-center justify-center px-6 py-12">
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
        className="relative z-10 text-center max-w-md w-full"
      >
        <p className="text-[9px] uppercase tracking-[0.6em] text-purple-400/80 mb-8 font-mono">
          Pandora&apos;s Academy · Control Plane
        </p>

        <div className="mx-auto mb-6 w-16 h-16 rounded-2xl border border-purple-500/20 bg-purple-500/10 flex items-center justify-center shadow-xl shadow-purple-950/20">
          <GraduationCap className="w-8 h-8 text-purple-300" />
        </div>

        <h1 className="text-3xl font-light text-white tracking-tight mb-2">
          Pandora&apos;s Academy
        </h1>
        <p className="text-xs text-zinc-400 font-light mb-8">
          Control Plane Institucional · Acceso para Administradores y Managers
        </p>

        {!sent ? (
          <form onSubmit={handleRequest} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ingresa tu correo autorizado..."
                className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-purple-500/50 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-zinc-500 outline-none transition-all duration-200 font-light"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200 disabled:opacity-40 tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Procesando acceso...
                </>
              ) : (
                <>
                  <span>Enviar Enlace Mágico</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border border-purple-500/30 rounded-2xl p-6 bg-purple-500/[0.06] text-center"
          >
            <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-300 mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-purple-200 text-sm font-medium mb-1">Enlace Mágico Enviado</p>
            <p className="text-zinc-400 text-xs leading-relaxed mb-4">
              Hemos enviado un enlace de acceso seguro a <strong className="text-white">{sentEmail}</strong>.
            </p>
            <button
              onClick={() => setSent(false)}
              className="text-xs text-purple-400 hover:text-purple-300 underline font-light"
            >
              Intentar con otro correo
            </button>
          </motion.div>
        )}

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 py-2 px-3 rounded-lg"
          >
            {error}
          </motion.p>
        )}

        <p className="mt-12 text-[10px] text-zinc-700 tracking-widest uppercase font-mono">
          Pandoras Group · Confidential Executive Suite
        </p>
      </motion.div>
    </main>
  );
}
