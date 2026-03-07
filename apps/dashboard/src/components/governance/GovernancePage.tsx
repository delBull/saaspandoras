"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DAOChat } from "@/components/dao/DAOChat";
import { Lock, ShieldCheck, Vote, Coins, TrendingUp, Users, AlertTriangle, Settings2, X, Bell, CheckCircle2, XCircle, Unlock, MessageSquare, ListTodo, Wallet, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GovernanceParticipationModal } from "./GovernanceParticipationModal";
import { GovernanceProposalModal } from "./GovernanceProposalModal";
import { GovernanceWithdrawModal } from "./GovernanceWithdrawModal";
import { ManageActivities } from "../dao/ManageActivities";
import { useReadContract, useActiveAccount, useContractEvents, TransactionButton } from "thirdweb/react";
import { getContract, prepareEvent, prepareContractCall } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { config } from "@/config";
import { governanceABI } from "@/lib/governance-abi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import useSWR from "swr";
import { Loader2 } from "lucide-react";
import ProjectNavigationHeader from "@/components/projects/ProjectNavigationHeader";
import { ActivitiesList } from "../dao/ActivitiesList";
import { UserGovernanceList } from "../user/UserGovernanceList";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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

    return { settings };
};

function LockedView({ onAction }: { onAction: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6 bg-zinc-900/30 rounded-2xl border border-zinc-800 border-dashed p-8">
            <div className="h-20 w-20 bg-zinc-800/50 rounded-full flex items-center justify-center">
                <Lock className="h-10 w-10 text-zinc-500" />
            </div>
            <div className="space-y-2 max-w-md">
                <h3 className="text-2xl font-bold text-white">Acceso Restringido</h3>
                <p className="text-gray-400">
                    Esta sección es exclusiva para participantes activos de la Gobernanza Pandora.
                    Debes tener Staking activo o Voting Power para acceder.
                </p>
            </div>
            <Button
                onClick={onAction}
                className="bg-lime-500 text-black hover:bg-lime-400 font-bold px-8 py-6 rounded-xl shadow-[0_0_20px_rgba(132,204,22,0.2)]"
            >
                <ShieldCheck className="mr-2 h-5 w-5" />
                Desbloquear Acceso
            </Button>
        </div>
    );
}

