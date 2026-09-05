'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Fingerprint, MessageSquare, Plug, GitBranch } from 'lucide-react';

export default function AudienceLayout({ 
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
  let activeTab = 'identity';
  if (pathname.includes('/conversations')) activeTab = 'conversations';
  if (pathname.includes('/channels')) activeTab = 'channels';
  if (pathname.includes('/journeys')) activeTab = 'journeys';

  const navigateTo = (tab: string) => {
    router.push(`/portal/${slug}/audience/${tab}`);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white">
              Audience & Ops
            </h1>
            <p className="text-zinc-400 text-lg max-w-2xl mt-1">
              Gestiona identidades, interacciones, canales y journeys automatizados.
            </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={navigateTo} className="w-full">
        <TabsList className="bg-zinc-900 border border-white/10 p-1 mb-6 inline-flex overflow-x-auto max-w-full">
            <TabsTrigger value="identity" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400">
                <Fingerprint className="w-4 h-4 mr-2 shrink-0" />
                <span className="whitespace-nowrap">Identidades</span>
            </TabsTrigger>
            <TabsTrigger value="conversations" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400">
                <MessageSquare className="w-4 h-4 mr-2 shrink-0" />
                <span className="whitespace-nowrap">Inbox</span>
            </TabsTrigger>
            <TabsTrigger value="channels" className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400">
                <Plug className="w-4 h-4 mr-2 shrink-0" />
                <span className="whitespace-nowrap">Canales</span>
            </TabsTrigger>
            <TabsTrigger value="journeys" className="data-[state=active]:bg-rose-600/20 data-[state=active]:text-rose-400">
                <GitBranch className="w-4 h-4 mr-2 shrink-0" />
                <span className="whitespace-nowrap">Journeys</span>
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
