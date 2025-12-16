"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Vote, Coins, TrendingUp, Users, AlertTriangle, Settings2, X, Bell, CheckCircle2, XCircle, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GovernanceParticipationModal } from "./GovernanceParticipationModal";
import { GovernanceProposalModal } from "./GovernanceProposalModal";
import { GovernanceWithdrawModal } from "./GovernanceWithdrawModal";
import { useReadContract, useActiveAccount, useContractEvents, TransactionButton } from "thirdweb/react";
import { getContract, prepareEvent, prepareContractCall } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { config } from "@/config";
import { governanceABI } from "@/lib/governance-abi";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";

// --- Simple Local Settings Store (Mock Backend for Text/CMS) ---
const useGovernanceSettings = () => {
    const [settings, setSettings] = useState({
        apy: "12.5",
        stakedSubtext: "+12% this week",
        activityTitle: "Anuncio del Protocolo",
        activityText: "Participar en esta etapa temprana otorga multiplicadores de recompensa únicos.",
        announcement: "Participar en esta etapa temprana otorga multiplicadores de recompensa únicos.",
        boostEnabled: true,
        boostMultiplier: "x2.5"
    });

    useEffect(() => {
        const saved = localStorage.getItem("governance_settings");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setSettings(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error("Failed to parse settings", e);
            }
        }
    }, []);

    const updateSettings = (newSettings: Partial<typeof settings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        localStorage.setItem("governance_settings", JSON.stringify(updated));
    };

    return { settings, updateSettings };
};

