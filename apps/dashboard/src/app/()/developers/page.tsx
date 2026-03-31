'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Code2, 
  Terminal, 
  Copy, 
  Check, 
  Cpu, 
  Globe, 
  Zap, 
  Lock, 
  BarChart3, 
  Layers, 
  MessageSquare, 
  Coins,
  Puzzle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getDashboardDomain } from '@/lib/utils';

export default function DevelopersPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const widgetSnippet = `<script 
  src="https://${getDashboardDomain()}/api/widget/v1.js" 
  data-project-id="YOUR_PROJECT_SLUG" 
  data-api-key="pk_grow_live_..."
  defer
></script>`;

  const apiSnippet = `// Register a lead via JS API
const res = await window.PandorasGrowth.registerLead({
  email: 'user@example.com',
  name: 'John Doe',
  whatsapp: '+1234567890', // Automatically routes to CRM phone
  intent: 'whitelist',
  metadata: {
    tags: ['FULL_UNIT'] // E.g. FULL_UNIT triggers bypass & VIP alert
  }
});`;

  const roadmapItems = [
    {
      title: 'Pandoras Auth SDK',
      version: 'v1.8',
      description: 'Unified Social & Wallet login with automatic session bridging and KYC ready.',
      icon: <Lock className="w-6 h-6 text-indigo-400" />,
      status: 'In Development',
      color: 'indigo'
    },
    {
      title: 'Gamification API',
      version: 'v2.0',
      description: 'Levels, XP, and Achievements as a Service for any protocol or community.',
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      status: 'Planned',
      color: 'yellow'
    },
    {
      title: 'Token Creator & Minting',
      version: 'v2.2',
      description: 'Deploy ERC-20, ERC-721, or ERC-1155 directly from the dashboard.',
      icon: <Coins className="w-6 h-6 text-emerald-400" />,
      status: 'Research',
      color: 'emerald'
    },
    {
      title: 'NFT Passes & Gate Keeper',
      version: 'v2.5',
      description: 'Gated content, utility layers, and dynamic NFT management for VIP tiers.',
      icon: <Layers className="w-6 h-6 text-purple-400" />,
      status: 'Next Year',
      color: 'purple'
    },
    {
      title: 'Discord & Telegram Webhooks',
      version: 'v2.8',
      description: 'Protocol-level automations and real-time community alerts for every action.',
      icon: <MessageSquare className="w-6 h-6 text-blue-400" />,
      status: 'Planned',
      color: 'blue'
    },
    {
      title: 'Growth CRM & Marketing Hub',
      version: 'v3.2',
      description: 'Unified dashboard for automated user journey mapping and high-intent alerts.',
      icon: <BarChart3 className="w-6 h-6 text-pink-400" />,
      status: 'Research',
      color: 'pink'
    },
    {
      title: 'Agenda Soberana',
      version: 'v3.0',
      description: 'Decentralized governance, sovereign scheduling, and DAO tools.',
      icon: <Globe className="w-6 h-6 text-sky-400" />,
      status: 'Long Term',
      color: 'sky'
    }
  ];

  return (
    <div className="relative min-h-screen bg-zinc-950/50">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="container relative max-w-6xl py-12 space-y-16">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6 text-center md:text-left"
        >
          <div className="inline-flex items-center px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest border rounded-full bg-zinc-900/80 border-white/10 text-indigo-400 backdrop-blur-md">
            <Terminal className="w-3.5 h-3.5 mr-2" />
            Developer ecosystem & Hub
          </div>
          <h1 className="text-5xl font-black tracking-tight md:text-6xl lg:text-7xl">
            <span className="text-white">Build for</span> <br />
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Hyper Growth.
            </span>
          </h1>
          <p className="max-w-2xl text-xl text-zinc-400 font-light leading-relaxed">
            Integra la infraestructura definitiva de Pandoras. Captación de leads, gamificación profunda y automatización Web3 en un solo hub centralizado.
          </p>
          <div className="flex flex-wrap justify-center gap-4 md:justify-start pt-4">
            <Button className="bg-white text-black hover:bg-zinc-200 h-12 px-8 rounded-xl font-bold transition-all hover:scale-105 active:scale-95">
              Start Building
            </Button>
            <Button variant="outline" className="border-zinc-800 bg-zinc-900/50 h-12 px-8 rounded-xl font-bold backdrop-blur-sm transition-all hover:border-zinc-500">
              Technical Documentation
            </Button>
          </div>
        </motion.div>

        {/* Dynamic Features Tabs */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold text-white">SDK & Integrations</h2>
              <p className="text-zinc-500">Snippets de alta performance para tu stack técnico.</p>
            </div>
            <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-zinc-600 bg-zinc-900/50 px-3 py-1 rounded-lg border border-zinc-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              API STATUS: OPERATIONAL
            </div>
          </div>
          
          <Card className="border-white/5 bg-zinc-900/40 backdrop-blur-xl shadow-2xl overflow-hidden rounded-3xl">
            <div className="grid grid-cols-1 lg:grid-cols-5 min-h-[450px]">
              {/* Sidebar Tabs for Codes */}
              <div className="lg:col-span-1 border-b lg:border-b-0 lg:border-r border-white/5 p-4 bg-zinc-950/20">
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-bold text-zinc-600 mb-4 px-2">Growth OS v1.5</div>
                  <button 
                    onClick={() => setCopied('html-tab')}
                    className={`w-full flex items-center space-x-3 text-sm px-4 py-3 rounded-xl transition-all ${copied === 'html-tab' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                  >
                    <Globe className="w-4 h-4" />
                    <span>Widget Script</span>
                  </button>
                  <button 
                    onClick={() => setCopied('js-tab')}
                    className={`w-full flex items-center space-x-3 text-sm px-4 py-3 rounded-xl transition-all ${copied === 'js-tab' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                  >
                    <Puzzle className="w-4 h-4" />
                    <span>Advanced API</span>
                  </button>
                </div>
              </div>

              {/* Code Display Area */}
              <div className="lg:col-span-4 p-0 bg-zinc-950/40 relative group">
                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="bg-zinc-800 hover:bg-zinc-700 text-xs rounded-lg h-8"
                    onClick={() => handleCopy(copied === 'js-tab' ? apiSnippet : widgetSnippet, 'code')}
                  >
                    {copied === 'code' ? (
                      <><Check className="w-3 h-3 mr-2 text-emerald-400" /> Copied</>
                    ) : (
                      <><Copy className="w-3 h-3 mr-2" /> Copy Code</>
                    )}
                  </Button>
                </div>
                
                <div className="p-8 font-mono text-sm overflow-auto max-h-[500px]">
                  {copied === 'js-tab' ? (
                    <pre className="space-y-1">
                      <div className="text-zinc-600">// Direct Lead Injection via window capability</div>
                      <div>
                        <span className="text-purple-400">const</span> <span className="text-blue-400">response</span> = <span className="text-purple-400">await</span> <span className="text-indigo-400">window</span>.<span className="text-indigo-300">PandorasGrowth</span>.<span className="text-emerald-400">registerLead</span>({'{'}
                      </div>
                      <div className="pl-6">
                        <span className="text-zinc-400">email</span>: <span className="text-emerald-300">'builder@example.com'</span>,
                      </div>
                      <div className="pl-6">
                        <span className="text-zinc-400">whatsapp</span>: <span className="text-emerald-300">'+1234567890'</span>, <span className="text-zinc-600">// Native routing</span>
                      </div>
                      <div className="pl-6">
                        <span className="text-zinc-400">intent</span>: <span className="text-emerald-300">'whitelisting'</span>,
                      </div>
                      <div className="pl-6">
                        <span className="text-zinc-400">metadata</span>: {'{'} tags: [<span className="text-emerald-300">'FULL_UNIT'</span>] {'}'} <span className="text-zinc-600">// Triggers VIP Bypass</span>
                      </div>
                      <div>{'}'});</div>
                    </pre>
                  ) : (
                    <pre className="space-y-1">
                      <div className="text-zinc-600">&lt;!-- Drop this in your &lt;body&gt; --&gt;</div>
                      <div>
                        <span className="text-zinc-400">&lt;</span><span className="text-blue-400">script</span>
                      </div>
                      <div className="pl-6">
                        <span className="text-indigo-400">src</span>=<span className="text-emerald-300">"https://${getDashboardDomain()}/api/widget/v1.js"</span>
                      </div>
                      <div className="pl-6">
                        <span className="text-indigo-400">data-project-id</span>=<span className="text-emerald-300">"narai"</span>
                      </div>
                      <div className="pl-6">
                        <span className="text-indigo-400">data-api-key</span>=<span className="text-emerald-300">"pk_grow_live_..."</span>
                      </div>
                      <div className="pl-6">
                        <span className="text-indigo-400">data-theme</span>=<span className="text-emerald-300">"dark"</span>
                      </div>
                      <div>
                        <span className="text-zinc-400">&gt;&lt;/</span><span className="text-blue-400">script</span><span className="text-zinc-400">&gt;</span>
                      </div>
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Roadmap Timeline */}
        <section className="space-y-12 pt-10">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-white italic">ECOSYSTEM ROADMAP</h2>
            <div className="h-1 w-24 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full" />
            <p className="text-zinc-500 max-w-xl mx-auto">Nuestro compromiso con los desarrolladores: Crear las herramientas que tu protocolo necesita para ser masivo.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {roadmapItems.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative"
              >
                <div className={`absolute -inset-0.5 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500`} />
                <Card className="relative h-full transition-all border-white/5 bg-zinc-900/40 backdrop-blur-sm overflow-hidden rounded-3xl hover:border-white/10 shadow-lg">
                  <CardHeader className="p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div className="p-4 border border-white/5 rounded-2xl bg-zinc-950/50 shadow-inner group-hover:scale-110 transition-transform">
                        {item.icon}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="px-2.5 py-1 text-[9px] uppercase font-black tracking-widest rounded-lg border border-white/5 bg-zinc-950 text-indigo-400">
                          {item.version}
                        </span>
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold mb-3">{item.title}</CardTitle>
                    <CardDescription className="text-zinc-400 font-light leading-relaxed h-12 overflow-hidden">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-8 pb-8 pt-0">
                    <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 mr-2 rounded-full bg-zinc-700" />
                        {item.status}
                      </div>
                      <BarChart3 className="w-4 h-4 text-zinc-800" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Final CTA / Contact */}
        <section className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000" />
          <div className="relative p-10 md:p-16 border border-white/10 rounded-[40px] bg-zinc-950/80 backdrop-blur-3xl overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <Zap className="w-32 h-32 text-white/5 -rotate-12 translate-x-8 -translate-y-8" />
            </div>
            
            <div className="max-w-2xl space-y-6 relative z-10">
              <h3 className="text-3xl md:text-4xl font-bold text-white">¿Construyendo algo ambicioso?</h3>
              <p className="text-lg text-zinc-400 font-light">
                Nuestro equipo de **Core Engine** está aceptando socios beta para las nuevas APIs de Minting y Gobernanza. Únete al grupo de pioneros.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Button className="bg-indigo-600 hover:bg-indigo-700 h-12 px-10 rounded-2xl font-bold shadow-lg shadow-indigo-500/20">
                  Join Beta Access
                </Button>
                <Button variant="ghost" className="h-12 px-8 rounded-2xl font-bold text-zinc-400 hover:text-white hover:bg-white/5">
                  View Full API Changelog
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
