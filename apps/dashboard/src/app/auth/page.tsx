'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useActiveAccount, ConnectButton, darkTheme } from "thirdweb/react";
import { client } from "@/lib/thirdweb-client";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { useSearchParams } from 'next/navigation';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { defineChain } from 'thirdweb/chains';
import { useAuth } from '@/components/auth/AuthProvider';

function AuthContent() {
    const account = useActiveAccount();
    const searchParams = useSearchParams();
    const { runAuthFlow, status: authStatus } = useAuth();
    
    const projectSlug = searchParams.get('project') || 'pandoras';
    const origin = searchParams.get('origin');
    
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Chain detection (default to Sepolia for now or Base if project specifies)
    const chainId = project?.chainId ? Number(project.chainId) : 11155111;
    const chain = defineChain(chainId);
    const brandColor = project?.themeColor || '#7c3aed';

    useEffect(() => {
        async function fetchProject() {
            try {
                const res = await fetch(`/api/public/project/${projectSlug}/state?apiKey=pk_test_b277293448bd09198b6fd29ff0b87c4e1c9184219ff50111`);
                const data = await res.json();
                if (data && !data.error) {
                    setProject(data);
                }
            } catch (e) {
                console.error("Failed to fetch project for auth", e);
            } finally {
                setLoading(false);
            }
        }
        fetchProject();
    }, [projectSlug]);

    // Handle Authentication Completion
    useEffect(() => {
        if (account?.address && authStatus === 'authenticated') {
            console.log("🛡️ [Auth] Authenticated! Notifying parent...");
            if (window.opener) {
                window.opener.postMessage('growth_os:auth_success', origin || '*');
                setTimeout(() => window.close(), 1000);
            }
        }
    }, [account?.address, authStatus, origin]);

    // Trigger SIWE if connected but not authenticated
    useEffect(() => {
        if (account?.address && authStatus === 'unauthenticated') {
            runAuthFlow().catch(console.error);
        }
    }, [account?.address, authStatus, runAuthFlow]);

    const wallets = useMemo(() => [
        inAppWallet({ auth: { options: ["email", "google", "apple", "facebook", "passkey"] } }),
        createWallet("io.metamask")
    ], []);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-[100dvh] bg-[#050505] relative items-center justify-center p-6 overflow-hidden font-sans">
            <div className="fixed inset-0 pointer-events-none z-0" style={{
                background: `radial-gradient(ellipse at top, ${brandColor}30 0%, transparent 70%)`
            }}></div>
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="z-10 w-full max-w-[380px] flex flex-col items-center space-y-8 p-10 bg-zinc-950/50 backdrop-blur-3xl border border-zinc-800/50 rounded-[2.5rem] shadow-2xl"
            >
                <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden border border-zinc-800 shadow-2xl flex items-center justify-center bg-zinc-900 group">
                    {project?.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                            src={project.logoUrl} 
                            alt={project.title} 
                            className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                        />
                    ) : (
                        <span className="text-2xl font-black text-white">{(project?.title || "PD").substring(0, 2).toUpperCase()}</span>
                    )}
                </div>
                
                <div className="text-center space-y-3">
                    <h2 className="text-2xl font-black text-white tracking-tight leading-tight">{project?.title || "Pandoras Growth"}</h2>
                    <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Identificación Requerida</p>
                </div>

                <div className="w-full relative scale-[1.05] flex justify-center">
                    {authStatus === 'authenticated' ? (
                        <div className="flex flex-col items-center gap-4 py-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <ShieldCheck className="text-emerald-500 w-6 h-6" />
                            </div>
                            <p className="text-sm font-bold text-white uppercase tracking-widest">Acceso Concedido</p>
                        </div>
                    ) : (
                        <ConnectButton
                            client={client}
                            chain={chain}
                            wallets={wallets}
                            connectButton={{
                                label: "Activa tu acceso",
                            }}
                            connectModal={{
                                size: "compact",
                                title: `Acceder a ${project?.title || "Pandoras"}`,
                                showThirdwebBranding: false,
                            }}
                            theme={darkTheme({
                                colors: {
                                    primaryButtonBg: brandColor,
                                    primaryButtonText: "#000",
                                }
                            })}
                        />
                    )}
                </div>
                
                <p className="text-[10px] text-zinc-600 font-medium text-center leading-relaxed">
                    {authStatus === 'authenticated' 
                        ? "Sincronizando sesión con el protocolo. Esta ventana se cerrará automáticamente."
                        : "Conecta tu billetera o usa tu correo para validar tu acceso al protocolo de forma segura."}
                </p>
            </motion.div>

            <div className="fixed bottom-8 text-center opacity-30">
                 <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">Pandoras Security Layer</p>
            </div>
        </div>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <AuthContent />
        </Suspense>
    );
}
