'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Briefcase, Handshake, Users, ArrowUpRight, FolderGit2, CheckCircle2, ChevronRight, BarChart } from 'lucide-react';

interface Deal {
  id: string;
  organization: string;
  project: string;
  stage: 'PROSPECT' | 'NEGOTIATION' | 'DUE_DILIGENCE' | 'CLOSED' | 'LOST';
  value: string;
  owner: string;
  nextAction: string;
}

const MOCK_DEALS: Deal[] = [
  {
    id: 'DEAL-1042',
    organization: 'Acme Corp',
    project: 'Tokenización Real Estate Miami',
    stage: 'NEGOTIATION',
    value: '$500,000',
    owner: 'Matute',
    nextAction: 'Revisar términos del Smart Contract'
  },
  {
    id: 'DEAL-1043',
    organization: 'Zenith Holdings',
    project: 'S\'Narai Expansion',
    stage: 'DUE_DILIGENCE',
    value: '$1.2M',
    owner: 'Marco',
    nextAction: 'Esperando validación KYC institucional'
  },
  {
    id: 'DEAL-1044',
    organization: 'Fintech Latam SA',
    project: 'Integración RWA Yield',
    stage: 'CLOSED',
    value: '$250,000',
    owner: 'Hermes',
    nextAction: 'Desplegar dashboard de inversor'
  }
];

export function OperationsClientsTab() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const res = await fetch('/api/nexus/deals?scope=all');
        const data = await res.json();
        if (data.rooms) {
          // Map backend rooms to Deal interface
          const mappedDeals: Deal[] = data.rooms.map((r: any) => ({
            id: r.publicId || r.id,
            organization: r.company || r.counterparty || 'Desconocida',
            project: r.title || r.kind || 'Proyecto Sin Nombre',
            stage: r.status === 'SIGNED' ? 'CLOSED' : 'NEGOTIATION',
            value: 'N/A',
            owner: r.createdByEmail || 'Nexus',
            nextAction: 'Revisar expediente',
            rawData: r
          }));
          setDeals(mappedDeals);
        }
      } catch (err) {
        console.error('Error fetching deals', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDeals();
  }, []);

  const getStageStyles = (stage: Deal['stage']) => {
    switch (stage) {
      case 'PROSPECT': return 'border-sky-500/30 bg-sky-500/10 text-sky-400';
      case 'NEGOTIATION': return 'border-amber-500/30 bg-amber-500/10 text-amber-400';
      case 'DUE_DILIGENCE': return 'border-purple-500/30 bg-purple-500/10 text-purple-400';
      case 'CLOSED': return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
      case 'LOST': return 'border-rose-500/30 bg-rose-500/10 text-rose-400';
    }
  };

  return (
    <div className="p-5 overflow-y-auto flex-1 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-sky-500/20 bg-sky-500/[0.04]">
        <div>
          <p className="text-[11px] text-sky-300 font-mono uppercase font-bold flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            <span>CLIENTS & CRM (DEAL ROOMS)</span>
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">
            Superficie operativa para gestionar Organizaciones, Proyectos, Deals y Prospectos.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-zinc-400 text-xs font-mono">
            {isLoading ? 'Cargando...' : `${deals.length} Active Deals`}
          </div>
          <button className="px-3 py-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-[11px] font-mono transition-colors">
            + NEW DEAL
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Deal List */}
        <div className="lg:col-span-1 space-y-3">
          <h4 className="text-xs font-bold text-zinc-500 font-mono uppercase tracking-wider mb-2">
            Pipeline Activo
          </h4>
          <div className="space-y-2">
            {deals.map(deal => (
              <div 
                key={deal.id}
                onClick={() => setSelectedDeal(deal)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedDeal?.id === deal.id ? 'border-sky-500/40 bg-sky-950/20' : 'border-white/5 bg-[#0C0C10] hover:border-white/20'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] text-zinc-500 font-mono">{deal.id}</span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase ${getStageStyles(deal.stage)}`}>
                    {deal.stage}
                  </span>
                </div>
                <h5 className="text-sm font-semibold text-zinc-200">{deal.organization}</h5>
                <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{deal.project}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Deal Detail View */}
        <div className="lg:col-span-2">
          {selectedDeal ? (
            <motion.div 
              key={selectedDeal.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="h-full flex flex-col bg-[#0C0C10] border border-white/10 rounded-xl overflow-hidden"
            >
              {/* Deal Header */}
              <div className="p-5 border-b border-white/10 bg-black/20">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${getStageStyles(selectedDeal.stage)}`}>
                        {selectedDeal.stage}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">Owner: {selectedDeal.owner}</span>
                    </div>
                    <h2 className="text-xl font-bold text-white mt-2">{selectedDeal.organization}</h2>
                    <p className="text-sm text-zinc-400 mt-1 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-sky-400" />
                      {selectedDeal.project}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-500 font-mono uppercase">Deal Value</p>
                    <p className="text-xl font-mono text-emerald-400">{selectedDeal.value}</p>
                  </div>
                </div>
              </div>

              {/* Deal Content Grid */}
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                {/* Info Card */}
                <div className="p-4 rounded-xl border border-white/5 bg-black/40 space-y-3">
                  <h4 className="text-[11px] font-mono text-zinc-500 uppercase">Contexto Operativo</h4>
                  <div className="space-y-2 text-xs">
                    <p className="flex justify-between text-zinc-400">
                      <span>Próxima Acción:</span>
                      <span className="text-white text-right w-1/2">{selectedDeal.nextAction}</span>
                    </p>
                    <p className="flex justify-between text-zinc-400">
                      <span>Último Contacto:</span>
                      <span className="text-white">Reciente</span>
                    </p>
                  </div>
                  <button className="w-full mt-2 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono transition-colors">
                    Actualizar Deal
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <button className="w-full p-3 flex items-center justify-between rounded-xl border border-white/5 bg-black/40 hover:bg-white/5 hover:border-white/10 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <FolderGit2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs text-zinc-300">Abrir Data Room del Deal</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                  </button>
                  <button className="w-full p-3 flex items-center justify-between rounded-xl border border-white/5 bg-black/40 hover:bg-white/5 hover:border-white/10 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                        <BarChart className="w-4 h-4" />
                      </div>
                      <span className="text-xs text-zinc-300">Consultar Hermes Intelligence</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-purple-400 transition-colors" />
                  </button>
                  <button className="w-full p-3 flex items-center justify-between rounded-xl border border-white/5 bg-black/40 hover:bg-white/5 hover:border-white/10 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs text-zinc-300">Ver Aprobaciones Pendientes</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border border-white/5 border-dashed rounded-xl p-8 text-center bg-black/20">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-4">
                <Handshake className="w-6 h-6 text-zinc-600" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-300">Selecciona un Deal</h3>
              <p className="text-xs text-zinc-500 mt-2 max-w-sm">
                Haz clic en una organización de la lista a la izquierda para visualizar el estado, tareas y documentos en su Deal Room.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
