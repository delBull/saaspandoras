'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Zap,
  ArrowRight,
  Lock,
  Loader2,
  Building2,
} from 'lucide-react';

interface TrialUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationSlug: string;
  organizationName: string;
}

const AGENDA_1_1_URL =
  process.env.NEXT_PUBLIC_AGENDA_1_1_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.origin}/schedule/pandoras?type=strategy`
    : 'https://dash.pandoras.finance/schedule/pandoras?type=strategy');

const PLANS = [
  {
    id: 'core',
    name: 'Core Sovereign',
    price: '$490',
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
}: TrialUpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState('growth');
  const [requestSent, setRequestSent] = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

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
          planName: plan?.name || selectedPlan,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Error al registrar intención de upgrade.');
      }

      setReferenceId(data.referenceId || `upg_${Date.now()}`);
      setRequestSent(true);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error inesperado al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#0B0B12] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 text-zinc-100">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {requestSent ? (
          <div className="text-center py-12 space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-950/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">¡Solicitud de Upgrade Recibida!</h3>
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
            {/* Header */}
            <div className="space-y-2 pr-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[11px] font-mono">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>UPGRADE BOUNDARY · TRANSFERENCIA CONTINUA</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
                Pasa de Trial a <span className="bg-gradient-to-r from-purple-300 via-purple-400 to-indigo-300 bg-clip-text text-transparent font-normal">Producción Ilimitada</span>
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-light max-w-2xl">
                Al actualizar tu plan, tu instancia de <strong>{organizationName}</strong> conserva
                completamente su identidad, documentos del Vault y campañas aprobadas. No vuelves a empezar.
              </p>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`cursor-pointer rounded-2xl p-5 border transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-purple-950/30 border-purple-500/90 shadow-xl shadow-purple-950/40'
                        : 'bg-zinc-950/50 border-zinc-850 hover:border-zinc-700'
                    }`}
                  >
                    {plan.highlight && (
                      <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md">
                        {plan.badge}
                      </span>
                    )}

                    <div className="space-y-3">
                      <div>
                        <span className="text-xs font-mono font-bold text-zinc-300 block">{plan.name}</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl font-bold text-white">{plan.price}</span>
                          <span className="text-[11px] text-zinc-500 font-mono">{plan.period}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">{plan.description}</p>
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

                    <div className="pt-4 mt-4 border-t border-white/5">
                      <div
                        className={`w-full py-2 rounded-xl text-center text-xs font-mono font-bold transition-all ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                        }`}
                      >
                        {isSelected ? 'Seleccionado' : 'Elegir Plan'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Invariant callout */}
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-zinc-300 text-[11px] sm:text-xs">
                  <strong>Garantía Inmutable:</strong> Tu configuración actual permanece en el Sovereign Vault. Al migrar a producción, se transfieren todos tus recursos sin fricción.
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
}
