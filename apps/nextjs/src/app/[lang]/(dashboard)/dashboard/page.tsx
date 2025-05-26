import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";

import { authOptions, getCurrentUser } from "@saasfly/auth";
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
} from "@saasfly/ui/table";

// import { DashboardHeader } from "~/components/header";
// import { K8sCreateButton } from "~/components/k8s/cluster-create-button";
import { DashboardShell } from "~/components/shell";
import type { Locale } from "~/config/i18n-config";
import { getDictionary } from "~/lib/get-dictionary";
import type { Dictionary } from "~/types";
import { trpc } from "~/trpc/server";
import { PromotionalBanner } from "~/components/promotional-banners";

export const metadata = {
  title: "Dashboard",
};

// Interface for token stats
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
  // TODO: Implement real data fetching from your API
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

function StatsOverview({ stats }: { stats: TokenStats }) {
  return (
    <div className="space-y-1">
      {/* Top Independent Stats */}
      <div className="flex gap-2">
        {/* Holders Stats */}
        <div className="rounded-lg border pl-3 pr-3 border-slate-800">
          <h3 className="text-xs font-medium text-gray-400">Holders</h3>
          <div className="flex items-baseline"> 
            <p className="text-sm font-semibold font-mono text-white">{stats.holders}</p>
          </div>
        </div>

        {/* PBOX Price Stats */}
        <div className="rounded-lg border border-slate-800 pl-3 pr-3">
          <h3 className="text-xs font-medium text-gray-400">PBOX Price</h3>
          <div className="flex items-baseline">
            <p className="text-sm font-semibold font-mono text-white">${stats.price}</p>
          </div>
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-3">
        {/* Circulating Supply */}
        <div className="rounded-l-lg bg-zinc-900 p-6">
          <h3 className="text-sm font-medium text-gray-400">Circulating Supply</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-semibold font-mono text-white">
              {stats.circulatingSupply} ₿
            </p>
          </div>
        </div>

        {/* Liquidity */}
        <div className="bg-zinc-900 p-6">
          <h3 className="text-sm font-medium text-gray-400">Liquidity</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-semibold font-mono text-white">${stats.liquidity}</p>
            <p className="ml-2 flex items-center text-sm text-red-400">
              <ArrowTrendingDownIcon className="h-4 w-4" />
              {Math.abs(stats.liquidityChange)}%
            </p>
          </div>
        </div>

        {/* Treasury */}
        <div className="rounded-r-smlg bg-zinc-900 p-6">
          <h3 className="text-sm font-medium text-gray-400">Treasury</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-semibold font-mono text-white">${stats.treasury}</p>
            <p className="ml-2 flex items-center text-sm text-green-400">
              <ArrowTrendingUpIcon className="h-4 w-4" />
              {stats.treasuryChange}%
            </p>
          </div>
        </div>
      </div>

      {/* Marketcap section - commented out */}
      {/* <div className="rounded-lg bg-zinc-900 p-6">
        <h3 className="text-sm font-medium text-gray-400">Marketcap</h3>
        <div className="mt-2 flex items-baseline">
          <p className="text-3xl font-semibold font-mono text-white">${stats.marketcap}</p>
          <p className="ml-2 flex items-center text-sm text-green-400">
            <ArrowTrendingUpIcon className="h-4 w-4" />
            {stats.marketcapChange}%
          </p>
        </div>
      </div> */}
    </div>
  );
}

// Add new interface for investments
interface Investment {
  id: string;
  name: string;
  amount: string;
  tickets: string;
  currency: string;
}

// Dummy data for investments
const dummyInvestments: Investment[] = [
  {
    id: "1",
    name: "Narai",
    amount: "1,233.58",
    tickets: "2 Tickets",
    currency: "USDT",
  },
  {
    id: "2",
    name: "USDC",
    amount: "558.24",
    tickets: "1 Ticket",
    currency: "USDT",
  },
  {
    id: "3",
    name: "FTM",
    amount: "779",
    tickets: "3 Tickets",
    currency: "USDT",
  },
  {
    id: "4",
    name: "AGOD-FTM LP 362 LP",
    amount: "466.47",
    tickets: "1 Ticket",
    currency: "USDT",
  },
];

