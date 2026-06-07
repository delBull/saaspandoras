import { getContract } from "thirdweb";
import { base, sepolia } from "thirdweb/chains";
import { client } from "~/lib/thirdweb-client";
import { parseUnits } from "viem";

export function getUsdcAddress(): string {
  if (process.env.NODE_ENV === 'production') {
    return process.env.USDC_MAINNET_ADDRESS || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  }
  return process.env.USDC_SEPOLIA_ADDRESS || "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
}

export function getUsdcChain() {
  return process.env.NODE_ENV === 'production' ? base : sepolia;
}

export function getUsdcContract() {
  return getContract({
    client,
    chain: getUsdcChain(),
    address: getUsdcAddress(),
  });
}

export function parseUsdcAmount(amount: string | number): bigint {
  return parseUnits(amount.toString(), 6);
}

export function formatUsdcAmount(wei: bigint): string {
  const decimal = 6;
  return (Number(wei) / 10 ** decimal).toFixed(2);
}
