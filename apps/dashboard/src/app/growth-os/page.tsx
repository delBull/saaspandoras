'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Zap, 
  ShieldCheck, 
  Rocket, 
  Target, 
  Globe, 
  Users, 
  Cpu, 
  BarChart3, 
  MessageSquare,
  Gift,
  Key,
  ChevronRight,
  Sparkles,
  MousePointer2,
  Lock
} from 'lucide-react';
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import NextImage from "next/image";
import { LeadCaptureModal } from "../../components/marketing/LeadCaptureModal";
import { DocumentVisorModal } from "../../components/marketing/DocumentVisorModal";
import { useAccessState } from "@/hooks/use-access-state";
import { useRouter } from "next/navigation";

const TierCard = ({ 
  tier, 
  title, 
  price, 
  description, 
  features, 
  accentColor, 
  icon: Icon,
  onCTA,
  popular = false 
}: { 
  tier: string, 
  title: string, 
  price: string, 
  description: string, 
  features: string[], 
  accentColor: string,
  icon: any,
  onCTA: () => void,
  popular?: boolean
}) => (
  <motion.div 
    whileHover={{ y: -10 }}
    className={`relative p-8 rounded-[2.5rem] border ${popular ? `border-${accentColor}-500/50 bg-${accentColor}-500/5` : 'border-zinc-800 bg-zinc-900/50'} backdrop-blur-xl flex flex-col h-full shadow-2xl transition-all duration-300 group`}
  >
    {popular && (
      <div className={`absolute -top-4 left-1/2 -translate-x-1/2 bg-${accentColor}-500 text-black font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-${accentColor}-500/50 z-20`}>
        Más Popular
      </div>
    )}
    
    <div className="flex items-center gap-4 mb-6">
      <div className={`p-4 rounded-2xl bg-${accentColor}-500/10 text-${accentColor}-400 border border-${accentColor}-500/20 group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <Badge variant="outline" className={`bg-${accentColor}-500/10 text-${accentColor}-400 border-${accentColor}-500/20 uppercase text-[9px] font-black tracking-widest`}>
          {tier}
        </Badge>
        <h3 className="text-2xl font-black text-white mt-1 tracking-tight">{title}</h3>
      </div>
    </div>

    <div className="mb-6">
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-black text-white tracking-tighter">{price}</span>
        {price.includes('$') && <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">/ mes</span>}
      </div>
      <p className="text-zinc-400 text-sm mt-3 leading-relaxed font-medium">
        {description}
      </p>
    </div>

    <div className="space-y-4 mb-8 flex-1">
      {features.map((feature, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={`flex-shrink-0 w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-${accentColor}-500/20 transition-colors`}>
            <ShieldCheck className={`w-3 h-3 text-zinc-600 group-hover:text-${accentColor}-400 transition-colors`} />
          </div>
          <span className="text-zinc-400 text-sm font-medium group-hover:text-zinc-200 transition-colors">{feature}</span>
        </div>
      ))}
    </div>

    <Button 
      onClick={onCTA}
      className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] bg-white text-black hover:bg-zinc-200 border-none transition-all flex items-center justify-center gap-2`}
    >
      {price === 'Gratis' ? 'Empezar Gratis' : price === 'Partnership' ? 'Aplicar como Partner' : 'Contactar Ventas'}
      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </Button>
  </motion.div>
);

const GrowthTicker = () => (
    <div className="w-full bg-zinc-900/30 border-y border-zinc-800/50 py-3 overflow-hidden select-none whitespace-nowrap flex items-center gap-8 relative">
        <div className="animate-marquee flex items-center gap-12 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
            {Array(10).fill(null).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span>Deploying Protocol #{1240 + i}</span>
                    <span className="text-zinc-700">|</span>
                    <span className="text-purple-400">+{(20 * (i + 1))} Artifacts Issued</span>
                    <span className="text-zinc-700">|</span>
                    <span className="text-emerald-400">Layer 4 Health: 100%</span>
                </div>
            ))}
        </div>
        <style jsx>{`
            .animate-marquee {
                display: flex;
                animation: marquee 40s linear infinite;
            }
            @keyframes marquee {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
            }
        `}</style>
    </div>
);

