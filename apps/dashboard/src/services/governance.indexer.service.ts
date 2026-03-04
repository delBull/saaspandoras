import { db } from '@/db';
import { governanceProposals, governanceVotes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ethers } from 'ethers';

const GOVERNOR_ABI = [
    "event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)",
    "event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason)",
    "event ProposalExecuted(uint256 proposalId)",
    "function token() external view returns (address)",
    "function quorum(uint256 blockNumber) external view returns (uint256)",
    "function proposalSnapshot(uint256 proposalId) external view returns (uint256)",
    "function proposalDeadline(uint256 proposalId) external view returns (uint256)",
    "function state(uint256 proposalId) external view returns (uint8)"
];

const ERC20_VOTES_ABI = [
    "function getPastTotalSupply(uint256 blockNumber) external view returns (uint256)"
];

export class GovernanceIndexerService {
    private provider: ethers.providers.JsonRpcProvider;
    private iface: ethers.utils.Interface;

    constructor(rpcUrl: string) {
        this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        this.iface = new ethers.utils.Interface(GOVERNOR_ABI);
    }

    /**
     * HOT PATH: Inicia el Listener en Tiempo Real
     */
    public listenToGovernor(governorAddress: string, protocolId: number) {
        console.log(`[Indexer] Listening to Governor: ${governorAddress} for Protocol ${protocolId}`);
        const contract = new ethers.Contract(governorAddress, GOVERNOR_ABI, this.provider);

        // Proposal Created
        contract.on("ProposalCreated", async (...args: any[]) => {
            const event = args[args.length - 1] as ethers.Event;
            await this.handleProposalCreated(protocolId, governorAddress, event);
        });

        // Vote Cast
        contract.on("VoteCast", async (...args: any[]) => {
            const event = args[args.length - 1] as ethers.Event;
            await this.handleVoteCast(protocolId, governorAddress, event);
        });

        // Execution
        contract.on("ProposalExecuted", async (...args: any[]) => {
            const event = args[args.length - 1] as ethers.Event;
            await this.handleProposalExecuted(governorAddress, event);
        });
    }

    /**
     * COLD PATH: Reconciliador histórico o para recuperar estado perdido tras reinicio
     */
    public async reconcile(governorAddress: string, protocolId: number, fromBlock: number, toBlock: number) {
        console.log(`[Reconciler] Syncing ${governorAddress} from ${fromBlock} to ${toBlock}`);
        const contract = new ethers.Contract(governorAddress, GOVERNOR_ABI, this.provider);

        // Fetch ProposalCreated
        const proposalCreatedFilter = contract.filters.ProposalCreated!();
        const proposalCreatedLogs = await contract.queryFilter(proposalCreatedFilter, fromBlock, toBlock);
        for (const log of proposalCreatedLogs) {
            await this.handleProposalCreated(protocolId, governorAddress, log as ethers.Event);
        }

        // Fetch VoteCast
        const voteCastFilter = contract.filters.VoteCast!();
        const voteCastLogs = await contract.queryFilter(voteCastFilter, fromBlock, toBlock);
        for (const log of voteCastLogs) {
            await this.handleVoteCast(protocolId, governorAddress, log as ethers.Event);
        }

        // Fetch ProposalExecuted
        const proposalExecutedFilter = contract.filters.ProposalExecuted!();
        const proposalExecutedLogs = await contract.queryFilter(proposalExecutedFilter, fromBlock, toBlock);
        for (const log of proposalExecutedLogs) {
            await this.handleProposalExecuted(governorAddress, log as ethers.Event);
        }

        // Proactive Status Sync (Constitutional State)
        await this.syncActiveProposalsState(governorAddress);

        console.log(`[Reconciler] Sync completed for ${governorAddress}`);
    }

    private async handleProposalCreated(protocolId: number, contractAddress: string, event: ethers.Event) {
        try {
            if (!event.args) return;
            const [proposalIdStr, proposerStr, targetsArr, valuesArr, signaturesArr, calldatasArr, startBlockNum, endBlockNum, desc] = event.args;
            const proposalId = proposalIdStr.toString();

            // Instanciamos el Governor para lecturas constitucionales
            const governor = new ethers.Contract(contractAddress, GOVERNOR_ABI, this.provider);

            // FETCH PRECISO (Constitutional Precision)
            // No asumimos startBlock = snapshot. Preguntamos al contrato.
            const snapshotBlock = await governor.proposalSnapshot(proposalId).catch(() => Number(startBlockNum));
            const deadlineBlock = await governor.proposalDeadline(proposalId).catch(() => Number(endBlockNum));

            const tokenAddr = await governor.token();
            const token = new ethers.Contract(tokenAddr, ERC20_VOTES_ABI, this.provider);

            const quorumAtSnapshot = await governor.quorum(snapshotBlock);
            const supplyAtSnapshot = await token.getPastTotalSupply(snapshotBlock);

            const isInvalid = quorumAtSnapshot.eq(0) || supplyAtSnapshot.eq(0);

            await db.insert(governanceProposals).values({
                protocolId: protocolId,
                proposalId: proposalId,
                governorAddress: contractAddress,
                chainId: 11155111,
                proposer: proposerStr,
                description: desc,
                targets: targetsArr,
                values: valuesArr,
                calldatas: calldatasArr,
                startBlock: Number(startBlockNum),
                endBlock: Number(endBlockNum),
                snapshotBlock: Number(snapshotBlock),
                deadlineBlock: Number(deadlineBlock),
                isInvalid: isInvalid,
                status: 1,
                quorumSnapshot: quorumAtSnapshot.toString(),
                totalVotingSupplySnapshot: supplyAtSnapshot.toString(),
                createdTxHash: event.transactionHash,
                createdBlockNumber: event.blockNumber,
                blockNumberIndexed: event.blockNumber,
                indexerVersion: "1.1.0"
            }).onConflictDoUpdate({
                target: [governanceProposals.proposalId, governanceProposals.governorAddress, governanceProposals.chainId],
                set: {
                    snapshotBlock: Number(snapshotBlock),
                    deadlineBlock: Number(deadlineBlock),
                    quorumSnapshot: quorumAtSnapshot.toString(),
                    totalVotingSupplySnapshot: supplyAtSnapshot.toString(),
                    isInvalid: isInvalid,
                    updatedAt: new Date()
                }
            });

            console.log(`[Indexer] Indexed ProposalCreated: ${proposalId}`);
        } catch (e) {
            console.error(`[Indexer] Error indexing ProposalCreated:`, e);
        }
    }

