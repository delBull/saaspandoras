import { useState } from "react";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { getContract, prepareContractCall } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { config } from "@/config";
import { governanceABI } from "@/lib/governance-abi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TransactionButton } from "thirdweb/react";
import { toast } from "sonner";
import { Loader2, Lock, Unlock, AlertTriangle } from "lucide-react";

interface GovernanceWithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
}

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function GovernanceWithdrawModal({ isOpen, onClose }: GovernanceWithdrawModalProps) {
    const account = useActiveAccount();
    const targetChain = config.governanceChain;

    const contract = getContract({
        client,
        chain: targetChain,
        address: config.governanceContractAddress,
        abi: governanceABI as any
    });

    const { data: userDeposits, isLoading } = useReadContract({
        contract,
        method: "getUserDeposits",
        params: [account?.address || "0x0000000000000000000000000000000000000000"]
    });

    // Lockup Period (read from contract or config, assuming 180 days for now or read from contract if needed)
    // For demo purposes, we'll mark them based on timestamp.
    const LOCKUP_SECONDS = 180 * 24 * 60 * 60;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Recompensas y Retiros</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="bg-blue-900/20 border border-blue-800 p-4 rounded-xl flex gap-3">
                        <AlertTriangle className="text-blue-400 w-5 h-5 shrink-0" />
                        <p className="text-sm text-blue-200">
                            Los depósitos generan recompensas pero están sujetos a un periodo de bloqueo de 180 días.
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-lime-500" /></div>
                    ) : !userDeposits || userDeposits.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No tienes depósitos activos.</p>
                    ) : (
                        <div className="space-y-3">
                            {userDeposits.map((dep: any, index: number) => {
                                const isWithdrawn = (dep.flags & 1) !== 0; // Bit 0 check
                                if (isWithdrawn) return null; // Skip already withdrawn

                                const amountVal = dep.token === 0
                                    ? Number(dep.amount) / 1e18
                                    : Number(dep.amount) / 1e6;
                                const symbol = dep.token === 0 ? "ETH" : "USDC";
                                const depositTime = Number(dep.timestamp);
                                const unlockTime = depositTime + LOCKUP_SECONDS;
                                const isLocked = Date.now() / 1000 < unlockTime;
                                const unlockDate = new Date(unlockTime * 1000).toLocaleDateString();

                                // Calculate remaining days
                                const remainingMs = (unlockTime * 1000) - Date.now();
                                const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

                                return (
                                    <div key={index} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-white text-lg">{amountVal.toLocaleString()} {symbol}</p>
                                            <p className="text-xs text-gray-400">Desbloqueo: {unlockDate}</p>
                                        </div>

                                        {isLocked ? (
                                            <TooltipProvider delayDuration={0}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span tabIndex={0}> {/* Wrapper for disabled element accessibility */}
                                                            <Button variant="ghost" disabled className="text-yellow-500 bg-yellow-500/10 opacity-50 cursor-not-allowed border border-yellow-500/20">
                                                                <Lock className="w-4 h-4 mr-2" /> Bloqueado
                                                            </Button>
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-zinc-900 border-zinc-800 text-white">
                                                        <p>Reglas no cumplidas: Periodo de bloqueo activo.</p>
                                                        <p className="text-xs text-yellow-400 mt-1">Faltan {remainingDays} días.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ) : (
                                            <TransactionButton
                                                transaction={() => prepareContractCall({
                                                    contract,
                                                    method: "withdraw",
                                                    params: [BigInt(index)] // Pass index of deposit
                                                })}
                                                onTransactionConfirmed={() => {
                                                    toast.success("Retiro Exitoso");
                                                    onClose();
                                                }}
                                                theme="dark"
                                                className="!bg-lime-500 !text-black hover:!bg-lime-400 !px-4 !py-2 !h-auto !text-sm !font-bold"
                                            >
                                                <Unlock className="w-4 h-4 mr-2" /> Reclamar
                                            </TransactionButton>
                                        )}
                                    </div>
                                );
                            })}
                            {userDeposits.every((d: any) => (d.flags & 1) !== 0) && (
                                <p className="text-center text-gray-500 py-4">Todos tus depósitos han sido retirados.</p>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
