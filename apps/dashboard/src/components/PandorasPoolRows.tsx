"use client";

import { useActiveAccount, useReadContract } from "thirdweb/react";
import { getContract } from "thirdweb";
import { base } from "thirdweb/chains";
import { PANDORAS_POOL_ABI } from "@/lib/pandoras-pool-abi";
import { client } from "@/lib/thirdweb-client";
import { ChevronRightIcon } from "@heroicons/react/24/solid";

const POOL_CONTRACT_ADDRESS = "0x4122d7a6f11286b881f8332d8c27debcc922b2fa";

export function PandorasPoolRows() {
  const account = useActiveAccount();

  const contract = getContract({
    client,
    chain: base,
    address: POOL_CONTRACT_ADDRESS,
    abi: PANDORAS_POOL_ABI,
  });

  const { data: stats, isLoading } = useReadContract({
    contract,
    method: "getUserStats",
    params: account ? [account.address] : ["0x0000000000000000000000000000000000000000"],
    queryOptions: {
      enabled: !!account,
    },
  });

  if (isLoading) {
    return (
      <tr>
        <td colSpan={4} className="px-4 py-4 text-center text-gray-400">
          Loading on-chain data...
        </td>
      </tr>
    );
  }

  if (!stats) {
    return null; // Don't render anything if there are no stats (e.g., wallet not connected)
  }

  const ethAmount = Number(stats.depositedETH) / 1e18;
  const usdcAmount = Number(stats.depositedUSDC) / 1e6;

  return (
    <>
      {ethAmount > 0 && (
        <tr className="hover:bg-gray-800/50">
          <td className="px-4 py-4 text-white">Pandora's Pool</td>
          <td className="px-4 py-4 text-white">
            {ethAmount.toFixed(4)} ETH
          </td>
          <td className="px-4 py-4 text-white flex items-center">
            N/A
            <ChevronRightIcon className="h-4 w-4 ml-2 text-gray-400" />
          </td>
          <td className="px-4 py-4">
            <button className="text-lime-300 hover:text-lime-200">
              View Details
            </button>
          </td>
        </tr>
      )}
      {usdcAmount > 0 && (
        <tr className="hover:bg-gray-800/50">
          <td className="px-4 py-4 text-white">Pandora's Pool</td>
          <td className="px-4 py-4 text-white">
            {usdcAmount.toFixed(2)} USDC
          </td>
          <td className="px-4 py-4 text-white flex items-center">
            N/A
            <ChevronRightIcon className="h-4 w-4 ml-2 text-gray-400" />
          </td>
          <td className="px-4 py-4">
            <button className="text-lime-300 hover:text-lime-200">
              View Details
            </button>
          </td>
        </tr>
      )}
    </>
  );
}
