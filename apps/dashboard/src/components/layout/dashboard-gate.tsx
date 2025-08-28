'use client';

import { useActiveAccount, useReadContract } from "thirdweb/react";
import { getContract } from "thirdweb";
import { base } from "thirdweb/chains";
import { client } from "@/lib/thirdweb-client";
import { PANDORAS_KEY_ABI } from "@/lib/pandoras-key-abi";
import { NFTGatingClient } from "@/components/nft-gating/nft-gating-client";
import { Loader2 } from "lucide-react";

const PANDORAS_KEY_CONTRACT_ADDRESS = "0xA6694331d22C3b0dD2d550a2f320D601bE17FBba";

export function DashboardGate({ children }: { children: React.ReactNode }) {
  const account = useActiveAccount();

  const contract = getContract({
    client,
    chain: base,
    address: PANDORAS_KEY_CONTRACT_ADDRESS,
    abi: PANDORAS_KEY_ABI,
  });

  const { data: hasKey, isLoading } = useReadContract({
    contract,
    method: "isGateHolder",
    params: account ? [account.address] : [],
    queryOptions: {
      enabled: !!account,
    }
  });

  if (!account) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Welcome to the Dashboard</h2>
          <p className="mt-2 text-gray-600">Please connect your wallet to continue.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (hasKey) {
    return <>{children}</>;
  }

  return <NFTGatingClient />;
}
