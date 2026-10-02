'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { CheckCircle, XCircle, Shield, AlertCircle, Clock, UserCircle, Activity } from 'lucide-react';

export interface ApprovalRequest {
  id: string;
  who: { name: string; email: string; avatar?: string; role: string };
  what: string;
  why: string;
  resource: string;
  capability: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  nextAction?: string;
  timestamp: string;
  risk?: 'LOW' | 'MEDIUM' | 'HIGH';
}

const MOCK_APPROVALS: ApprovalRequest[] = [
  {
    id: 'APP-1042',
    who: { name: 'Hermes Agent', email: 'hermes@pandoras.finance', role: 'AI Orchestrator' },
    what: 'Distribuir 5,000 USDC a holders de Deal #1042',
    why: 'Ciclo de dividendos alcanzado para el Q3',
    resource: 'Project: S\'Narai (snarai)',
    capability: 'finance.manage',
    status: 'PENDING',
    nextAction: 'Ejecutar transferencia on-chain (Polygon)',
    timestamp: new Date().toISOString(),
    risk: 'HIGH'
  },
  {
    id: 'APP-1043',
    who: { name: 'Marco', email: 'admin@pandoras.finance', role: 'SUPER_ADMIN' },
    what: 'Aprobar KYC y asignar rol "MARKETING" a usuario nuevo',
    why: 'Nuevo ingreso al equipo operativo Cohort B',
    resource: 'User: 0x93...a1b2',
    capability: 'users.manage',
    status: 'PENDING',
    nextAction: 'Firmar transacción de metadata',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    risk: 'MEDIUM'
  }
];

export function OperationsApprovalsTab() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(MOCK_APPROVALS);

  const handleAction = (id: string, action: 'APPROVED' | 'REJECTED') => {
    setApprovals(prev => prev.map(app => app.id === id ? { ...app, status: action } : app));
  };

  const pendingCount = approvals.filter(a => a.status === 'PENDING').length;

  return (
    <div className="p-5 overflow-y-auto flex-1 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04]">
        <div>
          <p className="text-[11px] text-amber-300 font-mono uppercase font-bold flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            <span>GOVERNANCE & APPROVAL CENTER</span>
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">
            Superficie explícita de gobernanza. Acciones críticas propuestas por Hermes o miembros del equipo.
          </p>
        </div>
        <div className="px-3.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-mono flex items-center gap-1.5 shrink-0">
          <Activity className="w-3.5 h-3.5" />
          <span>{pendingCount} Pendientes</span>
        </div>
      </div>

      <div className="space-y-4">
        {approvals.length === 0 ? (
          <div className="p-8 text-center border border-white/5 rounded-xl bg-[#0C0C10]">
            <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2 opacity-50" />
            <p className="text-xs text-zinc-400 font-mono">No hay aprobaciones pendientes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {approvals.map(approval => (
              <motion.div
                key={approval.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border ${
                  approval.status === 'PENDING' ? 'border-amber-500/20 bg-amber-950/10' :
                  approval.status === 'APPROVED' ? 'border-emerald-500/20 bg-emerald-950/10' :
                  'border-rose-500/20 bg-rose-950/10'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  
                  {/* Left: Telemetry */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-white/10 bg-black/40 text-zinc-400">
                        {approval.id}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        approval.status === 'PENDING' ? 'border-amber-500/30 text-amber-300 bg-amber-500/10' :
                        approval.status === 'APPROVED' ? 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10' :
                        'border-rose-500/30 text-rose-300 bg-rose-500/10'
                      }`}>
                        {approval.status}
                      </span>
                      {approval.risk && (
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          approval.risk === 'HIGH' ? 'border-rose-500/30 text-rose-300' :
                          approval.risk === 'MEDIUM' ? 'border-amber-500/30 text-amber-300' :
                          'border-emerald-500/30 text-emerald-300'
                        }`}>
                          RISK: {approval.risk}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        {approval.what}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1 flex items-start gap-1">
                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 text-zinc-500 shrink-0" />
                        <span><strong>Why:</strong> {approval.why}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
                      <div className="space-y-1 text-xs">
                        <p className="text-zinc-500 font-mono text-[10px]">WHO (PROPOSER)</p>
                        <p className="text-zinc-300 flex items-center gap-1.5">
                          <UserCircle className="w-3.5 h-3.5 text-indigo-400" />
                          {approval.who.name} <span className="text-zinc-500">({approval.who.role})</span>
                        </p>
                      </div>
                      <div className="space-y-1 text-xs">
                        <p className="text-zinc-500 font-mono text-[10px]">RESOURCE & CAPABILITY</p>
                        <p className="text-zinc-300">
                          <span className="text-purple-300">{approval.resource}</span> 
                          <span className="mx-1 text-zinc-600">→</span> 
                          <span className="text-sky-300 font-mono text-[10px] bg-sky-500/10 px-1 py-0.5 rounded border border-sky-500/20">{approval.capability}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-row md:flex-col gap-2 shrink-0 md:min-w-[140px]">
                    {approval.status === 'PENDING' ? (
                      <>
                        <button
                          onClick={() => handleAction(approval.id, 'APPROVED')}
                          className="flex-1 md:w-full px-3 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          AUTHORIZE
                        </button>
                        <button
                          onClick={() => handleAction(approval.id, 'REJECTED')}
                          className="flex-1 md:w-full px-3 py-2 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          REJECT
                        </button>
                      </>
                    ) : (
                      <div className="flex-1 md:w-full px-3 py-2 rounded-lg border border-white/5 bg-black/40 text-zinc-500 text-xs font-mono flex items-center justify-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        PROCESSED
                      </div>
                    )}
                    
                    {approval.nextAction && (
                      <div className="mt-2 p-2 rounded bg-black/40 border border-white/5 text-[9px] font-mono text-zinc-400">
                        <span className="text-purple-400">NEXT:</span> {approval.nextAction}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
