'use client';

/**
 * 🏛️ ADMIN B2B CRM (F9.11)
 * apps/dashboard/src/components/admin/views/AdminCrmView.tsx
 *
 * HQ Deal Room & B2B Pipeline.
 * Kanban board for tracking prospects until they convert into Tenants.
 */

import React, { useState } from 'react';
import { 
  KanbanSquare, 
  Search, 
  Filter, 
  MoreHorizontal,
  Phone,
  Mail,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  Plus,
  Briefcase
} from 'lucide-react';
import { usePlatformInspector } from '../inspector/PlatformInspectorContext';
import { PlatformB2bLeadDTO, PlatformB2bLeadStage, B2bPipelineMetricsDTO } from '@/lib/dash-contracts/admin';

interface AdminCrmViewProps {
  initialLeads: PlatformB2bLeadDTO[];
  metrics: B2bPipelineMetricsDTO;
}

const STAGES: { id: PlatformB2bLeadStage; label: string; color: string }[] = [
  { id: 'PROSPECT', label: 'Prospectos Fríos', color: 'zinc' },
  { id: 'CONTACTED', label: 'Contactados', color: 'blue' },
  { id: 'DEMO', label: 'Demo Agendada', color: 'purple' },
  { id: 'DUE_DILIGENCE', label: 'Due Diligence', color: 'amber' },
  { id: 'NEGOTIATION', label: 'Negociación', color: 'orange' }
];

export function AdminCrmView({ initialLeads, metrics }: AdminCrmViewProps) {
  const { inspect } = usePlatformInspector();
  const [leads, setLeads] = useState<PlatformB2bLeadDTO[]>(initialLeads);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLeadsByStage = (stage: PlatformB2bLeadStage) => {
    return filteredLeads.filter(l => l.stage === stage);
  };

  const handleOpenLead = (lead: PlatformB2bLeadDTO) => {
    inspect({
      type: 'CRM_LEAD',
      title: lead.companyName,
      subtitle: `B2B Lead: ${lead.name} (${lead.stage})`,
      badge: lead.stage,
      badgeColor: lead.stage === 'NEGOTIATION' ? 'amber' : 'violet',
      attributes: {
        'Contacto': lead.name,
        'Email': lead.email || 'No provisto',
        'Teléfono': lead.phone || 'No provisto',
        'Fuente': lead.source,
        'Valor Estimado': `$${lead.estimatedValueUsd.toLocaleString()} USD`,
        'Asignado a': lead.assignedOperatorName || 'Sin asignar',
        'Creado': new Date(lead.createdAt).toLocaleDateString(),
        'Última Act.': new Date(lead.updatedAt).toLocaleDateString(),
      },
      rawPayload: lead,
      actionHref: `/admin/crm/leads/${lead.id}`,
      actionLabel: 'Promover a Tenant ↗',
    });
  };

  return (
    <div className="space-y-6 max-w-full overflow-hidden h-full flex flex-col">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-purple-400" />
            HQ Deal Room (B2B CRM)
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Gestión de Pipeline Comercial para B2B. Los prospectos ganados se promueven a Tenants.
          </p>
        </div>

        {/* Quick Metrics */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-[#111118] border border-white/[0.08] text-xs flex items-center gap-2">
            <span className="text-zinc-400">Pipeline Value:</span>
            <span className="font-mono font-bold text-emerald-400">
              ${metrics.pipelineValueUsd.toLocaleString()}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#111118] border border-white/[0.08] text-xs flex items-center gap-2">
            <span className="text-zinc-400">Activos:</span>
            <span className="font-mono font-bold text-white">{metrics.activeDeals}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#111118] border border-white/[0.08] text-xs flex items-center gap-2">
            <span className="text-zinc-400">Conversión:</span>
            <span className="font-mono font-bold text-cyan-400">{metrics.conversionRate}%</span>
          </div>
          
          <button className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors flex items-center gap-1.5 ml-2">
            <Plus className="w-3.5 h-3.5" />
            Nuevo Prospecto
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-[#0F0F16] border border-white/[0.08] flex items-center justify-between gap-3 shrink-0">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar empresa o contacto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#151520] border border-white/[0.08] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <button className="p-2 rounded-xl bg-[#151520] border border-white/[0.08] text-zinc-400 hover:text-white transition-colors">
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 scrollbar-thin scrollbar-thumb-white/[0.1] scrollbar-track-transparent">
        <div className="flex h-full gap-4 min-w-max items-start">
          {STAGES.map((stage) => {
            const stageLeads = getLeadsByStage(stage.id);
            return (
              <div key={stage.id} className="w-80 h-full flex flex-col bg-[#0F0F16]/50 rounded-2xl border border-white/[0.04]">
                {/* Column Header */}
                <div className="p-4 flex items-center justify-between border-b border-white/[0.04] shrink-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-${stage.color}-500 shadow-[0_0_8px_rgba(0,0,0,0.5)] shadow-${stage.color}-500/50`} />
                    <span className="text-xs font-semibold text-white uppercase tracking-wider">
                      {stage.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 bg-white/[0.04] px-2 py-0.5 rounded-full">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Column Content */}
                <div className="flex-1 p-3 overflow-y-auto scrollbar-none space-y-3">
                  {stageLeads.map((lead) => (
                    <div 
                      key={lead.id}
                      onClick={() => handleOpenLead(lead)}
                      className="group p-4 rounded-xl border border-white/[0.06] bg-[#12121B] hover:bg-[#151520] hover:border-purple-500/30 transition-all cursor-pointer shadow-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
                          {lead.companyName}
                        </h4>
                        <button className="text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{lead.name}</span>
                        </div>
                        {lead.email && (
                          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <Mail className="w-3.5 h-3.5" />
                            <span className="truncate">{lead.email}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 mt-3 border-t border-white/[0.04] flex items-center justify-between">
                        <span className="text-[10px] font-mono font-medium text-emerald-400/80 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          ${(lead.estimatedValueUsd / 1000).toFixed(1)}k
                        </span>
                        
                        {lead.assignedOperatorName && (
                          <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-[9px] font-bold text-purple-300" title={`Operador: ${lead.assignedOperatorName}`}>
                            {lead.assignedOperatorName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {stageLeads.length === 0 && (
                    <div className="h-24 border border-dashed border-white/[0.05] rounded-xl flex items-center justify-center text-xs text-zinc-600 font-medium">
                      Arrastrar aquí
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
