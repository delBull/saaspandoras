'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@saasfly/ui/use-toast";
import { Loader2, ShieldCheck, Send, BarChart2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useActiveAccount, useReadContract, useSendTransaction } from "thirdweb/react";
import { getContract, prepareContractCall, readContract } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { config } from "@/config";
import { PANDORAS_KEY_ABI } from "@/lib/pandoras-key-abi";

// Extend the ABI to include missing standard items + adminMint
const EXTENDED_ABI = [
    ...PANDORAS_KEY_ABI,
    {
        "inputs": [{ "name": "to", "type": "address" }],
        "name": "adminMint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

export function NFTManager() {
    const { toast } = useToast();
    const account = useActiveAccount();

    // 1. Global Gate Settings (API)
    const [nftGateEnabled, setNftGateEnabled] = useState(false);
    const [loadingSettings, setLoadingSettings] = useState(true);

    // 2. Contract Stats (Thirdweb)
    const contract = getContract({
        client,
        chain: config.chain,
        address: config.applyPassNftAddress,
        abi: EXTENDED_ABI,
    });

    const { data: totalSupply, isLoading: isLoadingSupply, refetch: refetchSupply } = useReadContract({
        contract,
        method: "totalSupply",
        params: []
    });

    // 3. Airdrop Logic
    const [airdropAddress, setAirdropAddress] = useState("");
    const { mutate: sendTransaction } = useSendTransaction();
    const [airdropStatus, setAirdropStatus] = useState<'idle' | 'checking' | 'confirm_overwrite' | 'minting' | 'success' | 'error'>('idle');
    const [showAirdropModal, setShowAirdropModal] = useState(false);
    const [balanceCheckValue, setBalanceCheckValue] = useState<bigint | null>(null);

    // --- Functions ---

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/settings?key=apply_gate_enabled");
            if (res.ok) {
                const data = await res.json();
                setNftGateEnabled(data.value === "true");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingSettings(false);
        }
    };

    const handleToggleGate = async () => {
        const newValue = !nftGateEnabled;
        setNftGateEnabled(newValue); // Optimistic

        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-wallet-address": account?.address || "" },
                body: JSON.stringify({ key: "apply_gate_enabled", value: String(newValue) }),
            });

            if (!res.ok) throw new Error("Failed to update");

            toast({
                title: "Configuración Actualizada",
                description: `El NFT Gate ha sido ${newValue ? "ACTIVADO" : "DESACTIVADO"}.`,
            });
        } catch (error) {
            setNftGateEnabled(!newValue); // Revert
            toast({
                title: "Error",
                description: "No se pudo actualizar la configuración.",
                variant: "destructive",
            });
        }
    };

    const initiateAirdrop = async () => {
        if (!airdropAddress) return;

        setAirdropStatus('checking');
        setShowAirdropModal(true);

        try {
            // Check if user already has a pass
            const bal = await readContract({
                contract,
                method: "balanceOf",
                params: [airdropAddress]
            });

            if (bal > 0n) {
                setBalanceCheckValue(bal);
                setAirdropStatus('confirm_overwrite');
            } else {
                // Proceed directly
                executeMint();
            }
        } catch (e) {
            console.error("Failed to check balance", e);
            // If check fails, we might still want to proceed or error out. 
            // Let's assume safely proceed but maybe log it.
            executeMint();
        }
    };

    const executeMint = () => {
        setAirdropStatus('minting');
        try {
            const transaction = prepareContractCall({
                contract,
                method: "adminMint",
                params: [airdropAddress]
            });

            sendTransaction(transaction, {
                onSuccess: async () => {
                    setAirdropStatus('success');
                    toast({
                        title: "Pase Enviado",
                        description: `Apply Pass otorgado a ${airdropAddress}`,
                    });
                    setAirdropAddress("");

                    // Force refresh stats
                    await refetchSupply();

                    // Close modal after delay
                    setTimeout(() => {
                        setShowAirdropModal(false);
                        setAirdropStatus('idle');
                        setBalanceCheckValue(null);
                    }, 3000);
                },
                onError: (e) => {
                    console.error(e);
                    setAirdropStatus('error');
                }
            });
        } catch (e) {
            console.error(e);
            setAirdropStatus('error');
            toast({ title: "Error", description: "Fallo al preparar transacción", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-lime-400" />
                    Control de Acceso (NFT Gate)
                </h3>

                {/* Toggle Section */}
                <div className="flex items-center justify-between bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 mb-6">
                    <div>
                        <p className="text-white font-medium">Restringir Acceso a Aplicaciones Protocolo</p>
                        <p className="text-sm text-zinc-400">Solo usuarios con <strong>Apply Pass</strong> podrán ver el formulario.</p>
                    </div>
                    {loadingSettings ? <Loader2 className="animate-spin" /> : (
                        <div
                            onClick={handleToggleGate}
                            className={`w-14 h-7 rounded-full p-1 cursor-pointer transition-colors duration-300 ${nftGateEnabled ? "bg-lime-500" : "bg-zinc-600"}`}
                        >
                            <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${nftGateEnabled ? "translate-x-7" : "translate-x-0"}`} />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Stats Card */}
                    <div className="bg-zinc-800/30 p-6 rounded-xl border border-zinc-700">
                        <div className="flex items-center gap-3 mb-2">
                            <BarChart2 className="w-5 h-5 text-blue-400" />
                            <h4 className="text-white font-semibold">Estadísticas de Pases</h4>
                        </div>
                        <div className="mt-4">
                            <p className="text-3xl font-bold text-white">
                                {isLoadingSupply ? "..." : totalSupply?.toString() || "0"}
                            </p>
                            <p className="text-sm text-zinc-500">Pases Apply Pass emitidos</p>
                        </div>
                    </div>

                    {/* Airdrop Tool */}
                    <div className="bg-zinc-800/30 p-6 rounded-xl border border-zinc-700">
                        <div className="flex items-center gap-3 mb-4">
                            <Send className="w-5 h-5 text-purple-400" />
                            <h4 className="text-white font-semibold">Otorgar Pase (Airdrop)</h4>
                        </div>

                        <div className="space-y-3">
                            <Input
                                placeholder="0x... Dirección de la Wallet"
                                value={airdropAddress}
                                onChange={(e) => setAirdropAddress(e.target.value)}
                                className="bg-zinc-900 border-zinc-700 text-white"
                            />
                            <Button
                                onClick={initiateAirdrop}
                                disabled={airdropStatus !== 'idle' && airdropStatus !== 'error' || !airdropAddress}
                                className="w-full bg-purple-600 hover:bg-purple-700 font-bold"
                            >
                                {airdropStatus === 'minting' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                Enviar Pase
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Modal Overlay */}
            {showAirdropModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl transform transition-all scale-100 relative">
                        {/* Close button for error state */}
                        {(airdropStatus === 'error' || airdropStatus === 'confirm_overwrite') && (
                            <button
                                onClick={() => {
                                    setShowAirdropModal(false);
                                    setAirdropStatus('idle');
                                }}
                                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                            >
                                ✕
                            </button>
                        )}

                        {airdropStatus === 'checking' && (
                            <div className="flex flex-col items-center">
                                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">Verificando...</h3>
                                <p className="text-zinc-400 text-sm">Comprobando si el usuario ya tiene un pase.</p>
                            </div>
                        )}

                        {airdropStatus === 'confirm_overwrite' && (
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4 border border-yellow-500/20">
                                    <AlertTriangle className="w-8 h-8 text-yellow-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">¡Usuario ya tiene Pase!</h3>
                                <p className="text-zinc-400 text-sm mb-6">
                                    Esta wallet ya posee <strong>{balanceCheckValue?.toString()}</strong> pase(s). ¿Deseas enviarle otro de todos modos?
                                </p>
                                <div className="flex gap-3 w-full">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowAirdropModal(false);
                                            setAirdropStatus('idle');
                                        }}
                                        className="flex-1"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={() => executeMint()}
                                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
                                    >
                                        Enviar Otro
                                    </Button>
                                </div>
                            </div>
                        )}

                        {airdropStatus === 'minting' && (
                            <div className="flex flex-col items-center">
                                <div className="relative w-16 h-16 mb-6 flex items-center justify-center">
                                    <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                    <Send className="w-6 h-6 text-purple-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Airdrop en Progreso</h3>
                                <p className="text-zinc-400 text-sm">Confirmando transacción en la blockchain...</p>
                            </div>
                        )}

                        {airdropStatus === 'success' && (
                            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">¡Pase Enviado!</h3>
                                <p className="text-zinc-400 text-sm">El usuario ha recibido su Apply Pass correctamente.</p>
                            </div>
                        )}

                        {airdropStatus === 'error' && (
                            <div className="flex flex-col items-center animate-in shake duration-300">
                                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                                    <ShieldCheck className="w-8 h-8 text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Error al Enviar</h3>
                                <p className="text-zinc-400 text-sm mb-4">No se pudo completar la transacción. Asegúrate de tener permisos y gas suficiente.</p>
                                <Button
                                    variant="destructive"
                                    onClick={() => setShowAirdropModal(false)}
                                    className="w-full mt-2"
                                >
                                    Cerrar
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
