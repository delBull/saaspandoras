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
        {price !== 'Free' && price !== 'Rev Share' && <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">/ mes</span>}
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
      {price === 'Free' ? 'Empezar Gratis' : price === 'Rev Share' ? 'Aplicar como Partner' : 'Contactar Ventas'}
      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </Button>
  </motion.div>
);

export default function GrowthOSLanding() {
  const [leadModal, setLeadModal] = useState(false);
  const [docModal, setDocModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | undefined>(undefined);

  const openConversion = (tier?: string) => {
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

      <main className="relative z-10 w-full max-w-7xl mx-auto px-8 py-20 lg:py-32">
        {/* HERO SECTION */}
        <div className="text-center max-w-5xl mx-auto mb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <Badge className="bg-zinc-900 text-purple-400 border-zinc-800 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-10 shadow-xl">
              Instant Execution Hub for Web3
            </Badge>
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.85] mb-10">
              INSIGHTS &rarr; <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-zinc-100 to-emerald-400">
                EXECUTION
              </span>
              <br/> IN 60 SECONDS
            </h1>
            <p className="text-lg md:text-2xl text-zinc-500 font-bold leading-relaxed max-w-3xl mx-auto mb-16 uppercase tracking-tight">
              Diseña, Ejecuta y Escala. No solo te traemos leads… <span className="text-white">construimos gobernanza</span>. Atribución absoluta del "Governance Acquisition Cost" (GAC).
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 px-4">
              <Button 
                onClick={() => openConversion()}
                className="w-full sm:w-auto h-20 px-14 rounded-3xl bg-white text-black font-black text-xl hover:bg-zinc-200 transition-all shadow-[0_0_60px_rgba(255,255,255,0.15)] uppercase tracking-tighter italic"
              >
                Pide tu Setup
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

        {/* DEMAND ENGINE PREVIEW */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="relative mb-48 rounded-[3rem] border border-zinc-800 bg-zinc-900/50 p-1 lg:p-4 shadow-2xl overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
          <div className="aspect-video rounded-[2.5rem] bg-zinc-950 border border-zinc-800 flex items-center justify-center relative group">
             <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <div className="text-center space-y-4 relative z-10">
                <Rocket className="w-16 h-16 text-purple-500 mx-auto mb-6 animate-bounce" />
                 <h3 className="text-3xl font-black tracking-tighter">⚡ DEMAND ENGINE + DAO GOVERNANCE</h3>
                 <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Narrativa Dual Automática • GAC Tracking • Governance Concentrator</p>
             </div>
          </div>
        </motion.div>

        {/* STATS SECTION */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-40">
          {[
            { label: 'Governance GAC', value: 'Tracker' },
            { label: 'Time to First DAO', value: '< 2m' },
            { label: 'Narrative Accuracy', value: '98%' },
            { label: 'Conversion Lift', value: '+45%' },
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
              tier="GGE: CORE"
              title="DAO Monitor"
              price="$300"
              description="La base para cualquier protocolo serio. Métricas on-chain y atribución básica de miembros."
              accentColor="purple"
              icon={Zap}
              onCTA={() => openConversion('CORE: DAO Monitor')}
              features={[
                'DAO Metrics Dashboard',
                'Poder de Voto (Real)',
                'Miembros Únicos Tracker',
                'Atribución Básica',
                'Setup Asistido',
                'Soporte Estándar'
              ]}
            />
            
            <TierCard 
              tier="GGE: PRO"
              title="Growth Optimizer"
              price="$599"
              popular={true}
              description="Atribución avanzada y tracking de GAC para optimizar la toma de poder."
              accentColor="emerald"
              icon={Rocket}
              onCTA={() => openConversion('PRO: Growth Optimizer')}
              features={[
                'Governance Attribution',
                'GAC (Governance Acq Cost)',
                'Campaign Influence Score',
                'Treasury Intelligence',
                'Educación IA Automática',
                'Prioridad en Soporte'
              ]}
            />
            
            <TierCard 
              tier="GGE: ELITE"
              title="Strategic Fortress"
              price="Rev Share"
              description="Protección total y optimización automática del crecimiento de gobernanza."
              accentColor="indigo"
              icon={Key}
              onCTA={() => openConversion('ELITE: Strategic Fortress')}
              features={[
                'Alertas de Centralización',
                'Anti-Manipulation Model',
                'Auto-Optimization Loop',
                'SBT Reputation Layer',
                'Partner Global Listing',
                'Consejería Estratégica'
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
            <h4 className="text-3xl font-black tracking-tight">Multitenant Hub</h4>
            <p className="text-zinc-500 leading-relaxed font-bold uppercase text-xs tracking-wide">Gestiona múltiples protocolos desde una sola infraestructura, separando audiencias de forma soberana.</p>
          </div>
          <div className="space-y-6 group">
            <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-8 group-hover:rotate-12 transition-transform">
              <Target className="w-8 h-8 text-emerald-400" />
            </div>
            <h4 className="text-3xl font-black tracking-tight">Lead Intelligence</h4>
            <p className="text-zinc-500 leading-relaxed font-bold uppercase text-xs tracking-wide">Resolución de identidad digital (Fingerprint + Wallet) para saber exactamente quién es tu audiencia.</p>
          </div>
          <div className="space-y-6 group">
            <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-8 group-hover:rotate-12 transition-transform">
              <Users className="w-8 h-8 text-indigo-400" />
            </div>
            <h4 className="text-3xl font-black tracking-tight">Protocol Loyalty</h4>
            <p className="text-zinc-500 leading-relaxed font-bold uppercase text-xs tracking-wide">Crea incentivos reales con nuestro motor de cupones y reputación on-chain intransferible.</p>
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
            Pide tu Setup ahora
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
