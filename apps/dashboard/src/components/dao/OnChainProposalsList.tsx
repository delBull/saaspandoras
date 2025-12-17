
"use client";

import { useReadContract, useActiveAccount, TransactionButton } from "thirdweb/react";
import { getContract, defineChain, prepareContractCall } from "thirdweb";
import { client } from "@/lib/thirdweb-client"; // Verify correct path
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CheckCircleIcon, XCircleIcon, ClockIcon, PlayCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { ethers } from "ethers";

interface OnChainProposalsListProps {
    votingContractAddress: string;
    chainId: number;
    governanceTokenAddress?: string;
}

export function OnChainProposalsList({ votingContractAddress, chainId, governanceTokenAddress }: OnChainProposalsListProps) {
    const account = useActiveAccount();
    const contract = getContract({
        client,
        chain: defineChain(chainId),
        address: votingContractAddress,
    });

    // Fetch Proposals
    // Assuming standard Governor or Vote contract. usually `getAllProposals` or loop.
    // For Thirdweb Vote contract: `getAll()`
    const { data: proposals, isLoading, refetch } = useReadContract({
        contract,
        method: "function getAll() view returns ((uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)[])",
        params: [],
    });

    // Helper to get state
    // state: 0=Pending, 1=Active, 2=Canceled, 3=Defeated, 4=Succeeded, 5=Queued, 6=Expired, 7=Executed
    const getProposalState = (proposalId: bigint) => {
        // This requires a separate call per proposal if getAll doesn't return state. 
        // We might need to fetch state separately or assume standard Vote struct has executed/cancelled flags?
        // Thirdweb "Vote" contract usually returns struct with state?
        // Actually standard IGovernor `state(proposalId)`
        return 0; // Placeholder, better to fetch in component
    };

    // We need a component to render each proposal because we need to fetch its specific State and Votes
    return (
        <div className="space-y-4">
            {isLoading && <div className="text-zinc-500 animate-pulse">Cargando propuestas on-chain...</div>}

            {proposals && proposals.length === 0 && (
                <div className="text-zinc-500 text-center py-10 border border-zinc-800 rounded-xl">No hay propuestas activas.</div>
            )}

            {proposals?.map((p: any) => (
                <ProposalCard
                    key={p.proposalId.toString()}
                    proposal={p}
                    contract={contract}
                    account={account}
                    chainId={chainId}
                />
            ))}
        </div>
    );
}

function ProposalCard({ proposal, contract, account, chainId }: any) {
    // Fetch State
    const { data: stateData } = useReadContract({
        contract,
        method: "function state(uint256) view returns (uint8)",
        params: [proposal.proposalId],
    });

    // Fetch Votes (For, Against, Abstain)
    const { data: votesData } = useReadContract({
        contract,
        method: "function proposalVotes(uint256) view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)",
        params: [proposal.proposalId],
    });

    // Parse Votes
    const forVotes = votesData ? Number(ethers.utils.formatEther(votesData[1])) : 0;
    const againstVotes = votesData ? Number(ethers.utils.formatEther(votesData[0])) : 0;
    const totalVotes = forVotes + againstVotes;
    const forPercentage = totalVotes > 0 ? (forVotes / totalVotes) * 100 : 0;

    // Parse State
    const stateMap = [
        { label: "Pendiente", color: "text-zinc-500", bg: "bg-zinc-800" }, // 0
        { label: "Activa", color: "text-blue-400", bg: "bg-blue-900/30" }, // 1
        { label: "Cancelada", color: "text-red-400", bg: "bg-red-900/30" }, // 2
        { label: "Rechazada", color: "text-red-500", bg: "bg-red-900/30 border-red-500/30" }, // 3
        { label: "Aprobada", color: "text-green-400", bg: "bg-green-900/30 border-green-500/30" }, // 4
        { label: "En Cola", color: "text-yellow-400", bg: "bg-yellow-900/30" }, // 5
        { label: "Expirada", color: "text-zinc-500", bg: "bg-zinc-800" }, // 6
        { label: "Ejecutada", color: "text-lime-500", bg: "bg-lime-900/30 border-lime-500/30" }, // 7
    ];
    const state = stateMap[stateData !== undefined ? stateData : 0] || stateMap[0];

    // Determine if can vote (Active state = 1)
    const isActive = stateData === 1;

    // Vote Action
    const vote = (support: number) => {
        // 0 = Against, 1 = For, 2 = Abstain
        if (!account) return toast.error("Conecta tu wallet");

        try {
            // Need TransactionButton or useContractWrite
            // We'll use TransactionButton inline below
        } catch (e) { console.error(e); }
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2">{proposal.description}</h3>
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs border ${state?.bg || "bg-zinc-800"} ${state?.color || "text-zinc-500"} border-transparent`}>
                            {state?.label || "Pending"}
                        </span>
                        <span className="text-zinc-500 text-xs">ID: {proposal.proposalId.toString()}</span>
                    </div>
                </div>
                {/* Timer if active */}
                {isActive && (
                    <div className="flex items-center gap-1 text-xs text-blue-400 bg-blue-900/10 px-2 py-1 rounded">
                        <ClockIcon className="w-3 h-3" />
                        <span>Votación en curso</span>
                        {/* We could calc blocks remaining if we had current block */}
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                    <span>A favor: {forVotes.toLocaleString()}</span>
                    <span>En contra: {againstVotes.toLocaleString()}</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden flex">
                    <div className="bg-green-500 h-full" style={{ width: `${forPercentage}%` }} />
                    <div className="bg-red-500 h-full" style={{ width: `${100 - forPercentage}%` }} />
                </div>
            </div>

            {/* Actions */}
            {isActive && (
                <div className="flex gap-2 mt-4">
                    <TransactionButton
                        transaction={() => prepareContractCall({
                            contract,
                            method: "function castVote(uint256, uint8)",
                            params: [proposal.proposalId, 1] // 1 = For
                        })}
                        onTransactionConfirmed={() => toast.success("Voto registrado: A favor")}
                        onError={(e) => toast.error(e.message)}
                        className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-sm font-medium"
                    >
                        Votar A Favor
                    </TransactionButton>
                    <TransactionButton
                        transaction={() => prepareContractCall({
                            contract,
                            method: "function castVote(uint256, uint8)",
                            params: [proposal.proposalId, 0] // 0 = Against
                        })}
                        onTransactionConfirmed={() => toast.success("Voto registrado: En contra")}
                        onError={(e) => toast.error(e.message)}
                        className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg text-sm font-medium"
                    >
                        Votar En Contra
                    </TransactionButton>
                </div>
            )}

            {/* Execute Button if Succeeded (4) */}
            {stateData === 4 && (
                <TransactionButton
                    transaction={() => prepareContractCall({
                        contract,
                        method: "function execute(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash)",
                        params: [
                            proposal.targets,
                            proposal.values,
                            proposal.calldatas,
                            (ethers.utils.id(proposal.description) as `0x${string}`) // keccak256 of description string
                        ]
                    })}
                    onTransactionConfirmed={() => toast.success("Propuesta Ejecutada!")}
                    onError={(e) => toast.error("Error ejecutando: " + e.message)}
                    className="w-full mt-4 bg-lime-600 hover:bg-lime-500 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                >
                    <PlayCircleIcon className="w-4 h-4" /> Ejecutar Propuesta
                </TransactionButton>
            )}
        </div>
    );
}
