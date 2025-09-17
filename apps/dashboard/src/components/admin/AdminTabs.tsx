'use client';

import { useState } from 'react';

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
  children: React.ReactNode; // Para el contenido de la pestaña de proyectos
}

export function AdminTabs({ swaps, children }: AdminTabsProps) {
  const [activeTab, setActiveTab] = useState('projects');

  const totalVolume = swaps.reduce((a, s) => a + (s.status === 'success' ? s.fromAmountUsd : 0), 0);
  const totalFees = swaps.reduce((a, s) => a + (s.status === 'success' ? s.feeUsd : 0), 0);
  const feeWallet = process.env.NEXT_PUBLIC_SWAP_FEE_WALLET ?? "N/A";

  return (
    <>
      <div className="border-b border-zinc-700 mb-6">
        <nav className="flex space-x-4">
          <button onClick={() => setActiveTab('projects')} className={`pb-2 font-semibold ${activeTab === 'projects' ? 'text-lime-400 border-b-2 border-lime-400' : 'text-gray-400'}`}>
            Proyectos
          </button>
          <button onClick={() => setActiveTab('swaps')} className={`pb-2 font-semibold ${activeTab === 'swaps' ? 'text-lime-400 border-b-2 border-lime-400' : 'text-gray-400'}`}>
            Swaps
          </button>
        </nav>
      </div>

      {activeTab === 'projects' && children}

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
    </>
  );
}