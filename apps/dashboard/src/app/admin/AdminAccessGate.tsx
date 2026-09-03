'use client';

/**
 * 🏛️ ADMIN ACCESS GATE (F9.3)
 * apps/dashboard/src/app/admin/AdminAccessGate.tsx
 *
 * Institutional access gate for unauthenticated or non-admin actors
 * attempting to access the Platform Governance Plane.
 */

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { ConnectButton } from 'thirdweb/react';
import { client } from '@/lib/thirdweb-client';

interface AdminAccessGateProps {
  reason?: string;
}

export function AdminAccessGate({ reason }: AdminAccessGateProps) {
  return (
    <div className="min-h-screen bg-[#08080A] text-white flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/[0.08] bg-[#0E0E16]/90 p-8 shadow-2xl backdrop-blur-xl text-center space-y-6"
        >
          {/* Icon Header */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-purple-400 font-semibold">
              Acceso Restringido
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Platform Governance Plane
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {reason ||
                'Esta consola está estrictamente reservada para administradores de plataforma (SUPER_ADMIN y PLATFORM_ADMIN). Conecta tu billetera autorizada.'}
            </p>
          </div>

          {/* Thirdweb Connect Button */}
          <div className="pt-2 flex justify-center">
            <ConnectButton
              client={client}
              theme="dark"
              connectButton={{
                label: 'Conectar Billetera de Plataforma',
                className: '!bg-purple-600 hover:!bg-purple-500 !text-white !font-semibold !rounded-xl !text-xs !py-3 !px-5',
              }}
            />
          </div>

          {/* Back to Nexus */}
          <div className="pt-4 border-t border-white/[0.06]">
            <Link
              href="/nexus"
              className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a Nexus Command Center</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
