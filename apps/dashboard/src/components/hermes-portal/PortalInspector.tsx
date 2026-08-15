'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { WrenchScrewdriverIcon, ShieldCheckIcon, ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { HermesIntelligencePanel } from './overview/HermesIntelligencePanel';

export function PortalInspector({ children, title = 'Hermes Operating System', type = 'system', attributes = {}, organization, expanded = true, onToggle }: any) {
  const pathname = usePathname() || '';
  
  let dynamicTitle = title;
  let dynamicType = type;
  let dynamicAttributes = { ...attributes };

  if (pathname.includes('/channels')) {
      dynamicTitle = 'Omnichannel Mesh';
      dynamicType = 'network';
      dynamicAttributes = {
          ...dynamicAttributes,
          'Integration Layer': 'Active',
          'Protocol': 'HTTPS Webhooks',
          'Privacy': 'E2E Encryption where supported'
      };
  } else if (pathname.includes('/journeys')) {
      dynamicTitle = 'Journeys Configuration';
      dynamicType = 'cognitive';
      dynamicAttributes = {
          ...dynamicAttributes,
          'Runtime': 'Hermes Stateful Engine',
          'Persistence': 'hermes_actor_journeys'
      };
  } else if (pathname.includes('/governance')) {
      dynamicTitle = 'Governance Layer';
      dynamicType = 'security';
      dynamicAttributes = {
          ...dynamicAttributes,
          'Control Plane': 'Active',
          'Access Level': 'Admin Console'
      };
  } else if (pathname.includes('/knowledge')) {
      dynamicTitle = 'Knowledge Base';
      dynamicType = 'data';
      dynamicAttributes = {
          ...dynamicAttributes,
          'Vector DB': 'Active',
          'Embedding Model': 'text-embedding-3-small'
      };
  } else if (pathname.includes('/identity')) {
    dynamicTitle = 'Identity & Access Manager';
    dynamicType = 'Security.IAM';
    dynamicAttributes = {
      'Role Context': 'Tenant Operator',
      'Authorization': 'RBAC Enforced',
      'Keys Active': 'True'
    };
  } else if (pathname.includes('/conversations')) {
    dynamicTitle = 'Conversational Memory';
    dynamicType = 'Cognitive.Runtime';
    dynamicAttributes = {
      'Session Context': 'Persistent',
      'Semantic Index': 'Live',
      'Trace Logs': 'Enabled'
    };
  } else if (pathname.includes('/policies')) {
    dynamicTitle = 'Cognitive Policies';
    dynamicType = 'Governance.Guardrails';
    dynamicAttributes = {
      'Safety Level': 'Strict',
      'Constraints': 'Enforced',
      'Escalation': 'Human Hand-off'
    };
  } else if (pathname.includes('/activity')) {
      dynamicTitle = 'Activity Feed';
      dynamicType = 'observability';
      dynamicAttributes = {
          ...dynamicAttributes,
          'Telemetry': 'Real-time',
          'Audit Log': 'Immutable'
      };
  } else if (pathname.includes('/settings')) {
    dynamicTitle = 'Workspace Settings';
    dynamicType = 'System.Config';
    dynamicAttributes = {
      'Environment': 'Production',
      'API Version': 'v2.1',
      'Sync': 'Active'
    };
  } else if (pathname.includes('/add-ons')) {
    dynamicTitle = 'Integration Add-ons';
    dynamicType = 'Ecosystem.Plugins';
    dynamicAttributes = {
      'Store Status': 'Connected',
      'Webhooks': 'Enabled',
      'Modules': 'Loaded'
    };
  }

  if (!expanded) {
    return (
      <aside className="flex w-12 bg-[#12121A] border border-white/[0.08] rounded-2xl flex-col shrink-0 font-sans h-full overflow-hidden shadow-2xl relative items-center py-4 cursor-pointer hover:bg-white/[0.02] transition-colors" onClick={onToggle}>
        <div className="w-8 h-8 rounded-xl bg-white/[0.05] flex items-center justify-center text-white/50 hover:text-white transition-colors mb-4">
          <ChevronLeftIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-start gap-4">
          <WrenchScrewdriverIcon className="w-5 h-5 text-purple-400" />
          <div className="writing-vertical-rl rotate-180 text-xs font-bold text-zinc-500 uppercase tracking-widest mt-4">
            Inspector
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex w-full bg-[#12121A] border border-white/[0.08] rounded-2xl flex-col shrink-0 font-sans h-full overflow-hidden shadow-2xl relative">
        <div className="h-12 px-4 border-b border-white/[0.06] flex items-center justify-between bg-[#0C0C12] shrink-0">
            <div className="flex items-center gap-2">
                {onToggle && (
                  <button onClick={onToggle} className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                )}
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <WrenchScrewdriverIcon className="w-3.5 h-3.5 text-purple-400" />
                    Inspector
                </span>
            </div>
            <span className="text-[10px] font-mono bg-white/5 text-zinc-500 px-1.5 py-0.5 rounded">
                {dynamicType}
            </span>
        </div>

        <div className="p-4 flex-1 flex flex-col space-y-6 overflow-y-auto">
            <div>
                <h3 className="text-sm font-bold text-zinc-100">{dynamicTitle}</h3>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">Context Inspector View</p>
            </div>

            {Object.keys(dynamicAttributes).length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Attributes</h4>
                    {Object.entries(dynamicAttributes).map(([key, val]: any) => (
                        <div key={key} className="bg-black/30 border border-white/5 p-2.5 rounded-lg">
                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">{key}</div>
                            <div className="text-xs text-zinc-200 font-mono mt-0.5 break-all">{String(val)}</div>
                        </div>
                    ))}
                </div>
            )}

            {children}



            <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl space-y-2 mt-auto shrink-0">
                <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                    <ShieldCheckIcon className="w-4 h-4 text-purple-400" />
                    ADR-001 Compliant
                </span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                    State & metrics are backed by Postgres persistent storage (`hermes_jobs`).
                </p>
            </div>
        </div>
    </aside>
  );
}
