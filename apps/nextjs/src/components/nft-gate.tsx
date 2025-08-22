'use client';

import { useActiveAccount } from "thirdweb/react";
import { getContract, readContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { client } from "~/lib/thirdweb-client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PANDORAS_KEY_ABI } from "~/lib/pandoras-key-abi";

const PANDORAS_KEY_CONTRACT_ADDRESS = "0x720F378209a5c68F8657080A28ea6452518f67b0";

export function NFTGate({ children }: { children: React.ReactNode }) {
  const account = useActiveAccount();
  const address = account?.address;
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkKey = async () => {
      if (!address) {
        setIsLoading(false);
        setHasKey(false);
        return;
      }

      setIsLoading(true);
      try {
        const contract = getContract({
          client,
          chain: sepolia,
          address: PANDORAS_KEY_CONTRACT_ADDRESS,
          abi: PANDORAS_KEY_ABI,
        });

        const hasNft = await readContract({
          contract,
          method: "isGateHolder",
          params: [address],
        });
        setHasKey(!!hasNft);

      } catch (error) {
        console.error("Failed to check for Pandora's Key", error);
        setHasKey(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkKey();
  }, [address]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-lg">Verifying your access...</div>
        <div className="mt-4 w-16 h-16 border-4 border-dashed rounded-full animate-spin border-sky-500"></div>
      </div>
    );
  }

  if (!hasKey) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-2xl font-bold mb-4">Access Denied</div>
        <p className="mb-8 text-center text-muted-foreground">You do not own a Pandora's Key NFT required to access this page.</p>
        <Link href="/" className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Return to Homepage
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}