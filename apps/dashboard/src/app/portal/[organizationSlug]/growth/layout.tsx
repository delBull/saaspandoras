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
    router.push(`/portal/${slug}/growth/${tab}`);
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

      <Tabs value={activeTab} onValueChange={navigateTo} className="w-full">
        <TabsList className="bg-zinc-900 border border-white/10 p-1 mb-6 inline-flex overflow-x-auto max-w-full">
            <TabsTrigger value="marketing" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400">
                <BarChart2 className="w-4 h-4 mr-2 shrink-0" />
                <span className="whitespace-nowrap">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="strategy" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400">
                <Compass className="w-4 h-4 mr-2 shrink-0" />
                <span className="whitespace-nowrap">Strategy</span>
            </TabsTrigger>
            <TabsTrigger value="market-attack" className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400">
                <Target className="w-4 h-4 mr-2 shrink-0" />
                <span className="whitespace-nowrap">Campaigns</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-rose-600/20 data-[state=active]:text-rose-400">
                <GraduationCap className="w-4 h-4 mr-2 shrink-0" />
                <span className="whitespace-nowrap">Academy</span>
            </TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Content wrapper */}
      <div className="mt-0">
          {children}
      </div>
    </div>
  );
}
