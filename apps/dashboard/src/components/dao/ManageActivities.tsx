
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
    const [category, setCategory] = useState("social"); // social, labor
    const [frequency, setFrequency] = useState("once"); // once, daily, weekly, unlimited
    const [durationHours, setDurationHours] = useState("24");
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
                    type: "custom",
                    category,
                    requirements: {
                        durationSeconds: category === 'labor' ? Number(durationHours) * 3600 : 0,
                        frequency: frequency
                    }
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

    const fillPreset = (type: 'social' | 'labor' | 'quick') => {
        if (type === 'social') {
            setTitle("Spread the Word");
            setDescription("Comparte nuestro último post y etiqueta a 3 amigos.");
            setRewardAmount("10");
            setRewardToken("PBOX");
            setCategory("social");
            setFrequency("once");
        } else if (type === 'labor') {
            setTitle("Compromiso Semanal");
            setDescription("Mantén tu staking activo durante 7 días consecutivos.");
            setRewardAmount("50");
            setRewardToken("PBOX");
            setCategory("labor");
            setDurationHours("168");
            setFrequency("weekly");
        } else if (type === 'quick') {
            setTitle("Check-in Rápido");
            setDescription("Realiza una acción simple en la plataforma.");
            setRewardAmount("5");
            setRewardToken("PBOX");
            setCategory("social");
            setFrequency("daily");
        }
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Crear Nueva Actividad</h3>

            {/* Presets */}
            <div className="mb-8 overflow-x-auto pb-2">
                <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider font-bold">Plantillas Rápidas</p>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => fillPreset('social')}
                        className="flex flex-col items-start p-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-lime-500/50 rounded-lg transition-all text-left min-w-[140px]"
                    >
                        <span className="text-lime-400 text-sm font-bold mb-1">Misión Social</span>
                        <span className="text-xs text-zinc-500">10 PBOX • Única</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => fillPreset('labor')}
                        className="flex flex-col items-start p-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-blue-500/50 rounded-lg transition-all text-left min-w-[140px]"
                    >
                        <span className="text-blue-400 text-sm font-bold mb-1">Labor Semanal</span>
                        <span className="text-xs text-zinc-500">50 PBOX • 7 Días</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => fillPreset('quick')}
                        className="flex flex-col items-start p-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-purple-500/50 rounded-lg transition-all text-left min-w-[140px]"
                    >
                        <span className="text-purple-400 text-sm font-bold mb-1">Tarea Rápida</span>
                        <span className="text-xs text-zinc-500">5 PBOX • Diaria</span>
                    </button>
                </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="activity-title" className="block text-sm font-medium text-zinc-300 mb-1.5">Título de la Misión</label>
                            <input
                                id="activity-title"
                                className="w-full bg-black/40 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 outline-none transition-all placeholder:text-zinc-600"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ej: Seguir en Twitter"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="activity-category" className="block text-sm font-medium text-zinc-300 mb-1.5">Tipo de Actividad</label>
                            <select
                                id="activity-category"
                                className="w-full bg-black/40 border border-zinc-700 rounded-lg p-2.5 text-white outline-none focus:ring-2 focus:ring-lime-500/50"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                <option value="social">Misión (Social) - Verificación Manual</option>
                                <option value="labor">Labor (Staking) - Verificación Automática</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="activity-frequency" className="block text-sm font-medium text-zinc-300 mb-1.5">Frecuencia / Repetición</label>
                            <select
                                id="activity-frequency"
                                className="w-full bg-black/40 border border-zinc-700 rounded-lg p-2.5 text-white outline-none focus:ring-2 focus:ring-lime-500/50"
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value)}
                            >
                                <option value="once">Una vez (Única)</option>
                                <option value="daily">Diaria (Cada 24h)</option>
                                <option value="weekly">Semanal (Cada 7 días)</option>
                                <option value="unlimited">Ilimitada (Pruebas/Spam)</option>
                            </select>
                            <p className="text-[10px] text-zinc-500 mt-1 pl-1">
                                Define qué tan seguido un usuario puede reclamar esta recompensa.
                            </p>
                        </div>

                        {category === 'labor' && (
                            <div className="bg-blue-900/10 border border-blue-900/30 p-3 rounded-lg">
                                <label htmlFor="activity-duration" className="block text-sm font-medium text-blue-200 mb-1.5">Duración Requerida (Horas)</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        id="activity-duration"
                                        type="number"
                                        className="w-full bg-black/40 border border-blue-800/50 rounded-lg p-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                                        value={durationHours}
                                        onChange={(e) => setDurationHours(e.target.value)}
                                    />
                                    <span className="text-xs text-blue-400 whitespace-nowrap font-medium px-2">
                                        = {(Number(durationHours) / 24).toFixed(1)} Días
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="activity-desc" className="block text-sm font-medium text-zinc-300 mb-1.5">Instrucciones</label>
                            <textarea
                                id="activity-desc"
                                className="w-full bg-black/40 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 outline-none transition-all resize-none placeholder:text-zinc-600 min-h-[120px]"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe exactamente qué debe hacer el usuario para completar esta misión..."
                            />
                        </div>

                        <div className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-800">
                            <label htmlFor="rewardAmount" className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Recompensa a otorgar</label>
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <input
                                        id="rewardAmount"
                                        type="number"
                                        className="w-full bg-black/40 border border-zinc-700 rounded-lg p-2.5 text-white font-bold text-lg outline-none focus:border-lime-500 transition-colors"
                                        value={rewardAmount}
                                        onChange={(e) => setRewardAmount(e.target.value)}
                                    />
                                </div>
                                <div className="w-1/3">
                                    <select
                                        className="w-full h-full bg-black/40 border border-zinc-700 rounded-lg p-2 text-white font-medium outline-none"
                                        value={rewardToken}
                                        onChange={(e) => setRewardToken(e.target.value)}
                                    >
                                        <option value="PBOX">PBOX</option>
                                        <option value="USDC">USDC</option>
                                        <option value="ETH">ETH</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-zinc-800 mt-6">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-lime-500 to-lime-400 hover:from-lime-400 hover:to-lime-300 text-black font-bold py-4 rounded-xl transition-all disabled:opacity-50 shadow-[0_4px_20px_rgba(132,204,22,0.2)] hover:shadow-[0_4px_25px_rgba(132,204,22,0.4)] transform hover:-translate-y-0.5"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></span>
                                Procesando...
                            </span>
                        ) : (
                            "Publicar Nueva Actividad"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
