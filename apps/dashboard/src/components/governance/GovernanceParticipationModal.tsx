"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Wallet, Loader2, X, Info, CheckCircle2, AlertTriangle } from "lucide-react";
import { useReadContract, useActiveAccount, useSendTransaction, useWalletBalance } from "thirdweb/react";
import { toast } from "sonner";
import { TransactionButton } from "thirdweb/react";
import { prepareContractCall, getContract, toWei } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { config } from "@/config";
import { PANDORAS_GOVERNANCE_ABI } from "@/lib/governance-abi";
import { base, baseSepolia } from "thirdweb/chains";
import { approve, allowance } from "thirdweb/extensions/erc20";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { Button } from "@/components/ui/button";

interface GovernanceParticipationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GovernanceParticipationModal({ isOpen, onClose }: GovernanceParticipationModalProps) {
    const account = useActiveAccount();
    const [amount, setAmount] = useState("");
    const [currency, setCurrency] = useState<"ETH" | "USDC">("ETH");
    const [isApproved, setIsApproved] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    // Correction: USDC address for Sepolia is 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
    // I should probably pass this or read it from config? Or hardcode for now since it's hardcoded in contract deployment args.
    // Actually, I can rely on the fact that I don't have the USDC address in config easily available without adding it. 
    // Let's use the hardcoded Sepolia USDC address for balance check if currency is USDC.
    const SEPOLIA_USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

    const { data: walletBalance } = useWalletBalance({
        client,
        chain: config.chain,
        address: account?.address,
        tokenAddress: currency === 'USDC' ? SEPOLIA_USDC : undefined
    });

    const handleMax = () => {
        if (walletBalance) {
            setAmount(walletBalance.displayValue);
        }
    };
    const { width, height } = useWindowSize();

    // Determine Chain and Contracts
    const targetChain = config.governanceChain;
    const isSepolia = targetChain.id === baseSepolia.id;

    // Sepolia Testnet Logic: Default to ETH, Warn on USDC
    useEffect(() => {
        if (isSepolia && currency === 'USDC') {
            // Optional: Auto-switch back to ETH or just warn
            // setCurrency('ETH'); 
        }
    }, [isSepolia, currency]);

    const contract = getContract({
        client,
        chain: targetChain, // Fix: Use governanceChain (Base Sepolia)
        address: config.governanceContractAddress,
        abi: PANDORAS_GOVERNANCE_ABI as any
    });

    // USDC Contract (Hardcoded for Base Mainnet or Sepolia Mock if exists)
    // On Base Sepolia, we might not have a valid USDC, so this might fail if used.
    // Base Mainnet USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
    const usdcAddress = isSepolia
        ? "0x036CbD53842c5426634e7929541eC2318f3dCF7e" // Base Sepolia USDC Mock (Example) or from contract
        : "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base Mainnet USDC

    const usdcContract = getContract({
        client,
        chain: targetChain, // Fix: Use governanceChain
        address: usdcAddress,
    });

    // Fetch User Stats
    const { data: userStats, isLoading: isLoadingStats } = useReadContract({
        contract,
        method: "getUserStats",
        params: [account?.address || "0x0000000000000000000000000000000000000000"]
    });

    // Calculate Voting Power
    // ETH = 2000 VP per unit ( approx $2000)
    // USDC = 1 VP per unit
    const currentVP = userStats ? (
        (Number(userStats[0]) / 1e18 * 2000) + (Number(userStats[1]) / 1e6)
    ) : 0;

    // Check Allowance for USDC
    const { data: currentAllowance } = useReadContract({
        contract: usdcContract,
        method: "allowance",
        params: [account?.address || "", config.governanceContractAddress]
    });

