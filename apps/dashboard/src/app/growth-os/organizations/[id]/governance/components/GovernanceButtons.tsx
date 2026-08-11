'use client';

import { useState } from 'react';
import { approveIntent, rejectIntent } from '../../actions';
import { useRouter } from 'next/navigation';

export default function GovernanceButtons({ intentId, requestedOrganizationId }: { intentId: string, requestedOrganizationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    const result = await approveIntent(requestedOrganizationId, intentId, 'Authorized via Governance Center');
    
    if (result.success) {
      router.refresh();
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleReject = async () => {
    const rejectReason = prompt("Reason for rejection:");
    if (!rejectReason) return;
    
    setLoading(true);
    setError(null);
    const result = await rejectIntent(requestedOrganizationId, intentId, rejectReason);
    
    if (result.success) {
      router.refresh();
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-4">
        <button 
          onClick={handleReject}
          disabled={loading}
          className="px-6 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium transition-colors disabled:opacity-50"
        >
          REJECT
        </button>
        <button 
          onClick={handleApprove}
          disabled={loading}
          className="px-6 py-2 rounded-lg bg-black text-white hover:bg-gray-800 font-medium transition-colors disabled:opacity-50"
        >
          APPROVE
        </button>
      </div>
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
}
