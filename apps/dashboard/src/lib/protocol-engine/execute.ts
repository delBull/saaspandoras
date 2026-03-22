import { buildArtifactTransaction } from "./artifact/execute";

export interface ExecutionConfig {
  address: string;
  method: string;
  params: any[];
  value: bigint;
  token?: string;
  requiresApproval?: boolean;
  totalValue?: bigint;
}

export type ProtocolAction =
  | { type: 'BUY_ARTIFACT'; payload: any }
  | { type: 'BUY_TOKEN'; payload: any }
  | { type: 'MARKET_BUY'; payload: any }
  | { type: 'DAO_VOTE'; payload: any };

/**
 * The Unified Execution Router for all protocol interactions.
 * This ensures consistency across the dashboard (Modals, Market, DAO).
 */
export function resolveExecution(action: ProtocolAction): ExecutionConfig {
  switch (action.type) {
    case 'BUY_ARTIFACT':
      return buildArtifactTransaction(action.payload);

    case 'BUY_TOKEN':
      // Future implementation: buildTokenPurchase(action.payload);
      return {
        address: action.payload.project.contractAddress,
        method: "function purchase() payable",
        params: [],
        value: action.payload.value,
        token: 'ETH'
      };

    case 'MARKET_BUY':
      // Future implementation: buildMarketBuy(action.payload);
      return {
        address: action.payload.marketAddress,
        method: "function buy(uint256 listingId) payable",
        params: [action.payload.listingId],
        value: action.payload.price,
        token: 'ETH'
      };

    case 'DAO_VOTE':
      // Future implementation: buildVoteTransaction(action.payload);
      return {
        address: action.payload.governanceAddress,
        method: "function castVote(uint256 proposalId, uint8 support)",
        params: [action.payload.proposalId, action.payload.support],
        value: 0n,
        token: 'NATIVE'
      };

    default:
      throw new Error(`Unknown protocol action: ${(action as any).type}`);
  }
}
