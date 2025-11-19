'use client';

import { useState } from 'react';
import type { ReactNode } from "react";
import type { UserData } from "@/types/admin";
import { UsersTable } from "./UsersTable";
import WhatsAppLeadsTab from './WhatsAppLeadsTab';
import ShortlinksSubTab from './ShortlinksSubTab';

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

  const totalVolume = swaps.reduce((a, s) => a + (s.status === 'success' ? s.fromAmountUsd : 0), 0);
  const totalFees = swaps.reduce((a, s) => a + (s.status === 'success' ? s.feeUsd : 0), 0);
  const feeWallet = process.env.NEXT_PUBLIC_SWAP_FEE_WALLET ?? "N/A";

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
          <button onClick={() => setActiveTab('swaps')} className={`pb-2 font-semibold ${activeTab === 'swaps' ? 'text-lime-400 border-b-2 border-lime-400' : 'text-gray-400'}`}>
            Swaps
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

      {activeTab === 'swaps' && (
        <div>
          <h2 className="text-xl font-bold mb-4 text-white">Estadísticas de Swaps</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-8">
            <div>
              <p className="text-3xl font-bold">${totalVolume.toLocaleString()}</p>
              <span className="text-sm text-gray-400">Volumen Total</span>
            </div>
            <div>
              <p className="text-3xl font-bold">{swaps.filter(s => s.status === 'success').length}</p>
              <span className="text-sm text-gray-400">Nº Swaps Exitosos</span>
            </div>
            <div>
              <p className="text-3xl font-bold">${totalFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <span className="text-sm text-gray-400">Comisiones Recaudadas</span>
            </div>
            <div className="col-span-2 md:col-span-1">
              <p className="text-xs text-lime-200 break-all">Fee wallet: <br /> {feeWallet}</p>
            </div>
          </div>
          <div className="max-h-[350px] overflow-auto border-t border-gray-700 pt-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-lime-200 border-b border-lime-800">
                  <th className="py-1 text-left">TxHash</th>
                  <th className="py-1 text-left">Desde</th>
                  <th className="py-1">Hacia</th>
                  <th className="py-1 text-right">Monto (USD)</th>
                  <th className="py-1 text-right">Fee (USD)</th>
                  <th className="py-1 text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {swaps.map((s) => (
                  <tr key={s.txHash} className="border-b border-zinc-800 hover:bg-zinc-900">
                    <td className="py-2"><a href={`/`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{s.txHash.slice(0, 8)}...{s.txHash.slice(-6)}</a></td>
                    <td className="text-[11px]">{s.from.slice(0, 6)}...{s.from.slice(-4)}</td>
                    <td className="text-center">{s.toToken}</td>
                    <td className="text-right">${s.fromAmountUsd.toLocaleString()}</td>
                    <td className="text-right">${s.feeUsd.toFixed(4)}</td>
                    <td className={`text-right font-bold ${s.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>{s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
                className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  activeMarketingSubTab === 'newsletter'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                }`}
                disabled
              >
                📧 Newsletter (Próximamente)
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
          {activeMarketingSubTab === 'newsletter' && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="text-lg font-medium mb-2">Newsletter System</h3>
              <p className="text-zinc-500">Sistema de newsletters próximamente...</p>
            </div>
          )}
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