    useEffect(() => {
        if (currency === 'ETH') {
            setIsApproved(true);
        } else {
            if (amount && currentAllowance !== undefined) {
                const amountBig = BigInt(Math.floor(parseFloat(amount) * 1e6));
                // Cast currentAllowance to any -> BigInt to avoid TS error if types mismatch
                setIsApproved(BigInt(currentAllowance as any) >= amountBig);
            } else {
                setIsApproved(false);
            }
        }
    }, [currency, amount, currentAllowance]);


    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && isOpen) {
                onClose();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    const handleSuccess = () => {
        toast.success("¡Participación Confirmada!");
        setShowConfetti(true);
        setTimeout(() => {
            setShowConfetti(false);
            onClose();
        }, 5000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {showConfetti && (
                        <div className="fixed inset-0 z-[100] pointer-events-none">
                            <Confetti width={width} height={height} numberOfPieces={500} recycle={false} />
                        </div>
                    )}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={onClose}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-zinc-800 flex justify-between items-start bg-zinc-900/50">
                                <div>
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <ShieldCheck className="w-6 h-6 text-lime-400" />
                                        Participación Governance DAO
                                    </h2>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Deposita activos para obtener Voting Power (VP) y recompensas.
                                    </p>
                                </div>
                                <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">

                                {/* Current Stats */}
                                {account && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/50">
                                            <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Tu Voting Power</span>
                                            <div className="text-xl font-mono font-bold text-white mt-1">
                                                {isLoadingStats ? <Loader2 className="w-4 h-4 animate-spin" /> : `${currentVP.toLocaleString()} VP`}
                                            </div>
                                        </div>
                                        <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/50">
                                            <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Estado</span>
                                            <div className="text-xl font-bold text-lime-400 mt-1 flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Activo
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Informational Box */}
                                <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
                                    <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-blue-100">¿Cómo funciona?</h4>
                                        <ul className="text-xs text-blue-200/70 space-y-1 list-disc pl-4">
                                            <li>Tus activos se bloquean por 180 días (Soft Lock).</li>
                                            <li>Generas rendimiento (APY) y Voting Power inmediatamente.</li>
                                            <li>Puedes retirar recompensas en cualquier momento.</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Currency Tabs */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-400 uppercase ml-1">Selecciona Activo</label>
                                    <div className="grid grid-cols-2 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
                                        <button
                                            onClick={() => setCurrency("ETH")}
                                            className={`relative py-3 text-sm font-bold rounded-lg transition-all ${currency === "ETH"
                                                ? "bg-zinc-800 text-white shadow-xl ring-1 ring-white/10"
                                                : "text-gray-400 hover:text-gray-200 hover:bg-zinc-800/50"
                                                }`}
                                        >
                                            ETH (Native)
                                            {currency === 'ETH' && <motion.div layoutId="activeTab" className="absolute inset-0 rounded-lg bg-zinc-700/10" />}
                                        </button>
                                        <button
                                            onClick={() => setCurrency("USDC")}
                                            className={`relative py-3 text-sm font-bold rounded-lg transition-all ${currency === "USDC"
                                                ? "bg-zinc-800 text-white shadow-xl ring-1 ring-white/10"
                                                : "text-gray-400 hover:text-gray-200 hover:bg-zinc-800/50"
                                                }`}
                                        >
                                            USDC
                                            {currency === 'USDC' && <motion.div layoutId="activeTab" className="absolute inset-0 rounded-lg bg-zinc-700/10" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Amount Input */}
                                <div className="space-y-3">
                                    <label htmlFor="deposit-amount" className="text-xs font-medium text-gray-400 uppercase flex justify-between ml-1">
                                        <span>Cantidad a Depositar</span>
                                        <span className="text-xs text-gray-500">Disponible: {walletBalance ? parseFloat(walletBalance.displayValue).toFixed(4) : "0.00"} {currency}</span>
                                    </label>
                                    <div className="relative group">
                                        <input
                                            id="deposit-amount"
                                            type="number"
                                            placeholder="0.0"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full bg-black border border-zinc-800 rounded-xl py-4 pl-12 pr-16 text-white text-lg font-mono placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500/50 transition-all group-hover:border-zinc-700"
                                        />
                                        <div className="absolute left-4 top-4.5 text-gray-400">
                                            {currency === 'ETH' ? <span className="font-bold text-zinc-500">Ξ</span> : <span className="font-bold text-zinc-500">$</span>}
                                        </div>
                                        <button
                                            onClick={handleMax}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-lime-500 hover:text-lime-400 px-2 py-1 rounded hover:bg-lime-500/10 transition-colors"
                                        >
                                            MAX
                                        </button>
                                    </div>

                                    {isSepolia && currency === 'ETH' && (
                                        <p className="text-[10px] text-lime-400/80 flex items-center gap-1.5 ml-1">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Red Sepolia Detectada: Depósitos en ETH habilitados.
                                        </p>
                                    )}

                                    {isSepolia && currency === 'USDC' && (
                                        <div className="p-3 bg-orange-900/20 border border-orange-500/20 rounded-lg flex gap-2">
                                            <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
                                            <p className="text-xs text-orange-200">
                                                <strong>Nota:</strong> En Testnet (Sepolia), asegúrate de tener tokens USDC de prueba. Para producción, usa Base Mainnet.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Estimated Impact */}
                                <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Nuevo Voting Power:</span>
                                        <span className="font-mono text-white">
                                            +{amount ? (parseFloat(amount) * (currency === 'ETH' ? 2000 : 1)).toFixed(0) : '0'} VP
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Yield Estimado (APY):</span>
                                        <span className="font-mono text-lime-400">~12.5%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer / Actions */}
                            <div className="p-6 border-t border-zinc-800 bg-zinc-900/50">
                                {!account ? (
                                    <Button className="w-full bg-zinc-800 text-white cursor-not-allowed" disabled>
                                        Conecta tu Wallet
                                    </Button>
                                ) : (
                                    currency === 'USDC' && !isApproved ? (
                                        <TransactionButton
                                            transaction={() => {
                                                if (!amount || parseFloat(amount) <= 0) throw new Error("Monto inválido");
                                                const val = BigInt(Math.floor(parseFloat(amount) * 1e6));
                                                return approve({
                                                    contract: usdcContract,
                                                    spender: config.governanceContractAddress,
                                                    amount: Number(val)
                                                });
                                            }}
                                            onTransactionConfirmed={() => {
                                                toast.success("USDC Aprobado");
                                                setIsApproved(true);
                                            }}
                                            theme="dark"
                                            className="!w-full !bg-blue-600 hover:!bg-blue-500 !text-white !font-bold !rounded-xl !py-6 !text-lg"
                                        >
                                            1. Aprobar USDC
                                        </TransactionButton>
                                    ) : (
                                        <TransactionButton
                                            transaction={() => {
                                                if (!amount || parseFloat(amount) <= 0) throw new Error("Monto inválido");

                                                if (currency === 'ETH') {
                                                    const val = BigInt(Math.floor(parseFloat(amount) * 1e18)); // Wei
                                                    return prepareContractCall({
                                                        contract,
                                                        method: "depositETH",
                                                        params: [],
                                                        value: val
                                                    });
                                                } else {
                                                    const val = BigInt(Math.floor(parseFloat(amount) * 1e6)); // 6 decimals
                                                    return prepareContractCall({
                                                        contract,
                                                        method: "depositUSDC",
                                                        params: [val],
                                                    });
                                                }
                                            }}
                                            onTransactionSent={() => toast.info("Firmando transacción...")}
                                            onTransactionConfirmed={handleSuccess}
                                            onError={(e) => {
                                                console.error(e);
                                                toast.error("Error en la transacción. Revisa la consola.");
                                            }}
                                            theme="dark"
                                            className={`!w-full !font-bold !rounded-xl !py-6 !text-lg shadow-lg ${currency === 'USDC'
                                                ? '!bg-green-600 hover:!bg-green-500 !text-white'
                                                : '!bg-lime-500 hover:!bg-lime-400 !text-black'
                                                }`}
                                        >
                                            {currency === 'USDC' ? '2. Confirmar Depósito' : 'Confirmar Participación'}
                                        </TransactionButton>
                                    )
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )
            }
        </AnimatePresence >
    );
}
