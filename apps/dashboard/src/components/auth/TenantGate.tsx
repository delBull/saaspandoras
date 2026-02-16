'use client';

import React, { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { Loader2, Lock, Crown, Users } from "lucide-react";
import { useToast } from "@saasfly/ui/use-toast";

interface NFTContractRequirement {
    address: string;
    chainId: number;
    minBalance: number;
}

interface TenantRequirements {
    nftContracts?: NFTContractRequirement[];
    requiredRoles?: string[];
}

interface TenantGateProps {
    tenantId?: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
    showRequirements?: boolean;
}

export function TenantGate({
    tenantId = 'pandoras-main',
    children,
    fallback,
    showRequirements = true
}: TenantGateProps) {
    const account = useActiveAccount();
    const { toast } = useToast();
    
    const [isLoading, setIsLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);
    const [requirements, setRequirements] = useState<TenantRequirements | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!account?.address) {
            setIsLoading(false);
            setHasAccess(false);
            return;
        }

        checkAccess();
    }, [account?.address, tenantId]);

    const checkAccess = async () => {
        if (!account?.address) return;
        
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/auth/tenant-access', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    address: account.address,
                    tenantId
                })
            });

            const data = await response.json();

            if (response.ok && data.hasAccess) {
                setHasAccess(true);
            } else {
                setHasAccess(false);
                setRequirements(data.requirements || null);
                setError(data.error || 'Access denied');
            }
        } catch (err) {
            console.error('[TenantGate] Error checking access:', err);
            // On error, allow access (fail open)
            setHasAccess(true);
        } finally {
            setIsLoading(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="w-6 h-6 animate-spin text-lime-400" />
            </div>
        );
    }

    // Has access - render children
    if (hasAccess) {
        return <>{children}</>;
    }

    // No access - render fallback or default denied UI
    if (fallback) {
        return <>{fallback}</>;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
            <div className="max-w-md w-full text-center">
                {/* Icon */}
                <div className="mb-6">
                    <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
                        <Lock className="w-10 h-10 text-red-500" />
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white mb-2">
                    Access Restricted
                </h2>
                <p className="text-gray-400 mb-6">
                    {error || 'You do not meet the requirements to access this area.'}
                </p>

                {/* Requirements */}
                {showRequirements && requirements && (
                    <div className="bg-zinc-800/50 rounded-lg p-4 mb-6 text-left">
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">
                            Requirements to access:
                        </h3>
                        
                        {requirements.nftContracts && requirements.nftContracts.length > 0 && (
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Crown className="w-4 h-4 text-lime-400" />
                                    <span>NFT Ownership</span>
                                </div>
                                <ul className="ml-6 space-y-1">
                                    {requirements.nftContracts.map((nft, i) => (
                                        <li key={i} className="text-xs text-gray-500">
                                            • Contract: {nft.address.slice(0, 6)}...{nft.address.slice(-4)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {requirements.requiredRoles && requirements.requiredRoles.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Users className="w-4 h-4 text-lime-400" />
                                    <span>Required Roles</span>
                                </div>
                                <ul className="ml-6 space-y-1">
                                    {requirements.requiredRoles.map((role, i) => (
                                        <li key={i} className="text-xs text-gray-500">
                                            • {role}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* Action */}
                <button
                    onClick={checkAccess}
                    className="w-full bg-lime-500 hover:bg-lime-400 text-black font-bold py-3 px-6 rounded-lg transition-colors"
                >
                    Check Again
                </button>
            </div>
        </div>
    );
}

/**
 * Hook for programmatic tenant access checking
 */
export function useTenantAccess(tenantId?: string) {
    const account = useActiveAccount();
    const [isLoading, setIsLoading] = useState(false);
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);
    const [requirements, setRequirements] = useState<TenantRequirements | null>(null);

    const checkAccess = async () => {
        if (!account?.address) {
            setHasAccess(false);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/tenant-access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: account.address,
                    tenantId: tenantId || 'pandoras-main'
                })
            });

            const data = await response.json();
            setHasAccess(data.hasAccess || false);
            setRequirements(data.requirements || null);
        } catch {
            setHasAccess(true); // Fail open
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        hasAccess,
        requirements,
        checkAccess,
        isAuthorized: hasAccess === true
    };
}
