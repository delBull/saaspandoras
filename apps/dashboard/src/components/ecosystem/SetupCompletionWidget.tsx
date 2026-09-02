'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Bot, 
  Rocket, 
  Landmark, 
  CheckCircle2, 
  Circle, 
  ArrowUpRight, 
  Sparkles, 
  ShieldCheck, 
  Cpu 
} from 'lucide-react';

interface SetupStep {
  id: string;
  label: string;
  done: boolean;
  href: string;
  actionText: string;
}

interface SuiteSetup {
  name: string;
  short: string;
  icon: React.ElementType;
  percentage: number;
  color: 'emerald' | 'violet' | 'indigo';
  steps: SetupStep[];
  primaryHref: string;
}

export function SetupCompletionWidget({ organizationSlug }: { organizationSlug: string }) {
  const suites: SuiteSetup[] = [
    {
      name: 'Hermes AI OS',
      short: 'HERMES',
      icon: Bot,
      percentage: 80,
      color: 'emerald',
      primaryHref: `/portal/${organizationSlug}`,
      steps: [
        {
          id: 'h_vault',
          label: 'Knowledge Vault (K25 Soberano)',
          done: true,
          href: `/portal/${organizationSlug}/knowledge`,
          actionText: 'Ver Bóveda',
        },
        {
          id: 'h_telegram',
          label: 'Telegram Bot Mesh (@pandorasHermes_bot)',
          done: true,
          href: `/portal/${organizationSlug}/channels`,
          actionText: 'Ver Conector',
        },
        {
          id: 'h_persona',
          label: 'Business Persona & Prompt Core',
          done: true,
          href: `/portal/${organizationSlug}/settings`,
          actionText: 'Configurar',
        },
        {
          id: 'h_widget',
          label: 'Web Widget Embed en Vivo',
          done: false,
          href: `/portal/${organizationSlug}/channels`,
          actionText: 'Obtener Script Embed',
        },
      ],
    },
    {
      name: 'Growth OS',
      short: 'GROWTH',
      icon: Rocket,
      percentage: 60,
      color: 'violet',
      primaryHref: `/growth-os/organizations/${organizationSlug}`,
      steps: [
        {
          id: 'g_crm',
          label: 'CRM & Pipeline Comercial',
          done: true,
          href: `/growth-os/organizations/${organizationSlug}/pipeline`,
          actionText: 'Ver Pipeline',
        },
        {
          id: 'g_email',
          label: 'Email Marketing & Difusión',
          done: true,
          href: `/growth-os/organizations/${organizationSlug}/email`,
          actionText: 'Crear Campaña',
        },
        {
          id: 'g_gov',
          label: 'Protocol Governance Proposals',
          done: false,
          href: `/growth-os/organizations/${organizationSlug}/governance`,
          actionText: 'Redactar Propuesta',
        },
        {
          id: 'g_treasury',
          label: 'Treasury Tracking & Yield',
          done: false,
          href: `/growth-os/organizations/${organizationSlug}/finance`,
          actionText: 'Vincular Vault',
        },
      ],
    },
    {
      name: 'RWA Tokenomics',
      short: 'RWA',
      icon: Landmark,
      percentage: 20,
      color: 'indigo',
      primaryHref: `/profile/projects/${organizationSlug}/manage`,
      steps: [
        {
          id: 'r_project',
          label: 'Project Setup & Whitepaper Metadata',
          done: true,
          href: `/profile/projects/${organizationSlug}/manage`,
          actionText: 'Ver Ficha',
        },
        {
          id: 'r_tokenomics',
          label: 'Tokenomics Modeling & Fases de Venta',
          done: false,
          href: `/profile/projects/${organizationSlug}/manage`,
          actionText: 'Configurar Fases',
        },
        {
          id: 'r_legal',
          label: 'Legal Framework & Contratos Notarizados',
          done: false,
          href: `/profile/projects/${organizationSlug}/manage`,
          actionText: 'Subir Dictamen',
        },
        {
          id: 'r_deploy',
          label: 'Smart Contract Deployment (Base / EVM)',
          done: false,
          href: `/profile/projects/${organizationSlug}/manage`,
          actionText: 'Desplegar On-Chain',
        },
      ],
    },
  ];

  const totalPercentage = Math.round(
    suites.reduce((acc, s) => acc + s.percentage, 0) / suites.length
  );

  return (
    <div className="rounded-3xl bg-[#09090E] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/5 via-violet-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>Sistema Operativo de Instalación del Ecosistema</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Setup Completion Matrix
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
            Monitorea el aprovisionamiento de las 3 suites soberanas para @{organizationSlug}. Cada paso completado incrementa el readiness institucional de tu protocolo.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 p-3.5 rounded-2xl shrink-0">
          <div className="text-right">
            <div className="text-[10px] font-mono text-zinc-400 uppercase">Ecosystem Readiness</div>
            <div className="text-2xl font-black font-mono text-white">{totalPercentage}%</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-indigo-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Grid of 3 Suites */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {suites.map((suite) => {
          const Icon = suite.icon;
          const isEmerald = suite.color === 'emerald';
          const isViolet = suite.color === 'violet';
          const isIndigo = suite.color === 'indigo';

          const accentBadge = isEmerald
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : isViolet
            ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';

          const progressFill = isEmerald
            ? 'bg-emerald-400'
            : isViolet
            ? 'bg-violet-400'
            : 'bg-indigo-400';

          return (
            <div
              key={suite.short}
              className="bg-black/30 border border-white/[0.06] hover:border-white/15 rounded-2xl p-5 space-y-5 flex flex-col justify-between transition-all"
            >
              <div className="space-y-4">
                {/* Suite Title & % */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl border ${accentBadge}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-white">{suite.name}</span>
                  </div>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${accentBadge}`}>
                    {suite.percentage}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${progressFill}`}
                      style={{ width: `${suite.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                    <span>Instalación</span>
                    <span>{suite.steps.filter((s) => s.done).length} de {suite.steps.length} módulos</span>
                  </div>
                </div>

                {/* Checklist Steps */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  {suite.steps.map((step) => (
                    <Link
                      key={step.id}
                      href={step.href}
                      className="group flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.04] transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {step.done ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                        )}
                        <span className={`truncate text-xs ${step.done ? 'text-zinc-300' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                          {step.label}
                        </span>
                      </div>
                      <ArrowUpRight className="w-3 h-3 text-zinc-600 group-hover:text-white transition-colors shrink-0 ml-1" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-white/5">
                <Link
                  href={suite.primaryHref}
                  className={`w-full py-2 px-3 rounded-xl border text-xs font-bold font-mono flex items-center justify-center gap-1.5 transition-all ${accentBadge} hover:brightness-125`}
                >
                  <span>Gestionar {suite.short}</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
