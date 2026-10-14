'use client';

/**
 * HermesAmbientDrawer — Phase 2 Ambient UI for Non-Nexus Surfaces
 * 
 * Provides a discrete, non-intrusive drawer that houses the HermesIntelligencePanel.
 * Instead of a floating chat everywhere, this respects the "hermetic" philosophy
 * and opens only when requested by the user from the top navigation.
 */

import React, { useEffect, useRef, useState } from 'react';
import { X, Brain } from 'lucide-react';
import { HermesIntelligencePanel } from './overview/HermesIntelligencePanel';

interface HermesAmbientDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  organizationSlug: string;
  organizationName: string;
}

export function HermesAmbientDrawer({ isOpen, onClose, organizationSlug, organizationName }: HermesAmbientDrawerProps) {
  // Mobile-only drag-to-dismiss (bottom-sheet handle). Presentation state only.
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef<number | null>(null);

  const onHandleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0]?.clientY ?? null;
  };
  const onHandleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const delta = (e.touches[0]?.clientY ?? 0) - dragStartY.current;
    setDragY(Math.max(0, delta));
  };
  const onHandleTouchEnd = () => {
    const shouldClose = dragY > 110;
    dragStartY.current = null;
    setDragY(0);
    if (shouldClose) onClose();
  };

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
        role="dialog"
        aria-modal="true"
        aria-label="Hermes Copilot"
        style={dragY > 0 ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
        className="fixed top-0 right-0 h-[100dvh] w-full sm:w-[450px] md:w-[500px] max-sm:top-auto max-sm:bottom-0 max-sm:h-[92dvh] max-sm:rounded-t-2xl max-sm:border-t max-sm:border-white/[0.12] bg-[#12121A] border-l border-white/[0.08] shadow-2xl z-[99999] flex flex-col transform transition-transform animate-in slide-in-from-right max-sm:slide-in-from-bottom duration-300 ease-out max-sm:pb-[env(safe-area-inset-bottom)]"
      >
        {/* Mobile bottom-sheet drag handle (hidden on sm+) */}
        <div
          className="sm:hidden flex justify-center pt-2 pb-1 touch-none cursor-grab shrink-0"
          onTouchStart={onHandleTouchStart}
          onTouchMove={onHandleTouchMove}
          onTouchEnd={onHandleTouchEnd}
          aria-hidden="true"
        >
          <span className="h-1.5 w-12 rounded-full bg-white/25" />
        </div>
        {/* Drawer Header is omitted because HermesIntelligencePanel has its own header */}

        {/* Drawer Body */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
           <HermesIntelligencePanel 
             organizationSlug={organizationSlug} 
             organizationName={organizationName}
             onClose={onClose}
           />
        </div>
      </div>
    </>
  );
}
