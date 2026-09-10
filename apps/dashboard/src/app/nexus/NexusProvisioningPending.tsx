"use client";

/**
 * ⏳ Nexus Provisioning Pending
 * Shown when a collaborator completed self-registration but is not yet
 * approved (status = PENDING). They must wait until an admin approves the
 * provisioning request from admin.pandoras.finance → /admin/collaborators.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Hourglass, ShieldCheck, Mail } from 'lucide-react';

interface NexusProvisioningPendingProps {
  email?: string | null;
}

export function NexusProvisioningPending({ email }: NexusProvisioningPendingProps) {
  return (
    <div className="min-h-screen bg-[#08080A] text-white flex items-center justify-center p-6 relative overflow-hidden">
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md relative z-10 space-y-6"
      >
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <Hourglass className="w-6 h-6 text-amber-400" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-[10px] font-mono tracking-widest uppercase">
            Provisioning · Revisión Administrativa
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Solicitud en Revisión
          </h1>

          <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Tu registro fue completado exitosamente. Un administrador debe aprobar tu
            aprovisionamiento antes de que puedas acceder al Nexus.
          </p>
        </div>

        <div className="bg-[#0e0e16] border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl">
          <div className="flex items-center gap-3 text-xs text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Recibirás acceso automáticamente una vez que la administración apruebe tu solicitud.
            </span>
          </div>
          {email && (
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
              <span>Revisa tu correo <strong className="text-zinc-200">{email}</strong> por si necesitamos validar algo contigo.</span>
            </div>
          )}
          <div className="pt-3 border-t border-white/[0.06] flex flex-col items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Estado actual</span>
            <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[11px] font-semibold">
              PENDING APPROVAL
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}