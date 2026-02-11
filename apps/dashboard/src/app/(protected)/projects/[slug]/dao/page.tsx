"use client";

import { useState, use, Suspense, useEffect } from "react";
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
import { useActiveAccount, useReadContract, useActiveWalletConnectionStatus } from "thirdweb/react";
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
    const connectionStatus = useActiveWalletConnectionStatus(); // "connected" | "connecting" | "disconnected"
    const [isOwner, setIsOwner] = useState(false);

    // Initial check and effect for updates
    useEffect(() => {
        if (connectionStatus === 'connecting') return; // Wait

        if (project?.applicant_wallet_address && account?.address) {
            const isMatch = account.address.toLowerCase() === project.applicant_wallet_address.toLowerCase().trim();
            setIsOwner(isMatch);
        } else {
            setIsOwner(false);
        }
    }, [account?.address, project?.applicant_wallet_address, connectionStatus]);

    console.log("DEBUG: DAO Ownership Check", {
        account: account?.address,
        stored: project?.applicant_wallet_address,
        match: isOwner
    });

    // -- Voting Power Fetching (Artifacts / Licenses) --
    // We use the License Contract for voting power, not the Utility Token.
    const licenseAddress = project?.licenseContractAddress;
    const chainId = project?.chain_id ? Number(project.chain_id) : 11155111;

    console.log("DEBUG: DAO Page Setup", {
        licenseAddress,
        project_id: project?.id,
        chainId
    });

    const licenseContract = licenseAddress ? getContract({
        client,
        chain: defineChain(chainId),
        address: licenseAddress
    }) : undefined;

    // Licenses are NFTs (usually 0 decimals, but treated as 1 unit = 1 vote)
    // We don't need decimals for ERC721 usually, but let's assume 18 if strictly needed or 0.
    // Actually, getVotes usually returns WEI format if ERC20Votes, but for simple NFT 1=1. 
    // However, W2ELoom might use standard checkpoints.
    // Let's assume 0 decimals for display of "Count" but check raw value.
    const decimals = 0;



    const { data: votingPowerBigInt } = useReadContract({
        contract: licenseContract || dummyContract,
        method: "function getVotes(address) view returns (uint256)",
        params: [account?.address || "0x0000000000000000000000000000000000000000"],
        queryOptions: { enabled: !!licenseContract && !!account }
    });

    const { data: tokenBalanceBigInt } = useReadContract({
        contract: licenseContract || dummyContract,
        method: "function balanceOf(address) view returns (uint256)",
        params: [account?.address || "0x0000000000000000000000000000000000000000"],
        queryOptions: { enabled: !!licenseContract && !!account }
    });

    console.log("DEBUG: DAO Page Stats", {
        licenseAddress,
        account: account?.address,
        votingPowerRaw: votingPowerBigInt?.toString(),
        tokenBalanceRaw: tokenBalanceBigInt?.toString(),
        decimals
    });

    const divisor = 1; // NFTs are whole units usually
    const votingPower = votingPowerBigInt ? Number(votingPowerBigInt) / divisor : 0;
    const tokenBalance = tokenBalanceBigInt ? Number(tokenBalanceBigInt) / divisor : 0;

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
                        tokenBalance={tokenBalance}
                        className="lg:h-[calc(100vh-80px)]"
                    />
                </div>
            </div>
        </div>
    );
}