    private async handleVoteCast(protocolId: number, contractAddress: string, event: ethers.Event) {
        try {
            if (!event.args) return;
            const [voterStr, proposalIdStr, supportNum, weightNum, reasonStr] = event.args;
            const proposalId = proposalIdStr.toString();
            const weight = weightNum.toString();
            const support = Number(supportNum);

            // AGREGACIÓN IDEMPOTENTE (Log-based)
            const logIndex = event.logIndex;
            const txHash = event.transactionHash;

            await db.transaction(async (tx) => {
                // 1. Insertar log individual (Idempotent by txHash + logIndex)
                const voteInserted = await tx.insert(governanceVotes).values({
                    proposalId: proposalId,
                    voterAddress: voterStr,
                    support: support,
                    weight: weight,
                    reason: reasonStr,
                    txHash: txHash,
                    logIndex: logIndex,
                    blockNumber: event.blockNumber,
                    chainId: 11155111,
                    governorAddress: contractAddress
                }).onConflictDoNothing().returning();

                // 2. Si es nuevo, agrupar en el Proposal Master
                if (voteInserted.length > 0) {
                    const updateData: any = { updatedAt: new Date(), blockNumberIndexed: event.blockNumber };

                    if (support === 1) updateData.forVotes = ethers.BigNumber.from(weight).add(0).toString(); // Placeholder handled by SQL later or manual fetch
                    // En Drizzle/Postgres mejor usar sql`...` para incrementos atómicos
                    const proposal = await tx.query.governanceProposals.findFirst({
                        where: eq(governanceProposals.proposalId, proposalId)
                    });

                    if (proposal) {
                        const newFor = support === 1 ? ethers.BigNumber.from(proposal.forVotes).add(weight).toString() : proposal.forVotes;
                        const newAgainst = support === 0 ? ethers.BigNumber.from(proposal.againstVotes).add(weight).toString() : proposal.againstVotes;
                        const newAbstain = support === 2 ? ethers.BigNumber.from(proposal.abstainVotes).add(weight).toString() : proposal.abstainVotes;

                        await tx.update(governanceProposals)
                            .set({
                                forVotes: newFor,
                                againstVotes: newAgainst,
                                abstainVotes: newAbstain,
                                blockNumberIndexed: event.blockNumber,
                                updatedAt: new Date()
                            })
                            .where(eq(governanceProposals.id, proposal.id));
                    }
                }
            });

            console.log(`[Indexer] Aggregated VoteCast for ${proposalId} by ${voterStr} (Weight: ${weight})`);
        } catch (e) {
            console.error(`[Indexer] Error indexing VoteCast:`, e);
        }
    }

    private async handleProposalExecuted(contractAddress: string, event: ethers.Event) {
        try {
            if (!event.args) return;
            const [proposalIdStr] = event.args;

            await db.update(governanceProposals)
                .set({ status: 7, isExecuted: true, updatedAt: new Date() })
                .where(eq(governanceProposals.proposalId, proposalIdStr.toString()));

            console.log(`[Indexer] Indexed ProposalExecuted: ${proposalIdStr.toString()}`);
        } catch (e) {
            console.error(`[Indexer] Error indexing ProposalExecuted:`, e);
        }
    }

    /**
     * Reconciliador de estados proactivo (State Reconciler)
     * Llamar periódicamente para actualizar propuestas que no emiten eventos al cambiar estado por tiempo.
     */
    public async syncActiveProposalsState(governorAddress: string) {
        const activeProposals = await db.query.governanceProposals.findMany({
            where: (t, { and, eq, ne }) => and(
                eq(t.governorAddress, governorAddress),
                ne(t.status, 7), // No Executed
                ne(t.status, 3), // No Defeated
                ne(t.status, 2)  // No Canceled
            )
        });

        if (activeProposals.length === 0) return;

        const governor = new ethers.Contract(governorAddress, GOVERNOR_ABI, this.provider);
        console.log(`[Reconciler] Syncing states for ${activeProposals.length} proposals on ${governorAddress}`);

        for (const prop of activeProposals) {
            try {
                const currentState = await governor.state(prop.proposalId);
                if (currentState !== prop.status) {
                    await db.update(governanceProposals)
                        .set({ status: currentState, updatedAt: new Date() })
                        .where(eq(governanceProposals.id, prop.id));
                    console.log(`[Reconciler] Updated Proposal ${prop.proposalId} status: ${prop.status} -> ${currentState}`);
                }
            } catch (e) {
                console.warn(`[Reconciler] Failed to sync state for ${prop.proposalId}`, e);
            }
        }
    }

    // Helper para extraer el título de la descripción (convención de OpenZeppelin: "# Titulo\nDescripcion")
    private extractTitle(description: string): string {
        if (!description) return "Untitled Proposal";
        const lines = description.split('\n');
        if (lines?.[0]?.startsWith('# ')) {
            return lines[0].substring(2).trim();
        }
        return description.substring(0, 50) + "..."; // Fallback truncado
    }
}