const ProgressionPreview = () => {
    const [val, setVal] = useState(3);
    const mockTiers = [
        { name: 'Bronze', threshold: 0, perks: ['Basic Metrics'] },
        { name: 'Silver', threshold: 5, perks: ['Governance Tracker'] },
        { name: 'Gold', threshold: 15, perks: ['AI Nurturing', 'VIP Support'] },
        { name: 'Diamond', threshold: 30, perks: ['SBT Reputation', 'Revenue Share'] },
    ];
    
    const currentTier = [...mockTiers].reverse().find(t => val >= t.threshold) || mockTiers[0];
    const nextTier = mockTiers.find(t => t.threshold > val);
    const progress = nextTier ? Math.floor((val / nextTier.threshold) * 100) : 100;

    return (
        <div className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full" />
            
            <div className="flex flex-col md:flex-row gap-12 items-center">
                <div className="flex-1 space-y-8 w-full">
                    <div>
                        <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 mb-4 font-black uppercase tracking-widest text-[9px]">Progression Engine Preview</Badge>
                        <h3 className="text-4xl font-black tracking-tighter text-white uppercase italic">Visualiza tu Escala</h3>
                        <p className="text-zinc-500 text-sm font-medium mt-2 max-w-sm">Mueve el slider para ver cómo el protocolo recompensa a los holders automáticamente.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2">
                            <span>Balance de Artefactos</span>
                            <span className="text-white text-lg">{val}</span>
                        </div>
                        <input 
                            type="range" min="0" max="40" value={val} 
                            onChange={(e) => setVal(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>
                </div>

                <div className="w-full md:w-[340px] bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2rem] space-y-6 relative z-10">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Rango Actual</span>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[9px] font-black uppercase italic tracking-tighter">
                            {currentTier?.name || 'Iniciando'}
                        </Badge>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                            <span>Progreso al siguiente nivel</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                            <motion.div animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-purple-500 to-emerald-500" />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-3">
                        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block">Beneficios Activos</span>
                        <div className="flex flex-wrap gap-2">
                            {currentTier?.perks?.map((p, i) => (
                                <div key={i} className="px-2 py-1 bg-zinc-800 rounded-lg text-[9px] font-bold text-zinc-400 border border-white/5">
                                    {p}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const APIPreview = () => (
    <div className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] p-1 shadow-2xl overflow-hidden group">
        <div className="bg-zinc-900/50 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
            </div>
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Headless Integration (v2.0)</span>
            <Cpu className="w-4 h-4 text-zinc-700" />
        </div>
        <div className="p-8 font-mono text-[11px] leading-relaxed text-zinc-400">
            <div className="space-y-1">
                <p><span className="text-purple-400">const</span> res = <span className="text-emerald-400">await</span> <span className="text-blue-400">fetch</span>(<span className="text-orange-300">'/api/public/project/alpha/state'</span>);</p>
                <p><span className="text-purple-400">const</span> {`{ progression }`} = <span className="text-emerald-400">await</span> res.<span className="text-blue-400">json</span>();</p>
                <p>&nbsp;</p>
                <p><span className="text-zinc-600">// Desbloquea UI personalizada según el Tier</span></p>
                <p><span className="text-purple-400">if</span> (progression.unlockDelta === <span className="text-orange-400">0</span>) {`{`}</p>
                <p>&nbsp;&nbsp;<span className="text-blue-400">showGovenanceWidget</span>(progression.currentTier.perks);</p>
                <p>{`}`}</p>
            </div>
        </div>
    </div>
);

export default function GrowthOSLanding() {
  const [leadModal, setLeadModal] = useState(false);
  const [docModal, setDocModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | undefined>(undefined);
  
  const router = useRouter();
  const { isGenesisQualified, ux, isLoading } = useAccessState();

  const openConversion = (tier?: string) => {
    if (isGenesisQualified) {
        router.push("/admin");
        return;
    }
    setSelectedTier(tier);
    setLeadModal(true);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500 selection:text-white overflow-x-hidden">
      {/* Abstract Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-600/20 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Navigation - Minimal */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-8 w-full max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center group-hover:rotate-6 transition-transform duration-300 shadow-xl shadow-white/10 overflow-hidden">
            <img src="/images/logo_green.png" alt="Pandora Logo" className="w-full h-full object-cover p-1.5" />
          </div>
          <span className="font-black text-2xl tracking-tighter uppercase italic">Pandora's <span className="text-zinc-500">Growth OS</span></span>
        </Link>
        <div className="flex items-center gap-8">
          <Link href="/admin" className="text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-colors">Admin Dashboard</Link>
          <div className="hidden sm:block h-4 w-px bg-zinc-800"></div>
          <Button 
            onClick={() => setDocModal(true)}
            variant="ghost" 
            className="text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
          >
            Docs
          </Button>
        </div>
      </nav>

      <GrowthTicker />

      <main className="relative z-10 w-full max-w-7xl mx-auto px-8 py-20 lg:py-32">
        {/* HERO SECTION */}
        <div className="text-center max-w-5xl mx-auto mb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <Badge className="bg-zinc-900 text-purple-400 border-zinc-800 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-10 shadow-xl">
              Infraestructura de Ventaja Asimétrica
            </Badge>
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.85] mb-10">
              EL ACCESO <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-zinc-100 to-emerald-400 uppercase">
                NO ES IGUAL
              </span>
            </h1>
            
            {/* 🛰️ Real-Time Scarcity Injected from Level 20 Backend */}
            {ux?.scarcityHint && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-8 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 inline-block"
              >
                 <span className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                    <Sparkles className="w-3 h-3 animate-pulse" />
                    {ux.scarcityHint}
                 </span>
              </motion.div>
            )}

            <p className="text-lg md:text-2xl text-zinc-500 font-bold leading-relaxed max-w-3xl mx-auto mb-16 uppercase tracking-tight">
              Growth OS determina quién entra primero — <span className="text-white">y quién captura la mayor ventaja</span>. Un sistema cerrado que rastrea, clasifica y activa a participantes tempranos en oportunidades financieras reales.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 px-4">
              <Button 
                onClick={() => openConversion()}
                disabled={isLoading}
                className="w-full sm:w-auto h-20 px-14 rounded-3xl bg-white text-black font-black text-xl hover:bg-zinc-200 transition-all shadow-[0_0_60px_rgba(255,255,255,0.15)] uppercase tracking-tighter italic"
              >
                {isLoading ? "Validando..." : isGenesisQualified ? "Ir al Dashboard" : "Entrar Temprano"}
              </Button>
              <Button 
                onClick={() => setDocModal(true)}
                variant="ghost" 
                className="w-full sm:w-auto h-20 px-10 rounded-3xl text-zinc-400 font-black text-lg hover:bg-white/5 transition-all uppercase tracking-tighter hover:text-white"
              >
                Launch Panel Docs
              </Button>
            </div>
          </motion.div>
        </div>

         {/* NARRATIVE BREAK */}
        <div className="mb-48 text-center max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter uppercase italic">Growth OS no es un dashboard.</h2>
          <p className="text-xl text-zinc-500 font-bold uppercase tracking-tight">
            Es la infraestructura detrás de:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="p-8 rounded-3xl border border-zinc-900 bg-zinc-950/50">
              <span className="text-white font-black text-xl uppercase italic">Acceso temprano a preventas</span>
            </div>
            <div className="p-8 rounded-3xl border border-zinc-900 bg-zinc-950/50">
              <span className="text-white font-black text-xl uppercase italic">Asignación Preferencial</span>
            </div>
            <div className="p-8 rounded-3xl border border-zinc-900 bg-zinc-950/50">
              <span className="text-white font-black text-xl uppercase italic">Ventaja Acumulativa</span>
            </div>
          </div>
        </div>

         {/* HOW IT WORKS - 4 STEP PROCESS */}
        <div className="mb-48">
          <div className="text-center mb-16">
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 mb-4 font-black uppercase tracking-widest text-[9px]">El Proceso</Badge>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic">Cómo funciona</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Entra temprano al sistema", desc: "Asegura tu posición en la ventana Genesis." },
              { step: "02", title: "Clasifícate automáticamente", desc: "Nuestro motor determina tu tier de beneficios on-chain." },
              { step: "03", title: "Desbloquea acceso exclusivo", desc: "Flujo de tratos privados y derechos de gobernanza." },
              { step: "04", title: "Participa antes que el mercado", desc: "Captura la ventaja total del ecosistema." }
            ].map((s, i) => (
              <div key={i} className="p-10 rounded-[2.5rem] border border-zinc-800 bg-zinc-900/30 relative group overflow-hidden">
                <div className="text-6xl font-black text-zinc-800 absolute -top-2 -right-2 italic group-hover:text-purple-500/20 transition-colors">{s.step}</div>
                <h4 className="text-xl font-black text-white mb-4 relative z-10">{s.title}</h4>
                <p className="text-zinc-500 text-sm font-bold uppercase tracking-tight relative z-10">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* WHY IT EXISTS */}
        <div className="mb-48 py-24 border-y border-zinc-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-purple-500/5 blur-[120px]" />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <p className="text-zinc-500 font-black uppercase tracking-[0.3em] mb-8">Por qué existe</p>
            <h3 className="text-4xl md:text-6xl font-black mb-10 tracking-tighter uppercase italic">La mayoría descubre las oportunidades <span className="text-purple-400 underline decoration-emerald-500 underline-offset-8">demasiado tarde</span>.</h3>
            <p className="text-2xl text-white font-black uppercase italic tracking-tight">
              Growth OS existe para recompensar el <span className="text-emerald-400">tiempo</span>, no el ruido.
            </p>
          </div>
        </div>

        {/* STATS SECTION */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-40">
          {[
            { label: 'Asignación Temprana', value: 'Garantizada' },
            { label: 'Tiempo a Genesis', value: 'Instante' },
            { label: 'Precisión de Reparto', value: '100%' },
            { label: 'Ventaja de Activo', value: '+Asim' },
          ].map((stat, i) => (
            <div key={i} className="text-center p-10 rounded-[2.5rem] border border-zinc-900 bg-zinc-950/50 backdrop-blur-md group hover:border-zinc-700 transition-colors">
              <div className="text-5xl font-black text-white mb-2 tracking-tighter group-hover:scale-110 transition-transform">{stat.value}</div>
              <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* PACKAGES SECTION */}
        <div className="mb-48">
          <div className="text-center mb-20 px-4">
            <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter">PLANES DE ESCALA</h2>
            <p className="text-zinc-600 font-bold text-xl uppercase tracking-tight">De la captura básica a la identidad digital soberana.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-stretch">
            <TierCard 
              tier="NIVEL DE ENTRADA"
              title="Acceso al Sistema"
              price="Gratis"
              description="Punto de entrada básico al ecosistema. Seguimiento y reputación base."
              accentColor="purple"
              icon={Zap}
              onCTA={() => openConversion('ENTRY: System Access')}
              features={[
                'Identificación de Identidad',
                'Monitoreo de Estatus',
                'Dashboard de Acceso',
                'Entrada a la Comunidad',
                'Soporte Estándar'
              ]}
            />
            
            <TierCard 
              tier="CAPA PRO"
              title="Motor de Asignación"
              price="$599"
              popular={true}
              description="Clasificación avanzada para participantes serios que buscan asignación preferencial."
              accentColor="emerald"
              icon={Rocket}
              onCTA={() => openConversion('PRO: Allocation Engine')}
              features={[
                'Asignación Preferencial',
                'Acceso Temprano a Tratos',
                'Resolución de Identidad',
                'Staking de Reputación',
                'Activación IA (Nurturing)',
                'Soporte Prioritario'
              ]}
            />
            
            <TierCard 
              tier="ACCESO ELITE"
              title="Fortaleza Genesis"
              price="Partnership"
              description="Máxima ventaja e infraestructura personalizada para participantes de alto impacto."
              accentColor="indigo"
              icon={Key}
              onCTA={() => openConversion('ELITE: Genesis Fortress')}
              features={[
                'Derechos Genesis de Asignación',
                'Integración Directa SDK',
                'Capa de Identidad Custom',
                'Interés Compuesto de Ventaja',
                'Asesoría Estratégica'
              ]}
            />
          </div>
        </div>

        {/* FEATURES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 mb-48">
          <div className="space-y-6 group">
            <div className="w-16 h-16 rounded-[1.5rem] bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-8 group-hover:rotate-12 transition-transform">
              <Globe className="w-8 h-8 text-purple-400" />
            </div>
            <h4 className="text-3xl font-black tracking-tight">Umbrales de Acceso</h4>
            <p className="text-zinc-500 leading-relaxed font-bold uppercase text-xs tracking-wide">Infraestructura que filtra el ruido y prioriza a los participantes según tiempo y alineación.</p>
          </div>
          <div className="space-y-6 group">
            <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-8 group-hover:rotate-12 transition-transform">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <h4 className="text-3xl font-black tracking-tight">Inteligencia de Identidad</h4>
            <p className="text-zinc-500 leading-relaxed font-bold uppercase text-xs tracking-wide">Resolución de participantes de alta intención (Wallet + Metadata) para asegurar la ventaja.</p>
          </div>
          <div className="space-y-6 group">
            <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-8 group-hover:rotate-12 transition-transform">
              <Key className="w-8 h-8 text-indigo-400" />
            </div>
            <h4 className="text-3xl font-black tracking-tight">Reputación Genesis</h4>
            <p className="text-zinc-500 leading-relaxed font-bold uppercase text-xs tracking-wide">Crea palanca real con nuestra capa de reputación intransferible y sistema de asignación preferente.</p>
          </div>
        </div>

        {/* FOOTER CTA */}
        <div className="rounded-[3rem] md:rounded-[4rem] bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-8 md:p-16 lg:p-32 text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[120px] group-hover:bg-emerald-500/20 transition-all duration-700"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 blur-[120px] group-hover:bg-purple-500/20 transition-all duration-700"></div>
          
          <h2 className="text-5xl lg:text-8xl font-black mb-12 relative z-10 tracking-tighter leading-none italic uppercase">
            ¿LISTO PARA <br/> CONVERTIR?
          </h2>
          
          <Button 
            onClick={() => openConversion()}
            size="lg" 
            className="w-full sm:w-auto h-20 px-14 rounded-3xl bg-emerald-500 text-black font-black text-xl md:text-2xl hover:bg-emerald-400 transition-all shadow-2xl shadow-emerald-500/30 relative z-10 uppercase italic tracking-tighter"
          >
            Entrar Temprano
          </Button>
          
          <p className="text-zinc-600 font-black uppercase tracking-[0.4em] text-[10px] mt-16 relative z-10 opacity-50">
            © 2026 PANDORA'S GROWTH OPERATING SYSTEM
          </p>
        </div>
      </main>

      {/* Modals */}
      <LeadCaptureModal 
        isOpen={leadModal} 
        onClose={() => setLeadModal(false)} 
        tierName={selectedTier}
      />
      
      <DocumentVisorModal 
        isOpen={docModal} 
        onClose={() => setDocModal(false)}
      />

      {/* Global CSS for branding */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');
        body {
          font-family: 'Outfit', sans-serif;
          background-color: black;
        }
        .text-3d {
          text-shadow: 0 1px 0 #ccc, 0 2px 0 #c9c9c9, 0 3px 0 #bbb;
        }
      ` }} />
    </div>
  );
}
