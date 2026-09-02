"use client";

import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { toast } from "sonner";
import { Sparkles, Calendar, Zap, ShieldCheck } from "lucide-react";

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
  const [maxParticipants, setMaxParticipants] = useState("");

  const activeAccount = useActiveAccount();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccount) {
      toast.error("Wallet no conectada");
      return;
    }
    setIsLoading(true);

    try {
      const message = `Create Activity: ${title}\nReward: ${rewardAmount} ${rewardToken}\nDate: ${new Date().toISOString().split('T')[0]}`;
      const signature = await activeAccount.signMessage({ message });

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
            frequency: frequency,
            maxParticipants: maxParticipants ? Number(maxParticipants) : undefined
          },
          signature,
          signerAddress: activeAccount.address,
          message
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al crear la actividad");
      }

      toast.success("Actividad creada y publicada en la red con éxito");
      setTitle("");
      setDescription("");
      setRewardAmount("0");
      setMaxParticipants("");
    } catch (err: any) {
      toast.error(err.message || "Error al procesar la solicitud");
    } finally {
      setIsLoading(false);
    }
  };

  const fillPreset = (type: 'social' | 'labor' | 'quick') => {
    if (type === 'social') {
      setTitle("Compartir Lanzamiento en X");
      setDescription("Haz un tweet o quote sobre nuestro lanzamiento y coloca el link de tu publicación.");
      setRewardAmount("10");
      setRewardToken("PBOX");
      setCategory("social");
      setFrequency("once");
      setMaxParticipants("");
    } else if (type === 'labor') {
      setTitle("Participación en Mesa de Trabajo");
      setDescription("Participa activamente en la sesión semanal de gobernanza y desarrollo.");
      setRewardAmount("50");
      setRewardToken("PBOX");
      setCategory("labor");
      setDurationHours("168");
      setFrequency("weekly");
      setMaxParticipants("");
    } else if (type === 'quick') {
      setTitle("Check-in de Protocolo");
      setDescription("Realiza una confirmación de presencia diaria en el portal del ecosistema.");
      setRewardAmount("5");
      setRewardToken("PBOX");
      setCategory("social");
      setFrequency("daily");
      setMaxParticipants("100");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Crear Nueva Actividad</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Configura misiones de crecimiento comunitario o tareas de protocolo con incentivos on-chain.
          </p>
        </div>
      </div>

      {/* Presets */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
          Plantillas Rápidas
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => fillPreset('social')}
            className="flex flex-col items-start p-3.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-violet-500/40 rounded-2xl transition-all text-left group"
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-violet-400 group-hover:scale-110 transition-transform" />
              <span className="text-violet-300 text-sm font-semibold">Misión Social</span>
            </div>
            <span className="text-xs text-zinc-500 font-mono">10 PBOX • Única</span>
          </button>
          <button
            type="button"
            onClick={() => fillPreset('labor')}
            className="flex flex-col items-start p-3.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-indigo-500/40 rounded-2xl transition-all text-left group"
          >
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="text-indigo-300 text-sm font-semibold">Labor Semanal</span>
            </div>
            <span className="text-xs text-zinc-500 font-mono">50 PBOX • 7 Días</span>
          </button>
          <button
            type="button"
            onClick={() => fillPreset('quick')}
            className="flex flex-col items-start p-3.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-amber-500/40 rounded-2xl transition-all text-left group"
          >
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-amber-300 text-sm font-semibold">Check-in Rápido</span>
            </div>
            <span className="text-xs text-zinc-500 font-mono">5 PBOX • Diaria</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleCreate} className="space-y-6 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="activity-title" className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider font-mono">
                Título de la Misión
              </label>
              <input
                id="activity-title"
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/60 outline-none transition-all placeholder:text-zinc-600"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Compartir análisis de tokenomics en X"
                required
              />
            </div>

            <div>
              <label htmlFor="activity-category" className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider font-mono">
                Tipo de Actividad
              </label>
              <select
                id="activity-category"
                className="w-full bg-[#0C0C10] border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:ring-2 focus:ring-violet-500/40"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="social">Misión (Social) - Verificación Manual</option>
                <option value="labor">Labor (Staking) - Verificación Automática</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="activity-frequency" className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider font-mono">
                  Frecuencia
                </label>
                <select
                  id="activity-frequency"
                  className="w-full bg-[#0C0C10] border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:ring-2 focus:ring-violet-500/40"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                >
                  <option value="once">Única</option>
                  <option value="daily">Diaria</option>
                  <option value="weekly">Semanal</option>
                  <option value="unlimited">Ilimitada</option>
                </select>
              </div>
              <div>
                <label htmlFor="activity-limit" className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider font-mono">
                  Cupo Máximo
                </label>
                <input
                  id="activity-limit"
                  type="number"
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:ring-2 focus:ring-violet-500/40 placeholder:text-zinc-600"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  placeholder="Sin límite"
                />
              </div>
            </div>

            {category === 'labor' && (
              <div className="bg-indigo-500/10 border border-indigo-500/20 p-3.5 rounded-xl">
                <label htmlFor="activity-duration" className="block text-xs font-semibold text-indigo-300 mb-1.5 uppercase tracking-wider font-mono">
                  Duración Requerida (Horas)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="activity-duration"
                    type="number"
                    className="w-full bg-black/40 border border-indigo-500/30 rounded-xl p-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                  />
                  <span className="text-xs text-indigo-300 whitespace-nowrap font-mono px-2">
                    = {(Number(durationHours) / 24).toFixed(1)} Días
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="activity-desc" className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider font-mono">
                Instrucciones Detalladas
              </label>
              <textarea
                id="activity-desc"
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/60 outline-none transition-all resize-none placeholder:text-zinc-600 min-h-[120px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe los pasos exactos y el enlace de evidencia para validación..."
              />
            </div>

            <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/10">
              <label htmlFor="rewardAmount" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono mb-2.5">
                Recompensa a Otorgar
              </label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    id="rewardAmount"
                    type="number"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white font-mono font-bold text-lg outline-none focus:border-violet-500/60 transition-colors"
                    value={rewardAmount}
                    onChange={(e) => setRewardAmount(e.target.value)}
                  />
                </div>
                <div className="w-1/3">
                  <select
                    className="w-full h-full bg-[#0C0C10] border border-white/10 rounded-xl p-2.5 text-white font-mono font-medium outline-none"
                    value={rewardToken}
                    onChange={(e) => setRewardToken(e.target.value)}
                  >
                    <option value="PBOX">PBOX</option>
                    <option value="USDC">USDC</option>
                    <option value="ETH">ETH</option>
                  </select>
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                Los tokens se transfieren automáticamente desde la tesorería del protocolo tras la aprobación.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-violet-600/20 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
                Publicando en el Protocolo...
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
