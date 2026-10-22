'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface TrialUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationSlug: string;
  organizationName: string;
}

const AGENDA_1_1_URL =
  process.env.NEXT_PUBLIC_AGENDA_1_1_URL ??
  (typeof window !== 'undefined'
    ? `${window.location.origin}/schedule/pandoras?type=strategy`
    : 'https://dash.pandoras.finance/schedule/pandoras?type=strategy');

const PLANS = [
  {
    id: 'starter',
    name: 'Starter Sovereign',
    price: '$190',
    currency: 'USD',
    period: '/mes',
    description: 'Para proyectos y fundadores que inician su presencia con IA autónoma y CRM.',
    features: [
      'Knowledge Vault de hasta 50 documentos clave',
      'Hermes Concierge AI 24/7 en Web Widget',
      'Pipeline Comercial & CRM Básico',
      'Registro y análisis de hasta 500 prospectos',
      'Pruebas y certificados notarizados en IPFS',
    ],
    highlight: false,
    badge: 'ACCESIBLE',
  },
  {
    id: 'core',
    name: 'Core Sovereign',
    price: '$490',
    currency: 'USD',
    period: '/mes',
    description: 'Para organizaciones que buscan automatizar su estrategia y conocimiento 24/7.',
    features: [
      'Knowledge Vault sin límite de documentos',
      'Motor de Estrategia & Campañas ilimitadas',
      '2 Canales Oficiales (Telegram, Web Widget)',
      'Governance Queue con aprobación humana',
      'Pruebas criptográficas notarizadas en IPFS',
    ],
    highlight: false,
    badge: 'ESENCIAL',
  },
  {
    id: 'growth',
    name: 'Growth & Multimedia',
    price: '$990',
    currency: 'USD',
    period: '/mes',
    description: 'El sistema completo con generación de audio, video y distribución multicanal.',
    features: [
      'Todo lo incluido en Core Sovereign',
      '50 Media Credits mensuales (Video & Voz Nano Banana)',
      'Multi-Channel Mesh ilimitado (Telegram, X, LinkedIn, Warpcast)',
      'Orquestación autónoma con Sweeper de reconciliación',
      'Soporte técnico prioritario y SLA 99.9%',
    ],
    highlight: true,
    badge: 'RECOMENDADO',
  },
  {
    id: 'enterprise',
    name: 'Enterprise Sovereign',
    price: 'Custom',
    currency: '',
    period: '',
    description: 'Infraestructura dedicada en VPC privada con modelos personalizados.',
    features: [
      'VPC dedicada y aislamiento físico de datos',
      'Modelos Fine-Tuned y LoRA a la medida de tu marca',
      'Canales ilimitados y custom webhooks',
      'Facturación corporativa, contrato y soporte 24/7',
    ],
    highlight: false,
    badge: 'ENTERPRISE',
  },
];

