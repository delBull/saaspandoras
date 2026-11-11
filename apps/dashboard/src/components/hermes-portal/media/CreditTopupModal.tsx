'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCheckout } from '@/components/payments/CreditCheckout';
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

const PRESET_AMOUNTS = [10, 25, 50, 100, 250];

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
  const [txHash, setTxHash] = useState<string>('');
  // 'card' = thirdweb Checkout (tarjeta/Apple Pay/crypto gestionado), 'crypto' = transferencia manual + txHash
  const [method, setMethod] = useState<'card' | 'crypto'>('card');
  const [chainId, setChainId] = useState<number>(8453);
  const [treasury, setTreasury] = useState<{ treasury: string | null; usdc: string; chainId: number; minTopupUsd: number } | null>(null);

  const activeAmount = customAmount ? parseFloat(customAmount) : selectedAmount;
  // El mínimo lo manda el servidor (HERMES_MIN_TOPUP_USD); no se duplica aquí.
  const minTopupUsd = treasury?.minTopupUsd ?? 10;
  const isValidAmount = !isNaN(activeAmount) && activeAmount >= minTopupUsd;

  useEffect(() => {
    if (!isOpen || isSandbox) return;
    let cancelled = false;
    fetch(`/api/v1/hermes/billing/deposit?tenantId=${encodeURIComponent(tenantId)}`)
      .then(async (res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.ok) return;
        setTreasury({ treasury: data.treasury, usdc: data.usdc, chainId: data.chainId, minTopupUsd: data.minTopupUsd });
        setChainId(data.chainId ?? 8453);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [isOpen, isSandbox, tenantId]);

  const submitDeposit = async (opts?: { txHash?: string; rail?: 'card' | 'crypto'; note?: string }) => {
    if (!isValidAmount) return;
    const hash = (opts?.txHash ?? txHash).trim();
    if (!isSandbox && !/^0x[a-fA-F0-9]{64}$/.test(hash)) {
      setStatus({ ok: false, message: 'Falta el txHash (0x + 64 caracteres) del pago on-chain.' });
      return;
    }
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
          txHash: isSandbox ? undefined : hash,
          chainId,
          rail: opts?.rail ?? (method === 'card' ? 'card' : 'crypto'),
          note: opts?.note,
        }),
      });

      const data = await res.json();

      if (res.ok && data.ok && data.status === 'PENDING_REVIEW') {
        // Verificado on-chain pero NO acreditado: requiere aprobación de un admin.
        setStatus({
          ok: true,
          message: `⏳ Pago de $${Number(data.amountUsd ?? activeAmount).toFixed(2)} verificado on-chain. Queda pendiente de aprobación; el saldo se acredita al autorizarse.`,
        });
      } else if (res.ok && data.ok) {
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
            Transferencia USDC en Base a la treasury de Pandora's. El saldo se acredita al verificarse el pago.
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
              {`Monto a Recargar (Mínimo $${minTopupUsd.toFixed(2)} USD)`}
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

          {/* Método de pago (sólo producción) */}
          {!isSandbox && (
            <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/50 p-1">
              <button
                type="button"
                onClick={() => setMethod('card')}
                className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                  method === 'card' ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40' : 'text-zinc-400'
                }`}
              >
                Tarjeta / Apple Pay
              </button>
              <button
                type="button"
                onClick={() => setMethod('crypto')}
                className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                  method === 'crypto' ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40' : 'text-zinc-400'
                }`}
              >
                USDC (transferencia)
              </button>
            </div>
          )}

          {/* Tarjeta: thirdweb Checkout (convierte a USDC en Base a la treasury) */}
          {!isSandbox && method === 'card' && (
            <div className="space-y-2">
              {treasury?.treasury ? (
                <CreditCheckout
                  amountUsd={isValidAmount ? activeAmount : minTopupUsd}
                  treasury={treasury.treasury}
                  onTransaction={(hash, paymentId) => {
                    setTxHash(hash);
                    void submitDeposit({
                      txHash: hash,
                      rail: 'card',
                      note: paymentId ? `thirdweb:${paymentId}` : undefined,
                    });
                  }}
                  onError={(message) => setStatus({ ok: false, message })}
                />
              ) : (
                <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                  Tesorería no configurada en el servidor: la recarga con tarjeta está deshabilitada.
                </p>
              )}
              <p className="text-[10px] leading-relaxed text-zinc-500">
                El pago se convierte a <strong>USDC en Base</strong> y llega a la treasury. Acreditamos el importe
                que se verifica on-chain; un administrador lo autoriza.
              </p>
            </div>
          )}

          {/* Cripto: transferencia manual + txHash */}
          {!isSandbox && method === 'crypto' && (
            <div className="space-y-2 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-3">
              <p className="text-[11px] leading-relaxed text-emerald-200">
                Transfiere{' '}
                <strong>${isValidAmount ? activeAmount.toFixed(2) : '0.00'} USDC</strong> en Base a la wallet de
                tesorería y pega el hash:
              </p>
              <p className="break-all rounded-lg bg-zinc-950/70 border border-emerald-500/20 px-2 py-1.5 font-mono text-[10px] text-emerald-100">
                {treasury?.treasury ?? 'Tesorería no configurada — contacta a soporte'}
              </p>
              <input
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="0x… (txHash del pago)"
                spellCheck={false}
                className={`w-full px-3 py-2 rounded-lg bg-zinc-950/80 border font-mono text-[11px] text-white placeholder-zinc-600 focus:outline-none ${
                  txHash && !/^0x[a-fA-F0-9]{64}$/.test(txHash.trim())
                    ? 'border-rose-500/60'
                    : 'border-zinc-800 focus:border-emerald-500/60'
                }`}
              />
              <p className="text-[10px] leading-relaxed text-emerald-200/60">
                El saldo se acredita cuando el pago se verifica on-chain. Un txHash sólo puede usarse una vez.
              </p>
            </div>
          )}

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
            onClick={() => void submitDeposit()}
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
                {isSandbox
                  ? `Acreditar saldo de prueba ($${isValidAmount ? activeAmount.toFixed(2) : '0.00'})`
                  : `Verificar pago y acreditar ($${isValidAmount ? activeAmount.toFixed(2) : '0.00'})`}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
