'use client';

import React from 'react';
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TierCard = ({ 
  tier, 
  title, 
  price, 
  description, 
  features, 
  accentColor, 
  icon: Icon,
  popular = false 
}: { 
  tier: string, 
  title: string, 
  price: string, 
  description: string, 
  features: string[], 
  accentColor: string,
  icon: any,
  popular?: boolean
}) => (
  <motion.div 
    whileHover={{ y: -10 }}
    className={`relative p-8 rounded-3xl border ${popular ? `border-${accentColor}-500/50 bg-${accentColor}-500/5` : 'border-zinc-800 bg-zinc-900/50'} backdrop-blur-xl flex flex-col h-full shadow-2xl transition-all duration-300`}
  >
    {popular && (
      <div className={`absolute -top-4 left-1/2 -translate-x-1/2 bg-${accentColor}-500 text-black font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-${accentColor}-500/50 z-20`}>
        Más Popular
      </div>
    )}
    
    <div className="flex items-center gap-4 mb-6">
      <div className={`p-3 rounded-2xl bg-${accentColor}-500/20 text-${accentColor}-400 border border-${accentColor}-500/30`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <Badge variant="outline" className={`bg-${accentColor}-500/10 text-${accentColor}-400 border-${accentColor}-500/20 uppercase text-[10px] font-bold`}>
          {tier}
        </Badge>
        <h3 className="text-2xl font-black text-white mt-1">{title}</h3>
      </div>
    </div>

    <div className="mb-6">
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-black text-white">{price}</span>
        {price !== 'Free' && <span className="text-zinc-500 text-sm">/ mes</span>}
      </div>
      <p className="text-zinc-400 text-sm mt-3 leading-relaxed">
        {description}
      </p>
    </div>

    <div className="space-y-4 mb-8 flex-1">
      {features.map((feature, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={`flex-shrink-0 w-5 h-5 rounded-full bg-${accentColor}-500/10 flex items-center justify-center`}>
            <ShieldCheck className={`w-3 h-3 text-${accentColor}-400`} />
          </div>
          <span className="text-zinc-300 text-sm font-medium">{feature}</span>
        </div>
      ))}
    </div>

    <Button className={`w-full h-12 rounded-2xl font-bold bg-white text-black hover:bg-zinc-200 border-none transition-all group`}>
      {price === 'Free' ? 'Empezar Gratis' : 'Contactar Ventas'}
      <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </Button>
  </motion.div>
);

export default function GrowthOSLanding() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500 selection:text-white overflow-hidden">
      {/* Abstract Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-600/20 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Navigation - Minimal */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-6 w-full max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
            <span className="text-black font-black text-xl italic">P</span>
          </div>
          <span className="font-black text-xl tracking-tighter uppercase italic">Pandora's <span className="text-zinc-500">Growth OS</span></span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/admin" className="text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors">Admin Dashboard</Link>
          <Button variant="outline" className="rounded-full border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-all text-xs font-black uppercase overflow-hidden relative group">
            <span className="relative z-10">Conectar Wallet</span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </Button>
        </div>
      </nav>

      <main className="relative z-10 w-full max-w-7xl mx-auto px-8 py-20 lg:py-32">
        {/* HERO SECTION */}
        <div className="text-center max-w-4xl mx-auto mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-gradient-to-r from-purple-500/20 to-emerald-500/20 text-white border-zinc-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8">
              Protocol Growth Partner
            </Badge>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.95] mb-8">
              DE VISITAS &rarr; A <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-zinc-100 to-emerald-400">
                INVERSORES
              </span>
              <br/> EN AUTOMÁTICO
            </h1>
            <p className="text-xl md:text-2xl text-zinc-400 font-medium leading-relaxed max-w-2xl mx-auto mb-12">
              Convierte tráfico anónimo en usuarios listos para invertir. La infraestructura definitiva de captación y cierre para protocolos Web3.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="h-16 px-10 rounded-2xl bg-white text-black font-black text-lg hover:bg-zinc-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                Empezar Ahora
              </Button>
              <Button size="lg" variant="ghost" className="h-16 px-10 rounded-2xl text-white font-bold text-lg hover:bg-white/5 transition-all">
                Ver Documentación
              </Button>
            </div>
          </motion.div>
        </div>

        {/* STATS SECTION */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-40">
          {[
            { label: 'Leads Capturados', value: '1M+' },
            { label: 'Protocolos Activos', value: '50+' },
            { label: 'Cursos Generados', value: '5k+' },
            { label: 'Retención Media', value: '85%' },
          ].map((stat, i) => (
            <div key={i} className="text-center p-8 rounded-3xl border border-zinc-800/50 bg-zinc-900/20 backdrop-blur-sm">
              <div className="text-4xl font-black text-white mb-2">{stat.value}</div>
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* PACKAGES SECTION */}
        <div className="mb-40">
          <div className="text-center mb-16 px-4">
            <h2 className="text-4xl md:text-5xl font-black mb-4">Planes Diseñados para Crecer</h2>
            <p className="text-zinc-500 font-medium text-lg">De la captura básica a la identidad digital soberana.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            <TierCard 
              tier="Fase 1: HOOK"
              title="Setup & Leads"
              price="$300"
              description="Te implementamos el sistema y te generamos tus primeros leads cualificados."
              accentColor="purple"
              icon={Zap}
              features={[
                'Setup Asistido White-label',
                'Primeros Leads Cualificados',
                'Captura con IA Inteligente',
                'Branding Personalizado',
                'Dashboard de Resultados',
                'Configuración Multi-tenant'
              ]}
            />
            
            <TierCard 
              tier="Fase 2: GROWTH"
              title="Scale (SaaS)"
              price="$199"
              popular={true}
              description="Nurturing automático y gestión de audiencia para escala masiva."
              accentColor="emerald"
              icon={Rocket}
              features={[
                'Educación IA 24/7 (Cursos)',
                'Newsletter Automation',
                'Shortlinks Tracking PRO',
                'Discord Webhooks Expert',
                'Atribución de Conversión',
                'API Keys con Scopes'
              ]}
            />

            <TierCard 
              tier="Fase 3: IDENTITY"
              title="Partner (VIP)"
              price="Rev Share"
              description="Nos convertimos en tu infraestructura crítica. Cobramos por éxito."
              accentColor="indigo"
              icon={Key}
              features={[
                'SBT Identity & Reputation',
                'WhatsApp & Telegram Bridge',
                'Smart QRs Dinámicos',
                'Revenue Tracking System',
                'Campañas Omni-canal',
                'Partner Global Listing'
              ]}
            />
          </div>
        </div>

        {/* FEATURES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-40">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
              <Globe className="w-6 h-6 text-purple-400" />
            </div>
            <h4 className="text-2xl font-black">Multitenant Hub</h4>
            <p className="text-zinc-500 leading-relaxed font-medium">Gestiona múltiples protocolos desde una sola infraestructura, separando audiencias de forma soberana.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
              <Target className="w-6 h-6 text-emerald-400" />
            </div>
            <h4 className="text-2xl font-black">Lead Intelligence</h4>
            <p className="text-zinc-500 leading-relaxed font-medium">Resolución de identidad digital (Fingerprint + Wallet) para saber exactamente quién es tu audiencia.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
              <Users className="w-6 h-6 text-indigo-400" />
            </div>
            <h4 className="text-2xl font-black">Protocol Loyalty</h4>
            <p className="text-zinc-500 leading-relaxed font-medium">Crea incentivos reales con nuestro motor de cupones y reputación on-chain intransferible.</p>
          </div>
        </div>

        {/* FOOTER CTA */}
        <div className="rounded-[40px] bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-12 lg:p-24 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px]"></div>
          <h2 className="text-4xl lg:text-6xl font-black mb-8 relative z-10">¿LISTO PARA CONVERTIR <br/> TRÁFICO EN DINERO?</h2>
          <Button size="lg" className="h-16 px-12 rounded-2xl bg-emerald-500 text-black font-black text-xl hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 relative z-10">
            Pide tu Setup ahora
          </Button>
          <p className="text-zinc-600 font-bold uppercase tracking-widest text-[10px] mt-8 relative z-10">© 2026 PANDORA'S GROWTH PARTNER SYSTEM</p>
        </div>
      </main>

      {/* Global CSS for some effects */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');
        body {
          font-family: 'Outfit', sans-serif;
        }
      `}</style>
    </div>
  );
}
