'use client';

import { useCallback } from 'react';
import type { ReactNode } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import type { UserData } from "@/types/admin";
import { UsersTable } from "./UsersTable";
import WhatsAppLeadsTab from './WhatsAppLeadsTab';
import ShortlinksSubTab from './ShortlinksSubTab';
import { NFTManager } from "./NFTManager";
import NewsletterSubTab from './NewsletterSubTab';
import GrowthOSSubTab from './GrowthOSSubTab';
import { DiscordManager } from './DiscordManager';
import { MarketingDashboard } from './marketing/MarketingDashboard';
import { CalendarManager } from "./CalendarManager";
import { ClientsManager } from "./clients/ClientsManager";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings2, CreditCard } from "lucide-react";
import { MarketingHelpModal } from "./marketing/MarketingHelpModal";
import { CreateCampaignModal } from "./marketing/CreateCampaignModal";
import { CreatePaymentLinkModal } from "./payments/CreatePaymentLinkModal";
import { toast } from "sonner";
import { PaymentsDashboard } from "./payments/PaymentsDashboard";
import { CoursesAdminPanel } from "./CoursesAdminPanel";

interface Swap {
  txHash: string;
  from: string;
  toToken: string;
  fromAmountUsd: number;
  feeUsd: number;
  status: string;
};

interface AdminTabsProps {
  swaps: Swap[];
  users?: UserData[];
  children: ReactNode[]; // Ahora espera un array de nodos
  showSettings?: boolean;
  showUsers?: boolean;
  showShortlinks?: boolean;
  showMarketing?: boolean;
  currentUserId?: string; // ID of the logged-in admin
}

