'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@saasfly/ui/use-toast";
import { Loader2, ShieldCheck, Send, BarChart2, CheckCircle2, AlertTriangle, Wallet, Download, ExternalLink, Pencil, QrCode as LucideQrCode, Copy } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useActiveAccount, useReadContract, useSendTransaction } from "thirdweb/react";
import { getContract, prepareContractCall, readContract } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { config } from "@/config";
import { PANDORAS_KEY_ABI } from "@/lib/pandoras-key-abi";
import { CreateNFTPassModal } from "./CreateNFTPassModal";
import { NFTTypeInfoModal } from "./NFTTypeInfoModal";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@saasfly/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { IdentificationIcon, GiftIcon, TicketIcon, QrCodeIcon } from "@heroicons/react/24/outline";

// Extend the ABI to include missing standard items + adminMint
const EXTENDED_ABI = [
    ...PANDORAS_KEY_ABI,
    {
        "inputs": [{ "name": "quantity", "type": "uint256" }],
        "name": "mintWithPayment",
        "outputs": [],
        "stateMutability": "payable",
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
    const [showInfoModal, setShowInfoModal] = useState(false);

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
        nftType?: string;
        shortlinkSlug?: string;
        targetUrl?: string;
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

    // 5. Dynamic QRs Logic (Lifted State)
    const [shortlinks, setShortlinks] = useState<any[]>([]);
    const [loadingShortlinks, setLoadingShortlinks] = useState(true);

    const fetchShortlinks = async () => {
        try {
            const res = await fetch("/api/admin/shortlinks?show_all=true", {
                headers: { "x-wallet-address": account?.address || "" }
            });
            if (res.ok) {
                const data = await res.json();
                setShortlinks(data.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingShortlinks(false);
        }
    };

    useEffect(() => {
        if (account?.address) {
            fetchSettings();
            fetchAvailablePasses();
            fetchShortlinks();
        }
    }, [account?.address]);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/settings?key=apply_gate_enabled", {
                headers: {
                    "x-wallet-address": account?.address || ""
                }
            });
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
            const res = await fetch("/api/admin/nft-passes", {
                headers: {
                    "x-wallet-address": account?.address || "",
                    "x-thirdweb-address": account?.address || ""
                }
            });
            if (res.ok) {
                const passes = await res.json();
                // Add the Apply Pass manually if not in list
                const applyPass = {
                    id: 'system-apply-pass',
                    title: 'Apply Access Pass (Sistema)',
                    contractAddress: config.applyPassNftAddress,
                    symbol: 'APPLY',
                    imageUrl: null,
                    nftType: 'access'
                };
                setAvailablePasses([applyPass, ...passes]);
                console.log('✅ Loaded NFT Passes:', [applyPass, ...passes]);
            } else {
                console.error('❌ Failed to fetch NFT passes:', res.status, res.statusText);
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
                method: "mintWithPayment",
                params: [1n],
                value: 0n
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

    // 6. QR Management Logic
    const [viewingQR, setViewingQR] = useState<any>(null);
    const [editingQR, setEditingQR] = useState<any>(null);
    const [editTargetUrl, setEditTargetUrl] = useState("");
    const [savingQR, setSavingQR] = useState(false);

    const handleViewQR = (pass: any) => {
        setViewingQR(pass);
    };

    const handleEditQR = (pass: any) => {
        setEditingQR(pass);
        // Find existing link data if dynamic
        if (pass.shortlinkSlug) {
            const link = shortlinks.find((sl: any) => sl.slug === pass.shortlinkSlug);
            if (link) {
                setEditTargetUrl(link.destinationUrl);
            }
        }
    };

    const handleSaveQREdit = async () => {
        if (!editingQR?.shortlinkSlug) return;
        setSavingQR(true);
        try {
            // Find the ID of the shortlink to update
            const link = shortlinks.find((sl: any) => sl.slug === editingQR.shortlinkSlug);
            if (!link) throw new Error("Shortlink not found");

            const res = await fetch("/api/admin/shortlinks", {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "x-wallet-address": account?.address || "" },
                body: JSON.stringify({ id: link.id, destinationUrl: editTargetUrl })
            });

            if (!res.ok) throw new Error("Failed to update");

            toast({ title: "QR Actualizado", description: "La URL de destino ha sido modificada." });
            setEditingQR(null);
            fetchShortlinks(); // Refresh data
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "No se pudo actualizar el QR.", variant: "destructive" });
        } finally {
            setSavingQR(false);
        }
    };

    const downloadQR = async (slugOrUrl: string, isSlug: boolean) => {
        try {
            const QRCodeLib = (await import("qrcode")).default;
            const getExplorerUrl = (address: string) => {
                const chainId = config.chain.id;
                if (chainId === 8453) return `https://basescan.org/address/${address}`;
                if (chainId === 11155111) return `https://sepolia.etherscan.io/address/${address}`;
                if (chainId === 84532) return `https://sepolia.basescan.org/address/${address}`;
                return `https://etherscan.io/address/${address}`;
            };

            const url = isSlug ? `${window.location.origin}/${slugOrUrl}` : (slugOrUrl.startsWith('0x') ? getExplorerUrl(slugOrUrl) : slugOrUrl);
            const filename = isSlug ? `qr-${slugOrUrl}.png` : `qr-redirect.png`;

            const dataUrl = await QRCodeLib.toDataURL(url, { width: 1000, margin: 2 });
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error("QR Download failed", e);
            toast({ title: "Error", description: "Fallo al generar imagen del QR.", variant: "destructive" });
        }
    };

    // Filter passes to show only valid Access Passes (not QRs)
    const displayPasses = availablePasses.filter(p => p.contractAddress === config.applyPassNftAddress || (p as any).nftType !== 'qr');

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-lime-400 to-emerald-500">
                        NFT Lab
                    </h2>
                    <p className="text-zinc-400 text-sm">
                        Crea Pases de Acceso, Identidades Digitales y QRs Dinámicos con *Landings para tu ecosistema.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => { fetchAvailablePasses(); fetchShortlinks(); }}
                        variant="outline"
                        className="border-zinc-700 text-zinc-400 hover:text-white"
                        title="Refrescar lista"
                    >
                        <Loader2 className={`w-4 h-4 ${loadingPasses ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                        onClick={() => setShowInfoModal(true)}
                        variant="outline"
                        className="bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-lime-500 hover:border-lime-500/50"
                        title="Información sobre tipos de NFT"
                    >
                        <Info className="w-4 h-4" />
                    </Button>
                    <Button
                        onClick={() => setShowCreateWizard(true)}
                        className="bg-lime-500 hover:bg-lime-400 text-black font-bold"
                    >
                        <Wallet className="w-4 h-4 mr-2" />
                        Crear Nuevo NFT / QR
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

            {/* Tabs Organization */}
            <Tabs defaultValue="all" className="w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <TabsList className="bg-zinc-900 border border-zinc-800">
                        <TabsTrigger value="all">Todo</TabsTrigger>
                        <TabsTrigger value="access">Access Passes</TabsTrigger>
                        <TabsTrigger value="identity">Identidad (SBT)</TabsTrigger>
                        <TabsTrigger value="coupon">Cupones</TabsTrigger>
                        <TabsTrigger value="qr" className="flex items-center gap-2">
                            <QrCodeIcon className="w-4 h-4" />
                            Smart QRs
                        </TabsTrigger>
                    </TabsList>

                    <span className="text-xs text-zinc-500 font-mono">
                        Total Assets: {availablePasses.filter(p => p.contractAddress !== config.applyPassNftAddress).length}
                    </span>
                </div>

                {/* Helper to render pass list */}
                {['all', 'access', 'identity', 'coupon'].map((tabValue) => (
                    <TabsContent key={tabValue} value={tabValue} className="space-y-4">
                        {loadingPasses ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 h-32 animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {availablePasses
                                    .filter(p => {
                                        if (p.contractAddress === config.applyPassNftAddress) return false; // Hide system pass
                                        if (tabValue === 'all') return true;
                                        return (p as any).nftType === tabValue;
                                    })
                                    .map((pass) => (
                                        <div key={pass.id} className="group bg-zinc-900/60 border border-zinc-800 hover:border-lime-500/30 rounded-xl p-5 transition-all hover:shadow-xl hover:shadow-lime-500/5">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border border-zinc-700 font-bold transition-colors
                                                    ${(pass as any).nftType === 'qr' ? 'bg-lime-500/10 text-lime-400 border-lime-500/30' :
                                                        (pass as any).nftType === 'identity' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
                                                            (pass as any).nftType === 'coupon' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                                                                'bg-gradient-to-br from-zinc-800 to-black text-indigo-400'
                                                    }`}>
                                                    {(pass as any).nftType === 'qr' ? <QrCodeIcon className="w-5 h-5" /> :
                                                        (pass as any).nftType === 'identity' ? <IdentificationIcon className="w-5 h-5" /> :
                                                            (pass as any).nftType === 'coupon' ? <GiftIcon className="w-5 h-5" /> :
                                                                pass.symbol.charAt(0)}
                                                </div>
                                                <Badge variant="outline" className="bg-black/50 text-[10px] border-zinc-700 text-zinc-400">
                                                    {pass.symbol}
                                                </Badge>
                                            </div>

                                            <h4 className="font-bold text-white mb-1 truncate">{pass.title}</h4>
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="text-xs text-zinc-500 font-mono truncate max-w-[120px]" title={pass.contractAddress}>
                                                    {pass.contractAddress.substring(0, 6)}...{pass.contractAddress.substring(38)}
                                                </p>
                                                <Badge variant="secondary" className="text-[10px] h-5 bg-zinc-800 text-zinc-400 hover:bg-zinc-700">
                                                    {(pass as any).nftType?.toUpperCase() || 'ACCESS'}
                                                </Badge>
                                            </div>

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
                                                <Button
                                                    onClick={() => navigator.clipboard.writeText(pass.contractAddress)}
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 border border-zinc-700 bg-zinc-900/50"
                                                    title="Copiar Address"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                {availablePasses.filter(p => p.contractAddress !== config.applyPassNftAddress && (tabValue === 'all' || (p as any).nftType === tabValue)).length === 0 && (
                                    <div className="col-span-full bg-zinc-900/20 border border-dashed border-zinc-800 rounded-xl p-12 text-center">
                                        <div className="w-12 h-12 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Wallet className="w-6 h-6 text-zinc-600" />
                                        </div>
                                        <p className="text-zinc-500 text-sm">No hay Assets de tipo {tabValue === 'all' ? '' : tabValue.toUpperCase()} aún.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>
                ))}

                <TabsContent value="qr" className="space-y-8">
                    {/* QR Contracts (Assets) */}
                    <div>
                        <h4 className="text-sm font-bold text-zinc-400 mb-4 uppercase tracking-wider">Contratos Smart QR</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {availablePasses
                                .filter(p => (p as any).nftType === 'qr')
                                .map((pass) => (
                                    <div key={pass.id} className="group bg-zinc-900/60 border border-zinc-800 hover:border-lime-500/30 rounded-xl p-5 transition-all relative overflow-hidden">
                                        {/* Dynamic Badge */}
                                        {(pass as any).shortlinkSlug && (
                                            <div className={`absolute top-0 right-0 ${(pass as any).shortlinkType === 'landing' ? 'bg-indigo-500 text-white' : 'bg-lime-500 text-black'} text-[9px] font-bold px-2 py-1 rounded-bl-lg z-10`}>
                                                {(pass as any).shortlinkType === 'landing' ? 'LANDING' : 'DINÁMICO'}
                                            </div>
                                        )}

                                        <div className="flex justify-between items-start mb-4">
                                            <button
                                                onClick={() => handleViewQR(pass)}
                                                className="w-10 h-10 rounded-lg bg-lime-500/10 text-lime-400 border border-lime-500/30 flex items-center justify-center font-bold hover:bg-lime-500/20 transition-colors"
                                                title="Ver Código QR"
                                            >
                                                <QrCodeIcon className="w-5 h-5" />
                                            </button>
                                            <Badge variant="outline" className="bg-black/50 text-[10px] border-zinc-700 text-zinc-400">
                                                {pass.symbol}
                                            </Badge>
                                        </div>

                                        <h4 className="font-bold text-white mb-1 truncate">{pass.title}</h4>
                                        <p className="text-xs text-zinc-500 font-mono mb-4 truncate" title={pass.contractAddress}>{pass.contractAddress}</p>

                                        <div className="flex flex-col gap-2">
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => {
                                                        const isDynamic = !!(pass as any).shortlinkSlug;
                                                        const target = isDynamic ? (pass as any).shortlinkSlug : ((pass as any).targetUrl || pass.contractAddress);
                                                        downloadQR(target, isDynamic);
                                                    }}
                                                    className="flex-1 bg-lime-500/10 text-lime-400 border border-lime-500/30 hover:bg-lime-500/20 text-xs h-8 font-bold"
                                                    title="Descargar PNG"
                                                >
                                                    <Download className="w-3 h-3 mr-2" />
                                                    Descargar
                                                </Button>

                                                {(pass as any).shortlinkSlug && (
                                                    <Button
                                                        onClick={() => {
                                                            const url = `${window.location.origin}/${(pass as any).shortlinkSlug}`;
                                                            window.open(url, '_blank');
                                                        }}
                                                        className={`flex-1 ${(pass as any).shortlinkType === 'landing' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20'} text-[10px] h-8 font-bold border`}
                                                        title={(pass as any).shortlinkType === 'landing' ? "Ver Landing Page" : "Ver Enlace Corto"}
                                                    >
                                                        <ExternalLink className="w-3 h-3 mr-1" />
                                                        {(pass as any).shortlinkType === 'landing' ? 'Landing' : 'Ver Link'}
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="flex gap-2">
                                                {(pass as any).shortlinkSlug ? (
                                                    <Button
                                                        onClick={() => handleEditQR(pass)}
                                                        className="flex-1 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/30 text-xs h-8 font-bold"
                                                    >
                                                        <Pencil className="w-3 h-3 mr-2" />
                                                        Editar Destino
                                                    </Button>
                                                ) : (
                                                    <Button disabled className="flex-1 bg-zinc-800 text-zinc-500 border border-zinc-700 text-xs h-8 cursor-not-allowed opacity-50 font-bold" title="QR Estático (No editable)">
                                                        <ShieldCheck className="w-3 h-3 mr-2" />
                                                        Estático
                                                    </Button>
                                                )}

                                                <Button
                                                    onClick={() => {
                                                        setSelectedPassAddress(pass.contractAddress);
                                                        setShowAirdropModal(true);
                                                    }}
                                                    className="flex-1 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/40 text-xs h-8 font-bold"
                                                >
                                                    <Send className="w-3 h-3 mr-2" />
                                                    Enviar
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            {availablePasses.filter(p => (p as any).nftType === 'qr').length === 0 && (
                                <div className="col-span-full text-center py-8 text-zinc-500 text-sm italic border border-dashed border-zinc-800 rounded-lg">
                                    No tienes contratos de tipo QR desplegados.
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

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
                                    disabled={!/^0x[a-fA-F0-9]{40}$/.test(airdropAddress)}
                                    className="bg-purple-500 text-white hover:bg-purple-600 font-bold"
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Enviar Pase
                                </Button>
                            </DialogFooter>

                            {/* Sharing Options even before success if they want to share the link */}
                            <div className="pt-4 border-t border-zinc-800">
                                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-3">Compartir Enlace del Proyecto</p>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => {
                                            const pass = availablePasses.find(p => p.contractAddress === selectedPassAddress);
                                            const slug = (pass as any)?.shortlinkSlug;
                                            const url = slug ? `${window.location.origin}/${slug}` : (pass as any)?.targetUrl || window.location.origin;
                                            const msg = `¡Mira este NFT! Revísalo aquí: ${url}`;
                                            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                                        }}
                                        size="sm"
                                        className="flex-1 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 hover:bg-[#25D366]/20 text-[11px]"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FaWhatsapp className="w-3 h-3" />
                                            Compartir
                                        </div>
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            const pass = availablePasses.find(p => p.contractAddress === selectedPassAddress);
                                            const slug = (pass as any)?.shortlinkSlug;
                                            const url = slug ? `${window.location.origin}/${slug}` : (pass as any)?.targetUrl || window.location.origin;
                                            navigator.clipboard.writeText(url);
                                            toast({ title: "Copiado", description: "Enlace copiado" });
                                        }}
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 border-zinc-700 text-zinc-400 text-[11px]"
                                    >
                                        <Copy className="w-3 h-3 mr-1" />
                                        Copiar Link
                                    </Button>
                                </div>
                            </div>
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
                        <div className="flex flex-col items-center py-6">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20">
                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">¡Pase Enviado!</h3>
                            <p className="text-zinc-400 text-sm mb-6 text-center px-4">El usuario ha recibido su Apply Pass correctamente.</p>

                            <div className="flex gap-2 w-full mt-4">
                                <Button
                                    onClick={() => {
                                        const msg = `¡Acabo de enviarte un Pase de Acceso! Revísalo aquí: ${window.location.origin}`;
                                        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                                    }}
                                    className="flex-1 bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/30 font-bold"
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Compartir
                                </Button>
                                <Button
                                    onClick={() => {
                                        const url = `${window.location.origin}`;
                                        navigator.clipboard.writeText(url);
                                        toast({ title: "Copiado", description: "Enlace copiado al portapapeles" });
                                    }}
                                    variant="outline"
                                    className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                                >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Copiar Link
                                </Button>
                            </div>

                            <Button
                                variant="ghost"
                                className="w-full mt-2 text-zinc-500 hover:text-white"
                                onClick={() => { setAirdropStatus('idle'); setShowAirdropModal(false); }}
                            >
                                Cerrar
                            </Button>
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

            {/* View QR Dialog */}
            <Dialog open={!!viewingQR} onOpenChange={(o) => !o && setViewingQR(null)}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Código QR: {viewingQR?.title}</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            {(viewingQR as any)?.shortlinkSlug ? "QR Dinámico" : "QR Estático"} - Escanea para probar.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl">
                        {viewingQR && (
                            <QRGenerator
                                value={
                                    (viewingQR as any).shortlinkSlug
                                        ? `${window.location.origin}/${(viewingQR as any).shortlinkSlug}`
                                        : ((viewingQR as any).targetUrl || (
                                            config.chain.id === 8453 ? `https://basescan.org/address/${viewingQR.contractAddress}` :
                                                config.chain.id === 11155111 ? `https://sepolia.etherscan.io/address/${viewingQR.contractAddress}` :
                                                    config.chain.id === 84532 ? `https://sepolia.basescan.org/address/${viewingQR.contractAddress}` :
                                                        `https://etherscan.io/address/${viewingQR.contractAddress}`
                                        ))
                                }
                            />
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={() => {
                                const isDynamic = !!(viewingQR as any).shortlinkSlug;
                                const target = isDynamic ? (viewingQR as any).shortlinkSlug : ((viewingQR as any).targetUrl || viewingQR.contractAddress);
                                downloadQR(target, isDynamic);
                            }}
                            className="w-full bg-lime-500 text-black hover:bg-lime-400 font-bold"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Descargar PNG
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit QR Dialog */}
            <Dialog open={!!editingQR} onOpenChange={(o) => !o && setEditingQR(null)}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Editar Destino</DialogTitle>
                        <DialogDescription>Cambia la URL de destino del QR dinámico.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="p-3 bg-black/40 rounded-lg flex items-center justify-between">
                            <code className="text-lime-400 text-sm">pandoras.finance/{editingQR?.shortlinkSlug}</code>
                            <Badge variant="outline" className="text-[10px]">QR Code</Badge>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="edit-url" className="text-xs text-zinc-500 uppercase font-bold">Nueva URL de Destino</label>
                            <Input
                                id="edit-url"
                                value={editTargetUrl}
                                onChange={(e) => setEditTargetUrl(e.target.value)}
                                className="bg-zinc-800 text-white border-zinc-700 font-mono text-sm"
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setEditingQR(null)}>Cancelar</Button>
                        <Button onClick={handleSaveQREdit} disabled={savingQR} className="bg-lime-500 text-black hover:bg-lime-400">
                            {savingQR ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Cambios"}
                        </Button>
                    </DialogFooter>
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
                    // Refresh shortlinks
                    fetchShortlinks();
                }}
            />

            <NFTTypeInfoModal
                open={showInfoModal}
                onOpenChange={setShowInfoModal}
            />
        </div>
    );
}

function QRGenerator({ value }: { value: string }) {
    const [src, setSrc] = useState("");

    useEffect(() => {
        if (!value) return;
        import("qrcode").then(QRCode => {
            QRCode.toDataURL(value, { width: 400, margin: 2 })
                .then(setSrc)
                .catch(console.error);
        });
    }, [value]);

    if (!src) return <div className="w-64 h-64 bg-zinc-100 animate-pulse rounded-lg" />;
    return <img src={src} alt="QR Code" className="w-64 h-64" />;
}


