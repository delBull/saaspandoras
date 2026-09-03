'use client';

/**
 * 🏛️ PLATFORM INSPECTOR DRAWER (F9.3)
 * apps/dashboard/src/components/admin/inspector/PlatformInspectorDrawer.tsx
 *
 * Universal slide-over drawer matching the Hermes Portal Drawer aesthetic.
 */

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, ShieldCheck, Cpu, Building2, User, Activity } from 'lucide-react';
import { usePlatformInspector } from './PlatformInspectorContext';

export function PlatformInspectorDrawer() {
  const { data, isOpen, close } = usePlatformInspector();

  if (!isOpen || !data) return null;

  const getIcon = () => {
    switch (data.type) {
      case 'TENANT':
        return <Building2 className="w-5 h-5 text-purple-400" />;
      case 'GPU_EVENT':
      case 'ENDPOINT':
        return <Cpu className="w-5 h-5 text-cyan-400" />;
      case 'COLLABORATOR':
        return <User className="w-5 h-5 text-amber-400" />;
      case 'RWA_DEAL':
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      default:
        return <Activity className="w-5 h-5 text-zinc-400" />;
    }
  };

  const badgeColorClass = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    violet: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    zinc: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  }[data.badgeColor || 'zinc'];

  return (
    <AnimatePresence>
      {/* Backdrop for mobile */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={close}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
      />

      {/* Drawer Container */}
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed top-0 right-0 h-screen w-full sm:w-[460px] lg:w-[480px] bg-[#0C0C12] border-l border-white/[0.08] z-50 flex flex-col shadow-2xl overflow-hidden font-sans"
      >
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-[#111118]/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center shrink-0">
              {getIcon()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  {data.type}
                </span>
                {data.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${badgeColorClass}`}>
                    {data.badge}
                  </span>
                )}
              </div>
              <h3 className="text-base font-semibold text-white truncate mt-0.5">
                {data.title}
              </h3>
            </div>
          </div>

          <button
            onClick={close}
            className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-all shrink-0 ml-3"
            aria-label="Cerrar inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
          {data.subtitle && (
            <p className="text-xs text-zinc-400 leading-relaxed bg-white/[0.02] p-3.5 rounded-xl border border-white/[0.04]">
              {data.subtitle}
            </p>
          )}

          {/* Attributes Grid */}
          {data.attributes && Object.keys(data.attributes).length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                Atributos & Telemetría
              </h4>
              <div className="bg-[#14141E] rounded-xl border border-white/[0.06] divide-y divide-white/[0.04] overflow-hidden">
                {Object.entries(data.attributes).map(([key, val]) => (
                  <div key={key} className="px-4 py-3 flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-medium">{key}</span>
                    <span className="text-white font-mono font-semibold text-right max-w-[60%] truncate">
                      {typeof val === 'boolean' ? (val ? '✓ Habilitado' : '✗ Deshabilitado') : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Payload Preview if available */}
          {data.rawPayload && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                Carga de Datos (Snapshot)
              </h4>
              <pre className="p-3.5 rounded-xl bg-black/60 border border-white/[0.06] text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-56">
                {JSON.stringify(data.rawPayload, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        {data.actionHref && (
          <div className="px-6 py-4 border-t border-white/[0.08] bg-[#111118]/80 backdrop-blur-md shrink-0">
            <Link
              href={data.actionHref}
              target={data.actionHref.startsWith('http') ? '_blank' : undefined}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-900/20 transition-all"
            >
              <span>{data.actionLabel || 'Ver Detalle Completo'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </motion.aside>
    </AnimatePresence>
  );
}
