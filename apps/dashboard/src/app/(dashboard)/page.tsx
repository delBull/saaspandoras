'use client';

import { useReadContract } from "thirdweb/react";
import { utils } from "ethers";
import { usePoolPandorasContract } from "@/lib/contracts/pool-pandoras";

function StatCard({ title, value, isLoading }: { title: string, value: string | number, isLoading: boolean }) {
  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="font-semibold text-gray-600">{title}</h3>
      {isLoading ? (
        <div className="animate-pulse h-8 w-1/2 bg-gray-300 rounded mt-1"></div>
      ) : (
        <p className="text-2xl font-bold">{value}</p>
      )}
    </div>
  );
}

export default function DashboardHomePage() {
  const contract = usePoolPandorasContract();
  const { data: vaultStats, isLoading } = useReadContract({
    contract,
    method: "getVaultStats",
    params: [],
  });

  const formatAndShorten = (value: any, decimals = 18) => {
    if (!value) return "0.00";
    const formatted = utils.formatUnits(value, decimals);
    return parseFloat(formatted).toFixed(2);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Pandora's Pool Overview</h1>
      <p className="mt-2 text-gray-600">
        Live statistics from the Pool Pandoras smart contract.
      </p>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard 
          title="ETH in Vault" 
          value={`Ξ ${formatAndShorten(vaultStats?.ethInVault)}`} 
          isLoading={isLoading} 
        />
        <StatCard 
          title="USDC in Vault" 
          value={`$ ${formatAndShorten(vaultStats?.usdcInVault, 6)}`} // USDC usually has 6 decimals
          isLoading={isLoading} 
        />
        <StatCard 
          title="Number of Depositors" 
          value={vaultStats?.numDepositors?.toString() ?? 0}
          isLoading={isLoading} 
        />
        <StatCard 
          title="Total ETH Deposited" 
          value={`Ξ ${formatAndShorten(vaultStats?.totalDepositedETH_)}`}
          isLoading={isLoading} 
        />
        <StatCard 
          title="Total USDC Deposited" 
          value={`$ ${formatAndShorten(vaultStats?.totalDepositedUSDC_, 6)}`}
          isLoading={isLoading} 
        />
         <StatCard 
          title="Total ETH Invested" 
          value={`Ξ ${formatAndShorten(vaultStats?.totalInvestedETH_)}`}
          isLoading={isLoading} 
        />
      </div>
    </div>
  );
}
