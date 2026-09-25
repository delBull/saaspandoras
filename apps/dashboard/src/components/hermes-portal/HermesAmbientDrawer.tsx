'use client';

/**
 * HermesAmbientDrawer — Phase 2 Ambient UI for Non-Nexus Surfaces
 * 
 * Provides a discrete, non-intrusive drawer that houses the HermesIntelligencePanel.
 * Instead of a floating chat everywhere, this respects the "hermetic" philosophy
 * and opens only when requested by the user from the top navigation.
 */

import React, { useEffect } from 'react';
import { X, Brain } from 'lucide-react';
import { HermesIntelligencePanel } from './overview/HermesIntelligencePanel';

interface HermesAmbientDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  organizationSlug: string;
  organizationName: string;
}

export function HermesAmbientDrawer({ isOpen, onClose, organizationSlug, organizationName }: HermesAmbientDrawerProps) {
  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99990] transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className="fixed top-0 right-0 h-[100dvh] w-full sm:w-[450px] md:w-[500px] bg-[#12121A] border-l border-white/[0.08] shadow-2xl z-[99999] flex flex-col transform transition-transform animate-in slide-in-from-right duration-300 ease-out"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#0C0C12] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600/30 to-purple-600/30 flex items-center justify-center border border-indigo-500/30 shrink-0 shadow-inner">
              <Brain size={16} className="text-indigo-300" />
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-medium text-sm tracking-wide truncate">Hermes Ambient AI</h3>
              <p className="text-indigo-400/80 text-[10px] font-semibold tracking-wider uppercase truncate font-mono">
                Asistente Cognitivo Soberano
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-white/[0.06] transition-colors shrink-0"
            title="Cerrar (ESC)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body - Reusing the Intelligence Panel but adapting it slightly if needed */}
        <div className="flex-1 overflow-hidden relative">
           <HermesIntelligencePanel 
             organizationSlug={organizationSlug} 
             organizationName={organizationName}
           />
           {/* Note: The IntelligencePanel has its own top header, we might want to tweak it but for now it works as a fully featured chat */}
        </div>
      </div>
    </>
  );
}
