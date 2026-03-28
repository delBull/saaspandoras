import { useState, useEffect } from 'react';
import { AccessState } from '@/lib/access/state-machine';

export interface AccessStateData {
    state: AccessState;
    authenticated: boolean;
    isAdmin: boolean;
    hasAccess: boolean;
    user?: {
        address: string;
        hasAccess: boolean;
        isAdmin: boolean;
        tier: string;
        ritualCompletedAt?: string | Date | null;
        pressureLevel: number;
    };
    ux?: {
        flow: string;
        delay: number;
        copyVariant: string;
        scarcityHint?: string;
    };
    betaOpen: boolean;
    ritualEnabled: boolean;
    error?: string;
    _dev_debug?: {
        message: string;
        code?: string;
        cause?: any;
    };
    latency?: number;
}

/**
 * 🛰️ useAccessState (Unified Frontend Oracle)
 * ============================================================================
 * The definitive hook for Auth & Access in Level 20+ infrastructure.
 * Consumes the hardened /api/access-state endpoint to provide:
 * 1. Definitive Access State (ADMIN, HAS_ACCESS, etc.)
 * 2. Behavioral UX Config (Funnels, Delays, Scarcity)
 * 3. Identity Confidence (JWT-only)
 * ============================================================================
 */
export function useAccessState() {
    const [data, setData] = useState<AccessStateData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refresh = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/access-state');
            if (res.ok) {
                const json = await res.json();
                setData(json);
            } else {
                setData({ state: AccessState.ERROR, authenticated: false, isAdmin: false, hasAccess: false, betaOpen: false, ritualEnabled: true, error: 'API_UNREACHABLE' });
            }
        } catch (err) {
            setData({ state: AccessState.ERROR, authenticated: false, isAdmin: false, hasAccess: false, betaOpen: false, ritualEnabled: true, error: 'NET_ERROR' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    return {
        ...data,
        isLoading,
        refresh,
        // Helper to check if the user is "Qualified" for Genesis
        isGenesisQualified: data?.state === AccessState.HAS_ACCESS || data?.state === AccessState.ADMIN,
        // Helper to check if the user is in the "Ritual"
        isInRitual: data?.state === AccessState.WALLET_NO_ACCESS || data?.state === AccessState.NO_SESSION
    };
}
