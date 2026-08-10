'use client';

import React, { useEffect, useState } from 'react';
import { getPendingIntents } from '@/app/growth-os/organizations/[id]/actions';
import GovernanceButtons from '@/app/growth-os/organizations/[id]/governance/components/GovernanceButtons';
import { simulateHermesProposal } from '@/actions/simulate-hermes-intent';
import { useRouter } from 'next/navigation';

export default function HermesGovernanceSection({ organizationId }: { organizationId: string }) {
    const [intents, setIntents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchIntents = async () => {
        setLoading(true);
        try {
            const result = await getPendingIntents(organizationId);
            setIntents(result.pendingIntents || []);
        } catch (error) {
            console.error("Error fetching intents:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchIntents();
    }, [organizationId]);

    const handleSimulate = async () => {
        await simulateHermesProposal(organizationId);
        fetchIntents();
        router.refresh();
    };

    return (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-white">Hermes Operational Governance</h3>
                    <p className="text-gray-400 text-sm mt-1">
                        Review and approve autonomous actions proposed by Hermes.
                    </p>
                </div>
                <button 
                    onClick={handleSimulate}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm font-medium text-gray-300 transition-colors"
                >
                    Trigger Hermes (Dev)
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8 text-gray-500">Loading proposals...</div>
            ) : intents.length === 0 ? (
                <div className="text-center py-12 bg-zinc-800/30 rounded-lg border border-zinc-800/50">
                    <p className="text-gray-400">No pending operational intents.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {intents.map((intent: any) => (
                        <div key={intent.intentId} className="bg-zinc-800/50 rounded-lg p-5 border border-zinc-700">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs rounded font-medium">
                                            {intent.intentType}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            Status: {intent.status}
                                        </span>
                                    </div>
                                    <h4 className="text-lg font-bold text-white">{intent.strategyDecision}</h4>
                                </div>
                            </div>
                            
                            <div className="space-y-4 mb-6">
                                <div>
                                    <h5 className="text-sm font-medium text-gray-400 mb-1">Rationale (WHY)</h5>
                                    <p className="text-sm text-gray-300">{intent.reasonSummary}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-zinc-700/50 flex justify-end">
                                <GovernanceButtons intentId={intent.intentId} requestedOrganizationId={organizationId} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
