'use client';

import { useState } from 'react';
import type { ReactNode } from "react";
import type { UserData } from "@/types/admin";
import { UsersTable } from "./UsersTable";
import WhatsAppLeadsTab from './WhatsAppLeadsTab';
import ShortlinksSubTab from './ShortlinksSubTab';
import { NFTManager } from "./NFTManager";
import NewsletterSubTab from './NewsletterSubTab';
import { DiscordManager } from './DiscordManager';
import { MarketingDashboard } from './marketing/MarketingDashboard';
import { CalendarManager } from "./CalendarManager";
import { ClientsManager } from "./clients/ClientsManager";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings2, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation"; // Correct hook for client component
import { MarketingHelpModal } from "./marketing/MarketingHelpModal";
import { CreateCampaignModal } from "./marketing/CreateCampaignModal";
import { CreatePaymentLinkModal } from "./payments/CreatePaymentLinkModal";
import { toast } from "sonner";

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
  const [activeTab, setActiveTab] = useState('projects');
  const [activeMarketingSubTab, setActiveMarketingSubTab] = useState<'wa-leads' | 'shortlinks' | 'newsletter' | 'discord' | 'campaigns' | 'agenda'>('wa-leads');

  return (
    <>
      <div className="border-b border-zinc-700 mb-6">
        <nav className="flex space-x-4">
          <button onClick={() => setActiveTab('projects')} className={`pb-2 font-semibold ${activeTab === 'projects' ? 'text-lime-400 border-b-2 border-lime-400' : 'text-gray-400'}`}>
            Protocolos
          </button>
          <button onClick={() => setActiveTab('users')} className={`pb-2 font-semibold ${activeTab === 'users' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400'} flex items-center gap-2`}>
            Usuarios
          </button>
          <button onClick={() => setActiveTab('nft')} className={`pb-2 font-semibold ${activeTab === 'nft' ? 'text-lime-400 border-b-2 border-lime-400' : 'text-gray-400'} flex items-center gap-2`}>
            NFT Passes
          </button>
          <button onClick={() => setActiveTab('clients')} className={`pb-2 font-semibold ${activeTab === 'clients' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-400'} flex items-center gap-2`}>
            Clientes
          </button>

          {showMarketing && (
            <button onClick={() => setActiveTab('marketing')} className={`pb-2 font-semibold ${activeTab === 'marketing' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'} flex items-center gap-2`}>
              Marketing
            </button>
          )}
          {showSettings && (
            <button onClick={() => setActiveTab('settings')} className={`pb-2 font-semibold ${activeTab === 'settings' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-400'}`}>
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

          {/* Sub-tabs para diferentes secciones de marketing */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-4 border-b border-zinc-700 pb-2">
              <button
                onClick={() => setActiveMarketingSubTab('wa-leads')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeMarketingSubTab === 'wa-leads'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                  }`}
              >
                💬 WA Leads
              </button>
              <button
                onClick={() => setActiveMarketingSubTab('shortlinks')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeMarketingSubTab === 'shortlinks'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                  }`}
              >
                🔗 Shortlinks
              </button>
              <button
                onClick={() => setActiveMarketingSubTab('newsletter')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeMarketingSubTab === 'newsletter'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                  }`}
              >
                📧 Newsletter Analytics
              </button>
              <button
                onClick={() => setActiveMarketingSubTab('discord')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeMarketingSubTab === 'discord'
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                  }`}
              >
                🎮 Discord
              </button>
              <button
                onClick={() => setActiveMarketingSubTab('campaigns')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeMarketingSubTab === 'campaigns'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                  }`}
              >
                🎯 Campaigns
              </button>
              <button
                onClick={() => setActiveMarketingSubTab('agenda')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeMarketingSubTab === 'agenda'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                  }`}
              >
                🗓️ Agenda
              </button>
            </div>
          </div>

          {/* Contenido dinámico según sub-tab activa */}
          {activeMarketingSubTab === 'wa-leads' && <WhatsAppLeadsTab />}
          {activeMarketingSubTab === 'shortlinks' && <ShortlinksSubTab />}
          {activeMarketingSubTab === 'newsletter' && <NewsletterSubTab />}
          {activeMarketingSubTab === 'discord' && <DiscordManager />}
          {activeMarketingSubTab === 'campaigns' && (
            <MarketingDashboard />
          )}
          {activeMarketingSubTab === 'agenda' && (
            // TODO: Pass real UserID here. For now utilizing a clear fallback or needing context.
            // We'll import CalendarManager dynamically to avoid heavy load if not used
            <div className="w-full">
              <CalendarManager userId="FIXME_CURRENT_USER_ID" />
            </div>
          )}
        </div>
      )}

      {activeTab === 'shortlinks' && showShortlinks && children[2]}

      {activeTab === 'settings' && showSettings && children[1]}
    </>
  );
}
