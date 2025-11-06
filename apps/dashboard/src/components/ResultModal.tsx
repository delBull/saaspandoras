'use client';

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface ResultModalProps {
  isOpen: boolean;
  type: 'loading' | 'success' | 'error';
  title: string;
  description: string;
  content?: React.ReactNode;
  icon?: string;
  onClose?: () => void;
}

export function ResultModal({
  isOpen,
  type,
  title,
  description,
  content,
  icon,
  onClose
}: ResultModalProps) {
  const router = useRouter();

  const handleClose = useCallback(() => {
    if (type === 'loading') return; // No permitir cerrar modal de loading

    if (onClose) {
      onClose();
    } else {
      // Para success/error, redirigir automáticamente
      router.push('/profile/projects');
    }
  }, [type, onClose, router]);

  // Handle ESC key and prevent body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  const getIcon = () => {
    switch (type) {
      case 'loading':
        return <Loader2 className="w-8 h-8 animate-spin text-lime-400" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-400" />;
      case 'error':
        return <XCircle className="w-8 h-8 text-red-400" />;
      default:
        return icon ? <span className="text-2xl">{icon}</span> : null;
    }
  };

  const getButtonText = () => {
    switch (type) {
      case 'loading':
        return null;
      case 'success':
        return 'Ver mis proyectos';
      case 'error':
        return 'Intentar nuevamente';
      default:
        return 'Entendido';
    }
  };

  const getButtonAction = () => {
    switch (type) {
      case 'loading':
        return null;
      case 'success':
      case 'error':
        return () => router.push('/profile/projects');
      default:
        return handleClose;
    }
  };

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
            onClick={type !== 'loading' ? handleClose : undefined}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-start justify-between p-6 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center flex-shrink-0">
                    {getIcon()}
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
                {type !== 'loading' && (
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                )}
              </div>

              {/* Content */}
              {content && (
                <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto">
                  <div className="prose prose-invert prose-sm max-w-none">
                    {content}
                  </div>
                </div>
              )}

              {/* Footer */}
              {type !== 'loading' && (
                <div className="px-6 pb-6">
                  <Button
                    onClick={getButtonAction() ?? handleClose}
                    className={`w-full ${
                      type === 'success'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : type === 'error'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-lime-600 hover:bg-lime-700 text-white'
                    }`}
                  >
                    {getButtonText()}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