function InvestmentList({ dict }: { dict: Dictionary }) {
  return (
    <div className="divide-y divide-gray-800 rounded-lg bg-zinc-900">
      <div className="p-4 mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-8">
            <span className="text-sm font-medium text-gray-400">{dict.common.portfolio}</span>
            <span className="text-sm font-medium text-gray-400">{dict.common.tickets}</span>
            <span className="text-sm font-medium text-gray-400">{dict.common.action}</span>
          </div>
          <div className="relative">
            <select 
              defaultValue="all"
              className="
                appearance-none
                bg-zinc-900 
                text-white 
                text-sm 
                rounded-lg 
                px-4 
                py-2 
                pr-12
                pl-4 
                border 
                border-gray-800
                focus:outline-none 
                focus:ring-2 
                focus:ring-blue-500
                focus:border-blue-500
                min-w-[180px]
                cursor-pointer
                font-medium
              "
            >
              <option value="all">{dict.common.all_investments}</option>
              <option value="real-estate">{dict.common.real_estate}</option>
              <option value="startups">{dict.common.startups}</option>
              <option value="scaleups">{dict.common.scaleups}</option>
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
            <TableRow className="hover:bg-gray-800/50">
              <TableHead className="w-[200px] text-gray-400">Name</TableHead>
              <TableHead className="text-gray-400">Amount</TableHead>
              <TableHead className="text-gray-400">Tickets</TableHead>
              <TableHead className="text-gray-400">Action</TableHead>
            </TableRow>
          </TableHeader>
          <tbody className="divide-y divide-gray-800">
            {dummyInvestments.map((investment) => (
              <tr key={investment.id} className="hover:bg-gray-800/50">
                <td className="px-4 py-4 text-white">{investment.name}</td>
                <td className="px-4 py-4 text-white">
                  {investment.amount} {investment.currency}
                </td>
                <td className="px-4 py-4 text-white flex items-center">
                  {investment.tickets}
                  <ChevronRightIcon className="h-4 w-4 ml-2 text-gray-400" />
                </td>
                <td className="px-4 py-4">
                  <button className="text-lime-300 hover:text-lime-200">
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
     </div> 
  );
}

// Main dashboard component
export default async function DashboardPage({
  params: { lang },
}: {
  params: {
    lang: Locale;
  };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(authOptions?.pages?.signIn ?? "/login");
  }

  // Calculate total balance from investments
  const totalBalance = dummyInvestments.reduce((acc, inv) => {
    return acc + parseFloat(inv.amount.replace(',', ''));
  }, 0);

  // TODO: Get wallet address from authentication
  const walletAddress = "delBull.blockchain";

  const dict = await getDictionary(lang);
  const tokenStats = await getTokenStats();

  try {
    const customer = await trpc.customer.queryCustomer.query({
      userId: user.id,
    });

    if (!customer) {
      await trpc.customer.insertCustomer.mutate({
        userId: user.id,
      });
    }

    return (
      <DashboardShell 
      wallet={walletAddress} 
      totalBalance={totalBalance}>
        <StatsOverview stats={tokenStats} />

            {/* Promotional Banners */}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 my-6">
      <PromotionalBanner
        title="Hemp Project"
        subtitle="Green GENESIS Become an early supporter"
      actionText="Do more with hemp!"
        variant="purple"
      />
      <PromotionalBanner
        title="Mining Project"
        subtitle="Ever dream about being a miner?"
        actionText="Soon to be launched"
        variant="green"
      />
      <PromotionalBanner
        title="RA Wallet"
        subtitle="Best blockchain wallet, rewards like no other"
        actionText="Win by holding"
        variant="red"
      />
    </div>

        <Suspense
          fallback={
            <div className="divide-border-200 divide-y rounded-md border p-4">
              <div className="h-24 animate-pulse rounded bg-muted" />
            </div>
          }
        >
          <InvestmentList dict={dict} />
        </Suspense>
      </DashboardShell>
    );
  } catch (error) {
    console.error("Error loading dashboard:", error);
    return (
      <DashboardShell wallet={walletAddress} totalBalance={0}>
        <div className="text-red-500">
          Error loading dashboard data
        </div>
      </DashboardShell>
    );
  }
}