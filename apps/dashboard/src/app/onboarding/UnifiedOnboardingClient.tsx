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
  Bot,
  Compass,
  Check,
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
    title: 'Hermes',
    subtitle: 'Inteligencia Relacional',
    description: 'Habla con tus clientes, inversionistas y comunidad mediante una IA que conoce tu organización.',
    badge: 'CONVERSATIONAL PLANE',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    icon: <Bot className="w-5 h-5 text-emerald-400" />,
    features: [
      'Agente conversacional en Telegram y Widget Web',
      'Knowledge Vault con anclaje criptográfico (K25)',
      'Trazabilidad epistémica de reclamos institucionales (K26)',
    ],
  },
  {
    key: 'GROWTH_OS',
    title: 'Growth OS',
    subtitle: 'Operaciones Comerciales',
    description: 'Convierte conversaciones en oportunidades, administra prospectos, campañas y operaciones comerciales.',
    badge: 'COMMERCIAL OPERATIONS',
    badgeColor: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    icon: <TrendingUp className="w-5 h-5 text-violet-400" />,
    features: [
      'Pipeline de cualificación e inversores relacionales',
      'Email marketing institucional con cuota mensual',
      'Tesorería soberana Safe con guardias de retiro',
    ],
  },
  {
    key: 'PANDORAS_RWA',
    title: 'RWA & Tokenomics',
    subtitle: 'Capital On-Chain',
    description: 'Tokeniza activos, estructura participaciones y opera economías on-chain.',
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
  const [hermesPriority, setHermesPriority] = useState<string>('INVESTOR_RELATIONS');
  const [growthPriority, setGrowthPriority] = useState<string>('ACQUIRE_LEADS');
  const [rwaPriority, setRwaPriority] = useState<string>('TOKENIZE_ASSET');
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
        toast.warning('Debes seleccionar al menos una capacidad para tu ecosistema.');
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
    const toastId = toast.loading('Aprovisionando ecosistema con Hermes...', { id: 'prov-toast' });

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
        intents: {
          hermesPriority: selectedProducts.includes('HERMES') ? hermesPriority : undefined,
          growthPriority: selectedProducts.includes('GROWTH_OS') ? growthPriority : undefined,
          rwaPriority: selectedProducts.includes('PANDORAS_RWA') ? rwaPriority : undefined,
        },
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
      router.push(data.redirectUrl || `/ecosystem/${orgSlug}`);
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
            { num: 2, label: 'Ecosistema' },
            { num: 3, label: 'Intención' },
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
                    1. Cuéntanos sobre tu Organización
                  </h2>
                  <p className="text-zinc-400 text-xs mt-1">
                    Define la identidad comercial y el enlace soberano que identificará a tu ecosistema.
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
                        Categoría Principal
                      </label>
                      <select
                        value={businessCategory}
                        onChange={(e) => setBusinessCategory(e.target.value)}
                        className="w-full bg-black/40 border border-zinc-700/70 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-zinc-200 transition-all"
                      >
                        <option value="technology">Tecnología, IA & SaaS</option>
                        <option value="real_estate">Bienes Raíces, RWA & Hospitality</option>
                        <option value="finance">Finanzas, DeFi & Fondos</option>
                        <option value="services">Energía, Infraestructura & Corporativo</option>
                        <option value="other">Otro / Explorando</option>
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
                      ¿Qué hace tu organización? (Descripción corta)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      placeholder="Breve resumen de la actividad comercial, propuesta de valor o activos principales..."
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
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    <span>Siguiente: Diseña tu Ecosistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: DESIGN YOUR ECOSYSTEM */}
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
                    <Compass className="w-5 h-5 text-indigo-400" />
                    2. Diseña tu Ecosistema
                  </h2>
                  <p className="text-zinc-400 text-xs mt-1">
                    Selecciona las capacidades que quieres activar ahora. Puedes agregar las demás posteriormente.
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
                                <span className="text-xs text-zinc-400">· {prod.subtitle}</span>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${prod.badgeColor}`}>
                                  {prod.badge}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{prod.description}</p>
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
                    className="text-xs font-semibold text-zinc-400 hover:text-white px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Atrás</span>
                  </button>

                  <button
                    onClick={() => setStep(3)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    <span>Siguiente: Define tu Prioridad</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: STRATEGIC INTENT & FAST LAUNCH */}
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
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    3. Prioridad Inicial e Intención
                  </h2>
                  <p className="text-zinc-400 text-xs mt-1">
                    Hermes utilizará esta intención para darte la bienvenida y guiarte de forma personalizada en el Sovereign Mesh Hub.
                  </p>
                </div>

                {/* Intent questions per selected product */}
                <div className="space-y-5">
                  {/* Hermes Intent */}
                  {selectedProducts.includes('HERMES') && (
                    <div className="bg-black/40 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                        <Bot className="w-4 h-4" />
                        <span>¿Qué quieres que Hermes haga primero?</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          { id: 'INVESTOR_RELATIONS', label: 'Atención e información a inversionistas' },
                          { id: 'CLIENT_SUPPORT', label: 'Atención y soporte a clientes' },
                          { id: 'LEAD_GENERATION', label: 'Captación y cualificación de prospectos' },
                          { id: 'FAQ_AUTOMATION', label: 'Soporte institucional & FAQ' },
                          { id: 'EXPLORING', label: 'Todavía explorando capacidades' },
                        ].map((opt) => (
                          <div
                            key={opt.id}
                            onClick={() => setHermesPriority(opt.id)}
                            className={`px-3 py-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center gap-2 ${
                              hermesPriority === opt.id
                                ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40 shadow-sm'
                                : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                              hermesPriority === opt.id ? 'border-emerald-400 bg-emerald-400' : 'border-zinc-600'
                            }`}>
                              {hermesPriority === opt.id && <Check className="w-2.5 h-2.5 text-black stroke-[3]" />}
                            </div>
                            <span className="truncate">{opt.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Growth OS Intent */}
                  {selectedProducts.includes('GROWTH_OS') && (
                    <div className="bg-black/40 border border-violet-500/20 rounded-2xl p-4 sm:p-5 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-violet-400">
                        <TrendingUp className="w-4 h-4" />
                        <span>¿Cuál es tu prioridad comercial inicial?</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          { id: 'ACQUIRE_LEADS', label: 'Conseguir nuevos prospectos' },
                          { id: 'CONVERT_LEADS', label: 'Convertir prospectos existentes' },
                          { id: 'MARKETING_AUTOMATION', label: 'Automatizar marketing & emails' },
                          { id: 'INVESTOR_PIPELINE', label: 'Administrar pipeline de inversionistas' },
                          { id: 'OPERATIONS', label: 'Centralizar operaciones comerciales' },
                        ].map((opt) => (
                          <div
                            key={opt.id}
                            onClick={() => setGrowthPriority(opt.id)}
                            className={`px-3 py-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center gap-2 ${
                              growthPriority === opt.id
                                ? 'bg-violet-500/20 text-violet-200 border-violet-500/40 shadow-sm'
                                : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                              growthPriority === opt.id ? 'border-violet-400 bg-violet-400' : 'border-zinc-600'
                            }`}>
                              {growthPriority === opt.id && <Check className="w-2.5 h-2.5 text-black stroke-[3]" />}
                            </div>
                            <span className="truncate">{opt.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* RWA Intent */}
                  {selectedProducts.includes('PANDORAS_RWA') && (
                    <div className="bg-black/40 border border-sky-500/20 rounded-2xl p-4 sm:p-5 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                        <Layers className="w-4 h-4" />
                        <span>¿Qué quieres hacer con Pandoras?</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          { id: 'TOKENIZE_ASSET', label: 'Tokenizar un activo real (inmueble, energía)' },
                          { id: 'RAISE_CAPITAL', label: 'Levantar capital privado' },
                          { id: 'FRACTIONAL_SHARES', label: 'Crear participaciones fraccionales' },
                          { id: 'CREATE_DAO', label: 'Crear una DAO y modelo de gobernanza' },
                          { id: 'EXPLORING', label: 'Todavía estoy explorando viabilidad' },
                        ].map((opt) => (
                          <div
                            key={opt.id}
                            onClick={() => setRwaPriority(opt.id)}
                            className={`px-3 py-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center gap-2 ${
                              rwaPriority === opt.id
                                ? 'bg-sky-500/20 text-sky-200 border-sky-500/40 shadow-sm'
                                : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                              rwaPriority === opt.id ? 'border-sky-400 bg-sky-400' : 'border-zinc-600'
                            }`}>
                              {rwaPriority === opt.id && <Check className="w-2.5 h-2.5 text-black stroke-[3]" />}
                            </div>
                            <span className="truncate">{opt.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Compact Wallet & Identity Summary */}
                <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Ecosistema Destino</span>
                    <p className="font-bold text-white">{orgName} <span className="text-indigo-400 font-mono font-normal">(@{orgSlug})</span></p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Wallet Firmante</span>
                    <p className="font-mono text-zinc-300">
                      {account?.address
                        ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
                        : 'No conectada'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  <button
                    onClick={() => setStep(2)}
                    disabled={isProvisioning}
                    className="text-xs font-semibold text-zinc-400 hover:text-white px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Atrás</span>
                  </button>

                  <button
                    onClick={handleProvision}
                    disabled={isProvisioning}
                    className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs px-8 py-3.5 rounded-xl flex items-center gap-2 shadow-xl shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isProvisioning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Aprovisionando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Aprovisionar Ecosistema con Hermes</span>
                        <ArrowRight className="w-4 h-4" />
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