export default function GovernancePage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [pendingProposal, setPendingProposal] = useState<{ title: string; description: string; days: number } | null>(null);
    const [activeTab, setActiveTab] = useState("overview");
    const account = useActiveAccount();
    const { settings, updateSettings } = useGovernanceSettings();

    const contract = getContract({
        client,
        chain: config.chain,
        address: config.governanceContractAddress,
        abi: governanceABI as any
    });

    // --- On-Chain Data Fetching ---

    // 1. Vault Stats
    const { data: vaultStats, isLoading } = useReadContract({
        contract,
        method: "getVaultStats",
        params: []
    });

    // 2. User Stats
    const { data: userStats } = useReadContract({
        contract,
        method: "getUserStats",
        params: [account?.address || "0x0000000000000000000000000000000000000000"]
    });

    // 3. User Deposits
    const { data: userDeposits } = useReadContract({
        contract,
        method: "getUserDeposits",
        params: [account?.address || "0x0000000000000000000000000000000000000000"]
    });

    // 4. Voting Power
    const { data: votingPower } = useReadContract({
        contract,
        method: "getVotingPower",
        params: [account?.address || "0x0000000000000000000000000000000000000000"]
    });

    // 5. Proposals
    const { data: rawProposals, isLoading: isLoadingProposals } = useReadContract({
        contract,
        method: "getAllProposals",
        params: []
    });

    // --- Events for Activity Feed ---
    const preparedDepositEvent = prepareEvent({
        signature: "event Deposit(address indexed user, uint8 token, uint256 amount, uint256 when, uint256 depositIndex, bool reinvestment)"
    });
    const preparedProposalEvent = prepareEvent({
        signature: "event ProposalCreated(uint256 indexed id, address indexed proposer, string title, uint256 endTime)"
    });

    const { data: depositEvents } = useContractEvents({ contract, events: [preparedDepositEvent] });
    const { data: proposalEvents } = useContractEvents({ contract, events: [preparedProposalEvent] });

    // --- Derived Data ---
    const totalStakedETH = vaultStats ? (Number(vaultStats[0]) / 1e18).toFixed(2) : "0.00";
    const totalStakedUSDC = vaultStats ? (Number(vaultStats[1]) / 1e6).toFixed(0) : "0";
    const totalDisplay = `${totalStakedETH} ETH + $${totalStakedUSDC}`;

    const userVP = votingPower ? Number(votingPower).toLocaleString() : "0";

    const uniqueDepositors = new Set(depositEvents?.map(e => e.args.user) || []);
    if (Number(userVP.replace(/,/g, '')) > 0 && account?.address) uniqueDepositors.add(account.address as `0x${string}`);
    const participantCount = uniqueDepositors.size > 0 ? uniqueDepositors.size : ((Number(totalStakedETH) > 0 || Number(totalStakedUSDC) > 0) ? 1 : 0);

    // --- Process Proposals ---
    const now = Date.now() / 1000;
    const proposals = (rawProposals || []).map((p: any) => {
        // Struct: id, proposer, title, description, startTime, endTime, forVotes, againstVotes, active, executed
        const endTime = Number(p.endTime);
        const isActive = p.active;
        const isExecuted = p.executed;

        let status: 'active' | 'closed' | 'completed' = 'closed';
        if (isActive && now < endTime) status = 'active';
        else if (isActive && now >= endTime) status = 'closed'; // Pending execution/closing
        else if (isExecuted) status = 'completed';

        return {
            id: p.id,
            proposer: p.proposer,
            title: p.title,
            description: p.description,
            startDate: Number(p.startTime) * 1000,
            endDate: endTime * 1000,
            votesFor: Number(p.forVotes), // VP
            votesAgainst: Number(p.againstVotes), // VP
            status,
            raw: p
        };
    }).sort((a: any, b: any) => b.id < a.id ? 1 : -1).reverse(); // Newest first

    // --- Activity Feed Merge ---
    interface ActivityItem {
        type: 'contract' | 'proposal';
        title?: string; // Only for proposals
        user: string;
        token?: string; // Only for contract
        amount?: bigint; // Only for contract
        isReinvestment?: boolean;
        timestamp: number;
    }

    const combinedActivity: ActivityItem[] = [
        ...(depositEvents?.map(e => ({
            type: 'contract' as const,
            user: e.args.user,
            token: e.args.token === 0 ? "ETH" : "USDC",
            amount: e.args.amount,
            isReinvestment: e.args.reinvestment,
            timestamp: Number(e.args.when) * 1000
        })) || []),
        ...(proposalEvents?.map(e => ({
            type: 'proposal' as const,
            title: e.args.title,
            user: e.args.proposer,
            timestamp: 0 // Will be patched
        })) || [])
    ].sort((a: ActivityItem, b: ActivityItem) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 10);

    // Patch proposal feed from finding matching proposal in `proposals` list
    const enrichedActivity = combinedActivity.map((act: ActivityItem) => {
        if (act.type === 'proposal' && act.title) {
            const p = proposals.find((prop: any) => prop.title === act.title);
            if (p) return { ...act, timestamp: p.startDate };
        }
        return act;
    }).sort((a: ActivityItem, b: ActivityItem) => (b.timestamp || 0) - (a.timestamp || 0));

    // Auto-Pinning
    const activeProposal = proposals.find((p: any) => p.status === 'active');
    const pinnedContent = activeProposal ? {
        title: `Votación Activa: ${activeProposal.title}`,
        text: activeProposal.description,
        isProposal: true,
        endDate: activeProposal.endDate
    } : {
        title: settings.activityTitle,
        text: settings.activityText,
        isProposal: false
    };

    // 6. Admin Check
    // Hybrid: Check on-chain role OR off-chain specific super-admin wallet (from .env)
    const { data: hasChainRole, isLoading: isLoadingRole } = useReadContract({
        contract,
        method: "hasRole",
        params: ["0x0000000000000000000000000000000000000000000000000000000000000000", account?.address || "0x0000000000000000000000000000000000000000"]
    });

    const isSuperAdmin = !!(
        account?.address &&
        config.superAdminAddress &&
        account.address.toLowerCase() === config.superAdminAddress.toLowerCase()
    );

    const isAdmin = isSuperAdmin || !!hasChainRole;

    // Debugging Permissions
    useEffect(() => {
        if (account?.address) {
            console.log(`[Permissions] Checking Access for: ${account.address}`);
            console.log(`- Configured SuperAdmin: ${config.superAdminAddress || "Not Set"}`);
            console.log(`- Is Super Admin (Env): ${isSuperAdmin}`);
            console.log(`- Has Chain Role (0x00): ${hasChainRole} (Loading: ${isLoadingRole})`);
            console.log(`-> FINAL IS_ADMIN: ${isAdmin}`);
        }
    }, [account?.address, isSuperAdmin, hasChainRole, isLoadingRole]);


    return (
        <div className="min-h-screen bg-black text-white w-full">
            <div className="w-full px-4 py-8 md:px-8 space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-lime-400 to-emerald-500">
                            Pandora's Governance DAO
                        </h1>
                        <p className="text-gray-400 mt-2">
                            Participa en la toma de decisiones y obtén recompensas exclusivas.
                        </p>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
                        {isAdmin && (
                            <Button
                                variant="outline"
                                onClick={() => setIsManageOpen(true)}
                                className="border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 rounded-xl h-auto py-2 px-4 whitespace-nowrap flex-1 md:flex-none"
                            >
                                <Settings2 className="mr-2 h-4 w-4" />
                                Manage
                            </Button>
                        )}

                        <Button
                            variant="outline"
                            onClick={() => setIsWithdrawModalOpen(true)}
                            className="border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 rounded-xl h-auto py-2 px-4 whitespace-nowrap flex-1 md:flex-none"
                        >
                            <Unlock className="mr-2 h-4 w-4" />
                            Retiros
                        </Button>
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            // ...
                            className="bg-lime-500 text-black hover:bg-lime-400 font-bold px-6 py-2 rounded-xl shadow-[0_0_20px_rgba(132,204,22,0.3)] transition-all hover:scale-105 whitespace-nowrap flex-1 md:flex-none"
                        >
                            <ShieldCheck className="mr-2 h-5 w-5" />
                            Participar Ahora
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard title="Total Staked Protocol" value={isLoading ? "Loading..." : totalDisplay} change={settings.stakedSubtext} icon={<Coins className="h-5 w-5 text-lime-400" />} />
                    <StatsCard title="APY Actual" value={`${settings.apy}%`} change={`+ Boost ${settings.boostMultiplier}`} icon={<TrendingUp className="h-5 w-5 text-emerald-400" />} />
                    <StatsCard title="Participantes" value={participantCount.toString()} change={participantCount > 0 ? "Active DAO Members" : "Be the first!"} icon={<Users className="h-5 w-5 text-blue-400" />} />
                    <StatsCard title="Tu Voting Power" value={`${userVP} VP`} change={account ? "Derived from Staking" : "Connect Wallet"} icon={<Vote className="h-5 w-5 text-purple-400" />} />
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
                        <TabsTrigger value="overview">Visión General</TabsTrigger>
                        <TabsTrigger value="staking">Staking & Rewards</TabsTrigger>
                        <TabsTrigger value="proposals">Propuestas ({proposals.filter((p: any) => p.status === 'active').length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-6 space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2 bg-zinc-900/50 border-zinc-800">
                                <CardHeader>
                                    <CardTitle>Actividad Reciente</CardTitle>
                                    <CardDescription>Movimientos y actualizaciones del protocolo</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {/* Pinned Announcement */}
                                        <div className={`flex items-center justify-between p-4 rounded-lg border border-l-4 ${pinnedContent.isProposal ? 'bg-purple-900/20 border-zinc-900 border-l-purple-500' : 'bg-zinc-950/50 border-zinc-900 border-l-blue-500'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`h-10 w-10 min-w-10 rounded-full flex items-center justify-center ${pinnedContent.isProposal ? 'bg-purple-500/10' : 'bg-blue-500/10'}`}>
                                                    {pinnedContent.isProposal ? <Vote className="h-5 w-5 text-purple-500" /> : <Bell className="h-5 w-5 text-blue-500" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{pinnedContent.title}</p>
                                                    <p className="text-sm text-gray-500 line-clamp-2">{pinnedContent.text}</p>
                                                    {pinnedContent.isProposal && (
                                                        <p className="text-xs text-purple-400 mt-1">Finaliza: {new Date(pinnedContent.endDate!).toLocaleDateString()}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-xs font-mono text-zinc-500 ml-2">PINNED</span>
                                        </div>

                                        {/* Activity Feed */}
                                        {enrichedActivity.map((event: any, i) => {
                                            if (event.type === 'proposal') {
                                                const iconColor = 'text-purple-500 bg-purple-500/10';
                                                return (
                                                    <div
                                                        key={`prop-${i}`}
                                                        onClick={() => setActiveTab("proposals")}
                                                        role="button"
                                                        tabIndex={0}
                                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveTab("proposals"); }}
                                                        className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-lg border border-zinc-900 cursor-pointer hover:bg-zinc-900 transition-colors group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${iconColor}`}>
                                                                <Vote className="h-5 w-5 text-purple-500" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-white group-hover:text-purple-400 transition-colors">New Proposal Created</p>
                                                                <p className="text-sm text-gray-500">{event.title}</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs font-mono text-zinc-500">
                                                            {event.timestamp ? new Date(event.timestamp).toLocaleDateString() : 'Just now'}
                                                        </span>
                                                    </div>
                                                );
                                            } else {
                                                const amount = event.token === "ETH"
                                                    ? (Number(event.amount) / 1e18).toFixed(4) + " ETH"
                                                    : (Number(event.amount) / 1e6).toFixed(2) + " USDC";
                                                return (
                                                    <div key={`tx-${i}`} className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-lg border border-zinc-900">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${event.isReinvestment ? 'bg-indigo-500/10' : 'bg-lime-500/10'}`}>
                                                                {event.isReinvestment ? <TrendingUp className="h-5 w-5 text-indigo-500" /> : <ShieldCheck className="h-5 w-5 text-lime-500" />}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-white">
                                                                    {event.isReinvestment ? `Compound ${event.token}` : `New ${event.token} Stake`}
                                                                </p>
                                                                <p className="text-sm text-gray-500">{event.user.substring(0, 6)}...{event.user.slice(-4)}</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs font-mono text-zinc-500">{amount}</span>
                                                    </div>
                                                );
                                            }
                                        })}
                                        {enrichedActivity.length === 0 && (
                                            <p className="text-center text-gray-500 py-4 opacity-50">Waiting for live transactions...</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-zinc-900/50 border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950">
                                <CardHeader>
                                    <CardTitle className="text-yellow-400 flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5" />
                                        Early Access
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm text-gray-300">
                                    <p>{settings.announcement}</p>
                                    {settings.boostEnabled && (
                                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                            <span className="block font-bold text-yellow-500 mb-1">Boost {settings.boostMultiplier}</span>
                                            Activo para depositantes de Fase 0.
                                        </div>
                                    )}
                                    <Button className="w-full" variant="outline" onClick={() => setIsModalOpen(true)}>
                                        Aprovechar Boost
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="staking">
                        {userDeposits && userDeposits.length > 0 ? (
                            <div className="grid gap-4">
                                {userDeposits.map((dep: any, i: number) => {
                                    const amount = dep.token === 0
                                        ? (Number(dep.amount) / 1e18).toFixed(4) + " ETH"
                                        : (Number(dep.amount) / 1e6).toFixed(2) + " USDC";
                                    const date = new Date(Number(dep.timestamp) * 1000).toLocaleDateString();
                                    const isWithdrawn = (dep.flags & 1) !== 0;
                                    const isReinvest = (dep.flags & 8) !== 0;

                                    return (
                                        <div key={i} className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${isReinvest ? 'bg-indigo-500/10' : 'bg-lime-500/10'}`}>
                                                    {isReinvest ? <TrendingUp className="h-4 w-4 text-indigo-500" /> : <Coins className="h-4 w-4 text-lime-500" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">{amount}</p>
                                                    <p className="text-xs text-gray-500">{isReinvest ? "Reinvested" : "Deposited"} on {date}</p>
                                                </div>
                                            </div>
                                            <div>
                                                {isWithdrawn ? <span className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded">Withdrawn</span> : <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">Active</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4 bg-zinc-900/30 rounded-2xl border border-zinc-800 border-dashed">
                                <Coins className="h-16 w-16 text-zinc-700" />
                                <h3 className="text-xl font-bold text-gray-300">No Active Staking</h3>
                                <p className="text-gray-500 max-w-md">You don't have any active deposits yet. Start staking to earn rewards.</p>
                                <Button onClick={() => setIsModalOpen(true)}>Start Staking</Button>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="proposals">
                        {proposals.length > 0 ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-white">Active Proposals</h3>
                                    {isAdmin && (
                                        <Button variant="secondary" size="sm" onClick={() => setIsProposalModalOpen(true)}>
                                            <Vote className="mr-2 h-4 w-4" /> Nueva Propuesta
                                        </Button>
                                    )}
                                </div>

                                <div className="grid gap-4">
                                    {proposals.map((prop: any) => {
                                        const totalVotes = prop.votesFor + prop.votesAgainst;
                                        const forPercent = totalVotes > 0 ? (prop.votesFor / totalVotes) * 100 : 0;
                                        const againstPercent = totalVotes > 0 ? (prop.votesAgainst / totalVotes) * 100 : 0;

                                        return (
                                            <Card key={prop.id.toString()} className="bg-zinc-900/50 border-zinc-800">
                                                <CardContent className="p-6">
                                                    <div className="space-y-6">
                                                        <div className="flex justify-between items-start">
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="text-lg font-bold text-white">{prop.title}</h4>
                                                                    <span className={`px-2 py-0.5 text-xs rounded-full ${prop.status === 'active' ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-700 text-zinc-400'}`}>
                                                                        {prop.status.toUpperCase()}
                                                                    </span>
                                                                </div>
                                                                <p className="text-gray-400 text-sm max-w-2xl">{prop.description}</p>
                                                                <div className="flex items-center gap-4 text-xs text-zinc-500 pt-2">
                                                                    <span>Ends: {new Date(prop.endDate).toLocaleDateString()}</span>
                                                                    <span>Total Votes (VP): {totalVotes.toLocaleString()}</span>
                                                                </div>
                                                            </div>

                                                            {prop.status === 'active' && (
                                                                <TransactionButton
                                                                    transaction={() => prepareContractCall({
                                                                        contract,
                                                                        method: "closeProposal",
                                                                        params: [prop.id]
                                                                    })}
                                                                    onTransactionConfirmed={() => toast.success("Proposal Closed")}
                                                                    theme="dark"
                                                                    className="!bg-zinc-800 !text-zinc-400 hover:!bg-zinc-700 !scale-90 !py-2 !px-4"
                                                                >
                                                                    Close
                                                                </TransactionButton>
                                                            )}
                                                        </div>

                                                        {/* Progress Bar */}
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-xs font-medium text-gray-400">
                                                                <span className="text-lime-400">For: {prop.votesFor.toLocaleString()} VP ({forPercent.toFixed(1)}%)</span>
                                                                <span className="text-red-400">Against: {prop.votesAgainst.toLocaleString()} VP ({againstPercent.toFixed(1)}%)</span>
                                                            </div>
                                                            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                                                                <div className="bg-lime-500 transition-all duration-500" style={{ width: `${forPercent}%` }} />
                                                                <div className="bg-red-500 transition-all duration-500" style={{ width: `${againstPercent}%` }} />
                                                            </div>
                                                        </div>

                                                        {/* Voting Actions */}
                                                        {prop.status === 'active' && (
                                                            <div className="flex gap-3 pt-2">
                                                                <TransactionButton
                                                                    transaction={() => prepareContractCall({
                                                                        contract,
                                                                        method: "vote",
                                                                        params: [prop.id, true]
                                                                    })}
                                                                    onTransactionConfirmed={() => toast.success("Voted FOR!")}
                                                                    theme="dark"
                                                                    className="!bg-lime-500/10 hover:!bg-lime-500/20 !text-lime-500 !border !border-lime-500/20 !flex-1 !font-bold"
                                                                >
                                                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Vote FOR
                                                                </TransactionButton>

                                                                <TransactionButton
                                                                    transaction={() => prepareContractCall({
                                                                        contract,
                                                                        method: "vote",
                                                                        params: [prop.id, false]
                                                                    })}
                                                                    onTransactionConfirmed={() => toast.success("Voted AGAINST")}
                                                                    theme="dark"
                                                                    className="!bg-red-500/10 hover:!bg-red-500/20 !text-red-500 !border !border-red-500/20 !flex-1 !font-bold"
                                                                >
                                                                    <XCircle className="mr-2 h-4 w-4" /> Vote AGAINST
                                                                </TransactionButton>
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4 bg-zinc-900/30 rounded-2xl border border-zinc-800 border-dashed">
                                <Vote className="h-16 w-16 text-zinc-700" />
                                <h3 className="text-xl font-bold text-gray-300">No Proposals Found</h3>
                                <p className="text-gray-500 max-w-md">Currently there are no active proposals on-chain.</p>
                                {isAdmin && (
                                    <Button variant="secondary" className="mt-4" onClick={() => setIsProposalModalOpen(true)}>
                                        Create Proposal (On-Chain)
                                    </Button>
                                )}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            <GovernanceParticipationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

            {/* Create Proposal Modal Wrapper to handle Transaction */}
            <GovernanceProposalModal
                isOpen={isProposalModalOpen}
                onClose={() => setIsProposalModalOpen(false)}
                onSubmit={(data) => {
                    const diff = new Date(data.endDate).getTime() - Date.now();
                    const days = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
                    setPendingProposal({ title: data.title, description: data.description, days });
                    setIsProposalModalOpen(false);
                }}
            />

            {/* Confirmation Modal for Proposal Creation */}
            <Dialog open={!!pendingProposal} onOpenChange={(open) => !open && setPendingProposal(null)}>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Confirm Proposal Creation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-gray-400">
                            You are about to create an On-Chain Proposal. This requires a transaction.
                        </p>
                        <div className="p-4 bg-zinc-900 rounded-lg space-y-2">
                            <p><span className="text-zinc-500">Title:</span> {pendingProposal?.title}</p>
                            <p><span className="text-zinc-500">Duration:</span> {pendingProposal?.days} days</p>
                        </div>
                        <TransactionButton
                            transaction={() => prepareContractCall({
                                contract,
                                method: "createProposal",
                                params: [
                                    pendingProposal!.title,
                                    pendingProposal!.description,
                                    BigInt(pendingProposal!.days)
                                ]
                            })}
                            onTransactionConfirmed={() => {
                                toast.success("Proposal Created Successfully!");
                                setPendingProposal(null);
                            }}
                            theme="dark"
                            className="w-full !bg-lime-500 !text-black hover:!bg-lime-400 !font-bold"
                        >
                            Confirm & Create On-Chain
                        </TransactionButton>
                        <Button variant="ghost" className="w-full" onClick={() => setPendingProposal(null)}>Cancel</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Frontend Settings Modal (Manage) */}
            <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Frontend Settings (Admin)</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Display APY (%)</Label>
                            <Input
                                value={settings.apy}
                                onChange={(e) => updateSettings({ apy: e.target.value })}
                                className="bg-zinc-900 border-zinc-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Boost Multiplier Text</Label>
                            <Input
                                value={settings.boostMultiplier}
                                onChange={(e) => updateSettings({ boostMultiplier: e.target.value })}
                                className="bg-zinc-900 border-zinc-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Activity Feed Title (Pinned)</Label>
                            <Input
                                value={settings.activityTitle}
                                onChange={(e) => updateSettings({ activityTitle: e.target.value })}
                                className="bg-zinc-900 border-zinc-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Activity Feed Text</Label>
                            <Textarea
                                value={settings.activityText}
                                onChange={(e) => updateSettings({ activityText: e.target.value })}
                                className="bg-zinc-900 border-zinc-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Early Access Announcement</Label>
                            <Textarea
                                value={settings.announcement}
                                onChange={(e) => updateSettings({ announcement: e.target.value })}
                                className="bg-zinc-900 border-zinc-800"
                            />
                        </div>
                        <div className="pt-2">
                            <Button className="w-full bg-lime-500 text-black hover:bg-lime-400 font-bold" onClick={() => setIsManageOpen(false)}>
                                Save Settings
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <GovernanceWithdrawModal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} />
        </div>
    );
}

function StatsCard({ title, value, change, icon }: { title: string; value: string; change: string; icon: React.ReactNode }) {
    return (
        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm hover:bg-zinc-900/80 transition-colors">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-zinc-400">{title}</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
                    </div>
                    <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-900">
                        {icon}
                    </div>
                </div>
                <div className="mt-2 flex items-center text-xs">
                    <span className="text-lime-500 font-medium">{change}</span>
                </div>
            </CardContent>
        </Card>
    );
}
