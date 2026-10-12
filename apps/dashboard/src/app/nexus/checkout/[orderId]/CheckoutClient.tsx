'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'thirdweb/react';
import { toast } from 'sonner';

import { HermesUnifiedCheckout } from '@/components/payments/HermesUnifiedCheckout';

export default function CheckoutClient({ order, paymentIntentId }: { order: any; paymentIntentId?: string }) {
  const account = useActiveAccount();
  const router = useRouter();
  const [isActivating, setIsActivating] = useState(false);

  const handleActivate = async () => {
    if (!account?.address) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsActivating(true);
    try {
      const res = await fetch(`/api/v1/internal/nexus/orders/${order.id}/provision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: account.address })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to activate');
      }

      toast.success('Provisioning successful!');
      router.push('/growth-os/hermes'); // Redirect to dashboard
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold mb-2">Order Summary</h1>
        <p className="text-zinc-400 mb-6 text-sm">Review your workspace activation details.</p>
        
        <div className="space-y-4 mb-8">
          <div className="flex justify-between pb-4 border-b border-zinc-800">
            <span className="text-zinc-500">Organization</span>
            <span className="font-medium text-right">{order.requestedOrgName}</span>
          </div>
          <div className="flex justify-between pb-4 border-b border-zinc-800">
            <span className="text-zinc-500">Order ID</span>
            <span className="font-mono text-xs text-right mt-1">{order.id}</span>
          </div>
          <div className="flex justify-between pb-4 border-b border-zinc-800">
            <span className="text-zinc-500">Total</span>
            <span className="font-medium text-emerald-400">${Number(order.totalAmount).toFixed(2)} USD</span>
          </div>
        </div>

        {order.status === 'PROVISIONED' ? (
          <div className="text-center p-4 bg-emerald-500/10 text-emerald-400 rounded-lg">
            This workspace has been successfully provisioned.
          </div>
        ) : order.status === 'PAID' ? (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm text-center">
              Payment confirmed! You can now activate your organization workspace.
            </div>
            {!account ? (
              <div className="p-4 bg-amber-500/10 text-amber-400 rounded-lg text-sm text-center">
                Please connect your wallet using the portal header to activate your workspace.
              </div>
            ) : (
              <button
                onClick={handleActivate}
                disabled={isActivating}
                className="w-full py-3 px-4 bg-white text-black font-semibold rounded-lg shadow hover:bg-zinc-200 transition disabled:opacity-50"
              >
                {isActivating ? 'Activating Workspace...' : 'Activate Workspace'}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-amber-500/10 text-amber-400 rounded-lg text-sm text-center">
              This order is awaiting payment settlement (status: {order.status}). You can settle on-chain via USDC or report a wire/SPEI transfer.
            </div>
            {paymentIntentId ? (
              <div className="mt-4">
                <HermesUnifiedCheckout intentId={paymentIntentId} />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