export default function GovernancePage() {
    // 1. Fetch "Pandoras" Project for Context (Chat, Metadata)
    const { data: project, isLoading: isProjectLoading } = useSWR(`/api/projects/pandoras`, fetcher);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [pendingProposal, setPendingProposal] = useState<{ title: string; description: string; days: number } | null>(null);
    const account = useActiveAccount();
    const { settings } = useGovernanceSettings();
    const [isOwner, setIsOwner] = useState(false);

    // --- On-Chain Setup ---
    const contract = getContract({
        client,
        chain: config.chain,
        address: config.governanceContractAddress,
        abi: governanceABI as any
    });

    // --- Ownership Check ---
    useEffect(() => {
        if (project && account?.address) {
            const isProjectOwner = project.applicant_wallet_address?.toLowerCase() === account.address.toLowerCase();
            const isSuperAdmin = config.superAdminAddress && account.address.toLowerCase() === config.superAdminAddress.toLowerCase();
            setIsOwner(isProjectOwner || !!isSuperAdmin);
        } else {
            setIsOwner(false);
        }
    }, [account?.address, project]);


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
    const { data: rawProposals } = useReadContract({
        contract,
        method: "getAllProposals",
        params: []
    });

    // --- Events for Activity Feed ---
    const preparedDepositEvent = prepareEvent({
        signature: "event Deposit(address indexed user, uint8 token, uint256 amount, uint256 when, uint256 depositIndex, bool reinvestment)"
    });

    const { data: depositEvents } = useContractEvents({ contract, events: [preparedDepositEvent] });

    // --- Derived Data ---
    const totalStakedETH = vaultStats ? (Number(vaultStats[0]) / 1e18).toFixed(2) : "0.00";
    const totalStakedUSDC = vaultStats ? (Number(vaultStats[1]) / 1e6).toFixed(0) : "0";
    const totalDisplay = `${totalStakedETH} ETH + $${totalStakedUSDC}`;

    const userVP = votingPower ? Number(votingPower).toLocaleString() : "0";

    const uniqueDepositors = new Set(depositEvents?.map(e => e.args.user) || []);
    if (Number(userVP.replace(/,/g, '')) > 0 && account?.address) uniqueDepositors.add(account.address as `0x${string}`);
    const participantCount = uniqueDepositors.size > 0 ? uniqueDepositors.size : ((Number(totalStakedETH) > 0 || Number(totalStakedUSDC) > 0) ? 1 : 0);

    // --- Participation Check ---
    const hasParticipation = useMemo(() => {
        const vpValue = Number(String(userVP).replace(/,/g, ''));
        const hasActiveDeposits = userDeposits && userDeposits.length > 0;
        return vpValue > 0 || hasActiveDeposits;
    }, [userVP, userDeposits]);

    // --- Process Proposals ---
    const now = Date.now() / 1000;
    const proposals = (rawProposals || []).map((p: any) => {
        const endTime = Number(p.endTime);
        const isActive = p.active;
        const isExecuted = p.executed;

        let status: 'active' | 'closed' | 'completed' = 'closed';
        if (isActive && now < endTime) status = 'active';
        else if (isActive && now >= endTime) status = 'closed';
        else if (isExecuted) status = 'completed';

        return {
            id: p.id,
            proposer: p.proposer,
            title: p.title,
            description: p.description,
            startDate: Number(p.startTime) * 1000,
            endDate: endTime * 1000,
            votesFor: Number(p.forVotes),
            votesAgainst: Number(p.againstVotes),
            status,
            raw: p
        };
    }).sort((a: any, b: any) => Number(b.id) - Number(a.id));

    if (isProjectLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black">
                <Loader2 className="w-10 h-10 animate-spin text-lime-500 mb-4" />
                <p className="text-zinc-500">Cargando Pandora's Governance...</p>
            </div>
        );
    }

    if (!project) {
        return <div className="p-10 text-center text-red-500">Error: Governance Project Object Not Found. Run migration.</div>;
    }

    return (
        <div className="min-h-screen bg-black text-white pb-20">
            <ProjectNavigationHeader />

            <div className="max-w-[1400px] mx-auto p-6 md:p-12 space-y-8">
                {/* 1. Top Section - Stats & Early Access */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <StatsCard title="Total Staked Protocol" value={isLoading ? "Loading..." : totalDisplay} change={settings.stakedSubtext} icon={<Coins className="h-5 w-5 text-lime-400" />} />
                    <StatsCard title="APY Actual" value={`${settings.apy}%`} change={`+ Boost ${settings.boostMultiplier}`} icon={<TrendingUp className="h-5 w-5 text-emerald-400" />} />
                    <StatsCard title="Participantes" value={participantCount.toString()} change={participantCount > 0 ? "Active DAO Members" : "Be the first!"} icon={<Users className="h-5 w-5 text-blue-400" />} />
                    <StatsCard title="Tu Voting Power" value={`${userVP} VP`} change={account ? "Derived from Staking" : "Connect Wallet"} icon={<Vote className="h-5 w-5 text-purple-400" />} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Early Access Panel */}
                    <Card className="bg-zinc-900/50 border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 lg:col-span-1">
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
                            <Button className="w-full bg-zinc-800 hover:bg-zinc-700" variant="outline" onClick={() => setIsModalOpen(true)}>
                                Aprovechar Boost
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Recent Activity Mini-Feed */}
                    <Card className="bg-zinc-900/50 border-zinc-800 lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Actividad Reciente</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {project.id && !isNaN(Number(project.id)) ? (
                                <UserGovernanceList projectIds={[Number(project.id)]} />
                            ) : (
                                <div className="text-sm text-zinc-500">No events available.</div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* 2. Main Tabbed Content */}
                <Tabs defaultValue="staking" className="w-full">
                    <TabsList className="bg-zinc-900 border border-zinc-800 p-1 rounded-xl mb-6">
                        <TabsTrigger value="staking" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 rounded-lg px-6">Staking & Utilidad</TabsTrigger>
                        <TabsTrigger value="proposals" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 rounded-lg px-6">Propuestas (On-Chain)</TabsTrigger>
                        <TabsTrigger value="chat" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 rounded-lg px-6">Foro Global</TabsTrigger>
                        <TabsTrigger value="tasks" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 rounded-lg px-6">Misiones</TabsTrigger>
                        {isOwner && <TabsTrigger value="manage" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-lime-400 text-zinc-400 rounded-lg px-6">Administrar</TabsTrigger>}
                    </TabsList>

                    {/* Staking Tab */}
                    <TabsContent value="staking" className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-bold text-white">Tus Activos en Staking</h3>
                                <p className="text-zinc-400">Gestiona tus posiciones y retira recompensas.</p>
                            </div>
                            <Button onClick={() => setIsModalOpen(true)} className="bg-lime-500 text-black hover:bg-lime-400 font-bold">
                                + Nuevo Depósito
                            </Button>
                        </div>

                        {userDeposits && userDeposits.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {userDeposits.map((dep: any, i: number) => {
                                    const amount = dep.token === 0
                                        ? (Number(dep.amount) / 1e18).toFixed(4) + " ETH"
                                        : (Number(dep.amount) / 1e6).toFixed(2) + " USDC";
                                    const date = new Date(Number(dep.timestamp) * 1000).toLocaleDateString();
                                    const isWithdrawn = (dep.flags & 1) !== 0;
                                    const isReinvest = (dep.flags & 8) !== 0;

                                    return (
                                        <Card key={i} className="bg-zinc-900/50 border-zinc-800">
                                            <CardContent className="p-4 flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${isReinvest ? 'bg-indigo-500/10' : 'bg-lime-500/10'}`}>
                                                        {isReinvest ? <TrendingUp className="h-5 w-5 text-indigo-500" /> : <Coins className="h-5 w-5 text-lime-500" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white text-lg">{amount}</p>
                                                        <p className="text-xs text-gray-500">{isReinvest ? "Reinvested" : "Deposited"} on {date}</p>
                                                    </div>
                                                </div>
                                                {isWithdrawn && <span className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded">Withdrawn</span>}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/20 border border-zinc-800 rounded-2xl border-dashed">
                                <Coins className="h-16 w-16 text-zinc-700 mb-4" />
                                <h3 className="text-lg font-bold text-gray-300">No tienes activos en staking</h3>
                                <p className="text-gray-500 mb-6">Comienza a generar rendimiento y poder de voto hoy.</p>
                                <Button onClick={() => setIsModalOpen(true)} className="bg-lime-500 text-black hover:bg-lime-400">Comenzar Ahora</Button>
                            </div>
                        )}
                    </TabsContent>

                    {/* Proposals Tab */}
                    <TabsContent value="proposals" className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-bold text-white">Propuestas On-Chain</h3>
                                <p className="text-zinc-400">Vota en decisiones vinculantes del protocolo.</p>
                            </div>
                            {isOwner && (
                                <Button variant="secondary" onClick={() => setIsProposalModalOpen(true)}>
                                    <Vote className="mr-2 h-4 w-4" /> Crear Propuesta
                                </Button>
                            )}
                        </div>

                        {proposals.length > 0 ? (
                            <div className="space-y-4">
                                {proposals.map((prop: any) => {
                                    const totalVotes = prop.votesFor + prop.votesAgainst;
                                    const forPercent = totalVotes > 0 ? (prop.votesFor / totalVotes) * 100 : 0;
                                    const againstPercent = totalVotes > 0 ? (prop.votesAgainst / totalVotes) * 100 : 0;

                                    return (
                                        <Card key={prop.id.toString()} className="bg-zinc-900/50 border-zinc-800">
                                            <CardContent className="p-6">
                                                <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                                                    <div className="space-y-2 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-xl font-bold text-white">{prop.title}</h4>
                                                            <span className={`px-2 py-0.5 text-xs rounded-full ${prop.status === 'active' ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-700 text-zinc-400'}`}>
                                                                {prop.status.toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-400 text-sm">{prop.description}</p>
                                                        <div className="flex items-center gap-4 text-xs text-zinc-500 pt-2">
                                                            <span>Ends: {new Date(prop.endDate).toLocaleDateString()}</span>
                                                            <span>Total Votes (VP): {totalVotes.toLocaleString()}</span>
                                                        </div>
                                                    </div>

                                                    {/* Voting Actions Area */}
                                                    <div className="w-full md:w-64 space-y-4">
                                                        {/* Progress Bar */}
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-xs font-medium">
                                                                <span className="text-lime-400">For {forPercent.toFixed(1)}%</span>
                                                                <span className="text-red-400">Against {againstPercent.toFixed(1)}%</span>
                                                            </div>
                                                            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                                                                <div className="bg-lime-500 transition-all duration-500" style={{ width: `${forPercent}%` }} />
                                                                <div className="bg-red-500 transition-all duration-500" style={{ width: `${againstPercent}%` }} />
                                                            </div>
                                                        </div>

                                                        {prop.status === 'active' && hasParticipation && (
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <TransactionButton
                                                                    transaction={() => prepareContractCall({
                                                                        contract,
                                                                        method: "vote",
                                                                        params: [prop.id, true]
                                                                    })}
                                                                    onTransactionConfirmed={() => toast.success("Voted FOR!")}
                                                                    theme="dark"
                                                                    className="!bg-lime-500/10 hover:!bg-lime-500/20 !text-lime-500 !border !border-lime-500/20 !h-10 !text-sm"
                                                                >
                                                                    Vote FOR
                                                                </TransactionButton>
                                                                <TransactionButton
                                                                    transaction={() => prepareContractCall({
                                                                        contract,
                                                                        method: "vote",
                                                                        params: [prop.id, false]
                                                                    })}
                                                                    onTransactionConfirmed={() => toast.success("Voted AGAINST")}
                                                                    theme="dark"
                                                                    className="!bg-red-500/10 hover:!bg-red-500/20 !text-red-500 !border !border-red-500/20 !h-10 !text-sm"
                                                                >
                                                                    Vote AGAINST
                                                                </TransactionButton>
                                                            </div>
                                                        )}
                                                        {prop.status === 'active' && !hasParticipation && (
                                                            <div className="text-xs text-center text-zinc-500 bg-zinc-900 p-2 rounded">
                                                                Must stake to vote
                                                            </div>
                                                        )}
                                                        {prop.status === 'active' && (
                                                            <TransactionButton
                                                                transaction={() => prepareContractCall({
                                                                    contract,
                                                                    method: "closeProposal",
                                                                    params: [prop.id]
                                                                })}
                                                                onTransactionConfirmed={() => toast.success("Proposal Closed")}
                                                                theme="dark"
                                                                className="!bg-zinc-800 !text-zinc-400 hover:!bg-zinc-700 !scale-90 !py-1 !w-full !text-xs !mt-2"
                                                            >
                                                                Force Close (Admin/Public)
                                                            </TransactionButton>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/20 border border-zinc-800 rounded-2xl border-dashed">
                                <Vote className="h-16 w-16 text-zinc-700 mb-4" />
                                <h3 className="text-lg font-bold text-gray-300">No hay propuestas activas</h3>
                                <p className="text-gray-500">La comunidad no ha presentado nuevas propuestas recientemente.</p>
                            </div>
                        )}
                    </TabsContent>

                    {/* Chat Tab */}
                    <TabsContent value="chat">
                        {hasParticipation ? (
                            <DAOChat project={project} isOwner={isOwner} />
                        ) : (
                            <LockedView onAction={() => setIsModalOpen(true)} />
                        )}
                    </TabsContent>

                    {/* Tasks Tab */}
                    <TabsContent value="tasks">
                        <ActivitiesList projectId={Number(project.id)} />
                    </TabsContent>

                    {/* Manage Tab */}
                    {isOwner && (
                        <TabsContent value="manage">
                            <ManageActivities projectId={project.id} />
                        </TabsContent>
                    )}
                </Tabs>
            </div>

            <GovernanceParticipationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

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
