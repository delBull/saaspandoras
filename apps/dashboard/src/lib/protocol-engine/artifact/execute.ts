import { resolveArtifactContract } from "./resolver";
import { resolveArtifactMethod } from "./methods";
import { resolvePayment } from "./payment";

/**
 * Builds the complete transaction configuration for an artifact purchase.
 * Aggregates resolution, payment, and method logic into a single structure.
 */
export function buildArtifactTransaction({
  project,
  phase,
  utilityContract,
  artifactType,
  quantity,
  account,
  chainId,
  priceInWei
}: {
  project: any;
  phase?: any;
  utilityContract?: any;
  artifactType: string;
  quantity: bigint;
  account: string;
  chainId: number;
  priceInWei: bigint;
}) {
  // 1. Resolve Contract Address
  const { address } = resolveArtifactContract({
    project,
    phase,
    utilityContract
  });

  // 2. Calculate Values (using BigInt)
  const totalCost = priceInWei * quantity;
  const buffer = (totalCost * 2n) / 100n; // 2% buffer for slippage
  const totalValue = totalCost + buffer;

  // 3. Resolve Payment Strategy
  const payment = resolvePayment({ chainId, totalValue });

  // 4. Resolve Method Config
  const methodConfig = resolveArtifactMethod({
    artifactType,
    quantity,
    account,
    totalValue
  });

  return {
    address,
    method: methodConfig.method,
    params: methodConfig.params,
    value: payment.value,
    requiresApproval: payment.requiresApproval,
    token: payment.token,
    totalValue // For UI display if needed
  };
}
