'use client';

import React, { useState, useId } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Building2,
  TrendingUp,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Globe,
  Loader2,
  Lock,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { useActiveAccount } from 'thirdweb/react';
import type { OnboardingProductKey, ProvisioningRequestDTO } from '@/lib/dash-contracts/provisioning';

interface ProductOption {
  key: OnboardingProductKey;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
  features: string[];
}

const PRODUCTS: ProductOption[] = [
  {
    key: 'HERMES',
    title: 'Inteligencia Relacional',
    subtitle: 'Hermes AI OS',
    description: 'Atención 24/7 en Telegram y Web respaldada por Knowledge Vault soberano (K25).',
    badge: 'CONVERSATIONAL PLANE',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
    features: [
      'Agente conversacional en Telegram y Widget Web',
      'Knowledge Vault con anclaje criptográfico',
      'Trazabilidad epistémica de reclamos (K26)',
    ],
  },
  {
    key: 'GROWTH_OS',
    title: 'Growth Commercial Engine',
    subtitle: 'Growth OS',
    description: 'Pipeline CRM de prospectos, campañas de email, tesorería Safe y pases VIP.',
    badge: 'COMMERCIAL OPERATIONS',
    badgeColor: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    icon: <TrendingUp className="w-5 h-5 text-violet-400" />,
    features: [
      'Pipeline de cualificación e inversores relacionales',
      'Email marketing institucional con cuota mensual',
      'Tesorería soberana con guardias de retiro diarias',
    ],
  },
  {
    key: 'PANDORAS_RWA',
    title: 'RWA & Tokenomics',
    subtitle: 'Pandoras Protocol Engine',
    description: 'Tokenización de activos, participaciones DAO y contratos notarizados EIP-712.',
    badge: 'CAPITAL & TOKENOMICS',
    badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    icon: <Layers className="w-5 h-5 text-sky-400" />,
    features: [
      'Emisión de participaciones y contratos tokenizados',
      'Gobernanza descentralizada para holders',
      'Conciliación Fast Lane y dispersión pro-rata',
    ],
  },
];

