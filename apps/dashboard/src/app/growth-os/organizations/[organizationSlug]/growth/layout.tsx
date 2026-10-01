'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Compass, Target, BarChart2, GraduationCap } from 'lucide-react';

export default function GrowthLayout({ 
  children,
  params
}: { 
  children: React.ReactNode,
  params: any
}) {
  const pathname = usePathname();
  const router = useRouter();
  const slug = params?.organizationSlug || '';

  // Determine active tab based on pathname
  let activeTab = 'marketing';
  if (pathname.includes('/strategy')) activeTab = 'strategy';
  if (pathname.includes('/market-attack')) activeTab = 'market-attack';
  if (pathname.includes('/content')) activeTab = 'content';

  const navigateTo = (tab: string) => {
    router.push(`/growth-os/organizations/${slug}/growth/${tab}`);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white">
              Growth OS
            </h1>
            <p className="text-zinc-400 text-lg max-w-2xl mt-1">
              Estrategia, campañas y análisis de crecimiento de tu proyecto.
            </p>
        </div>
      </div>

      <div className="flex w-full mb-8 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex items-center gap-2 bg-[#09090D]/80 backdrop-blur-md border border-white/5 p-1.5 rounded-2xl shadow-xl shadow-black/40">
          <button
            onClick={() => navigateTo('marketing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === 'marketing'
                ? 'bg-purple-500/10 text-purple-400 shadow-[inset_0_0_0_1px_rgba(168,85,247,0.2)]'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
            }`}
          >
            <BarChart2 className={`w-4 h-4 ${activeTab === 'marketing' ? 'text-purple-400' : 'text-zinc-500'}`} />
            Dashboard
          </button>
          
          <button
            onClick={() => navigateTo('strategy')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === 'strategy'
                ? 'bg-blue-500/10 text-blue-400 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.2)]'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
            }`}
          >
            <Compass className={`w-4 h-4 ${activeTab === 'strategy' ? 'text-blue-400' : 'text-zinc-500'}`} />
            Strategy
          </button>

          <button
            onClick={() => navigateTo('market-attack')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === 'market-attack'
                ? 'bg-emerald-500/10 text-emerald-400 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.2)]'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
            }`}
          >
            <Target className={`w-4 h-4 ${activeTab === 'market-attack' ? 'text-emerald-400' : 'text-zinc-500'}`} />
            Campaigns
          </button>

          <button
            onClick={() => navigateTo('content')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === 'content'
                ? 'bg-rose-500/10 text-rose-400 shadow-[inset_0_0_0_1px_rgba(244,63,114,0.2)]'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
            }`}
          >
            <GraduationCap className={`w-4 h-4 ${activeTab === 'content' ? 'text-rose-400' : 'text-zinc-500'}`} />
            Academy
          </button>
        </div>
      </div>
      
      {/* Content wrapper */}
      <div className="mt-0">
          {children}
      </div>
    </div>
  );
}
