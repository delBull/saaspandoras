'use client';

import { useState, useEffect, useCallback } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { toast } from 'sonner';

interface CommissionData {
  referralCode: string;
  status: string;
  pending: {
    total: string;
    count: number;
    directSales: number;
    residualYield: number;
    commissions: Array<{
      id: string;
      amount: string;
      type: string;
      clientWallet: string;
      createdAt: string;
    }>;
  };
  paid: {
    total: string;
    count: number;
    commissions: Array<{
      id: string;
      amount: string;
      type: string;
      clientWallet: string;
      paidAt: string;
    }>;
  };
  totalClients: number;
}

export default function AmbassadorDashboard() {
  const account = useActiveAccount();
  const [data, setData] = useState<CommissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const fetchCommissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ambassadors/commissions');
      if (res.ok) {
        setData(await res.json());
      } else {
        const err = await res.json();
        if (res.status !== 404) toast.error(err.error);
        setData(null);
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (account?.address) fetchCommissions();
    else setLoading(false);
  }, [account?.address, fetchCommissions]);

  const handleClaim = async () => {
    if (!account?.address || !data || data.pending.count === 0) return;

    setClaiming(true);
    try {
      const message = `Claim ambassador commissions | ${data.referralCode}`;
      const signature = await account.signMessage({ message });

      const res = await fetch('/api/ambassadors/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletSignature: signature, message }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      toast.success(`Claimed ${result.amount} USDC — ${result.commissionsClaimed} commissions`);
      fetchCommissions();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setClaiming(false);
    }
  };

  if (!account?.address) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto text-center py-20">
          <h1 className="text-3xl font-bold mb-4">Ambassador Dashboard</h1>
          <p className="text-zinc-400">Connect your wallet to view your commissions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Ambassador Dashboard</h1>
          <span className="text-sm text-zinc-500 font-mono">
            {account.address.slice(0, 6)}...{account.address.slice(-4)}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading...</div>
        ) : !data ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
            <p className="text-zinc-400">No ambassador profile found for this wallet.</p>
            <p className="text-zinc-600 text-sm mt-2">Apply at the <a href="/ambassadors" className="text-emerald-400 underline">Ambassadors page</a></p>
          </div>
        ) : (
          <>
            {/* Status Card */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Your Profile</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  data.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {data.status === 'active' ? 'Active' : 'Pending'}
                </span>
              </div>
              <div className="bg-zinc-800/30 rounded-xl p-4 text-center">
                <p className="text-sm text-zinc-500 mb-1">Your Referral Code</p>
                <p className="text-3xl font-mono text-emerald-400 font-bold tracking-wider">{data.referralCode}</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <p className="text-xs text-zinc-500 mb-1">Pending</p>
                <p className="text-2xl text-emerald-400 font-bold">{data.pending.total} USDC</p>
                <p className="text-xs text-zinc-600">{data.pending.count} commissions</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <p className="text-xs text-zinc-500 mb-1">Paid Out</p>
                <p className="text-2xl text-white font-bold">{data.paid.total} USDC</p>
                <p className="text-xs text-zinc-600">{data.paid.count} commissions</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <p className="text-xs text-zinc-500 mb-1">Direct Sales (4%)</p>
                <p className="text-2xl text-blue-400 font-bold">{data.pending.directSales}</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <p className="text-xs text-zinc-500 mb-1">Clients Referred</p>
                <p className="text-2xl text-purple-400 font-bold">{data.totalClients}</p>
              </div>
            </div>

            {/* Claim Button */}
            {data.pending.count > 0 && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-400">Available to withdraw</p>
                    <p className="text-3xl font-bold text-emerald-400">{data.pending.total} USDC</p>
                  </div>
                  <button
                    onClick={handleClaim}
                    disabled={claiming}
                    className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white rounded-xl font-bold transition-colors"
                  >
                    {claiming ? 'Processing...' : 'Claim All'}
                  </button>
                </div>
              </div>
            )}

            {/* Recent Commissions */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Commission History</h2>
              {data.pending.commissions.length === 0 && data.paid.commissions.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">No commissions yet. Share your referral code to start earning!</p>
              ) : (
                <div className="space-y-2">
                  {[...data.pending.commissions, ...data.paid.commissions].slice(0, 20).map((c) => (
                    <div key={c.id} className="flex items-center justify-between bg-zinc-800/30 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${
                          'paidAt' in c && c.paidAt ? 'bg-emerald-400' : 'bg-yellow-400'
                        }`} />
                        <div>
                          <p className="text-sm font-mono text-zinc-300">
                            {c.clientWallet.slice(0, 6)}...{c.clientWallet.slice(-4)}
                          </p>
                          <p className="text-xs text-zinc-500">{c.type.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-400">{c.amount} USDC</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
