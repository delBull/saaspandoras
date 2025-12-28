"use client";

import { useReadContract } from "thirdweb/react";
import { getContract } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { config } from "@/config";
import { Loader2, Check, X } from "lucide-react";

const CONTRACT = getContract({
    client,
    chain: config.chain,
    address: config.applyPassNftAddress
});

export function UserKeyStatus({ walletAddress }: { walletAddress: string }) {
    const { data: balance, isLoading } = useReadContract({
        contract: CONTRACT,
        method: "function balanceOf(address owner) view returns (uint256)",
        params: [walletAddress]
    });

    if (isLoading) {
        return <Loader2 className="w-3 h-3 animate-spin text-zinc-500" />;
    }

    const hasKey = balance && balance > 0n;

    return (
        <div className="flex items-center gap-1">
            {hasKey ? (
                <>
                    <Check className="w-3 h-3 text-yellow-400" />
                    <span className="text-yellow-400 text-xs font-medium">Sí</span>
                </>
            ) : (
                <>
                    <X className="w-3 h-3 text-zinc-600" />
                    <span className="text-zinc-600 text-xs">No</span>
                </>
            )}
        </div>
    );
}
