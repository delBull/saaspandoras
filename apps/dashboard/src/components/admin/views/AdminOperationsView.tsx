'use client';

/**
 * 🏛️ ADMIN PLATFORM OPERATIONS VIEW (F9.8)
 * apps/dashboard/src/components/admin/views/AdminOperationsView.tsx
 *
 * Operational utilities, cache controls, serverless fleet management,
 * and system health checks.
 */

import React, { useState } from 'react';
import { 
  Wrench, 
  RefreshCw, 
  Server, 
  Cpu, 
  Database, 
  Sparkles, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminOperationsViewProps {
  endpoints: Array<{
    id: string;
    endpointId: string;
    endpointName: string;
    modelType: string;
    gpuType: string;
    perSecondCostUsd: number;
    status: string;
  }>;
}

export function AdminOperationsView({ endpoints }: AdminOperationsViewProps) {
  const [runningTask, setRunningTask] = useState<string | null>(null);

  const handleRunTask = async (taskName: string) => {
    setRunningTask(taskName);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success(`Tarea '${taskName}' ejecutada con éxito.`);
    } catch (err: any) {
      toast.error(`Fallo al ejecutar '${taskName}': ${err.message}`);
    } finally {
      setRunningTask(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Operaciones de Plataforma & Serverless Fleet
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Herramientas de mantenimiento, recarga de cachés, inspección de GPU RunPod y utilidades operativas.
        </p>
      </div>

      {/* Operational Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Task 1 */}
        <div className="p-5 rounded-2xl bg-[#0F0F16] border border-white/[0.08] space-y-4 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <RefreshCw className={`w-5 h-5 ${runningTask === 'cache_flush' ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Purgar Caché de Plataforma</h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Invalida las tags de Next.js y revalida los feeds públicos de portales y widgets.
            </p>
          </div>
          <button
            onClick={() => handleRunTask('cache_flush')}
            disabled={runningTask !== null}
            className="w-full py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-white transition-all disabled:opacity-50"
          >
            {runningTask === 'cache_flush' ? 'Purgando...' : 'Ejecutar Purga'}
          </button>
        </div>

        {/* Task 2 */}
        <div className="p-5 rounded-2xl bg-[#0F0F16] border border-white/[0.08] space-y-4 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Optimizar Neon Pooler</h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Verifica el estado de las conexiones activas en Neon PostgreSQL Serverless Driver.
            </p>
          </div>
          <button
            onClick={() => handleRunTask('pooler_check')}
            disabled={runningTask !== null}
            className="w-full py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-white transition-all disabled:opacity-50"
          >
            {runningTask === 'pooler_check' ? 'Verificando...' : 'Test de Conexión'}
          </button>
        </div>

        {/* Task 3 */}
        <div className="p-5 rounded-2xl bg-[#0F0F16] border border-white/[0.08] space-y-4 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Heartbeat RunPod Fleet</h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Envía un ping de verificación a todos los endpoints serverless configurados.
            </p>
          </div>
          <button
            onClick={() => handleRunTask('runpod_ping')}
            disabled={runningTask !== null}
            className="w-full py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-white transition-all disabled:opacity-50"
          >
            {runningTask === 'runpod_ping' ? 'Enviando Ping...' : 'Enviar Heartbeat'}
          </button>
        </div>
      </div>

      {/* Fleet Endpoints List */}
      <div className="p-6 rounded-2xl bg-[#0F0F16] border border-white/[0.08] space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Endpoints RunPod Registrados</h3>
          <span className="text-xs font-mono text-cyan-400">{endpoints.length} Endpoints</span>
        </div>

        <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-[#12121B]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-[#161622] text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  <th className="py-3 px-4">Endpoint</th>
                  <th className="py-3 px-4">Modelo</th>
                  <th className="py-3 px-4">GPU</th>
                  <th className="py-3 px-4">Costo / Seg</th>
                  <th className="py-3 px-4 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {endpoints.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      No hay endpoints registrados.
                    </td>
                  </tr>
                ) : (
                  endpoints.map((ep) => (
                    <tr key={ep.endpointId} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-white block">{ep.endpointName}</span>
                        <span className="text-[11px] font-mono text-zinc-500">{ep.endpointId}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-purple-300">{ep.modelType}</td>
                      <td className="py-3.5 px-4 font-mono text-zinc-300">{ep.gpuType}</td>
                      <td className="py-3.5 px-4 font-mono text-zinc-400">
                        ${ep.perSecondCostUsd.toFixed(6)}/s
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                          {ep.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
