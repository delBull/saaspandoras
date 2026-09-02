import { getPendingIntents } from '../actions';
import GovernanceButtons from './components/GovernanceButtons';
import { ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';

export default async function GovernanceCenterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await Promise.resolve(params);
  const requestedOrganizationId = `org_${id}`;
  
  let data = { pendingIntents: [] as any[] };
  let errorMsg: string | null = null;

  try {
    data = await getPendingIntents(requestedOrganizationId);
  } catch (err: any) {
    console.warn(`[GovernanceCenterPage] Notice:`, err.message);
    errorMsg = err.message;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
            <ShieldAlert className="w-7 h-7 text-amber-400" />
            Governance Center
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Superficie de autoridad y aprobación de intenciones operacionales para {id.toUpperCase()}.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs font-mono text-amber-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg.includes('UNAUTHENTICATED') ? 'Sesión no verificada. Inicia sesión en el portal o conecta tu wallet de fundador.' : errorMsg}</span>
        </div>
      )}

      {data.pendingIntents.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-16 text-center space-y-3 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-sm font-semibold text-zinc-200">No hay intenciones operacionales pendientes</p>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Todas las acciones críticas y de tesorería están al día. Nuevas propuestas de agentes y contratos aparecerán aquí para firma multi-sig.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {data.pendingIntents.map(intent => (
            <div key={intent.intentId} className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <span className="text-xs font-bold tracking-wider text-amber-300 uppercase font-mono">
                  Aprobación Requerida
                </span>
              </div>
              
              <div className="p-6 sm:p-8 space-y-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{intent.missionName}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase font-mono mb-1">Decisión Estratégica (Por qué)</p>
                      <p className="text-base font-semibold text-zinc-200 mb-1">"{intent.strategyDecision}"</p>
                      <p className="text-xs text-zinc-400">{intent.reasonSummary}</p>
                    </div>
                    
                    <div>
                      <p className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase font-mono mb-1">Pack</p>
                      <p className="text-xs text-zinc-300 font-mono">{intent.pack}</p>
                    </div>
                  </div>
                  
                  <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/10 space-y-4 font-mono">
                    <div>
                      <p className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase mb-1">Intención Operacional (Qué)</p>
                      <p className="text-xs text-indigo-400 font-semibold">{intent.intentType}</p>
                    </div>
                    
                    {intent.budget && (
                      <div>
                        <p className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase mb-1">Restricción de Presupuesto</p>
                        <p className="text-sm font-semibold text-white">{intent.budget}</p>
                      </div>
                    )}

                    {intent.authorityRequired && (
                      <div className="pt-3 border-t border-white/10">
                        <p className="text-[10px] font-bold tracking-wider text-amber-400 uppercase mb-1">Nivel de Autoridad</p>
                        <p className="text-xs text-zinc-300">{intent.authorityRequired}</p>
                      </div>
                    )}

                    {intent.consequence && (
                      <div className="pt-3 border-t border-white/10">
                        <p className="text-[10px] font-bold tracking-wider text-rose-400 uppercase mb-1">Consecuencia de Aprobación</p>
                        <p className="text-xs text-zinc-400">{intent.consequence}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 flex justify-end">
                  <GovernanceButtons intentId={intent.intentId} requestedOrganizationId={requestedOrganizationId} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
