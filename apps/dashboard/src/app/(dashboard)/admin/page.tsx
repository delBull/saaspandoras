'use client';

import { useActiveAccount } from "thirdweb/react";
import { useEffect, useState } from "react";

const ADMIN_WALLET = "0x00c9f7EE6d1808C09B61E561Af6c787060BFE7C9".toLowerCase();

// Mock de datos de swaps. En una app real, esto vendría de tu API/backend.
const MOCK_SWAPS = [
    { txHash: '0x123...', from: '0xabc...', toToken: 'ETH', fromAmountUsd: 150.50, feeUsd: 0.75, status: 'success' },
    { txHash: '0x456...', from: '0xdef...', toToken: 'USDC', fromAmountUsd: 300.00, feeUsd: 1.50, status: 'success' },
    { txHash: '0x789...', from: '0xghi...', toToken: 'WETH', fromAmountUsd: 50.00, feeUsd: 0.25, status: 'failed' },
];

function useAdminSwaps(wallet: string | undefined) {
  const [swaps, setSwaps] = useState<typeof MOCK_SWAPS>([]);
  
  useEffect(() => {
    // Simula una llamada a la API. Reemplaza esto con tu fetch real.
    // ej: fetch(`/api/admin/swaps?wallet=${wallet}`)
    if (wallet && wallet.toLowerCase() === ADMIN_WALLET) {
        // En un caso real, aquí harías un fetch a tu backend.
        // Por ahora, usamos datos mock.
        setSwaps(MOCK_SWAPS);
    } else {
        setSwaps([]);
    }
  }, [wallet]);

  return swaps;
}

export default function AdminDashboardPage() {
  const account = useActiveAccount();
  const mySwaps = useAdminSwaps(account?.address);

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

  const totalVolume = mySwaps.reduce((a, s) => a + (s.status === 'success' ? s.fromAmountUsd : 0), 0);
  const totalFees = mySwaps.reduce((a, s) => a + (s.status === 'success' ? s.feeUsd : 0), 0);
  const feeWallet = process.env.NEXT_PUBLIC_SWAP_FEE_WALLET || "N/A";

  return (
    <section className="py-24">
        <div className="bg-black/80 rounded-2xl p-8 max-w-4xl mx-auto border border-lime-400/20">
            <h2 className="text-xl font-bold mb-4 text-lime-400">
                Panel de Administración de Swaps
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-8">
                <div>
                    <p className="text-3xl font-bold">${totalVolume.toLocaleString()}</p>
                    <span className="text-sm text-gray-400">Volumen Total</span>
                </div>
                <div>
                    <p className="text-3xl font-bold">{mySwaps.filter(s => s.status === 'success').length}</p>
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
                        {mySwaps.map((s) => (
                        <tr key={s.txHash} className="border-b border-zinc-800 hover:bg-zinc-900">
                            <td className="py-2">
                                <a href={`#`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
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
    </section>
  );
}
