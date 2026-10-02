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
        {/* Drawer Header is omitted because HermesIntelligencePanel has its own header */}

        {/* Drawer Body */}
        <div className="flex-1 overflow-hidden relative">
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
