
"use client";

import { useReadContract } from "thirdweb/react";
import { VoteIcon, ActivityIcon } from "lucide-react";

interface DAOMetricsProps {
    licenseContract: any;
}

export function DAOMetrics({ licenseContract }: DAOMetricsProps) {
    const { data: totalSupply } = useReadContract({
        contract: licenseContract,
        method: "function totalSupply() view returns (uint256)",
        params: []
    });

    return (
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <VoteIcon className="w-24 h-24 text-purple-500" />
            </div>
            <p className="text-zinc-400 text-sm font-medium mb-1">Miembros del DAO</p>
            <h3 className="text-3xl font-bold text-white font-mono">
                {totalSupply ? totalSupply.toString() : "--"}
            </h3>
            <div className="mt-4 flex items-center text-xs text-purple-400">
                <ActivityIcon className="w-3 h-3 mr-1" />
                Holders de Access Cards
            </div>
        </div>
    );
}
