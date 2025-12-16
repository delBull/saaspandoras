
"use client";

import { useState } from "react";
import useSWR from "swr";
import { CheckCircle, Clock, ExternalLink, Gift, Send } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Activity {
    id: number;
    title: string;
    description: string;
    rewardAmount: string;
    rewardTokenSymbol: string;
    type: string;
    status: string;
    externalLink?: string;
    createdAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ActivitiesList({ projectId, compact = false, limit }: { projectId: number, compact?: boolean, limit?: number }) {
    const { data: activities, error, isLoading } = useSWR<Activity[]>(
        projectId ? `/api/dao/activities?projectId=${projectId}` : null,
        fetcher
    );

    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [proof, setProof] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = async () => {
        if (!selectedActivity) return;
        setIsSubmitting(true);

        try {
            // TODO: Get real wallet from hook
            const mockWallet = "0xUserWalletAddressPlaceholder";

            const res = await fetch("/api/dao/activities/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    activityId: selectedActivity.id,
                    userWallet: mockWallet,
                    proofData: proof
                }),
            });

            if (!res.ok) throw new Error("Submission failed");

            toast.success("Prueba enviada correctamente!");
            setIsOpen(false);
            setProof("");
        } catch (error) {
            toast.error("Error al enviar prueba.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="text-zinc-500 animate-pulse">Cargando actividades...</div>;
    if (!activities || activities.length === 0) return compact ? null : <div className="text-zinc-500">No hay actividades activas.</div>;

    const displayedActivities = limit ? activities.slice(0, limit) : activities;

    if (compact) {
        return (
            <div className="space-y-3">
                {displayedActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-zinc-900/30 border border-zinc-800 rounded-lg hover:bg-zinc-800/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="bg-lime-900/20 p-2 rounded-full text-lime-400">
                                <Gift className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-white">{activity.title}</h4>
                                <p className="text-xs text-zinc-500">{activity.rewardAmount} {activity.rewardTokenSymbol}</p>
                            </div>
                        </div>
                        <span className="text-[10px] uppercase bg-zinc-800 text-zinc-400 px-2 py-1 rounded">
                            {activity.type}
                        </span>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {displayedActivities.map((activity) => (
                <div key={activity.id} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex flex-col md:flex-row justify-between gap-4 items-start md:items-center hover:border-lime-500/30 transition-all">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-white">{activity.title}</h4>
                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full uppercase border border-zinc-700">
                                {activity.type}
                            </span>
                        </div>
                        <p className="text-sm text-zinc-400 mb-2">{activity.description}</p>
                        <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1 text-lime-400 font-mono bg-lime-900/10 px-2 py-0.5 rounded">
                                <Gift className="w-3 h-3" />
                                {activity.rewardAmount} {activity.rewardTokenSymbol}
                            </span>
                            {activity.externalLink && (
                                <a href={activity.externalLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline">
                                    <ExternalLink className="w-3 h-3" /> Link
                                </a>
                            )}
                        </div>
                    </div>

                    <Dialog open={isOpen && selectedActivity?.id === activity.id} onOpenChange={(open) => {
                        setIsOpen(open);
                        if (open) setSelectedActivity(activity);
                    }}>
                        <DialogTrigger asChild>
                            <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors border border-zinc-700 flex items-center gap-2">
                                <Send className="w-3 h-3" />
                                Participar
                            </button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                            <DialogHeader>
                                <DialogTitle>Enviar Prueba de Trabajo</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <p className="text-sm text-zinc-400">
                                    Para recibir tu recompensa de <span className="text-lime-400 font-bold">{activity.rewardAmount} {activity.rewardTokenSymbol}</span>,
                                    envía el enlace o texto que demuestre que completaste la tarea: "{activity.title}".
                                </p>
                                <textarea
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white h-32 outline-none focus:ring-2 focus:ring-lime-500"
                                    placeholder="Pegar enlace al tweet, artículo, hash de transacción, etc..."
                                    value={proof}
                                    onChange={(e) => setProof(e.target.value)}
                                />
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !proof}
                                    className="w-full bg-lime-500 hover:bg-lime-400 text-black font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSubmitting ? "Enviando..." : "Enviar para Revisión"}
                                </button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            ))}
        </div>
    );
}
