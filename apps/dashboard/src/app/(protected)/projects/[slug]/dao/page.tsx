"use client";

import { useState, use, Suspense } from "react";
import { notFound } from "next/navigation";
import ProjectNavigationHeader from "@/components/projects/ProjectNavigationHeader"; // Verify import path
import { DAOSidebar } from "@/components/dao/DAOSidebar";
import { DAODashboard } from "@/components/dao/DAODashboard";
import { Loader2 } from "lucide-react";

// Use same fetch logic as ProjectPage or call API
// Since this is a Client Component (for state), we might fetch in useEffect or use `use` with a Promise passed from layout/server component.
// For simplicity and consistency with current patterns, let's fetch client-side or use a Server Component wrapper.
// Let's make the Page a Server Component that passes data to a Client Wrapper.

// -- Wrapper Component --
// We need to define this in the same file or separate. 
// Given the pattern in ProjectPage, it's a Client Component that fetches data.
// Let's adapt that pattern.

import useSWR from "swr";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { getContract, defineChain } from "thirdweb";
import { client } from "@/lib/thirdweb-client"; // Verify client import path

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Dummy contract for typing fallback
const dummyContract = getContract({
    client,
    chain: defineChain(11155111),
    address: "0x0000000000000000000000000000000000000000"
});

export default function DAOPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = use(params); // React 19 `use` for params
    const { slug } = resolvedParams;

    const { data: project, error, isLoading } = useSWR(`/api/projects/${slug}`, fetcher);
    const [activeView, setActiveView] = useState('overview');
    const account = useActiveAccount();

    // Determine ownership
    const isOwner = account?.address && project?.applicant_wallet_address
        ? account.address.toLowerCase() === project.applicant_wallet_address.toLowerCase()
        : false;

    // -- Voting Power Fetching --
    const govTokenAddress = project?.governance_token_address;
    const chainId = project?.chain_id ? Number(project.chain_id) : 11155111;

    const tokenContract = govTokenAddress ? getContract({
        client,
        chain: defineChain(chainId),
        address: govTokenAddress
    }) : undefined;

    const { data: votingPowerBigInt } = useReadContract({
        contract: tokenContract || dummyContract,
        method: "function getVotes(address) view returns (uint256)",
        params: [account?.address || "0x0000000000000000000000000000000000000000"],
        queryOptions: { enabled: !!tokenContract && !!account }
    });

    const votingPower = votingPowerBigInt ? Number(votingPowerBigInt) / 1e18 : 0; // Assuming 18 decimals. Ideally read decimals too.


    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black">
                <Loader2 className="w-10 h-10 animate-spin text-lime-500 mb-4" />
                <p className="text-zinc-500">Cargando Sistema DAO...</p>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                Error al cargar el proyecto o no encontrado.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white pb-20">
            {/* Universal Nav */}
            <ProjectNavigationHeader />
            {/* Note: ProjectNavigationHeader usually needs to know it's in detailed view or just top nav? 
         It seems to be the top navbar. */ }

            <div className="flex flex-col lg:flex-row max-w-[1600px] mx-auto">
                {/* Main Content (Left/Center) */}
                <div className="flex-1 order-2 lg:order-1 border-r border-zinc-800/50 min-h-[calc(100vh-80px)]">
                    <DAODashboard project={project} activeView={activeView} isOwner={isOwner} />
                </div>

                {/* Sidebar (Right Side - per User Request) */}
                <div className="lg:w-80 order-1 lg:order-2">

                    <DAOSidebar
                        project={project}
                        activeView={activeView}
                        onViewChange={setActiveView}
                        isOwner={isOwner}
                        votingPower={votingPower}
                        className="lg:h-[calc(100vh-80px)]"
                    />
                </div>
            </div>
        </div>
    );
}
