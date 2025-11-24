'use client';

import { useState } from 'react';
import type { ReactNode } from "react";
import type { UserData } from "@/types/admin";
import { UsersTable } from "./UsersTable";
import WhatsAppLeadsTab from './WhatsAppLeadsTab';
import ShortlinksSubTab from './ShortlinksSubTab';
import NewsletterSubTab from './NewsletterSubTab';

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
}

export function AdminTabs({ swaps, users, children, showSettings = false, showUsers = false, showShortlinks = false, showMarketing = false }: AdminTabsProps) {
  const [activeTab, setActiveTab] = useState('projects');
  const [activeMarketingSubTab, setActiveMarketingSubTab] = useState<'wa-leads' | 'shortlinks' | 'newsletter' | 'campaigns'>('wa-leads');

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

      {activeTab === 'marketing' && showMarketing && (
        <div>
          <h2 className="text-xl font-bold mb-4 text-white">📈 Marketing Hub</h2>

          {/* Sub-tabs para diferentes secciones de marketing */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-4 border-b border-zinc-700 pb-2">
              <button
                onClick={() => setActiveMarketingSubTab('wa-leads')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeMarketingSubTab === 'wa-leads'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                }`}
              >
                💬 WA Leads
              </button>
              <button
                onClick={() => setActiveMarketingSubTab('shortlinks')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeMarketingSubTab === 'shortlinks'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                }`}
              >
                🔗 Shortlinks
              </button>
              <button
                onClick={() => setActiveMarketingSubTab('newsletter')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeMarketingSubTab === 'newsletter'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                }`}
              >
                📧 Newsletter Analytics
              </button>
              <button
                onClick={() => setActiveMarketingSubTab('campaigns')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  activeMarketingSubTab === 'campaigns'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                }`}
                disabled
              >
                🎯 Campaigns (Próximamente)
              </button>
            </div>
          </div>

          {/* Contenido dinámico según sub-tab activa */}
          {activeMarketingSubTab === 'wa-leads' && <WhatsAppLeadsTab />}
          {activeMarketingSubTab === 'shortlinks' && <ShortlinksSubTab />}
          {activeMarketingSubTab === 'newsletter' && <NewsletterSubTab />}
          {activeMarketingSubTab === 'campaigns' && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-lg font-medium mb-2">Campaign Management</h3>
              <p className="text-zinc-500">Sistema de campañas de marketing próximamente...</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'shortlinks' && showShortlinks && children[2]}

      {activeTab === 'settings' && showSettings && children[1]}
    </>
  );
}
