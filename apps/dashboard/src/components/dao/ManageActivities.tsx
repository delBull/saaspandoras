
"use client";

import { useState } from "react";
import { PlusIcon, CheckCircleIcon, XCircleIcon } from "lucide-react";
import { toast } from "sonner";

interface ManageActivitiesProps {
    projectId: number;
}

export function ManageActivities({ projectId }: ManageActivitiesProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [rewardAmount, setRewardAmount] = useState("0");
    const [rewardToken, setRewardToken] = useState("PBOX");
    const [isLoading, setIsLoading] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("/api/dao/activities", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    title,
                    description,
                    rewardAmount,
                    rewardTokenSymbol: rewardToken,
                    type: "custom"
                }),
            });

            if (!res.ok) throw new Error("Failed to create activity");

            toast.success("Activity Created!");
            setTitle("");
            setDescription("");
            setRewardAmount("0");
        } catch (error) {
            toast.error("Error creating activity");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Crear Nueva Actividad</h3>

            <form onSubmit={handleCreate} className="space-y-4">
                <div>
                    <label className="block text-sm text-zinc-400 mb-1">Título</label>
                    <input
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-lime-500 outline-none"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ej: Seguir en Twitter"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm text-zinc-400 mb-1">Descripción</label>
                    <textarea
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-lime-500 outline-none"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Instrucciones para el usuario..."
                        rows={3}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Recompensa</label>
                        <input
                            type="number"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white outline-none"
                            value={rewardAmount}
                            onChange={(e) => setRewardAmount(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Token</label>
                        <select
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white outline-none"
                            value={rewardToken}
                            onChange={(e) => setRewardToken(e.target.value)}
                        >
                            <option value="PBOX">PBOX</option>
                            <option value="USDC">USDC</option>
                            <option value="ETH">ETH</option>
                        </select>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-lime-500 hover:bg-lime-400 text-black font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                    {isLoading ? "Creando..." : "Publicar Actividad"}
                </button>
            </form>
        </div>
    );
}
