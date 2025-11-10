'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  content: React.ReactNode;
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function InfoModal({
  isOpen,
  onClose,
  title,
  description,
  content,
  icon = '💡',
  size = 'md'
}: InfoModalProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl'
  };

  // Handle ESC key and prevent body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pb-20 md:pb-4"
          >
            <div className={`w-full ${sizeClasses[size]} bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden`}>
              {/* Header */}
              <div className="flex items-start justify-between p-6 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-lime-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">{icon}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto">
                <div className="prose prose-invert prose-sm max-w-none">
                  {content}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6">
                <Button
                  onClick={onClose}
                  className="w-full bg-lime-600 hover:bg-lime-700 text-white"
                >
                  Entendido
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
