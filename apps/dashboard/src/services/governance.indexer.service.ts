import { db } from '@/db';
import { governanceProposals, governanceVotes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ethers } from 'ethers';

const GOVERNOR_ABI = [
    "event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)",
    "event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason)",
    "event ProposalExecuted(uint256 proposalId)",
    "function token() external view returns (address)",
    "function quorum(uint256 blockNumber) external view returns (uint256)"
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

        console.log(`[Reconciler] Sync completed for ${governorAddress}`);
    }

    private async handleProposalCreated(protocolId: number, contractAddress: string, event: ethers.Event) {
        try {
            if (!event.args) return;
            const [proposalIdStr, proposerStr, targetsArr, valuesArr, signaturesArr, calldatasArr, startBlockNum, endBlockNum, desc] = event.args;

            // Instanciamos el Governor para lecturas constitucionales
            const governor = new ethers.Contract(contractAddress, GOVERNOR_ABI, this.provider);
            const tokenAddr = await governor.token();
            const token = new ethers.Contract(tokenAddr, ERC20_VOTES_ABI, this.provider);

            // Fetch Snapshots (Constitutional Logic)
            const snapshotBlock = Number(startBlockNum); // El snapshot suele ser el startBlock
            const quorumAtSnapshot = await governor.quorum(snapshotBlock);
            const supplyAtSnapshot = await token.getPastTotalSupply(snapshotBlock);

            await db.insert(governanceProposals).values({
                protocolId: protocolId,
                proposalId: proposalIdStr.toString(),
                governorAddress: contractAddress,
                chainId: 11155111, // config.chain.id fallback
                proposer: proposerStr,
                description: desc,
                targets: targetsArr,
                values: valuesArr,
                calldatas: calldatasArr,
                startBlock: Number(startBlockNum),
                endBlock: Number(endBlockNum),
                status: 1, // Pending or Active 
                quorumSnapshot: quorumAtSnapshot.toString(),
                totalVotingSupplySnapshot: supplyAtSnapshot.toString(),
                createdTxHash: event.transactionHash,
                createdBlockNumber: event.blockNumber,
            }).onConflictDoNothing({ target: [governanceProposals.proposalId, governanceProposals.governorAddress, governanceProposals.chainId] });

            console.log(`[Indexer] Indexed ProposalCreated: ${proposalIdStr.toString()}`);
        } catch (e) {
            console.error(`[Indexer] Error indexing ProposalCreated:`, e);
        }
    }

    private async handleVoteCast(protocolId: number, contractAddress: string, event: ethers.Event) {
        try {
            if (!event.args) return;
            const [voterStr, proposalIdStr, supportNum, weightNum, reasonStr] = event.args;

            await db.insert(governanceVotes).values({
                proposalId: proposalIdStr.toString(),
                voterAddress: voterStr,
                support: Number(supportNum),
                weight: weightNum.toString(),
                reason: reasonStr,
                txHash: event.transactionHash,
                blockNumber: event.blockNumber,
            }).onConflictDoNothing({ target: [governanceVotes.proposalId, governanceVotes.voterAddress] });

            console.log(`[Indexer] Indexed VoteCast for ${proposalIdStr.toString()} by ${voterStr}`);
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
