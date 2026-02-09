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
import { Switch } from "@saasfly/ui/switch";
import { Badge } from "@/components/ui/badge";

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

    // 2. NFT Passes List (for airdrop selector)
    const [availablePasses, setAvailablePasses] = useState<Array<{
        id: string;
        title: string;
        contractAddress: string;
        symbol: string;
        imageUrl: string | null;
    }>>([]);
    const [loadingPasses, setLoadingPasses] = useState(true);
    const [selectedPassAddress, setSelectedPassAddress] = useState<string>(config.applyPassNftAddress);

    // 3. Contract Stats (Thirdweb) - Dynamic based on selected pass
    const contract = getContract({
        client,
        chain: config.chain,
        address: config.applyPassNftAddress, // Default to Apply Pass for stats
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

    // 4. Airdrop Logic
    const [airdropAddress, setAirdropAddress] = useState("");
    const { mutate: sendTransaction } = useSendTransaction();
    const [airdropStatus, setAirdropStatus] = useState<'idle' | 'checking' | 'confirm_overwrite' | 'minting' | 'success' | 'error'>('idle');
    const [showAirdropModal, setShowAirdropModal] = useState(false);
    const [balanceCheckValue, setBalanceCheckValue] = useState<bigint | null>(null);
    const [checkingBalance, setCheckingBalance] = useState(false);

    // --- Functions ---

    useEffect(() => {
        fetchSettings();
        fetchAvailablePasses();
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

    const fetchAvailablePasses = async () => {
        try {
            const res = await fetch("/api/admin/nft-passes");
            if (res.ok) {
                const passes = await res.json();
                // Add the Apply Pass manually if not in list
                const applyPass = {
                    id: 'system-apply-pass',
                    title: 'Apply Access Pass (Sistema)',
                    contractAddress: config.applyPassNftAddress,
                    symbol: 'APPLY',
                    imageUrl: null
                };
                setAvailablePasses([applyPass, ...passes]);
                console.log('✅ Loaded NFT Passes:', [applyPass, ...passes]);
            }
        } catch (e) {
            console.error('❌ Error fetching NFT passes:', e);
        } finally {
            setLoadingPasses(false);
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
            // Use selected pass contract for balance check
            const selectedContract = getContract({
                client,
                chain: config.chain,
                address: selectedPassAddress,
                abi: EXTENDED_ABI,
            });
            const bal = await readContract({
                contract: selectedContract,
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
            // Use selected pass contract for minting
            const selectedContract = getContract({
                client,
                chain: config.chain,
                address: selectedPassAddress,
                abi: EXTENDED_ABI,
            });

            const transaction = prepareContractCall({
                contract: selectedContract,
                method: "adminMint",
                params: [airdropAddress]
            });

            const selectedPass = availablePasses.find(p => p.contractAddress === selectedPassAddress);
            const passTitle = selectedPass?.title || 'NFT Pass';

            sendTransaction(transaction, {
                onSuccess: async () => {
                    setAirdropStatus('success');
                    toast({
                        title: "✅ Pase Enviado",
                        description: `${passTitle} otorgado a ${airdropAddress.substring(0, 8)}...`,
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
                        Administra el pase del sistema y crea nuevos contratos de acceso para tu ecosistema.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => fetchAvailablePasses()}
                        variant="outline"
                        className="border-zinc-700 text-zinc-400 hover:text-white"
                        title="Refrescar lista"
                    >
                        <Loader2 className={`w-4 h-4 ${loadingPasses ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                        onClick={() => setShowCreateWizard(true)}
                        className="bg-lime-500 hover:bg-lime-400 text-black font-bold"
                    >
                        <Wallet className="w-4 h-4 mr-2" />
                        Crear Nuevo NFT Pass
                    </Button>
                </div>
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

                <div className="flex gap-3 relative z-10 items-center justify-between mt-4 border-t border-zinc-800 pt-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={nftGateEnabled}
                                onCheckedChange={toggleGate}
                                disabled={togglingGate}
                                className="data-[state=checked]:bg-lime-500"
                            />
                            <span className="text-sm font-medium text-zinc-300">
                                {nftGateEnabled ? "Gate Activo" : "Gate Inactivo"}
                            </span>
                        </div>
                        {togglingGate && <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={() => {
                                setSelectedPassAddress(config.applyPassNftAddress);
                                setShowAirdropModal(true);
                            }}
                            className="bg-lime-500 text-black hover:bg-lime-400"
                        >
                            <Send className="w-4 h-4 mr-2" />
                            Airdrop Pass
                        </Button>
                    </div>
                </div>
            </div>

            {/* List of Other NFT Passes */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-lime-500" />
                        Tus NFT Passes Deployed
                    </h3>
                    <span className="text-xs text-zinc-500 font-mono">
                        Total: {availablePasses.length}
                    </span>
                </div>

                {loadingPasses ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 h-32 animate-pulse" />
                        ))}
                    </div>
                ) : availablePasses.length <= 1 ? (
                    <div className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-xl p-12 text-center">
                        <div className="w-12 h-12 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Wallet className="w-6 h-6 text-zinc-600" />
                        </div>
                        <p className="text-zinc-500 text-sm">No has creado NFT Passes adicionales aún.</p>
                        <Button
                            variant="link"
                            className="text-lime-500 hover:text-lime-400 mt-2"
                            onClick={() => setShowCreateWizard(true)}
                        >
                            Comienza creando uno ahora →
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availablePasses.map((pass) => {
                            // Skip the system pass in the secondary list as it's already shown above
                            if (pass.contractAddress === config.applyPassNftAddress) return null;

                            return (
                                <div key={pass.id} className="group bg-zinc-900/60 border border-zinc-800 hover:border-lime-500/30 rounded-xl p-5 transition-all hover:shadow-xl hover:shadow-lime-500/5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 bg-gradient-to-br from-zinc-800 to-black rounded-lg flex items-center justify-center border border-zinc-700 text-lime-500 font-bold group-hover:border-lime-500/50 transition-colors">
                                            {pass.symbol.charAt(0)}
                                        </div>
                                        <Badge variant="outline" className="bg-black/50 text-[10px] border-zinc-700 text-zinc-400">
                                            {pass.symbol}
                                        </Badge>
                                    </div>

                                    <h4 className="font-bold text-white mb-1 truncate">{pass.title}</h4>
                                    <p className="text-xs text-zinc-500 font-mono mb-4 truncate" title={pass.contractAddress}>
                                        {pass.contractAddress.substring(0, 10)}...{pass.contractAddress.substring(34)}
                                    </p>

                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => {
                                                setSelectedPassAddress(pass.contractAddress);
                                                setShowAirdropModal(true);
                                            }}
                                            className="w-full bg-zinc-800 hover:bg-lime-500 hover:text-black border border-zinc-700 text-sm py-1 h-8 transition-all"
                                        >
                                            <Send className="w-3 h-3 mr-2" />
                                            Airdrop
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
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
                            {/* NFT Pass Selector */}
                            <div className="space-y-2">
                                <label htmlFor="pass-select" className="text-xs text-zinc-500 uppercase font-semibold flex items-center gap-2">
                                    <span className="text-amber-500">🎫</span>
                                    Selecciona el NFT Pass
                                </label>
                                {loadingPasses ? (
                                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Cargando NFT Passes...
                                    </div>
                                ) : (
                                    <select
                                        id="pass-select"
                                        value={selectedPassAddress}
                                        onChange={(e) => {
                                            setSelectedPassAddress(e.target.value);
                                            setBalanceCheckValue(null); // Reset balance check
                                        }}
                                        className="w-full px-3 py-2 bg-black/50 border border-zinc-700 rounded-md text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-lime-500/50"
                                    >
                                        {availablePasses.map((pass) => (
                                            <option key={pass.contractAddress} value={pass.contractAddress}>
                                                {pass.symbol} - {pass.title}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {selectedPassAddress && (
                                    <p className="text-xs text-zinc-500 font-mono">
                                        Contrato: {selectedPassAddress.substring(0, 8)}...{selectedPassAddress.substring(36)}
                                    </p>
                                )}
                            </div>

                            {/* Wallet Address Input */}
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

            <CreateNFTPassModal
                isOpen={showCreateWizard}
                onClose={() => setShowCreateWizard(false)}
                onSuccess={() => {
                    // Refresh contract stats after creation
                    refetchSupply();
                    refetchBalance();
                    // Refresh available passes list
                    fetchAvailablePasses();
                }}
            />

        </div>
    );
}
