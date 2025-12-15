"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Vote, Coins, TrendingUp, Users, AlertTriangle, Settings2, X, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GovernanceParticipationModal } from "./GovernanceParticipationModal";
import { GovernanceProposalModal } from "./GovernanceProposalModal";
import { useReadContract, useActiveAccount, useContractEvents } from "thirdweb/react";
import { getContract, prepareEvent } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { config } from "@/config";
import { PANDORAS_GOVERNANCE_ABI } from "@/lib/governance-abi";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

// --- Simple Local Settings Store (Mock Backend) ---
const useGovernanceSettings = () => {
    const [settings, setSettings] = useState({
        apy: "12.5",
        stakedSubtext: "+12% this week",
        // participantCount is dynamic now
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

// --- Proposals Local Store ---
interface Proposal {
    id: string;
    title: string;
    description: string;
    endDate: string;
    status: 'active' | 'closed' | 'completed';
    createdAt: number;
    votesFor: number;
    votesAgainst: number;
}

const useGovernanceProposals = () => {
    const [proposals, setProposals] = useState<Proposal[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem("governance_proposals");
        if (saved) {
            try {
                setProposals(JSON.parse(saved));
            } catch (e) { console.error(e); }
        }
    }, []);

    const addProposal = (p: { title: string; description: string; endDate: string }) => {
        const newProposal: Proposal = {
            id: crypto.randomUUID(),
            ...p,
            status: 'active',
            createdAt: Date.now(),
            votesFor: 0,
            votesAgainst: 0
        };
        const updated = [newProposal, ...proposals];
        setProposals(updated);
        localStorage.setItem("governance_proposals", JSON.stringify(updated));
        // Also update activity feed via a custom event or shared state if needed, 
        // but for now we'll just rely on the component re-rendering.
        return newProposal;
    };

    const updateProposalStatus = (id: string, status: 'active' | 'closed' | 'completed') => {
        const updated = proposals.map(p => p.id === id ? { ...p, status } : p);
        setProposals(updated);
        localStorage.setItem("governance_proposals", JSON.stringify(updated));
    };

    return { proposals, addProposal, updateProposalStatus };
};

export default function GovernancePage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [isProposalModalOpen, setIsProposalModalOpen] = useState(false); // New state
    const account = useActiveAccount();
    const { settings, updateSettings } = useGovernanceSettings();
    const { proposals, addProposal, updateProposalStatus } = useGovernanceProposals();

    const contract = getContract({
        client,
        chain: config.chain,
        address: config.governanceContractAddress,
        abi: PANDORAS_GOVERNANCE_ABI as any
    });

    // Fetch Vault Stats
    const { data: vaultStats, isLoading } = useReadContract({
        contract,
        method: "getVaultStats",
        params: []
    });

    const { data: userStats } = useReadContract({
        contract,
        method: "getUserStats",
        params: [account?.address || "0x0000000000000000000000000000000000000000"]
    });

    const { data: userDeposits } = useReadContract({
        contract,
        method: "getUserDeposits",
        params: [account?.address || "0x0000000000000000000000000000000000000000"]
    });

    // Fetch Deposit Events for Activity & Participants
    // Signature from ABI: event Deposit(address indexed user, enum token, uint256 amount, uint256 when, uint256 depositIndex, bool reinvestment)
    // token is enum (uint8), amount uint256. 
    const preparedDepositEvent = prepareEvent({
        signature: "event Deposit(address indexed user, uint8 token, uint256 amount, uint256 when, uint256 depositIndex, bool reinvestment)"
    });

    const { data: events } = useContractEvents({
        contract,
        events: [preparedDepositEvent]
    });

    // Parse Stats
    // Parse Stats (Use Index 0/1 for Current Balance/TVL, not Index 2/3 for Cumulative Volume)
    const totalStakedETH = vaultStats ? (Number(vaultStats[0]) / 1e18).toFixed(2) : "0.00";
    const totalStakedUSDC = vaultStats ? (Number(vaultStats[1]) / 1e6).toFixed(0) : "0";
    const totalDisplay = `${totalStakedETH} ETH + $${totalStakedUSDC}`;

    const rawUserVP = userStats ? ((Number(userStats[0]) / 1e18 * 2000) + (Number(userStats[1]) / 1e6)) : 0;
    const userVP = rawUserVP > 0 ? `${rawUserVP.toLocaleString()} VP` : "0 VP";

    // Dynamic Participants
    const uniqueDepositors = new Set(events?.map(e => e.args.user) || []);
    if (rawUserVP > 0 && account?.address) uniqueDepositors.add(account.address as `0x${string}`);
    // If no events but total staked > 0, assume at least 1 (the dev/user)
    const participantCount = uniqueDepositors.size > 0 ? uniqueDepositors.size : ((Number(totalStakedETH) > 0 || Number(totalStakedUSDC) > 0) ? 1 : 0);

    // --- MERGE ACTIVITY FEED ---
    // 1. Contract Events
    const contractActivity = events?.map(event => ({
        type: 'contract',
        user: event.args.user,
        token: event.args.token === 0 ? "ETH" : "USDC",
        amount: event.args.amount,
        txHash: event.transactionHash,
        isReinvestment: event.args.reinvestment,
        timestamp: Number(event.args.when) * 1000 // assuming event has 'when' block timestamp
    })) || [];

    // 2. Proposal Events (Creation)
    const proposalActivity = proposals.map(p => ({
        type: 'proposal',
        title: p.title,
        status: p.status,
        timestamp: p.createdAt,
        user: "DAO Admin" // Mock User
    }));

    // 3. Sort & Slice
    // Note: contract events might not have 'when' easily accessible in thirdweb event object unless explicitly args.when exists.
    // The ABI says Deposit has 'when', so event.args.when works.
    const combinedActivity = [...contractActivity, ...proposalActivity]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 7); // Show a bit more

    // --- AUTO PINNING LOGIC ---
    // Find latest ACTIVE proposal
    const pinnedProposal = proposals.find(p => p.status === 'active');
    const pinnedContent = pinnedProposal ? {
        title: `Votación Activa: ${pinnedProposal.title}`,
        text: pinnedProposal.description,
        isProposal: true,
        endDate: pinnedProposal.endDate
    } : {
        title: settings.activityTitle,
        text: settings.activityText,
        isProposal: false
    };

    // Mock Admin Check
    const isAdmin = true;

    return (
        <div className="min-h-screen bg-black text-white w-full">
            <div className="w-full px-4 py-8 md:px-8 space-y-8">

                {/* Header: Title Left, Buttons Right */}
                <div className="flex flex-col md:flex-row items-center  gap-6">
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
                            onClick={() => setIsModalOpen(true)}
                            className="bg-lime-500 text-black hover:bg-lime-400 font-bold px-6 py-2 rounded-xl shadow-[0_0_20px_rgba(132,204,22,0.3)] transition-all hover:scale-105 whitespace-nowrap flex-1 md:flex-none"
                        >
                            <ShieldCheck className="mr-2 h-5 w-5" />
                            Participar Ahora
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard
                        title="Total Staked Protocol"
                        value={isLoading ? "Loading..." : totalDisplay}
                        change={settings.stakedSubtext}
                        icon={<Coins className="h-5 w-5 text-lime-400" />}
                    />
                    <StatsCard
                        title="APY Actual"
                        value={`${settings.apy}%`}
                        change={`+ Boost ${settings.boostMultiplier}`}
                        icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
                    />
                    <StatsCard
                        title="Participantes"
                        value={participantCount.toString()}
                        change={participantCount > 0 ? "Active DAO Members" : "Be the first!"}
                        icon={<Users className="h-5 w-5 text-blue-400" />}
                    />
                    <StatsCard
                        title="Tu Voting Power"
                        value={userVP}
                        change={account ? "Derived from Staking" : "Connect Wallet"}
                        icon={<Vote className="h-5 w-5 text-purple-400" />}
                    />
                </div>

                {/* Tabs */}
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
                        <TabsTrigger value="overview">Visión General</TabsTrigger>
                        <TabsTrigger value="staking">Staking & Rewards</TabsTrigger>
                        <TabsTrigger value="proposals">Propuestas ({proposals.filter(p => p.status === 'active').length})</TabsTrigger>
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
                                        {/* Pinned Announcement / Proposal */}
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

                                        {/* Combined Activity Feed */}
                                        {combinedActivity.map((event: any, i) => {
                                            if (event.type === 'proposal') {
                                                const iconColor = event.status === 'active' ? 'text-purple-500 bg-purple-500/10' : 'text-gray-500 bg-gray-500/10';
                                                return (
                                                    <div key={`prop-${i}`} className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-lg border border-zinc-900">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${iconColor}`}>
                                                                <Vote className={`h-5 w-5 ${event.status === 'active' ? 'text-purple-500' : 'text-gray-500'}`} />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-white">New Proposal Created</p>
                                                                <p className="text-sm text-gray-500">{event.title}</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs font-mono text-zinc-500">
                                                            {new Date(event.timestamp).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                );
                                            } else {
                                                // Contract Deposit/Reinvest
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

                                        {combinedActivity.length === 0 && (
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
                                    <p>
                                        {settings.announcement}
                                    </p>
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
                                    // Parse Deposit Info
                                    const amount = dep.token === 0
                                        ? (Number(dep.amount) / 1e18).toFixed(4) + " ETH"
                                        : (Number(dep.amount) / 1e6).toFixed(2) + " USDC";
                                    const date = new Date(Number(dep.timestamp) * 1000).toLocaleDateString();
                                    const isWithdrawn = (dep.flags & 1) !== 0; // Bit 0 check
                                    const isReinvest = (dep.flags & 8) !== 0; // Bit 3 check

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
                                                {isWithdrawn ? (
                                                    <span className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded">Withdrawn</span>
                                                ) : (
                                                    <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">Active</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4 bg-zinc-900/30 rounded-2xl border border-zinc-800 border-dashed">
                                <Coins className="h-16 w-16 text-zinc-700" />
                                <h3 className="text-xl font-bold text-gray-300">No Active Staking</h3>
                                <p className="text-gray-500 max-w-md">
                                    You don't have any active deposits yet. Start staking to earn rewards.
                                </p>
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
                                    {proposals.map((prop) => (
                                        <Card key={prop.id} className="bg-zinc-900/50 border-zinc-800">
                                            <CardContent className="p-6">
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
                                                            <span>votes: {prop.votesFor + prop.votesAgainst}</span>
                                                        </div>
                                                    </div>
                                                    {prop.status === 'active' && (
                                                        <Button
                                                            variant="outline"
                                                            className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                                                            onClick={() => updateProposalStatus(prop.id, 'closed')} // Mock Vote/Close
                                                        >
                                                            Close (Admin)
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4 bg-zinc-900/30 rounded-2xl border border-zinc-800 border-dashed">
                                <Vote className="h-16 w-16 text-zinc-700" />
                                <h3 className="text-xl font-bold text-gray-300">Propuestas de Gobernanza</h3>
                                <p className="text-gray-500 max-w-md">
                                    Actualmente no hay propuestas activas. Las propuestas aparecerán aquí cuando la DAO inicie votaciones.
                                </p>
                                {isAdmin && (
                                    <Button variant="secondary" className="mt-4" onClick={() => setIsProposalModalOpen(true)}>
                                        Agregar Propuesta (Admin)
                                    </Button>
                                )}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            <GovernanceParticipationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            <GovernanceProposalModal isOpen={isProposalModalOpen} onClose={() => setIsProposalModalOpen(false)} onSubmit={addProposal} />

            {/* Manage Modal */}
            {isManageOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsManageOpen(false)}>
                    <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-6" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <div className="flex justify-between">
                            <h2 className="text-xl font-bold">Admin Settings & Data</h2>
                            <button onClick={() => setIsManageOpen(false)}><X className="w-5 h-5" /></button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Current APY (%)</Label>
                                <Input
                                    value={settings.apy}
                                    onChange={e => updateSettings({ apy: e.target.value })}
                                    className="bg-zinc-900 border-zinc-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Staked Subtext</Label>
                                <Input
                                    value={settings.stakedSubtext}
                                    onChange={e => updateSettings({ stakedSubtext: e.target.value })}
                                    className="bg-zinc-900 border-zinc-700"
                                    placeholder="+12% this week"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Activity Title</Label>
                                <Input
                                    value={settings.activityTitle}
                                    onChange={e => updateSettings({ activityTitle: e.target.value })}
                                    className="bg-zinc-900 border-zinc-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Activity Text (Short Description)</Label>
                                <Textarea
                                    value={settings.activityText}
                                    onChange={e => updateSettings({ activityText: e.target.value })}
                                    className="bg-zinc-900 border-zinc-700 h-20"
                                />
                            </div>
                            <div className="border-t border-zinc-800 my-4 pt-4">
                                <Label className="text-yellow-500 mb-2 block">Early Access / Boost</Label>
                                <div className="space-y-2">
                                    <Label>Announcement Full Text</Label>
                                    <Textarea
                                        value={settings.announcement}
                                        onChange={e => updateSettings({ announcement: e.target.value })}
                                        className="bg-zinc-900 border-zinc-700"
                                    />
                                </div>
                                <div className="space-y-2 mt-2">
                                    <Label>Boost Multiplier</Label>
                                    <Input
                                        value={settings.boostMultiplier}
                                        onChange={e => updateSettings({ boostMultiplier: e.target.value })}
                                        className="bg-zinc-900 border-zinc-700"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={() => setIsManageOpen(false)}>Save & Close</Button>
                        </div>
                    </div>
                </div>
            )}
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
