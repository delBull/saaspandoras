
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { XIcon } from "lucide-react";

import { TransactionButton } from "thirdweb/react";
import { prepareContractCall, getContract, defineChain } from "thirdweb";
import { client } from "@/lib/thirdweb-client";

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
    // Mode: On-Chain vs Database
    // For now, if votingContractAddress exists, we default to On-Chain.
    const isOffChain = !votingContractAddress;
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
                    type: 'on_chain_proposal', // Keeping DB type for record
                    startDate: new Date().toISOString(),
                    status: 'active'
                }),
            });

            if (!res.ok) throw new Error("Failed to create off-chain event");

            toast.success("Evento creado");
            onCreated();
            onClose();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
                    <XIcon className="w-5 h-5" />
                </button>

                <h3 className="text-xl font-bold text-white mb-4">
                    {isOffChain ? "Nueva Propuesta / Evento" : "Nueva Propuesta On-Chain"}
                </h3>

                <form onSubmit={isOffChain ? handleSubmitOffChain : (e) => e.preventDefault()} className="space-y-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Título</label>
                        <input
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white outline-none focus:border-lime-500"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Descripción</label>
                        <textarea
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white outline-none focus:border-lime-500"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                            placeholder={isOffChain ? "" : "Detalles de la propuesta para votación on-chain..."}
                            required
                        />
                    </div>

                    {isOffChain ? (
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-lime-500 hover:bg-lime-400 text-black font-bold py-3 rounded-xl mt-2 transition-colors"
                        >
                            {isLoading ? "Creando..." : "Publicar Evento"}
                        </button>
                    ) : (
                        <TransactionButton
                            transaction={() => prepareContractCall({
                                contract: contract!,
                                method: "function propose(address[], uint256[], bytes[], string)",
                                params: [
                                    [], // targets
                                    [], // values
                                    [], // calldatas
                                    `${title}\n\n${description}` // description
                                ]
                            })}
                            onTransactionConfirmed={() => {
                                toast.success("Propuesta On-Chain creada exitosamente!");
                                onCreated();
                                onClose();
                            }}
                            onError={(e) => toast.error("Error creating proposal: " + e.message)}
                            className="w-full bg-lime-500 hover:bg-lime-400 text-black font-bold py-3 rounded-xl mt-2 transition-colors"
                        >
                            Confirmar en Blockchain
                        </TransactionButton>
                    )}
                </form>
            </div>
        </div>
    );
}
