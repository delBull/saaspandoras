"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ArrowRight, CheckCircle, Zap, Loader2, Landmark, Crown } from "lucide-react";
import { toast } from "sonner";
import { ConnectButton, darkTheme, useActiveAccount, TransactionButton } from "thirdweb/react";
import { client } from "@/lib/thirdweb-client";
import { defineChain, getContract, prepareContractCall } from "thirdweb";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { useRouter } from "next/navigation";

// USDT Contract on Arbitrum as an example for $500 Web3 checkout, 
// or maybe standard USDC on Polygon. For MVP, we mock the transaction 
// or use a native transfer to treasury if needed. 
// Since user specified to focus on Fastlane for fiat, we will prioritize Fastlane UI.

export default function HermesCheckoutClient({ lead, project, plan = 'monthly' }: { lead?: any, project?: any, plan?: string }) {
    const router = useRouter();
    const account = useActiveAccount();
    const [method, setMethod] = useState<'fastlane' | 'web3'>('fastlane');

    // FastLane State
    const [fastLaneEmail, setFastLaneEmail] = useState(lead?.email || '');
    const [fastLaneName, setFastLaneName] = useState(lead?.name || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [stage, setStage] = useState<'selection' | 'form' | 'instructions' | 'success'>('selection');
    const [purchaseRef, setPurchaseRef] = useState<string | null>(null);

    const wallets = [
        inAppWallet({ auth: { options: ["email", "google", "apple"] } }),
        createWallet("io.metamask")
    ];

    const submitFastLane = async () => {
        if (!fastLaneEmail || !fastLaneEmail.includes('@') || !fastLaneName) {
            toast.error("Por favor completa tu nombre y correo.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/v1/marketing/hermes/fast-lane', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: fastLaneEmail,
                    name: fastLaneName,
                    amount: plan === 'annual' ? 4990 : 499,
                    tier: plan === 'annual' ? 'Hermes Growth Annual' : 'Hermes Growth Monthly',
                    leadId: lead?.id,
                    projectId: project?.id
                })
            });

            const data = await res.json();
            if (res.ok) {
                setPurchaseRef(data.purchaseRef);
                setStage('instructions');
                toast.success("Referencia de pago generada.");
            } else {
                toast.error(data.error || "Error al procesar la solicitud");
            }
        } catch (e) {
            toast.error("Error de conexión");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleWeb3Success = async (receipt: any) => {
        setStage('success');
        toast.success("¡Pago Web3 Confirmado!");
        
        try {
            await fetch('/api/v1/marketing/hermes/crypto-verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    txHash: receipt.transactionHash,
                    wallet: account?.address,
                    leadId: lead?.id,
                    projectId: project?.id,
                    amount: plan === 'annual' ? 4990 : 499,
                    tier: plan === 'annual' ? 'Hermes Growth Annual' : 'Hermes Growth Monthly'
                })
            });
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto p-4 lg:p-8 flex items-center justify-center min-h-[90vh]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full items-center">
                
                {/* Left side: Value Prop */}
                <div className="space-y-8">
                    <div>
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6">
                            <Crown className="w-8 h-8 text-amber-500" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
                            Hermes <span className="text-amber-500">Growth</span>
                        </h1>
                        <p className="text-zinc-400 text-lg leading-relaxed">
                            Activa tu licencia corporativa y despliega tu Centro de Comando Operativo. Obtén acceso total al motor cognitivo, automatización de journeys y soporte premium.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                            <ShieldCheck className="w-6 h-6 text-emerald-400" />
                            <div>
                                <h3 className="font-bold text-white text-sm uppercase tracking-widest">Protocolo Inmutable</h3>
                                <p className="text-xs text-zinc-500">Tu infraestructura operativa registrada on-chain.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                            <Zap className="w-6 h-6 text-indigo-400" />
                            <div>
                                <h3 className="font-bold text-white text-sm uppercase tracking-widest">Setup Inmediato</h3>
                                <p className="text-xs text-zinc-500">Activación automatizada de Smart Contracts.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right side: Checkout Block */}
                <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                    {/* Background glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] pointer-events-none" />

                    <div className="flex justify-between items-center border-b border-zinc-800 pb-6 mb-6">
                        <div>
                            <h2 className="text-xl font-black text-white tracking-widest uppercase">Activación</h2>
                            <p className="text-xs text-zinc-500 font-mono mt-1">Plan {plan === 'annual' ? 'Anual' : 'Mensual'}</p>
                        </div>
                        <span className="text-2xl font-black text-amber-500">${plan === 'annual' ? '4,990' : '499'} <span className="text-sm text-zinc-500">USD</span></span>
                    </div>

                    <AnimatePresence mode="wait">
                        {stage === 'selection' && (
                            <motion.div key="selection" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                                <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold mb-4">Selecciona tu método de pago</p>
                                
                                <button
                                    onClick={() => setStage('form')}
                                    className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/30 rounded-2xl hover:bg-amber-500/20 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <Landmark className="w-6 h-6 text-amber-500" />
                                        <div className="text-left">
                                            <h4 className="font-bold text-white text-sm">FastLane (Fiat)</h4>
                                            <p className="text-xs text-zinc-400">Transferencia bancaria o tarjeta (Manual)</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-amber-500 group-hover:translate-x-1 transition-transform" />
                                </button>

                                <div className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-4">
                                    <div className="flex items-center gap-4">
                                        <Zap className="w-6 h-6 text-emerald-400" />
                                        <div className="text-left">
                                            <h4 className="font-bold text-white text-sm">Web3 (Cripto)</h4>
                                            <p className="text-xs text-zinc-400">Conecta tu wallet (USDC/USDT)</p>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <ConnectButton 
                                            client={client} 
                                            wallets={wallets}
                                            theme={darkTheme({ colors: { primaryButtonBg: "#10b981", primaryButtonText: "#000" } })}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {stage === 'form' && (
                            <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                                <button onClick={() => setStage('selection')} className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold hover:text-white transition-colors mb-2 block">
                                    ← Volver
                                </button>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Nombre Completo</label>
                                        <input 
                                            type="text" 
                                            value={fastLaneName} 
                                            onChange={e => setFastLaneName(e.target.value)}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm mt-1 outline-none focus:border-amber-500/50"
                                            placeholder="Tu nombre"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Correo Electrónico</label>
                                        <input 
                                            type="email" 
                                            value={fastLaneEmail} 
                                            onChange={e => setFastLaneEmail(e.target.value)}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm mt-1 outline-none focus:border-amber-500/50"
                                            placeholder="tu@correo.com"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={submitFastLane}
                                    disabled={isSubmitting}
                                    className="w-full py-4 mt-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest text-xs rounded-xl flex justify-center items-center gap-2 transition-all"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generar Instrucciones"}
                                </button>
                            </motion.div>
                        )}

                        {stage === 'instructions' && (
                            <motion.div key="instructions" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400">
                                        <CheckCircle className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-black text-white">Solicitud Recibida</h3>
                                    <p className="text-xs text-zinc-400 mt-2">Usa los siguientes datos para realizar tu transferencia bancaria y activar tu licencia de Hermes.</p>
                                </div>

                                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3 font-mono text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-zinc-500">Banco</span>
                                        <span className="text-white">BBVA México</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-zinc-500">Beneficiario</span>
                                        <span className="text-white">Pandoras Finance S.A.</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-zinc-500">CLABE</span>
                                        <span className="text-white">012180015509999999</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-zinc-500">Monto</span>
                                        <span className="text-emerald-400 font-bold">${plan === 'annual' ? '4,990' : '499'} USD (Eq. MXN)</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
                                        <span className="text-zinc-500">Referencia</span>
                                        <span className="text-amber-500 font-bold">{purchaseRef || "HRMS-2026"}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setStage('success')}
                                    className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-widest text-xs rounded-xl transition-all"
                                >
                                    Ya realicé el pago
                                </button>
                            </motion.div>
                        )}

                        {stage === 'success' && (
                            <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4 py-8">
                                <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400">
                                    <CheckCircle className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-black text-white">¡Gracias por tu confianza!</h3>
                                <p className="text-sm text-zinc-400 max-w-xs mx-auto">
                                    Hemos registrado tu intención. Nuestro equipo validará el pago en las próximas horas y tu Centro Operativo será activado automáticamente.
                                </p>
                                <button
                                    onClick={() => router.push('/portal')}
                                    className="mt-6 px-8 py-3 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-colors"
                                >
                                    Ir al Portal
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