export function AdminTabs({ swaps, users, children, showSettings = false, showUsers = false, showShortlinks = false, showMarketing = false, currentUserId }: AdminTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'projects';
  const activeMarketingSubTab = (searchParams.get('sub') ?? 'wa-leads') as 'wa-leads' | 'shortlinks' | 'newsletter' | 'discord' | 'campaigns' | 'agenda' | 'pay' | 'cursos' | 'growth-os';

  const setTab = useCallback((tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    params.delete('sub'); // reset sub-tab when main tab changes
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const setSubTab = useCallback((sub: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sub', sub);
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  return (
    <>
      <div className="border-b border-zinc-700 mb-6">
        <nav className="flex space-x-4">
          <button onClick={() => setTab('projects')} className={`pb-2 font-semibold ${activeTab === 'projects' ? 'text-lime-400 border-b-2 border-lime-400' : 'text-gray-400'}`}>
            Protocolos
          </button>
          <button onClick={() => setTab('users')} className={`pb-2 font-semibold ${activeTab === 'users' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400'} flex items-center gap-2`}>
            Usuarios
          </button>
          <button onClick={() => setTab('nft')} className={`pb-2 font-semibold ${activeTab === 'nft' ? 'text-lime-400 border-b-2 border-lime-400' : 'text-gray-400'} flex items-center gap-2`}>
            NFT Lab
          </button>
          <button onClick={() => setTab('clients')} className={`pb-2 font-semibold ${activeTab === 'clients' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-400'} flex items-center gap-2`}>
            Clientes
          </button>

          {showMarketing && (
            <button onClick={() => setTab('marketing')} className={`pb-2 font-semibold ${activeTab === 'marketing' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'} flex items-center gap-2`}>
              Marketing
            </button>
          )}
          {showSettings && (
            <button onClick={() => setTab('settings')} className={`pb-2 font-semibold ${activeTab === 'settings' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-400'}`}>
              Config
            </button>
          )}
        </nav>
      </div>

      {activeTab === 'projects' && children[0]}

      {activeTab === 'users' && showUsers && users && (
        <UsersTable users={users} />
      )}

      {activeTab === 'nft' && (
        <NFTManager />
      )}

      {activeTab === 'clients' && (
        <ClientsManager />
      )}

      {activeTab === 'marketing' && showMarketing && (
        <div className="animate-in fade-in duration-500">
          <div className="flex justify-between items-center mb-6 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 backdrop-blur-sm">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                💎 Marketing Hub
                <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">Active Suite</Badge>
              </h2>
              <p className="text-zinc-500 text-sm">Gestiona campañas, leads y flujos de conversión de forma soberana.</p>
            </div>
            <div className="flex gap-2">
              <MarketingHelpModal />
              <CreateCampaignModal />
              <CreatePaymentLinkModal />
            </div>
          </div>

          {/* Sub-tabs Redesign: Modern Grid Navigation */}
          <div className="mb-10">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
              {[
                { id: 'wa-leads', label: 'WA Leads', icon: '💬', color: 'text-green-400', active: 'bg-green-500/10 border-green-500/30 text-green-400 shadow-green-500/5', glow: 'bg-green-500/5', dot: 'bg-green-400' },
                { id: 'pay', label: 'Pay & Finance', icon: '💸', color: 'text-emerald-400', active: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/5', glow: 'bg-emerald-500/5', dot: 'bg-emerald-400' },
                { id: 'shortlinks', label: 'Shortlinks', icon: '🔗', color: 'text-blue-400', active: 'bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-blue-500/5', glow: 'bg-blue-500/5', dot: 'bg-blue-400' },
                { id: 'newsletter', label: 'Newsletter', icon: '📧', color: 'text-purple-400', active: 'bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-purple-500/5', glow: 'bg-purple-500/5', dot: 'bg-purple-400' },
                { id: 'growth-os', label: 'Growth OS', icon: '🚀', color: 'text-indigo-400', active: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-indigo-500/5', glow: 'bg-indigo-500/5', dot: 'bg-indigo-400', pulse: true },
                { id: 'discord', label: 'Discord', icon: '🎮', color: 'text-indigo-400', active: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-indigo-500/5', glow: 'bg-indigo-500/5', dot: 'bg-indigo-400' },
                { id: 'campaigns', label: 'Campaigns', icon: '🎯', color: 'text-orange-400', active: 'bg-orange-500/10 border-orange-500/30 text-orange-400 shadow-orange-500/5', glow: 'bg-orange-500/5', dot: 'bg-orange-400' },
                { id: 'agenda', label: 'Agenda', icon: '🗓️', color: 'text-rose-400', active: 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-rose-500/5', glow: 'bg-rose-500/5', dot: 'bg-rose-400' },
                { id: 'cursos', label: 'Cursos', icon: '📚', color: 'text-cyan-400', active: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-cyan-500/5', glow: 'bg-cyan-500/5', dot: 'bg-cyan-400' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSubTab(tab.id)}
                  className={`
                    relative group flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300
                    ${activeMarketingSubTab === tab.id 
                      ? `${tab.active}` 
                      : 'bg-zinc-900/30 border-zinc-800/50 text-zinc-500 hover:bg-zinc-800/50 hover:border-zinc-700 hover:text-zinc-300'
                    }
                    ${tab.pulse && activeMarketingSubTab === tab.id ? 'animate-pulse-subtle' : ''}
                  `}
                >
                  {/* Subtle Background Glow for Active State */}
                  {activeMarketingSubTab === tab.id && (
                    <div className={`absolute inset-0 ${tab.glow} blur-xl rounded-2xl -z-10 animate-in fade-in duration-500`} />
                  )}
                  
                  <span className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">{tab.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">{tab.label}</span>
                  
                  {/* Active Indicator Dot */}
                  {activeMarketingSubTab === tab.id && (
                    <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${tab.dot} shadow-[0_0_8px_rgba(255,255,255,0.2)]`} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Contenido dinámico según sub-tab activa */}
          {activeMarketingSubTab === 'wa-leads' && <WhatsAppLeadsTab />}
          {activeMarketingSubTab === 'pay' && <PaymentsDashboard />}
          {activeMarketingSubTab === 'shortlinks' && <ShortlinksSubTab />}
          {activeMarketingSubTab === 'newsletter' && <NewsletterSubTab />}
          {activeMarketingSubTab === 'growth-os' && <GrowthOSSubTab />}
          {activeMarketingSubTab === 'discord' && <DiscordManager />}
          {activeMarketingSubTab === 'campaigns' && (
            <MarketingDashboard />
          )}
          {activeMarketingSubTab === 'agenda' && (
            <div className="w-full">
              <CalendarManager userId="FIXME_CURRENT_USER_ID" />
            </div>
          )}
          {activeMarketingSubTab === 'cursos' && <CoursesAdminPanel />}
        </div>
      )}

      {activeTab === 'shortlinks' && showShortlinks && children[2]}

      {activeTab === 'settings' && showSettings && children[1]}
    </>
  );
}
