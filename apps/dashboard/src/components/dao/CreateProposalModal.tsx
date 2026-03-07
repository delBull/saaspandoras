"use client";

import { useState } from "react";
import { toast } from "sonner";
import { XIcon, BanknoteIcon, FileTextIcon } from "lucide-react";
import { TransactionButton } from "thirdweb/react";
import { prepareContractCall, getContract, defineChain } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { encodeFunctionData, parseUnits } from "viem";

interface CreateProposalModalProps {
    projectId: number;
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
    votingContractAddress?: string;
    chainId?: number;
}

export function CreateProposalModal({ projectId, isOpen, onClose, onCreated, votingContractAddress, chainId }: CreateProposalModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    // Proposal Logic
    const [actionType, setActionType] = useState<'text' | 'transfer'>('text');
    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [tokenAddress, setTokenAddress] = useState(""); // Empty for native
    const [decimals, setDecimals] = useState(18);

    // Mode: On-Chain vs Database
    // Default to Off-Chain (Free) if no contract, OR if user prefers.
    // We initiate based on contract existence, but allow toggle.
    const hasVotingContract = !!votingContractAddress;
    const [submissionMode, setSubmissionMode] = useState<'onchain' | 'offchain'>(hasVotingContract ? 'onchain' : 'offchain');

    const isOffChain = submissionMode === 'offchain';
    const [isLoading, setIsLoading] = useState(false);

    // On-Chain State
    const contract = votingContractAddress && chainId ? getContract({
        client,
        chain: defineChain(chainId),
        address: votingContractAddress
    }) : undefined;

    if (!isOpen) return null;

    const handleSubmitOffChain = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("/api/governance-events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    title,
                    description,
                    type: 'off_chain_signal', // Changed from on_chain_proposal for DB events
                    startDate: new Date().toISOString(),
                    status: 'active'
                }),
            });

            if (!res.ok) throw new Error("Failed to create off-chain event");

            toast.success("Evento creado (Off-Chain)");
            onCreated();
            onClose();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const getProposalParams = () => {
        if (actionType === 'text') {
            return {
                targets: [],
                values: [],
                calldatas: [],
                description: `${title}\n\n${description}`
            };
        }

        // Transfer Logic
        try {
            const val = parseUnits(amount, decimals);

            if (!tokenAddress) {
                // Native Transfer
                return {
                    targets: [recipient],
                    values: [val],
                    calldatas: ["0x"],
                    description: `${title}\n\n${description}\n\n[Transfer: ${amount} Native to ${recipient}]`
                };
            } else {
                // ERC20 Transfer
                const calldata = encodeFunctionData({
                    abi: [{ type: 'function', name: 'transfer', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] }],
                    functionName: 'transfer',
                    args: [recipient, val]
                });
                return {
                    targets: [tokenAddress],
                    values: [0n],
                    calldatas: [calldata],
                    description: `${title}\n\n${description}\n\n[Transfer: ${amount} ERC20 (${tokenAddress}) to ${recipient}]`
                };
            }
        } catch (e) {
            console.error("Error parsing proposal params", e);
            throw new Error("Invalid proposal parameters");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
                    <XIcon className="w-5 h-5" />
                </button>

                <h3 className="text-xl font-bold text-white mb-4">
                    {isOffChain ? "Nueva Propuesta (Gratis)" : "Nueva Propuesta On-Chain"}
                </h3>

                {/* Sub-Header / Mode Selection for Text Proposals */}
                {hasVotingContract && actionType === 'text' && (
                    <div className="flex items-center gap-2 mb-4 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                        <button
                            type="button"
                            onClick={() => setSubmissionMode('offchain')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${submissionMode === 'offchain' ? 'bg-zinc-800 text-lime-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Off-Chain (Gratis)
                        </button>
                        <button
                            type="button"
                            onClick={() => setSubmissionMode('onchain')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${submissionMode === 'onchain' ? 'bg-zinc-800 text-purple-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            On-Chain (Gas)
                        </button>
                    </div>
                )}


                <div className="flex bg-zinc-950 p-1 rounded-lg mb-4">
                    <button
                        type="button"
                        onClick={() => {
                            setActionType('text');
                            // If switching to text, default to offchain if intended for free, but let's keep current mode unless forced
                        }}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${actionType === 'text' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <FileTextIcon className="w-4 h-4" />
                        Texto / Señal
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setActionType('transfer');
                            setSubmissionMode('onchain'); // Transfers MUST be on-chain
                        }}
                        disabled={!hasVotingContract}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${actionType === 'transfer' ? 'bg-zinc-800 text-lime-400 shadow' : 'text-zinc-500 hover:text-zinc-300'} ${!hasVotingContract ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <BanknoteIcon className="w-4 h-4" />
                        Transferencia
                    </button>
                </div>

                <form onSubmit={isOffChain ? handleSubmitOffChain : (e) => e.preventDefault()} className="space-y-4">
                    <div>
                        <label htmlFor="proposal-title" className="block text-sm text-zinc-400 mb-1">Título</label>
                        <input
                            id="proposal-title"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white outline-none focus:border-lime-500"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="proposal-desc" className="block text-sm text-zinc-400 mb-1">Descripción</label>
                        <textarea
                            id="proposal-desc"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white outline-none focus:border-lime-500"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                            placeholder={isOffChain ? "Detalles de la discusión..." : "Detalles de la propuesta..."}
                            required
                        />
                    </div>

                    {/* Only show Transfer Details if Transfer Mode AND OnChain */}
                    {actionType === 'transfer' && !isOffChain && (
                        <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800 space-y-3">
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Detalles de Transferencia</p>

                            <div>
                                <label htmlFor="transfer-recipient" className="block text-xs text-zinc-400 mb-1">Destinatario (Wallet)</label>
                                <input
                                    id="transfer-recipient"
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white text-xs font-mono outline-none focus:border-lime-500"
                                    value={recipient}
                                    onChange={e => setRecipient(e.target.value)}
                                    placeholder="0x..."
                                />
                            </div>

                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label htmlFor="transfer-amount" className="block text-xs text-zinc-400 mb-1">Monto</label>
                                    <input
                                        id="transfer-amount"
                                        type="number"
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white text-sm outline-none focus:border-lime-500"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        placeholder="0.0"
                                    />
                                </div>
                                <div className="w-1/3">
                                    <label htmlFor="transfer-decimals" className="block text-xs text-zinc-400 mb-1">Decimals</label>
                                    <input
                                        id="transfer-decimals"
                                        type="number"
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white text-sm outline-none"
                                        value={decimals}
                                        onChange={e => setDecimals(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="transfer-token" className="block text-xs text-zinc-400 mb-1">Token Address (Opcional - Vacío para ETH/Native)</label>
                                <input
                                    id="transfer-token"
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white text-xs font-mono outline-none focus:border-lime-500"
                                    value={tokenAddress}
                                    onChange={e => setTokenAddress(e.target.value)}
                                    placeholder="0x... (Vacío para Nativo)"
                                />
                            </div>
                        </div>
                    )}

                    {isOffChain ? (
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-lime-500 hover:bg-lime-400 text-black font-bold py-3 rounded-xl mt-2 transition-colors flex items-center justify-center gap-2"
                        >
                            {isLoading ? "Creando..." : "Publicar Discusión (Gratis)"}
                        </button>
                    ) : (

                        <TransactionButton
                            transaction={() => {
                                const params = getProposalParams();
                                return prepareContractCall({
                                    contract: contract!,
                                    method: "function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) returns (uint256)",
                                    params: [
                                        params.targets as `0x${string}`[],
                                        params.values,
                                        params.calldatas as `0x${string}`[],
                                        params.description
                                    ]
                                });
                            }}
                            onTransactionConfirmed={() => {
                                toast.success("Propuesta On-Chain creada exitosamente!");
                                onCreated();
                                onClose();
                            }}
                            onError={(e) => toast.error("Error creating proposal: " + e.message)}
                            className="w-full bg-purple-500 hover:bg-purple-400 text-white font-bold py-3 rounded-xl mt-2 transition-colors"
                        >
                            Confirmar en Blockchain (Gas)
                        </TransactionButton>
                    )}
                </form>
            </div>
        </div>
    );
}
