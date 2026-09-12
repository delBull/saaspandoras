'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Clock,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Lock,
  Cpu,
  Share2,
  FileText,
  AlertTriangle,
} from 'lucide-react';

export function ExperienceClient() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [industry, setIndustry] = useState('Fintech & Web3');
  const [trialTier, setTrialTier] = useState<'SOFTWARE_ONLY' | 'MEDIA_ENABLED'>('MEDIA_ENABLED');

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [replayedInfo, setReplayedInfo] = useState<{ message: string; redirectUrl: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setReplayedInfo(null);

    if (!companyName.trim()) {
      setErrorMessage('Por favor ingresa el nombre de tu organización.');
      return;
    }

    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setErrorMessage('Por favor ingresa un correo corporativo válido.');
      return;
    }

    setLoading(true);
    setStatusMessage('Provisionando Sovereign Tenant en Pandoras OS...');

    try {
      const response = await fetch('/api/v1/hermes/experience/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          email: email.trim(),
          industry,
          trialTier,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Error al inicializar Hermes Experience.');
      }

      if (data.isReplayed) {
        setStatusMessage('Sesión activa encontrada. Reconectando a tu espacio de trabajo...');
        setReplayedInfo({
          message: 'Ya cuentas con un tenant activo para este correo.',
          redirectUrl: data.redirectUrl,
        });
      } else {
        setStatusMessage('Tenant soberano configurado. Redirigiendo a tu Portal...');
      }

      // Small pause for visual feedback, then navigate to portal
      setTimeout(() => {
        router.push(data.redirectUrl);
      }, 900);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error inesperado al conectar con Hermes.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070B] text-zinc-100 flex flex-col selection:bg-purple-500/30">
      {/* Top Navigation */}
      <header className="w-full border-b border-zinc-850 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/growth-os/hermes" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-wide text-white">Pandoras Hermes</span>
              <span className="text-[10px] block font-mono text-purple-400">HERMES EXPERIENCE</span>
            </div>
          </Link>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-500/30 text-purple-300">
              <Clock className="w-3.5 h-3.5" />
              <span>72 HORAS DE ACCESO TOTAL</span>
            </div>
            <Link
              href="/portal/login"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Value Proposition & Architecture */}
        <div className="lg:col-span-7 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Infraestructura Real · Cero Simulación</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white leading-[1.15]">
            Entra. Este es Hermes.{' '}
            <span className="bg-gradient-to-r from-purple-300 via-purple-400 to-indigo-300 bg-clip-text text-transparent font-normal">
              Úsalo durante 72 horas.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-light max-w-2xl">
            No es un simulador ni una animación de marketing. Al completar tus datos, Pandoras
            despliega un <strong>Tenant Soberano real</strong> en nuestra nube con base de datos
            dedicada, ledger de créditos y canales de distribución autónoma.
          </p>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 text-sm font-medium">
                <FileText className="w-4 h-4" />
                <span>Knowledge Vault Soberano</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Carga hasta 3 documentos confidenciales (PDF/MD/TXT). Hermes indexa y genera claims verificables con fail-closed gate.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium">
                <Cpu className="w-4 h-4" />
                <span>Motor de Estrategia</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Diseña y planifica hasta 3 campañas completas alineadas a metas de negocio, conversión y captación de demanda.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                <Share2 className="w-4 h-4" />
                <span>Channel Mesh Multicanal</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Conecta tus canales (Telegram, X, LinkedIn, Warpcast) y publica con firma y prueba criptográfica notarizada.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                <Clock className="w-4 h-4" />
                <span>Preservación Post-Trial</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Al terminar las 72h, tu información, campañas y timeline quedan preservados en modo solo lectura sin pérdida de datos.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Activation Form */}
        <div className="lg:col-span-5">
          <div className="relative rounded-3xl bg-zinc-900/80 border border-zinc-800/90 p-8 shadow-2xl shadow-purple-950/20 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">Configura tu Organización</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Acceso inmediato sin tarjeta de crédito</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Zap className="w-5 h-5" />
              </div>
            </div>

            {errorMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
                <div className="leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {replayedInfo && (
              <div className="mb-6 p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-purple-400" />
                <div className="leading-relaxed">{replayedInfo.message}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-2">
                  NOMBRE DE TU EMPRESA U ORGANIZACIÓN
                </label>
                <input
                  type="text"
                  required
                  disabled={loading}
                  placeholder="ej. Sovereign Capital Labs"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950/70 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-2">
                  CORREO CORPORATIVO DE CONTACTO
                </label>
                <input
                  type="email"
                  required
                  disabled={loading}
                  placeholder="founder@tuempresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950/70 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-2">
                  INDUSTRIA O VERTICAL
                </label>
                <select
                  disabled={loading}
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950/70 border border-zinc-800 text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                >
                  <option value="Fintech & Web3">Fintech, DeFi & Web3 Protocols</option>
                  <option value="Real Estate">Bienes Raíces & Desarrollos Patrimoniales</option>
                  <option value="SaaS & AI">SaaS B2B & Plataformas de Software</option>
                  <option value="Professional Services">Servicios Financieros & Consultoría</option>
                  <option value="eCommerce">Retail, D2C & Commerce</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-2">
                  TIER DE EVALUACIÓN HERMES
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setTrialTier('SOFTWARE_ONLY')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      trialTier === 'SOFTWARE_ONLY'
                        ? 'bg-purple-950/30 border-purple-500/80 text-white'
                        : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-bold font-mono">SOFTWARE ONLY</div>
                    <div className="text-[11px] text-zinc-400 mt-1 leading-snug">
                      Estrategia de texto, Knowledge Vault y distribución básica.
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setTrialTier('MEDIA_ENABLED')}
                    className={`p-3.5 rounded-2xl border text-left relative transition-all ${
                      trialTier === 'MEDIA_ENABLED'
                        ? 'bg-purple-950/40 border-purple-500 text-white shadow-lg shadow-purple-900/20'
                        : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                      RECOMENDADO
                    </span>
                    <div className="text-xs font-bold font-mono text-purple-300">MEDIA ENABLED</div>
                    <div className="text-[11px] text-zinc-400 mt-1 leading-snug">
                      Incluye 3 Media Credits para generación multimedia y video.
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xl shadow-purple-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                      <span>{statusMessage || 'Inicializando...'}</span>
                    </>
                  ) : (
                    <>
                      <span>Comenzar Experiencia Hermes (72h)</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500 font-mono pt-2">
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Aislamiento criptográfico y gobernanza estricta</span>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
