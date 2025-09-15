'use client';

import { useActiveAccount } from "thirdweb/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@saasfly/ui/button";

const ADMIN_WALLET = "0x00c9f7EE6d1808C09B61E561Af6c787060BFE7C9".toLowerCase();

// --- MOCK DATA ---
// En una app real, esto vendría de tu API/backend (Neon DB).
const MOCK_PROJECTS = [
    { id: 'proj_1', slug: 'hemp-genesis', title: 'Hemp Genesis', status: 'live', raisedAmount: 75000 },
    { id: 'proj_2', slug: 'ra-wallet', title: 'RA Wallet', status: 'live', raisedAmount: 150000 },
    { id: 'proj_3', slug: 'mining-corp', title: 'Mining Corp', status: 'pending', raisedAmount: 0 },
];

const MOCK_SWAPS = [
    { txHash: '0x123...', from: '0xabc...', toToken: 'ETH', fromAmountUsd: 150.50, feeUsd: 0.75, status: 'success' },
    { txHash: '0x456...', from: '0xdef...', toToken: 'USDC', fromAmountUsd: 300.00, feeUsd: 1.50, status: 'success' },
    { txHash: '0x789...', from: '0xghi...', toToken: 'WETH', fromAmountUsd: 50.00, feeUsd: 0.25, status: 'failed' },
];

function useAdminSwaps(wallet: string | undefined) {
    // Simula una llamada a la API. Reemplaza esto con tu fetch real.
    // En un caso real, aquí harías un fetch a tu backend.
    const data = useMemo(() => {
        if (wallet && wallet.toLowerCase() === ADMIN_WALLET) {
            return { swaps: MOCK_SWAPS, projects: MOCK_PROJECTS };
        }
        return { swaps: [], projects: [] };
    }, [wallet]);

  return data;
}

export default function AdminDashboardPage() {
  const account = useActiveAccount();
  const { swaps, projects } = useAdminSwaps(account?.address);
  const [activeTab, setActiveTab] = useState('projects');

  if (account?.address.toLowerCase() !== ADMIN_WALLET) {
    return (
        <div className="flex items-center justify-center min-h-[70vh]">
            <div className="text-center p-8 bg-zinc-900 rounded-lg">
                <h2 className="text-2xl font-bold text-red-500">Acceso Denegado</h2>
                <p className="text-gray-400 mt-2">Esta página es solo para administradores.</p>
            </div>
        </div>
    );
  }

  const totalVolume = swaps.reduce((a, s) => a + (s.status === 'success' ? s.fromAmountUsd : 0), 0);
  const totalFees = swaps.reduce((a, s) => a + (s.status === 'success' ? s.feeUsd : 0), 0);
  const feeWallet = process.env.NEXT_PUBLIC_SWAP_FEE_WALLET ?? "N/A";

  return (
    <section className="py-12 md:py-24">
        <div className="bg-zinc-900/80 rounded-2xl p-6 md:p-8 max-w-5xl mx-auto border border-lime-400/20">
            <h1 className="text-3xl font-bold mb-6 text-lime-400">
                Panel de Administración
            </h1>
            
            {/* Pestañas */}
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

            {/* Contenido de Pestañas */}
            {activeTab === 'projects' && (
                <div>
                    <h2 className="text-xl font-bold mb-4 text-white">Gestión de Proyectos</h2>
                    <div className="max-h-[400px] overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-lime-200 border-b border-lime-800">
                                    <th className="py-2 text-left">Proyecto</th>
                                    <th className="py-2 text-left">Estado</th>
                                    <th className="py-2 text-right">Recaudado (USD)</th>
                                    <th className="py-2 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.map((p) => (
                                <tr key={p.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                                    <td className="py-3 font-semibold">{p.title}</td>
                                    <td>
                                        <span className={`px-2 py-1 text-xs rounded-full ${p.status === 'live' ? 'bg-green-800 text-green-200' : 'bg-yellow-800 text-yellow-200'}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="text-right font-mono">${p.raisedAmount.toLocaleString()}</td>
                                    <td className="py-2 text-right">
                                        <Link href={`/projects/${p.slug}`} passHref>
                                            <Button variant="outline" size="sm" className="mr-2 border-zinc-600">Ver</Button>
                                        </Link>
                                        <Button variant="secondary" size="sm">Editar</Button>
                                    </td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'swaps' && (
                 <div>
                    <h2 className="text-xl font-bold mb-4 text-white">
                        Estadísticas de Swaps
                    </h2>
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
                            <p className="text-3xl font-bold">${totalFees.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                            <span className="text-sm text-gray-400">Comisiones Recaudadas</span>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <p className="text-xs text-lime-200 break-all">
                                Fee wallet: <br /> {feeWallet}
                            </p>
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
                                    <td className="py-2">
                                        <a href={`/`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                            {s.txHash.slice(0, 8)}...{s.txHash.slice(-6)}
                                        </a>
                                    </td>
                                    <td className="text-[11px]">{s.from.slice(0, 6)}...{s.from.slice(-4)}</td>
                                    <td className="text-center">{s.toToken}</td>
                                    <td className="text-right">${s.fromAmountUsd.toLocaleString()}</td>
                                    <td className="text-right">${s.feeUsd.toFixed(4)}</td>
                                    <td className={`text-right font-bold ${s.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                                        {s.status}
                                    </td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    </section>
  );
}