export function TrialUpgradeModal({
  isOpen,
  onClose,
  organizationSlug,
  organizationName,
}: TrialUpgradeModalProps): React.JSX.Element | null {
  const [selectedPlan, setSelectedPlan] = useState('growth');
  const [requestSent, setRequestSent] = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling while the full screen modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleRequestUpgrade = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const plan = PLANS.find((p) => p.id === selectedPlan);
      const res = await fetch('/api/v1/hermes/trial/upgrade-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationSlug,
          planId: selectedPlan,
          planName: plan?.name ?? selectedPlan,
        }),
      });

      const data = (await res.json()) as { message?: string; error?: string; referenceId?: string };
      if (!res.ok) {
        throw new Error(data.message ?? data.error ?? 'Error al registrar intención de upgrade.');
      }

      setReferenceId(data.referenceId ?? `upg_${Date.now()}`);
      setRequestSent(true);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setErrorMessage(errObj?.message ?? 'Error inesperado al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] w-screen h-screen bg-[#07070B] overflow-y-auto flex flex-col justify-between p-4 sm:p-6 md:p-8 lg:p-10 select-none animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Planes y Paquetes de Producción"
    >
      <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col justify-between space-y-6">
        {/* Top Header Bar */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[11px] font-mono">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>UPGRADE BOUNDARY · PRECIOS EN DÓLARES (USD)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-white tracking-tight mt-1">
              Pasa de Trial a <span className="bg-gradient-to-r from-purple-300 via-purple-400 to-indigo-300 bg-clip-text text-transparent font-normal">Producción Ilimitada</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-light max-w-2xl">
              Al actualizar tu plan, tu instancia de <strong>{organizationName}</strong> conserva
              completamente su identidad, documentos del Vault y campañas aprobadas. No vuelves a empezar.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/10 text-zinc-400 hover:text-white transition-all border border-white/10 shrink-0 cursor-pointer"
            aria-label="Cerrar modal"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {requestSent ? (
          <div className="text-center py-16 space-y-5 my-auto">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-950/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-bold text-white">¡Solicitud de Upgrade Recibida!</h3>
              <p className="text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
                Hemos registrado tu interés en el plan <strong>{PLANS.find((p) => p.id === selectedPlan)?.name}</strong> para{' '}
                <span className="text-white font-semibold">{organizationName}</span>. Tu Knowledge Vault, campañas y credenciales se preservan 100%.
              </p>
              {referenceId && (
                <div className="pt-2 text-[11px] text-zinc-500 font-mono flex items-center justify-center gap-1.5">
                  <span>Referencia registrada:</span>
                  <span className="text-zinc-300 font-bold bg-white/5 px-2 py-0.5 rounded select-all">
                    {referenceId}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={AGENDA_1_1_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs font-mono flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
              >
                <Calendar className="w-4 h-4" />
                <span>Agendar Sesión Técnica Directa (1:1)</span>
              </a>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-mono transition-all"
              >
                Volver a la Consola
              </button>
            </div>
          </div>
        ) : (
          <>
            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            {/* Plans Grid (1 col on mobile, 2 col on tablet, 4 col on desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-2 flex-1">
              {PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <button
                    type="button"
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`cursor-pointer rounded-2xl p-5 border transition-all relative flex flex-col justify-between text-left ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-500 shadow-xl shadow-purple-950/50 ring-1 ring-purple-500/50'
                        : 'bg-zinc-950/60 border-white/[0.08] hover:border-zinc-700'
                    }`}
                  >
                    {plan.highlight && (
                      <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md">
                        {plan.badge}
                      </span>
                    )}

                    <div className="space-y-3 w-full">
                      <div>
                        <span className="text-xs font-mono font-bold text-zinc-300 block">{plan.name}</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl sm:text-3xl font-bold text-white">{plan.price}</span>
                          {plan.currency && (
                            <span className="text-[11px] font-bold text-amber-400 font-mono ml-0.5">{plan.currency}</span>
                          )}
                          <span className="text-[11px] text-zinc-500 font-mono">{plan.period}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed min-h-[36px]">{plan.description}</p>
                      </div>

                      <div className="border-t border-white/5 pt-3 space-y-2">
                        {plan.features.map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-[11px] text-zinc-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                            <span className="leading-snug">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-white/5 w-full">
                      <div
                        className={`w-full py-2.5 rounded-xl text-center text-xs font-mono font-bold transition-all ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                        }`}
                      >
                        {isSelected ? 'Seleccionado' : 'Elegir Plan'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Invariant callout */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-zinc-300 text-[11px] sm:text-xs">
                  <strong>Garantía Inmutable:</strong> Precios expresados en <strong>Dólares Estadounidenses (USD)</strong>. Tu configuración actual permanece en el Sovereign Vault en IPFS.
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
              <a
                href={AGENDA_1_1_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-mono font-medium flex items-center justify-center gap-2 transition-all"
              >
                <Calendar className="w-4 h-4 text-purple-400" />
                <span>Agendar Sesión Técnica (1:1)</span>
              </a>

              <button
                onClick={handleRequestUpgrade}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmar Upgrade de Plan</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body) as unknown as React.JSX.Element;
}
