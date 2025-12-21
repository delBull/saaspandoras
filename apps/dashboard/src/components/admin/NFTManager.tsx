'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@saasfly/ui/use-toast";
import { Loader2, ShieldCheck, Send, BarChart2, CheckCircle2, AlertTriangle, Wallet } from "lucide-react";
import { useActiveAccount, useReadContract, useSendTransaction } from "thirdweb/react";
import { getContract, prepareContractCall, readContract } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { config } from "@/config";
import { PANDORAS_KEY_ABI } from "@/lib/pandoras-key-abi";
import { CreateNFTPassModal } from "./CreateNFTPassModal";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
    const [showCreateWizard, setShowCreateWizard] = useState(false);

    // 1. Global Gate Settings (API)
    const [nftGateEnabled, setNftGateEnabled] = useState(false);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [togglingGate, setTogglingGate] = useState(false);

    // 2. Contract Stats (Thirdweb)
    const contract = getContract({
        client,
        chain: config.chain,
        address: config.applyPassNftAddress,
        abi: EXTENDED_ABI,
    });

    const { data: supply, isLoading: supplyLoading, refetch: refetchSupply } = useReadContract({
        contract,
        method: "totalSupply",
        params: []
    });

    const { data: balance, isLoading: balanceLoading, refetch: refetchBalance } = useReadContract({
        contract,
        method: "balanceOf",
        params: [account?.address || "0x0000000000000000000000000000000000000000"],
        queryOptions: { enabled: !!account?.address }
    });

    // 3. Airdrop Logic
    const [airdropAddress, setAirdropAddress] = useState("");
    const { mutate: sendTransaction } = useSendTransaction();
    const [airdropStatus, setAirdropStatus] = useState<'idle' | 'checking' | 'confirm_overwrite' | 'minting' | 'success' | 'error'>('idle');
    const [showAirdropModal, setShowAirdropModal] = useState(false);
    const [balanceCheckValue, setBalanceCheckValue] = useState<bigint | null>(null);
    const [checkingBalance, setCheckingBalance] = useState(false);

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

    const toggleGate = async () => {
        setTogglingGate(true);
        const newValue = !nftGateEnabled;

        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-wallet-address": account?.address || "" },
                body: JSON.stringify({ key: "apply_gate_enabled", value: String(newValue) }),
            });

            if (!res.ok) throw new Error("Failed to update");

            setNftGateEnabled(newValue);
            toast({
                title: "Configuración Actualizada",
                description: `El NFT Gate ha sido ${newValue ? "ACTIVADO" : "DESACTIVADO"}.`,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo actualizar la configuración.",
                variant: "destructive",
            });
        } finally {
            setTogglingGate(false);
        }
    };

    const checkBalance = async () => {
        if (!airdropAddress) return;
        setCheckingBalance(true);
        try {
            const bal = await readContract({
                contract,
                method: "balanceOf",
                params: [airdropAddress]
            });
            setBalanceCheckValue(bal);
        } catch (e) {
            console.error("Failed to check balance", e);
            toast({ title: "Error", description: "Fallo al verificar balance.", variant: "destructive" });
        } finally {
            setCheckingBalance(false);
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
                    setBalanceCheckValue(null);

                    // Force refresh stats
                    await refetchSupply();
                    await refetchBalance();

                    // Close modal after delay
                    setTimeout(() => {
                        setShowAirdropModal(false);
                        setAirdropStatus('idle');
                    }, 3000);
                },
                onError: (e) => {
                    console.error(e);
                    setAirdropStatus('error');
                    toast({ title: "Error", description: "Fallo al enviar pase.", variant: "destructive" });
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
                        Gestión de Accesos
                    </h2>
                    <p className="text-zinc-400 text-sm">
                        Administra el pase del sistema y crea nuevos contratos de acceso.
                    </p>
                </div>
                <Button
                    onClick={() => setShowCreateWizard(true)}
                    className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white"
                >
                    <Wallet className="w-4 h-4 mr-2" />
                    Crear Nuevo NFT Pass
                </Button>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <ShieldCheck className="w-32 h-32" />
                </div>

                <div className="mb-6 relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-lime-500/10 text-lime-500 text-xs px-2 py-0.5 rounded border border-lime-500/20 font-mono">
                            SYSTEM
                        </span>
                        <h3 className="text-lg font-semibold text-white">Apply Access Pass</h3>
                    </div>
                    <p className="text-zinc-400 text-sm max-w-2xl">
                        Este es el pase que restringe el acceso a la aplicación de Protocolos.
                        <span className="font-mono text-xs bg-zinc-950 px-1 rounded text-zinc-500">Contrato: {config.applyPassNftAddress}</span>
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 relative z-10">
                    <div className="bg-black/40 p-4 rounded-lg border border-zinc-800/50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-zinc-500 text-xs uppercase tracking-wider">Total Supply</span>
                            <BarChart2 className="w-4 h-4 text-zinc-600" />
                        </div>
                        <div className="text-2xl font-mono font-bold text-white">
                            {supplyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : supply?.toString() || "0"}
                        </div>
                    </div>

                    <div className="bg-black/40 p-4 rounded-lg border border-zinc-800/50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-zinc-500 text-xs uppercase tracking-wider">Estado del Gate</span>
                            {nftGateEnabled ?
                                <CheckCircle2 className="w-4 h-4 text-green-500" /> :
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            }
                        </div>
                        <div className={`text-sm font-semibold ${nftGateEnabled ? "text-green-400" : "text-yellow-400"}`}>
                            {loadingSettings ? <Loader2 className="w-3 h-3 animate-spin" /> : (nftGateEnabled ? "ACTIVO (Restringido)" : "INACTIVO (Público)")}
                        </div>
                    </div>

                    <div className="bg-black/40 p-4 rounded-lg border border-zinc-800/50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-zinc-500 text-xs uppercase tracking-wider">Tu Balance</span>
                            <Wallet className="w-4 h-4 text-zinc-600" />
                        </div>
                        <div className="text-2xl font-mono font-bold text-white">
                            {balanceLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : balance?.toString() || "0"}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 relative z-10">
                    <Button
                        onClick={() => setShowAirdropModal(true)}
                        className="bg-lime-500 text-black hover:bg-lime-400"
                    >
                        <Send className="w-4 h-4 mr-2" />
                        Airdrop Pass
                    </Button>

                    <Button
                        onClick={toggleGate}
                        disabled={togglingGate}
                        variant="outline"
                        className={`border-zinc-700 hover:bg-zinc-800 ${!nftGateEnabled && "text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/10"}`}
                    >
                        {togglingGate ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {nftGateEnabled ? "Desactivar Gate" : "Activar Gate"}
                    </Button>
                </div>
            </div>

            <Dialog open={showAirdropModal} onOpenChange={setShowAirdropModal}>
                <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Airdrop Access Pass</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Envía un pase de acceso a una wallet específica sin costo.
                        </DialogDescription>
                    </DialogHeader>

                    {airdropStatus === 'idle' || airdropStatus === 'checking' ? (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label htmlFor="airdrop-wallet" className="text-xs text-zinc-500 uppercase font-semibold">Wallet Address</label>
                                <div className="flex gap-2">
                                    <Input
                                        id="airdrop-wallet"
                                        placeholder="0x..."
                                        value={airdropAddress}
                                        onChange={(e) => {
                                            setAirdropAddress(e.target.value);
                                            if (balanceCheckValue !== null) setBalanceCheckValue(null);
                                        }}
                                        className="bg-black/50 border-zinc-700 font-mono"
                                    />
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="border-zinc-700 hover:bg-zinc-800 shrink-0"
                                        onClick={checkBalance}
                                        disabled={checkingBalance || !airdropAddress}
                                        title="Verificar si ya tiene pase"
                                    >
                                        {checkingBalance ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                    </Button>
                                </div>
                                {balanceCheckValue !== null && (
                                    <p className={`text-xs ${balanceCheckValue > 0n ? "text-yellow-500" : "text-green-500"}`}>
                                        {balanceCheckValue > 0n ? `⚠️ Esta wallet ya tiene ${balanceCheckValue.toString()} pase(s).` : "✅ Wallet limpia (0 pases)."}
                                    </p>
                                )}
                            </div>
                            <DialogFooter className="flex justify-between sm:justify-between w-full">
                                <Button variant="ghost" onClick={() => setShowAirdropModal(false)}>Cancelar</Button>
                                <Button
                                    onClick={() => executeMint()}
                                    disabled={!airdropAddress}
                                    className="bg-lime-500 text-black hover:bg-lime-400"
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Enviar Pase
                                </Button>
                            </DialogFooter>
                        </div>
                    ) : null}

                    {airdropStatus === 'minting' && (
                        <div className="flex flex-col items-center py-8">
                            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">Enviando Airdrop...</h3>
                            <p className="text-zinc-400 text-sm">Confirmando transacción en la blockchain.</p>
                        </div>
                    )}

                    {airdropStatus === 'success' && (
                        <div className="flex flex-col items-center py-8">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20">
                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">¡Pase Enviado!</h3>
                            <p className="text-zinc-400 text-sm">El usuario ha recibido su Apply Pass correctamente.</p>
                        </div>
                    )}

                    {airdropStatus === 'error' && (
                        <div className="flex flex-col items-center py-8">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Error al Enviar</h3>
                            <p className="text-zinc-400 text-sm">No se pudo completar la transacción.</p>
                            <Button variant="ghost" onClick={() => { setAirdropStatus('idle'); setShowAirdropModal(false); }} className="mt-4">
                                Cerrar
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <CreateNFTPassModal isOpen={showCreateWizard} onClose={() => setShowCreateWizard(false)} />
        </div>
    );
}
