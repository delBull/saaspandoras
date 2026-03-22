import { ArtifactType } from "@/types/deployment";

/**
 * Resolves the correct contract method and parameters based on the artifact type.
 * This removes hardcoded logic from the UI and makes the system extensible.
 */
export function resolveArtifactMethod({
  artifactType,
  quantity,
  account,
  totalValue
}: {
  artifactType: ArtifactType | string;
  quantity: bigint;
  account: string;
  totalValue: bigint;
}) {
  switch (artifactType) {
    case 'Access':
    case 'Membership':
    case 'Yield':
      return {
        method: "function mintWithPayment(uint256 quantity) payable",
        params: [quantity],
        value: totalValue
      };

    case 'Identity':
    case 'Reputation':
      return {
        method: "function mint(address to)",
        params: [account],
        value: 0n // SBTs usually don't have a value in this call
      };

    case 'Coupon':
      return {
        method: "function claim()",
        params: [],
        value: 0n
      };

    default:
      // Default to mintWithPayment for safety if unknown
      return {
        method: "function mintWithPayment(uint256 quantity) payable",
        params: [quantity],
        value: totalValue
      };
  }
}