export function UnifiedOnboardingClient() {
  const router = useRouter();
  const account = useActiveAccount();
  const fallbackId = useId();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [businessCategory, setBusinessCategory] = useState('technology');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<OnboardingProductKey[]>([
    'HERMES',
    'GROWTH_OS',
  ]);
  const [isProvisioning, setIsProvisioning] = useState(false);

  // Auto-generate clean slug on name input
  const handleNameChange = (name: string) => {
    setOrgName(name);
    if (!orgSlug || orgSlug === orgName.toLowerCase().replace(/[^a-z0-9]/g, '-')) {
      const generated = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setOrgSlug(generated);
    }
  };

  const toggleProduct = (key: OnboardingProductKey) => {
    if (selectedProducts.includes(key)) {
      if (selectedProducts.length === 1) {
        toast.warning('Debes seleccionar al menos un producto para tu ecosistema.');
        return;
      }
      setSelectedProducts(selectedProducts.filter((p) => p !== key));
    } else {
      setSelectedProducts([...selectedProducts, key]);
    }
  };

  const handleProvision = async () => {
    if (!account?.address) {
      toast.error('Conecta tu wallet para firmar el aprovisionamiento del tenant.');
      return;
    }

    if (!orgName.trim() || !orgSlug.trim()) {
      toast.error('El nombre y el slug de la organización son obligatorios.');
      setStep(1);
      return;
    }

    setIsProvisioning(true);
    const toastId = toast.loading('Aprovisionando organización en el Sovereign Mesh...', { id: 'prov-toast' });

    try {
      const idempotencyKey = `idem_${orgSlug}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      const payload: ProvisioningRequestDTO = {
        organization: {
          name: orgName.trim(),
          slug: orgSlug.trim(),
          businessCategory,
          website: website.trim() || undefined,
          description: description.trim() || undefined,
        },
        products: selectedProducts,
        idempotencyKey,
      };

      const res = await fetch('/api/v1/internal/onboarding/provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': account.address,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al aprovisionar la organización');
      }

      toast.success('¡Ecosistema Soberano Aprovisionado con Éxito!', { id: 'prov-toast' });
      router.push(data.redirectUrl || `/portal/${orgSlug}/ecosystem`);
    } catch (err: any) {
      console.error('Provisioning error:', err);
      toast.error(err.message || 'Fallo durante el aprovisionamiento', { id: 'prov-toast' });
      setIsProvisioning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080D] text-white flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden">
      {/* Background Ambient Aura */}
      <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[450px] h-[450px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-3xl w-full relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sovereign Tenant Provisioning Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
            Crea tu Ecosistema Soberano
          </h1>
          <p className="text-zinc-400 text-sm mt-2 max-w-lg mx-auto">
            Configura la identidad de tu organización y activa de forma modular las capacidades de inteligencia, crecimiento y tokenomics.
          </p>
        </div>

        {/* Stepper Indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[
            { num: 1, label: 'Identidad' },
            { num: 2, label: 'Módulos' },
            { num: 3, label: 'Confirmación' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s.num
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400/50'
                    : step > s.num
                    ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
              </div>
              <span className={`text-xs font-medium ${step === s.num ? 'text-white' : 'text-zinc-500'}`}>
                {s.label}
              </span>
              {s.num < 3 && <div className="w-6 h-[1px] bg-zinc-800" />}
            </div>
          ))}
        </div>

        {/* Main Card Container */}
        <div className="bg-zinc-900/60 backdrop-blur-2xl border border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {/* STEP 1: IDENTITY */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-400" />
                    1. Identidad de tu Organización
                  </h2>
                  <p className="text-zinc-400 text-xs mt-1">
                    Define el nombre comercial y el slug canónico con el que operará tu tenant.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Nombre de la Organización / Empresa *
                    </label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Ej. S'Narai Luxury Living"
                      className="w-full bg-black/40 border border-zinc-700/70 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Slug Canónico (URL del Portal) *
                    </label>
                    <div className="flex items-center bg-black/40 border border-zinc-700/70 focus-within:border-indigo-500 rounded-xl px-4 py-3">
                      <span className="text-xs text-zinc-500 font-mono select-none">dash.pandoras.finance/portal/</span>
                      <input
                        type="text"
                        value={orgSlug}
                        onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="snarai"
                        className="bg-transparent border-none focus:outline-none text-sm text-indigo-300 font-mono ml-1 flex-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                        Categoría de Negocio
                      </label>
                      <select
                        value={businessCategory}
                        onChange={(e) => setBusinessCategory(e.target.value)}
                        className="w-full bg-black/40 border border-zinc-700/70 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-zinc-200 transition-all"
                      >
                        <option value="technology">Tecnología & IA</option>
                        <option value="real_estate">Bienes Raíces & Hospitality</option>
                        <option value="finance">Finanzas & DeFi</option>
                        <option value="e_commerce">Comercio & Retail</option>
                        <option value="services">Servicios Corporativos</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                        Sitio Web Oficial (Opcional)
                      </label>
                      <div className="flex items-center bg-black/40 border border-zinc-700/70 focus-within:border-indigo-500 rounded-xl px-3 py-3">
                        <Globe className="w-4 h-4 text-zinc-500 mr-2 shrink-0" />
                        <input
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://empresa.com"
                          className="bg-transparent border-none focus:outline-none text-sm text-white placeholder-zinc-600 flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Descripción Ejecutiva (Opcional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      placeholder="Breve resumen de la actividad comercial o propósito de la organización..."
                      className="w-full bg-black/40 border border-zinc-700/70 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-zinc-800">
                  <button
                    onClick={() => {
                      if (!orgName.trim() || !orgSlug.trim()) {
                        toast.error('Completa el nombre y el slug de la organización.');
                        return;
                      }
                      setStep(2);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    <span>Siguiente: Módulos del Ecosistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: WHAT DO YOU WANT TO BUILD? */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    2. ¿Qué quieres construir en tu Ecosistema?
                  </h2>
                  <p className="text-zinc-400 text-xs mt-1">
                    Selecciona las soluciones modulares que se instalarán en tu organización.
                  </p>
                </div>

                <div className="space-y-3.5">
                  {PRODUCTS.map((prod) => {
                    const isSelected = selectedProducts.includes(prod.key);
                    return (
                      <div
                        key={prod.key}
                        onClick={() => toggleProduct(prod.key)}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? 'bg-zinc-800/80 border-indigo-500/60 shadow-lg shadow-indigo-600/10'
                            : 'bg-black/30 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3.5">
                            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 shrink-0">
                              {prod.icon}
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-bold text-white">{prod.title}</h3>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${prod.badgeColor}`}>
                                  {prod.badge}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{prod.description}</p>
                            </div>
                          </div>

                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all shrink-0 mt-1 ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'border-zinc-700 bg-zinc-900 text-transparent'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Features List */}
                        <div className="mt-3.5 pt-3 border-t border-zinc-800/60 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {prod.features.map((feat, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                              <span className="w-1 h-1 rounded-full bg-indigo-400 shrink-0" />
                              <span className="truncate">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs font-semibold text-zinc-400 hover:text-white px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Atrás</span>
                  </button>

                  <button
                    onClick={() => setStep(3)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    <span>Siguiente: Revisión y Confirmación</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: CONFIRM & PROVISION */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    3. Resumen y Aprovisionamiento
                  </h2>
                  <p className="text-zinc-400 text-xs mt-1">
                    Revisa la configuración antes de inicializar la organización en el Sovereign Mesh.
                  </p>
                </div>

                {/* Summary Card */}
                <div className="bg-black/40 border border-zinc-800 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Organización</p>
                      <h3 className="text-lg font-bold text-white">{orgName}</h3>
                      <p className="text-xs text-indigo-400 font-mono">portal/{orgSlug}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      TRIAL 14 DÍAS
                    </span>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-2">
                      Módulos Instalados ({selectedProducts.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProducts.map((p) => {
                        const info = PRODUCTS.find((x) => x.key === p);
                        return (
                          <div
                            key={p}
                            className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-200"
                          >
                            {info?.icon}
                            <span>{info?.title}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Connected Wallet Verification */}
                  <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Wallet className="w-4 h-4 text-emerald-400" />
                      <span>Wallet Firmante:</span>
                    </div>
                    <span className="font-mono font-bold text-zinc-300">
                      {account?.address
                        ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
                        : 'No conectada'}
                    </span>
                  </div>
                </div>

                {/* Governance & Security Note */}
                <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-3.5 text-xs text-indigo-200/90 leading-relaxed flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    El aprovisionamiento creará las filas de identidad y módulos en el entorno seguro de Neon DB con registro auditable. Podrás configurar cada módulo y su base de conocimiento en el Sovereign Mesh Hub.
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  <button
                    onClick={() => setStep(2)}
                    disabled={isProvisioning}
                    className="text-xs font-semibold text-zinc-400 hover:text-white px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Atrás</span>
                  </button>

                  <button
                    onClick={handleProvision}
                    disabled={isProvisioning}
                    className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs px-8 py-3.5 rounded-xl flex items-center gap-2 shadow-xl shadow-emerald-600/20 transition-all disabled:opacity-50"
                  >
                    {isProvisioning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Aprovisionando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Aprovisionar Ecosistema</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default UnifiedOnboardingClient;
