
"use client";

import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { toast } from "sonner";
import { Loader2, PlayCircle, CheckCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface LaboresListProps {
    project: any;
}

export function LaboresList({ project }: LaboresListProps) {
    const account = useActiveAccount();
    const [labores, setLabores] = useState<any[]>([]);
    const [submissions, setSubmissions] = useState<Record<number, any>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (project?.id) {
            fetchData();
        }
    }, [project?.id, account?.address]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch Labores
            const resLabores = await fetch(`/api/dao/activities?projectId=${project.id}&category=labor`);
            const dataLabores = await resLabores.json();

            // Fetch User Submissions
            if (account) {
                const resSubs = await fetch(`/api/dao/submissions?projectId=${project.id}&userAddress=${account.address}`);
                const dataSubs = await resSubs.json();

                const subsMap: Record<number, any> = {};
                if (Array.isArray(dataSubs)) {
                    dataSubs.forEach((sub: any) => {
                        subsMap[sub.activityId] = sub;
                    });
                }
                setSubmissions(subsMap);
            }

            if (Array.isArray(dataLabores)) {
                setLabores(dataLabores);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error cargando labores");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStart = async (activityId: number) => {
        if (!account) return toast.error("Conecta tu wallet");

        try {
            const res = await fetch('/api/dao/submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: project.id,
                    activityId,
                    userWalletAddress: account.address,
                    action: 'start'
                })
            });

            if (!res.ok) throw new Error("Error iniciando labor");

            toast.success("Labor iniciada");
            fetchData();
        } catch (error) {
            toast.error("Error al iniciar");
        }
    };

    const handleClaim = async (activityId: number) => {
        if (!account) return toast.error("Conecta tu wallet");

        try {
            const res = await fetch('/api/dao/submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: project.id,
                    activityId,
                    userWalletAddress: account.address,
                    action: 'claim'
                })
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            toast.success("Recompensa reclamada!");
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Error reclamando");
        }
    };

    if (isLoading) return <div className="text-center py-6"><Loader2 className="w-6 h-6 animate-spin mx-auto text-lime-500" /></div>;

    if (labores.length === 0) {
        return (
            <div className="text-center py-10 bg-zinc-900 border border-zinc-800 rounded-xl">
                <p className="text-zinc-500">No hay labores de staking disponibles.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {labores.map(labor => {
                const submission = submissions[labor.id];
                const status = submission?.status; // pending, approved
                const requirements = labor.requirements || {};
                const durationSeconds = requirements.durationSeconds || 0;

                // Calc time left
                let timeLeft = 0;
                let canClaim = false;
                let progress = 0;

                if (status === 'pending' && submission.startedAt) {
                    const elapsed = (Date.now() - new Date(submission.startedAt).getTime()) / 1000;
                    timeLeft = Math.max(0, durationSeconds - elapsed);
                    canClaim = timeLeft === 0;
                    progress = durationSeconds > 0 ? Math.min(100, (elapsed / durationSeconds) * 100) : 100;
                }

                return (
                    <div key={labor.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold text-white">{labor.title}</h3>
                                <span className="bg-lime-900/30 text-lime-400 text-xs px-2 py-1 rounded border border-lime-500/20 flex items-center gap-1">
                                    {labor.rewardAmount} {labor.rewardTokenSymbol}
                                </span>
                            </div>
                            <p className="text-zinc-400 text-sm mb-4 min-h-[40px]">{labor.description}</p>

                            {/* Requirements */}
                            <div className="text-xs text-zinc-500 mb-4 bg-zinc-950 p-2 rounded">
                                <p>⏱ Duración requerida: {Math.ceil(durationSeconds / 3600)} horas</p>
                                <p>🔒 Requiere mantener el NFT</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4">
                            {!status && (
                                <button
                                    onClick={() => handleStart(labor.id)}
                                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 border border-zinc-700"
                                >
                                    <PlayCircle className="w-4 h-4" /> Iniciar Labor
                                </button>
                            )}

                            {status === 'pending' && (
                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs text-zinc-400">
                                        <span>En progreso...</span>
                                        <span>{Math.ceil(timeLeft / 60)} min restantes</span>
                                    </div>
                                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                                        <div className="bg-lime-500 h-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                                    </div>
                                    <button
                                        onClick={() => handleClaim(labor.id)}
                                        disabled={!canClaim}
                                        className="w-full bg-lime-500 hover:bg-lime-400 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-wait text-black font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        {canClaim ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                        {canClaim ? "Reclamar Recompensa" : "Tiempo Restante"}
                                    </button>
                                </div>
                            )}

                            {status === 'approved' && (
                                <div className="w-full bg-green-900/20 border border-green-500/30 text-green-400 py-2 rounded-lg flex items-center justify-center gap-2 font-medium">
                                    <CheckCircle className="w-4 h-4" /> Completado
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
