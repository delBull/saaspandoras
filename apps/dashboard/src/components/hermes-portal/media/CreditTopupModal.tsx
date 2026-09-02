'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Coins,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  Cpu,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface CreditTopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  defaultSandbox?: boolean;
  onSuccess?: () => void;
}

const PRESET_AMOUNTS = [5, 10, 25, 50, 100];

export function CreditTopupModal({
  isOpen,
  onClose,
  tenantId,
  defaultSandbox = true,
  onSuccess,
}: CreditTopupModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isSandbox, setIsSandbox] = useState<boolean>(defaultSandbox);
  const [processing, setProcessing] = useState<boolean>(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  const activeAmount = customAmount ? parseFloat(customAmount) : selectedAmount;
  const isValidAmount = !isNaN(activeAmount) && activeAmount >= 5.0;

  const handleDeposit = async () => {
    if (!isValidAmount) return;
    setProcessing(true);
    setStatus(null);

    try {
      const res = await fetch('/api/v1/hermes/billing/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          amountUsd: activeAmount,
          isSandbox,
          paymentMethod: 'thirdweb_pay',
        }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setStatus({
          ok: true,
          message: `✅ Recarga de $${activeAmount.toFixed(2)} USD acreditada exitosamente.`,
        });
        if (onSuccess) {
          onSuccess();
        }
        setTimeout(() => {
          onClose();
          setStatus(null);
        }, 1800);
      } else {
        setStatus({
          ok: false,
          message: data.error || 'Error al procesar la recarga con Thirdweb Pay.',
        });
      }
    } catch (err: any) {
      setStatus({
        ok: false,
        message: err?.message || 'Error de conexión con el servicio de facturación.',
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md bg-zinc-950 border border-zinc-800 text-zinc-100 p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-2 pb-3 border-b border-zinc-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Coins className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-white">
              Recargar Créditos de Cómputo
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-zinc-400">
            Powered by Thirdweb Pay • Tarjeta de crédito, débito y cripto con scale-to-zero serverless.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Selector de Destino: Sandbox vs Producción */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              Destino de los Créditos
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsSandbox(true)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSandbox
                    ? 'bg-amber-500/15 border-amber-500/40 text-white shadow-sm'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <FlaskConical className="w-4 h-4 text-amber-400" />
                  <span>Sandbox (Pruebas)</span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">Aislado de producción y métricas oficiales</p>
              </button>

              <button
                type="button"
                onClick={() => setIsSandbox(false)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  !isSandbox
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-white shadow-sm'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>Producción</span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">Para campañas vivas y media oficial</p>
              </button>
            </div>
          </div>

          {/* Selector de Monto */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              Monto a Recargar (Mínimo $5.00 USD)
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {PRESET_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(amt);
                    setCustomAmount('');
                  }}
                  className={`py-2 text-xs font-bold font-mono rounded-lg border transition-all ${
                    !customAmount && selectedAmount === amt
                      ? 'border-purple-500 bg-purple-500/20 text-purple-200'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            <div className="pt-1.5">
              <input
                type="number"
                min="5"
                step="1"
                placeholder="O ingresa un monto personalizado (ej. $15)"
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Resumen de Cómputo Estimado */}
          <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Total a Pagar:</span>
              <strong className="text-white font-mono text-sm">${isValidAmount ? activeAmount.toFixed(2) : '0.00'} USD</strong>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Capacidad Estimada (~$0.027/img):</span>
              <span className="font-mono text-purple-300 font-medium">
                ~{isValidAmount ? Math.floor(activeAmount / 0.027) : 0} imágenes
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
              <span>Garantía Serverless:</span>
              <span className="text-emerald-400">Scale-to-Zero Activo</span>
            </div>
          </div>

          {/* Feedback Status */}
          {status && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                status.ok
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/20 text-red-300'
              }`}
            >
              {status.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{status.message}</span>
            </div>
          )}

          {/* Action Button */}
          <Button
            disabled={!isValidAmount || processing}
            onClick={handleDeposit}
            className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-purple-900/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {processing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Procesando con Thirdweb Pay...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Pagar con Thirdweb Pay (${isValidAmount ? activeAmount.toFixed(2) : '0.00'} USD)
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
