'use client';

import React, { Suspense, useState, useEffect } from "react";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import { Table, TableHead, TableHeader, TableRow } from "@saasfly/ui/table";
import { DashboardShell } from "@/components/shell";
import { PromotionalBanner } from "@/components/promotional-banners";
import { PandorasPoolRows } from "@/components/PandorasPoolRows";
import { WalletRows } from "@/components/WalletRows";

import { 
  useActiveAccount, 
  useActiveWalletChain, 
  useSwitchActiveWalletChain 
} from "thirdweb/react";
import { config } from "@/config";

interface TokenStats { 
  marketcap: string; 
  circulatingSupply: string; 
  holders: string; 
  price: string; 
  liquidity: string; 
  treasury: string; 
  marketcapChange: number; 
  liquidityChange: number; 
  treasuryChange: number; 
}

async function getTokenStats(): Promise<TokenStats> { 
  await new Promise((resolve) => setTimeout(resolve, 500)); 
  return { 
    marketcap: "29.80M", 
    circulatingSupply: "9.00", 
    holders: "82K", 
    price: "244.25", 
    liquidity: "2.00M", 
    treasury: "1.0M", 
    marketcapChange: 1.25, 
    liquidityChange: -0.15, 
    treasuryChange: 1.25, 
  }; 

}
function StatsOverview({ stats }: { stats: TokenStats | null }) { if (!stats) { return ( 
  <div className="animate-pulse space-y-1">
    <div className="h-8 w-full rounded bg-gray-800/50"></div>
    <div className="h-40 w-full rounded bg-gray-800/50"></div></div> 
    ); 
  }

  return ( 
    <div className="space-y-1">
      <div className="flex gap-2">
        <div className="rounded-lg border border-slate-800 pl-3 pr-3">
          <h3 className="text-xs font-medium text-gray-400">PBOX Price</h3>
          <div className="flex items-baseline">
            <p className="text-sm font-semibold font-mono text-white">coming soon</p>
          </div>
        </div>
      </div>
    </div> 
  ); 
}

interface Investment { 
  id: string; 
  name: string; 
  amount: string; 
  tickets: string; 
  currency: string; 
}

const dummyInvestments: Investment[] = [];

function InvestmentList() { 
  return ( 
    <div className="divide-y divide-gray-800 rounded-lg bg-zinc-900">
      <div className="p-4 mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-8">
            <span className="text-sm font-medium text-gray-400">Portfolio</span>
            <span className="text-sm font-medium text-gray-400">Tickets</span>
            <span className="text-sm font-medium text-gray-400">Action</span>
            </div>
            <div className="relative">
              <select defaultValue="all" className="appearance-none bg-zinc-900 text-white text-sm rounded-lg px-4 py-2 pr-12 pl-4 border border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[180px] cursor-pointer font-medium">
                <option value="all">All Investments</option>
                <option value="real-estate">Real Estate</option>
                <option value="startups">Startups</option>
                <option value="scaleups">Scaleups</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              </div>
                    <Table className="divide-y divide-gray-800">
                      <TableHeader>
                        <TableRow className="hover:bg-gray-800/50"><TableHead className="w-[200px] text-gray-400">Name</TableHead>
                        <TableHead className="text-gray-400">Amount</TableHead>
                        <TableHead className="text-gray-400">Tickets</TableHead>
                        <TableHead className="text-gray-400">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <tbody className="divide-y divide-gray-800">{dummyInvestments.map((investment) => ( <tr key={investment.id} className="hover:bg-gray-800/50">
                        <td className="px-4 py-4 text-white">{investment.name}</td>
                        <td className="px-4 py-4 text-white">{investment.amount} {investment.currency}</td>
                        <td className="px-4 py-4 text-white flex items-center">{investment.tickets}<ChevronRightIcon className="h-4 w-4 ml-2 text-gray-400" /></td>
                        <td className="px-4 py-4">
                          <button className="text-lime-300 hover:text-lime-200">View Details</button>
                        </td>
                        </tr> 
                        ))}
                        <WalletRows />
                        <PandorasPoolRows />
                      </tbody>
                    </Table>
                </div>
              </div> 
            ); 
          }

async function fetchUserName(address: string): Promise<string | null> {
  if (address.toLowerCase() === "0xdd2fd4581271e230360230f9337d5c0430bf44c0") {
    await new Promise(resolve => setTimeout(resolve, 300)); 
    return "vitalik.eth";
  }
  return null;
}


export default function DashboardPage() {
  const [tokenStats, setTokenStats] = useState<TokenStats | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();

  useEffect(() => {
    if (account && activeChain && Number(activeChain.id) !== Number(config.chain.id)) {
      void switchChain(config.chain).catch((err: unknown) => {
        console.error("El usuario rechazó el cambio de red o hubo un error:", err);
      });
    }
  }, [account, activeChain, switchChain]);

  useEffect(() => {
    if (account?.address) {
      void fetchUserName(account.address).then(name => {
        setUserName(name);
      });
    } else {
      setUserName(null);
    }
  }, [account?.address]);


  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await getTokenStats();
        setTokenStats(stats);
      } catch (error) {
        console.error("Error al obtener las estadísticas del token:", error);
      }
    };
    void fetchStats();
  }, []);

  return (
    <DashboardShell wallet={account?.address} userName={userName ?? undefined}>
      <StatsOverview stats={tokenStats} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 my-6">
        <PromotionalBanner title="Hemp Project" subtitle="Green GENESIS Become an early supporter" actionText="Soon do more with hemp!" variant="purple" imageUrl="/images/sem.jpeg" />
        <PromotionalBanner title="web3 Casino Project" subtitle="Ever dream about owning a casino?" actionText="Soon to be launched" variant="green" imageUrl="/images/blockbunny.jpg" />
        <PromotionalBanner title="Narai Loft" subtitle="Want a loft with ocean view?" actionText="Own it soon!" variant="red" imageUrl="/images/narailoft.jpg" />
      </div>
      <Suspense fallback={<div className="divide-border-200 divide-y rounded-md border p-4"><div className="h-24 animate-pulse rounded bg-muted" /></div>}>
        <InvestmentList />
      </Suspense>
    </DashboardShell>
  );
}