'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Bot, 
  Rocket, 
  Landmark, 
  CheckCircle2, 
  Circle, 
  ArrowRight,
  ArrowUpRight, 
  Sparkles, 
  ShieldCheck, 
  Cpu,
  Compass,
  Zap,
} from 'lucide-react';

import type { EcosystemSetupSummary } from '@/lib/mesh/setup-progress.service';

export type StepTier = 'REQUIRED' | 'RECOMMENDED' | 'OPTIONAL';

interface SetupMissionStep {
  id: string;
  label: string;
  tier: StepTier;
  done: boolean;
  href: string;
  actionText: string;
}

interface SuiteMission {
  name: string;
  short: string;
  icon: React.ElementType;
  percentage: number;
  color: 'emerald' | 'violet' | 'indigo';
  steps: SetupMissionStep[];
  primaryHref: string;
  actionCta: string;
}

export function SetupCompletionWidget({ 
  organizationSlug,
  initialSummary,
}: { 
  organizationSlug: string;
  initialSummary?: EcosystemSetupSummary | null;
}) {
  const hermesMod = initialSummary?.modules?.find((m) => m.productKey === 'HERMES');
  const growthMod = initialSummary?.modules?.find((m) => m.productKey === 'GROWTH_OS');
  const rwaMod = initialSummary?.modules?.find((m) => m.productKey === 'PANDORAS_RWA');

  // Dynamic signals from real database state
  const isHermesPersonaDone = Boolean(hermesMod?.checklist?.find((c) => c.id === 'hermes-persona')?.isCompleted);
  const isHermesVaultDone = Boolean(hermesMod?.checklist?.find((c) => c.id === 'hermes-vault')?.isCompleted);
  const isHermesChannelsDone = Boolean(hermesMod?.checklist?.find((c) => c.id === 'hermes-telegram')?.isCompleted);

  const isGrowthPipelineDone = Boolean(growthMod?.checklist?.find((c) => c.id === 'growth-crm')?.isCompleted);
  const isGrowthCampaignDone = Boolean(growthMod?.checklist?.find((c) => c.id === 'growth-email')?.isCompleted);
  const isGrowthTreasuryDone = Boolean(growthMod?.checklist?.find((c) => c.id === 'growth-treasury')?.isCompleted);

  const isRwaProjectDone = Boolean(rwaMod?.checklist?.find((c) => c.id === 'rwa-compliance')?.isCompleted);
  const isRwaTokenomicsDone = Boolean(rwaMod?.checklist?.find((c) => c.id === 'rwa-tokenomics')?.isCompleted);
  const isRwaDeployDone = Boolean(rwaMod?.checklist?.find((c) => c.id === 'rwa-contract')?.isCompleted);

  const hermesPercentage = hermesMod?.progressPercentage ?? (isHermesPersonaDone ? 35 : 0);
  const growthPercentage = growthMod?.progressPercentage ?? (isGrowthPipelineDone ? 35 : 0);
  const rwaPercentage = rwaMod?.progressPercentage ?? (isRwaProjectDone ? 35 : 0);

  const suites: SuiteMission[] = [
    {
      name: 'Activar Hermes',
      short: 'Hermes AI',
      icon: Bot,
      percentage: hermesPercentage,
      color: 'emerald',
      primaryHref: `/portal/${organizationSlug}`,
      actionCta: 'Comenzar con Hermes →',
      steps: [
        {
          id: 'h_discovery',
          label: 'Cuéntale a Hermes sobre tu negocio',
          tier: 'REQUIRED',
          done: isHermesPersonaDone,
          href: `/portal/${organizationSlug}`,
          actionText: 'Conversar con Hermes',
        },
        {
          id: 'h_vault',
          label: 'Revisa el conocimiento institucional (K25)',
          tier: 'RECOMMENDED',
          done: isHermesVaultDone,
          href: `/portal/${organizationSlug}/knowledge`,
          actionText: 'Revisar Bóveda',
        },
        {
          id: 'h_channels',
          label: 'Conecta tu primer canal (Telegram / Widget)',
          tier: 'OPTIONAL',
          done: isHermesChannelsDone,
          href: `/portal/${organizationSlug}/channels`,
          actionText: 'Conectar Canal',
        },
      ],
    },
    {
      name: 'Activar Growth OS',
      short: 'Growth OS',
      icon: Rocket,
      percentage: growthPercentage,
      color: 'violet',
      primaryHref: `/growth-os/organizations/${organizationSlug}`,
      actionCta: 'Configurar Growth →',
      steps: [
        {
          id: 'g_pipeline',
          label: 'Define tu pipeline de prospectos',
          tier: 'REQUIRED',
          done: isGrowthPipelineDone,
          href: `/growth-os/organizations/${organizationSlug}/pipeline`,
          actionText: 'Configurar Pipeline',
        },
        {
          id: 'g_campaign',
          label: 'Crea tu primera campaña o difusión',
          tier: 'RECOMMENDED',
          done: isGrowthCampaignDone,
          href: `/growth-os/organizations/${organizationSlug}/email`,
          actionText: 'Lanzar Campaña',
        },
        {
          id: 'g_treasury',
          label: 'Configura tu tesorería Safe soberana',
          tier: 'OPTIONAL',
          done: isGrowthTreasuryDone,
          href: `/growth-os/organizations/${organizationSlug}/finance`,
          actionText: 'Vincular Safe',
        },
      ],
    },
    {
      name: 'Preparar RWA & Capital',
      short: 'RWA & Tokenomics',
      icon: Landmark,
      percentage: rwaPercentage,
      color: 'indigo',
      primaryHref: `/profile/projects/${organizationSlug}/manage`,
      actionCta: 'Preparar Proyecto →',
      steps: [
        {
          id: 'r_project',
          label: 'Define tu proyecto y metadata',
          tier: 'REQUIRED',
          done: isRwaProjectDone,
          href: `/profile/projects/${organizationSlug}/manage`,
          actionText: 'Editar Metadata',
        },
        {
          id: 'r_tokenomics',
          label: 'Modela fases de venta y participaciones',
          tier: 'RECOMMENDED',
          done: isRwaTokenomicsDone,
          href: `/profile/projects/${organizationSlug}/manage`,
          actionText: 'Configurar Tokenomics',
        },
        {
          id: 'r_deploy',
          label: 'Inicia dictamen legal y deploy on-chain',
          tier: 'OPTIONAL',
          done: isRwaDeployDone,
          href: `/profile/projects/${organizationSlug}/manage`,
          actionText: 'Desplegar On-Chain',
        },
      ],
    },
  ];

  const totalPercentage = initialSummary
    ? initialSummary.overallPercentage
    : Math.round(
        suites.reduce((acc, s) => acc + s.percentage, 0) / suites.length
      );

  const getTierBadge = (tier: StepTier) => {
    switch (tier) {
      case 'REQUIRED':
        return (
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            REQUIRED
          </span>
        );
      case 'RECOMMENDED':
        return (
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            RECOMMENDED
          </span>
        );
      case 'OPTIONAL':
        return (
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/10">
            OPTIONAL
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 🌟 HERMES CONCIERGE WELCOME BANNER */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0C0C16] via-[#101020] to-[#0A0A12] border border-indigo-500/20 p-6 sm:p-7 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-start gap-4 z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
            <Bot className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Hermes Concierge
              </span>
              <span className="text-zinc-500 text-xs">· Onboarding Asistido</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Tu ecosistema está listo. Ahora vamos a configurarlo juntos.
            </h3>
            <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
              Hermes ya conoce la estructura inicial de tu organización. Puedes completar las Setup Missions a tu propio ritmo o dejar que Hermes te guíe paso a paso.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 z-10 w-full md:w-auto">
          <Link
            href={`/portal/${organizationSlug}`}
            className="w-full md:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-bold font-mono flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>Hablar con Hermes Concierge</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 🚀 SETUP MISSIONS MATRIX */}
      <div className="rounded-3xl bg-[#09090E] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/5 via-violet-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Header & Overall Readiness */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>Ecosystem Readiness & Setup Missions</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Misiones de Activación Soberana
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
              Solo las misiones marcadas como <span className="text-amber-400 font-medium">REQUIRED</span> son esenciales para operar. Puedes continuar sin completar las recomendaciones adicionales.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 p-3.5 rounded-2xl shrink-0">
            <div className="text-right">
              <div className="text-[10px] font-mono text-zinc-400 uppercase">Ecosystem Readiness</div>
              <div className="text-2xl font-black font-mono text-white">{totalPercentage}%</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 border border-indigo-500/30 flex items-center justify-center text-emerald-300">
              <Zap className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Grid of 3 Setup Missions */}
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
                  {/* Mission Title & % */}
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
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${progressFill}`}
                        style={{ width: `${suite.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                      <span>3 pasos recomendados</span>
                      <span>{suite.steps.filter((s) => s.done).length} de {suite.steps.length} completados</span>
                    </div>
                  </div>

                  {/* Mission Steps with Tiers */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    {suite.steps.map((step, idx) => (
                      <Link
                        key={step.id}
                        href={step.href}
                        className="group flex items-start justify-between p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors text-xs"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="mt-0.5 shrink-0">
                            {step.done ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 text-zinc-600" />
                            )}
                          </div>
                          <div className="space-y-1 min-w-0">
                            <p className={`text-xs leading-snug ${step.done ? 'text-zinc-300' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                              <span className="font-mono text-zinc-500 mr-1.5">0{idx + 1}.</span>
                              {step.label}
                            </p>
                            <div className="flex items-center gap-1.5">
                              {getTierBadge(step.tier)}
                            </div>
                          </div>
                        </div>
                        <ArrowUpRight className="w-3 h-3 text-zinc-600 group-hover:text-white transition-colors shrink-0 ml-1.5 mt-0.5" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Action CTA Button */}
                <div className="pt-3 border-t border-white/5">
                  <Link
                    href={suite.primaryHref}
                    className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold font-mono flex items-center justify-center gap-1.5 transition-all ${accentBadge} hover:brightness-125`}
                  >
                    <span>{suite.actionCta}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

