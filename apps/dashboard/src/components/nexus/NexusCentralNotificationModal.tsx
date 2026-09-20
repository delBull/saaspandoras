'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  X,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Info,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  User,
  Shield,
} from 'lucide-react';
import { NexusBroadcastRenderer } from './NexusBroadcastRenderer';

export interface NexusBroadcastItem {
  id: string;
  title: string;
  content: string;
  type: 'ANNOUNCEMENT' | 'ALERT' | 'UPDATE' | 'URGENT';
  targetType: 'GLOBAL' | 'USER' | 'ROLE';
  targetEmail?: string | null;
  targetRole?: string | null;
  authorName: string;
  authorRole?: string | null;
  createdAt: string | Date;
  expiresAt?: string | Date | null;
}

interface NexusCentralNotificationModalProps {
  broadcasts: NexusBroadcastItem[];
  isOpen: boolean;
  onClose: () => void;
  onDismiss: (broadcastId: string) => void;
}

export function NexusCentralNotificationModal({
  broadcasts,
  isOpen,
  onClose,
  onDismiss,
}: NexusCentralNotificationModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen || broadcasts.length === 0) return null;

  const currentBroadcast = broadcasts[currentIndex] || broadcasts[0];
  if (!currentBroadcast) return null;

  const typeConfig = {
    ANNOUNCEMENT: {
      label: 'ANUNCIO OFICIAL',
      badgeClass: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
      icon: <Bell className="w-4 h-4 text-purple-400" />,
      borderGlow: 'shadow-[0_0_50px_rgba(168,85,247,0.15)] border-purple-500/30',
    },
    ALERT: {
      label: 'AVISO IMPORTANTE',
      badgeClass: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
      borderGlow: 'shadow-[0_0_50px_rgba(245,158,11,0.15)] border-amber-500/30',
    },
    UPDATE: {
      label: 'ACTUALIZACIÓN',
      badgeClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
      borderGlow: 'shadow-[0_0_50px_rgba(16,185,129,0.15)] border-emerald-500/30',
    },
    URGENT: {
      label: 'URGENTE / ACCIÓN REQUERIDA',
      badgeClass: 'border-rose-500/40 bg-rose-500/20 text-rose-300 animate-pulse',
      icon: <Flame className="w-4 h-4 text-rose-400" />,
      borderGlow: 'shadow-[0_0_60px_rgba(244,63,94,0.25)] border-rose-500/40',
    },
  }[currentBroadcast.type] || {
    label: 'COMUNICADO',
    badgeClass: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300',
    icon: <Info className="w-4 h-4 text-zinc-400" />,
    borderGlow: 'border-white/10 shadow-2xl',
  };

  const handleDismissCurrent = () => {
    onDismiss(currentBroadcast.id);
    if (broadcasts.length > 1) {
      if (currentIndex >= broadcasts.length - 1) {
        setCurrentIndex(Math.max(0, broadcasts.length - 2));
      }
    } else {
      onClose();
    }
  };

  const formattedDate = new Date(currentBroadcast.createdAt).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`relative w-full max-w-2xl bg-[#0B0B0E] border rounded-2xl overflow-hidden flex flex-col ${typeConfig.borderGlow}`}
        >
          {/* Top Bar Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0F0F14]">
            <div className="flex items-center gap-2.5">
              <span className={`px-2.5 py-1 rounded-lg border font-mono text-[11px] font-bold tracking-wider flex items-center gap-1.5 ${typeConfig.badgeClass}`}>
                {typeConfig.icon}
                <span>{typeConfig.label}</span>
              </span>

              {currentBroadcast.targetType !== 'GLOBAL' && (
                <span className="px-2 py-0.5 rounded-md border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 font-mono text-[10px]">
                  {currentBroadcast.targetType === 'USER' ? '👤 Dirigido a ti' : `🛡️ Rol: ${currentBroadcast.targetRole}`}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {broadcasts.length > 1 && (
                <span className="text-[11px] font-mono text-zinc-500">
                  {currentIndex + 1} de {broadcasts.length}
                </span>
              )}
              <button
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Body with Animation Key */}
          <div className="p-6 md:p-7 space-y-4 max-h-[65vh] overflow-y-auto relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentBroadcast.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {/* Title with native Emojis */}
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-snug">
                  {currentBroadcast.title}
                </h2>

            {/* Author & Timestamp Bar */}
            <div className="flex items-center gap-3 text-xs text-zinc-500 border-b border-white/5 pb-3">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>{currentBroadcast.authorName}</span>
                {currentBroadcast.authorRole && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-purple-300">
                    {currentBroadcast.authorRole}
                  </span>
                )}
              </span>
              <span>•</span>
              <span className="font-mono text-[11px]">{formattedDate}</span>
            </div>

                {/* Formatted Content with Enters & Clickable Links */}
                <div className="py-2">
                  <NexusBroadcastRenderer content={currentBroadcast.content} />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#0F0F14]/80">
            {/* Carousel navigation if multiple */}
            <div className="flex items-center gap-1.5">
              {broadcasts.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setCurrentIndex((prev) => Math.max(0, prev - 1)); }}
                    disabled={currentIndex === 0}
                    className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setCurrentIndex((prev) => Math.min(broadcasts.length - 1, prev + 1)); }}
                    disabled={currentIndex === broadcasts.length - 1}
                    className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Dismiss CTA */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); handleDismissCurrent(); }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Entendido / Descartar</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
