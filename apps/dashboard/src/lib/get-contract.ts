import { getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { client } from "./thirdweb-client";
import type { Address } from "thirdweb";
import type { Abi } from "viem";

export default function getThirdwebContract({ address, chainId, abi }: { address: Address; chainId: number; abi?: Abi }) {
  const chain = defineChain(chainId);
  return getContract({ address, client, chain, abi });
}