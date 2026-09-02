'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { 
  WrenchScrewdriverIcon, 
  ShieldCheckIcon, 
  ChevronRightIcon, 
  ChevronLeftIcon 
} from '@heroicons/react/24/outline';
import { useInspector } from './InspectorContext';

export function PortalInspector({ 
  children, 
  title = 'Hermes Operating System', 
  type = 'system', 
  attributes = {}, 
  organization, 
  expanded = true, 
  onToggle 
}: any) {
  const pathname = usePathname() || '';
  const { data: contextData, toggle: contextToggle } = useInspector();
  
  const handleToggle = onToggle || contextToggle;

  // Fallback dynamic definitions based on route
  let dynamicTitle = title;
  let dynamicType = type;
  let dynamicBadge = '';
  let dynamicBadgeColor: 'emerald' | 'violet' | 'amber' | 'blue' | 'zinc' = 'zinc';
  let dynamicDescription = 'Context Inspector View';
  let dynamicAttributes: Record<string, string> = { ...attributes };
  let dynamicCompliance = 'State & metrics are backed by Postgres persistent storage (`hermes_jobs`).';

  if (pathname.includes('/media')) {
    dynamicTitle = 'Hermes Media Factory';
    dynamicType = 'A2A.Studio';
    dynamicDescription = 'Orquestación de Activos Multimedia IPFS';
    dynamicBadge = 'A2A PROTOCOL V1.1';
    dynamicBadgeColor = 'violet';
    dynamicAttributes = {
      'Motor de IA': 'A2A Agent Orchestration',
      'Agentes Productores': 'Sofía (Prompt Director) & Pixel (Diffusion)',
      'Custodia y Prueba': 'Bóveda K25 Sovereign IPFS',
      'Firma Criptográfica': 'EIP-712 Notarized Receipt',
      'Persistencia de Jobs': 'Postgres hermes_jobs',
    };
    dynamicCompliance = 'Generación asistida bajo estándares de trazabilidad K26/K27 y CID descentralizado.';
  } else if (pathname.includes('/channels')) {
    dynamicTitle = 'Omnichannel Mesh';
    dynamicType = 'network';
    dynamicDescription = 'Conectores y Webhooks en Vivo';
    dynamicBadge = 'ONLINE';
    dynamicBadgeColor = 'emerald';
    dynamicAttributes = {
      'Integration Layer': 'Active',
      'Protocol': 'HTTPS Webhooks',
      'Canales Soportados': 'Telegram, WhatsApp, Portal Web',
      'Privacy': 'E2E Encryption where supported'
    };
  } else if (pathname.includes('/journeys')) {
    dynamicTitle = 'Journeys Engine';
    dynamicType = 'cognitive';
    dynamicDescription = 'Automatización Conversacional y Flujos';
    dynamicBadge = 'STATEFUL';
    dynamicBadgeColor = 'blue';
    dynamicAttributes = {
      'Runtime': 'Hermes Stateful Engine',
      'Motor de Decisión': 'Lattice Policy Engine',
      'Persistencia': 'hermes_actor_journeys',
      'Escalación': 'Automática a Operador Humano'
    };
  } else if (pathname.includes('/governance')) {
    dynamicTitle = 'Governance Layer';
    dynamicType = 'security';
    dynamicDescription = 'Políticas y Reglas del Protocolo';
    dynamicBadge = 'ENFORCED';
    dynamicBadgeColor = 'emerald';
    dynamicAttributes = {
      'Control Plane': 'Active',
      'Access Level': 'Admin Console & Operators',
      'Consenso': 'DAO On-Chain + Multi-Sig'
    };
  } else if (pathname.includes('/knowledge')) {
    dynamicTitle = 'Knowledge Vault';
    dynamicType = 'data';
    dynamicDescription = 'Bóveda Soberana de Documentación';
    dynamicBadge = 'INDEXED';
    dynamicBadgeColor = 'violet';
    dynamicAttributes = {
      'Vector DB': 'Active',
      'Embedding Model': 'text-embedding-3-small',
      'Vault CID': 'K25 Sovereign IPFS'
    };
  } else if (pathname.includes('/identity')) {
    dynamicTitle = 'Identity & Access Manager';
    dynamicType = 'Security.IAM';
    dynamicDescription = 'Control de Operadores y Llaves de API';
    dynamicBadge = 'RBAC';
    dynamicBadgeColor = 'blue';
    dynamicAttributes = {
      'Role Context': 'Tenant Operator',
      'Authorization': 'RBAC Enforced',
      'Keys Active': 'True'
    };
  } else if (pathname.includes('/conversations')) {
    dynamicTitle = 'Conversational Memory';
    dynamicType = 'Cognitive.Runtime';
    dynamicDescription = 'Historial Semántico y Contexto';
    dynamicBadge = 'SYNCHRONIZED';
    dynamicBadgeColor = 'emerald';
    dynamicAttributes = {
      'Session Context': 'Persistent',
      'Semantic Index': 'Live',
      'Trace Logs': 'Enabled'
    };
  } else if (pathname.includes('/policies')) {
    dynamicTitle = 'Cognitive Policies';
    dynamicType = 'Governance.Guardrails';
    dynamicDescription = 'Restricciones y Guardrails Post-LLM';
    dynamicBadge = 'STRICT';
    dynamicBadgeColor = 'amber';
    dynamicAttributes = {
      'Safety Level': 'Strict',
      'Constraints': 'Enforced',
      'Escalation': 'Human Hand-off'
    };
  } else if (pathname.includes('/activity')) {
    dynamicTitle = 'Activity Feed';
    dynamicType = 'observability';
    dynamicDescription = 'Registro de Eventos y Trazabilidad';
    dynamicBadge = 'REAL-TIME';
    dynamicBadgeColor = 'emerald';
    dynamicAttributes = {
      'Telemetry': 'Real-time',
      'Audit Log': 'Immutable Hash-Chain'
    };
  } else if (pathname.includes('/settings')) {
    dynamicTitle = 'Workspace Settings';
    dynamicType = 'System.Config';
    dynamicDescription = 'Configuración General del Tenant';
    dynamicBadge = 'PROD';
    dynamicBadgeColor = 'zinc';
    dynamicAttributes = {
      'Environment': 'Production',
      'API Version': 'v2.1',
      'Sync': 'Active'
    };
  } else if (pathname.includes('/add-ons')) {
    dynamicTitle = 'Integration Add-ons';
    dynamicType = 'Ecosystem.Plugins';
    dynamicDescription = 'Extensiones y Módulos Externos';
    dynamicBadge = 'MESH';
    dynamicBadgeColor = 'blue';
    dynamicAttributes = {
      'Store Status': 'Connected',
      'Webhooks': 'Enabled',
      'Modules': 'Loaded'
    };
  }

  // Override with context-supplied active inspection data if present
  if (contextData) {
    if (contextData.title) dynamicTitle = contextData.title;
    if (contextData.type) dynamicType = contextData.type;
    if (contextData.description) dynamicDescription = contextData.description;
    if (contextData.badge) dynamicBadge = contextData.badge;
    if (contextData.badgeColor) dynamicBadgeColor = contextData.badgeColor;
    if (contextData.attributes) dynamicAttributes = { ...contextData.attributes };
    if (contextData.complianceNote) dynamicCompliance = contextData.complianceNote;
  }

  if (!expanded) {
    return (
      <aside 
        className="flex w-12 bg-[#12121A] border border-white/[0.08] rounded-2xl flex-col shrink-0 font-sans h-full overflow-hidden shadow-2xl relative items-center py-4 cursor-pointer hover:bg-white/[0.04] transition-all group" 
        onClick={handleToggle}
        title="Abrir Inspector"
      >
        <div className="w-8 h-8 rounded-xl bg-white/[0.05] group-hover:bg-purple-500/20 group-hover:text-purple-300 flex items-center justify-center text-white/50 transition-colors mb-4">
          <ChevronLeftIcon className="w-4 h-4" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-start gap-4">
          <WrenchScrewdriverIcon className="w-5 h-5 text-purple-400" />
          <div className="writing-vertical-rl rotate-180 text-[11px] font-bold text-zinc-500 uppercase tracking-widest mt-4">
            Inspector
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex w-full bg-[#12121A] border border-white/[0.08] rounded-2xl flex-col shrink-0 font-sans h-full min-h-0 overflow-hidden shadow-2xl relative">
      <div className="h-12 px-4 border-b border-white/[0.06] flex items-center justify-between bg-[#0C0C12] shrink-0">
        <div className="flex items-center gap-2">
          {handleToggle && (
            <button 
              onClick={handleToggle} 
              className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Colapsar Inspector"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          )}
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
            <WrenchScrewdriverIcon className="w-3.5 h-3.5 text-purple-400" />
            Inspector
          </span>
        </div>
        <span className="text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full">
          {dynamicType}
        </span>
      </div>

      <div className="p-4 flex-1 flex flex-col space-y-5 overflow-y-auto min-h-0">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white tracking-tight">{dynamicTitle}</h3>
            {dynamicBadge && (
              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                dynamicBadgeColor === 'emerald'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : dynamicBadgeColor === 'amber'
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                  : dynamicBadgeColor === 'violet'
                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                  : dynamicBadgeColor === 'blue'
                  ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                  : 'bg-white/5 text-zinc-400 border-white/10'
              }`}>
                {dynamicBadge}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">{dynamicDescription}</p>
        </div>

        {Object.keys(dynamicAttributes).length > 0 && (
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
              Parámetros de Inspección
            </h4>
            <div className="space-y-2">
              {Object.entries(dynamicAttributes).map(([key, val]) => (
                <div key={key} className="bg-black/40 border border-white/[0.06] p-2.5 rounded-xl space-y-0.5 hover:border-white/10 transition-colors">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">{key}</div>
                  <div className="text-xs text-zinc-200 font-mono break-all">{String(val)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {children}

        <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl space-y-1.5 mt-auto shrink-0">
          <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5 font-mono">
            <ShieldCheckIcon className="w-4 h-4 text-purple-400 shrink-0" />
            Certificación Soberana K26/K27
          </span>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            {dynamicCompliance}
          </p>
        </div>
      </div>
    </aside>
  );
}
