'use client';

import React, { useState, useEffect } from "react";
import { UnauthorizedAccess } from "@/components/admin/UnauthorizedAccess";

interface AdminAuthGuardProps {
    children: React.ReactNode;
}

interface WalletSession {
    address: string;
    walletType: string;
    shouldReconnect: boolean;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                // Try multiple sources for wallet address
                let walletAddress = null;
                if (typeof window !== 'undefined') {
                    // 1. localStorage
                    if (window.localStorage) {
                        try {
                            const sessionData = localStorage.getItem('wallet-session');
                            if (sessionData) {
                                const parsedSession = JSON.parse(sessionData) as unknown as WalletSession;
                                walletAddress = parsedSession.address?.toLowerCase();
                            }
                        } catch (e) {
                            console.warn('Error reading wallet session:', e);
                        }
                    }

                    // 2. Cookie fallback
                    if (!walletAddress) {
                        try {
                            walletAddress = document.cookie
                                .split('; ')
                                .find((row) => row.startsWith('wallet-address='))
                                ?.split('=')[1];

                            if (!walletAddress) {
                                walletAddress = document.cookie
                                    .split('; ')
                                    .find((row) => row.startsWith('thirdweb:wallet-address='))
                                    ?.split('=')[1];
                            }
                        } catch (e) {
                            console.warn('Error reading cookies:', e);
                        }
                    }
                }

                if (!walletAddress) {
                    setAuthError('No se pudo obtener dirección de wallet');
                    setIsAdmin(false);
                    return;
                }

                const response = await fetch('/api/admin/verify', {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-thirdweb-address': walletAddress,
                        'x-wallet-address': walletAddress,
                        'x-user-address': walletAddress,
                    },
                });

                if (!response.ok) {
                    setAuthError(`Verificación fallida: ${response.status}`);
                    setIsAdmin(false);
                    return;
                }

                const data = await response.json() as { isAdmin?: boolean; isSuperAdmin?: boolean };
                const userIsAdmin = (data.isAdmin ?? false) || (data.isSuperAdmin ?? false);

                setIsAdmin(userIsAdmin);
                if (!userIsAdmin) setAuthError('Permisos insuficientes');
                else setAuthError(null);

            } catch (error) {
                setAuthError('Error al verificar permisos');
                setIsAdmin(false);
            } finally {
                setLoading(false);
            }
        };

        void checkAdminStatus();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-lime-500 border-t-transparent"></div>
                    <p className="text-zinc-500">Verificando permisos...</p>
                </div>
            </div>
        );
    }

    if (isAdmin === false) {
        return <UnauthorizedAccess authError={authError} />;
    }

    return <>{children}</>;
}
