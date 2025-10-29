'use client';

import { useState, useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { Input } from '@saasfly/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReferralComplete?: () => void;
}

export function ReferralModal({ isOpen, onClose, onReferralComplete }: ReferralModalProps) {
  const account = useActiveAccount();
  const [referrerWallet, setReferrerWallet] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Verificar si hay parámetro ?ref= en la URL y si el modal ya se mostró antes
  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen && account?.address) {
      const hasSeenModalKey = `pandoras_referral_modal_seen_${account.address}`;
      const hasSeenModal = localStorage.getItem(hasSeenModalKey);

      if (hasSeenModal) {
        // Usuario ya vio el modal, no mostrar de nuevo
        onClose();
        return;
      }

      // Verificar parámetro ?ref= en la URL
      const urlParams = new URLSearchParams(window.location.search);
      const refFromUrl = urlParams.get('ref');

      if (refFromUrl) {
        // Si hay ?ref= en URL, autopopular el campo
        setReferrerWallet(refFromUrl);
      }
    }
  }, [isOpen, account?.address, onClose]);

  const handleSubmit = async () => {
    if (!referrerWallet.trim()) {
      setError('Ingresa una wallet address de quien te refirió (opcional)');
      return;
    }

    if (!account?.address) {
      setError('Conecta tu wallet primero');
      return;
    }

    // Validar formato básico de wallet
    if (!referrerWallet.startsWith('0x') || referrerWallet.length !== 42) {
      setError('Formato de wallet inválido (debe empezar con 0x y tener 42 caracteres)');
      return;
    }

    // No permitir autoreferirse
    if (referrerWallet.toLowerCase() === account.address.toLowerCase()) {
      setError('No puedes referirte a ti mismo');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const response = await fetch('/api/referrals/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referrerWallet: referrerWallet.trim(),
          source: 'manual_entry'
        })
      });
      const data = await response.json() as { message?: string };

      if (!response.ok) {
        throw new Error(data.message ?? 'Error procesando referido');
      }

      // Éxito
      onReferralComplete?.();

      // Marcar que ya vio el modal
      if (typeof window !== 'undefined') {
        const hasSeenModalKey = `pandoras_referral_modal_seen_${account.address}`;
        localStorage.setItem(hasSeenModalKey, 'true');
      }

      // Cerrar modal después de un delay para mostrar confirmación
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = () => {
    // Permitir continuar sin referido
    if (typeof window !== 'undefined' && account?.address) {
      const hasSeenModalKey = `pandoras_referral_modal_seen_${account.address}`;
      localStorage.setItem(hasSeenModalKey, 'true');
    }

    onReferralComplete?.();
    onClose();
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
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎁</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  ¡Bono de Bienvenida!
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Conecta tu wallet y obtén <span className="text-cyan-400 font-semibold">+50 tokens</span> automáticos.<br/>
                  Si alguien te invitó, ingresa su wallet para recibir recompensas adicionales.
                </p>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="referrer-wallet" className="block text-sm font-medium text-gray-300 mb-2">
                    Wallet del que te refirió <span className="text-gray-500">(opcional)</span>
                  </label>
                  <Input
                    id="referrer-wallet"
                    value={referrerWallet}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReferrerWallet(e.target.value)}
                    placeholder="0x742d35Cc6634C0532925a3b844Bc..."
                    className="bg-zinc-800 border-zinc-600 focus:border-cyan-500 text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formato: 0x + 40 caracteres
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                  >
                    <p className="text-sm text-red-400">{error}</p>
                  </motion.div>
                )}

                {!isProcessing && (
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSubmit}
                      disabled={!referrerWallet.trim()}
                      className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50"
                    >
                      {referrerWallet.trim() ? 'Aplicar y Ganar +50 tokens' : 'Ganar +50 tokens'}
                    </Button>

                    <Button
                      onClick={handleSkip}
                      variant="outline"
                      className="flex-1 border-zinc-600 hover:bg-zinc-800"
                    >
                      Omitir
                    </Button>
                  </div>
                )}

                {isProcessing && (
                  <div className="text-center py-4">
                    <div className="inline-block w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span className="text-cyan-400">Procesando referido...</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="text-center mt-6 pt-4 border-t border-zinc-700">
                <p className="text-xs text-gray-500">
                  🔐 Tu información es privada y segura
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
