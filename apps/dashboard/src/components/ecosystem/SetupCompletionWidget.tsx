'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Bot, 
  Rocket, 
  CheckCircle2, 
  Circle, 
  ArrowRight,
  ArrowUpRight, 
  Sparkles, 
  Compass,
  Zap,
  Clock,
} from 'lucide-react';

import type { EcosystemSetupSummary } from '@saasfly/shared';
import { HermesFloatingGuide } from '@/components/guides/HermesFloatingGuide';
import type { EcosystemTourRole } from '@/lib/guides/ecosystem-guides.data';
import { getStationsForTenantVertical, type TenantVertical } from '@/lib/guides/tenant-vertical-guides.data';
import type { TenantExperienceContext } from '@/lib/mesh/tenant-experience-context';

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
  organizationName,
  initialSummary,
  experienceContext,
  tenantRole,
  actorId,
}: { 
  organizationSlug: string;
  organizationName: string;
  initialSummary?: EcosystemSetupSummary | null;
  experienceContext?: TenantExperienceContext | null;
  tenantRole?: string;
  actorId?: string;
}) {
  const normalizedRole: EcosystemTourRole = (
    tenantRole?.toUpperCase() === 'OWNER' || tenantRole?.toUpperCase() === 'ADMIN'
      ? 'ADMIN'
      : tenantRole?.toUpperCase() === 'OPERATOR'
      ? 'OPERATOR'
      : tenantRole?.toUpperCase() === 'MARKETING'
      ? 'MARKETING'
      : tenantRole?.toUpperCase() === 'SUPER_ADMIN'
      ? 'SUPER_ADMIN'
      : 'VIEWER'
  );
  const hermesMod = initialSummary?.modules?.find((m) => m.productKey === 'HERMES');
  const growthMod = initialSummary?.modules?.find((m) => m.productKey === 'GROWTH_OS');
  const rwaMod = initialSummary?.modules?.find((m) => m.productKey === 'PANDORAS_RWA');

  // Interactive Hermes Floating Guide State for Tenant
  const [isTourOpen, setIsTourOpen] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tour') === 'setup' || params.get('tour') === 'vertical') {
        setIsTourOpen(true);
      }
    }
  }, []);

  const tenantVertical: TenantVertical = experienceContext
    ? experienceContext.experienceMode === 'RWA_EXPANSION_FIRST'
      ? 'RWA_REAL_ESTATE'
      : 'SAAS_GROWTH'
    : rwaMod
    ? 'RWA_REAL_ESTATE'
    : 'SAAS_GROWTH';

  const tenantStations = getStationsForTenantVertical(tenantVertical, organizationSlug);

  // Dynamic signals from real database state
  const isHermesPersonaDone = Boolean(hermesMod?.checklist?.find((c) => c.id === 'hermes-persona')?.isCompleted);
  const isHermesVaultDone = Boolean(hermesMod?.checklist?.find((c) => c.id === 'hermes-vault')?.isCompleted);
  const isHermesChannelsDone = Boolean(hermesMod?.checklist?.find((c) => c.id === 'hermes-telegram')?.isCompleted);

  const isGrowthPipelineDone = Boolean(growthMod?.checklist?.find((c) => c.id === 'growth-crm')?.isCompleted);
  const isGrowthCampaignDone = Boolean(growthMod?.checklist?.find((c) => c.id === 'growth-email')?.isCompleted);
  const isGrowthTreasuryDone = Boolean(growthMod?.checklist?.find((c) => c.id === 'growth-treasury')?.isCompleted);

  const hermesPercentage = hermesMod?.progressPercentage ?? (isHermesPersonaDone ? 35 : 0);
  const growthPercentage = growthMod?.progressPercentage ?? (isGrowthPipelineDone ? 35 : 0);

  const allSuites: SuiteMission[] = [
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
          label: 'Haz que Hermes conozca tu negocio',
          tier: 'RECOMMENDED',
          done: isHermesVaultDone,
          href: `/portal/${organizationSlug}/knowledge`,
          actionText: 'Subir Conocimiento',
        },
        {
          id: 'h_channels',
          label: 'Conecta tu canal (Telegram / Widget)',
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
    // {
    //   name: 'Preparar RWA & Capital',
    //   short: 'RWA & Tokenomics',
    //   icon: Landmark,
    //   percentage: rwaPercentage,
    //   color: 'indigo',
    //   primaryHref: `/ecosystem/${organizationSlug}/capital`,
    //   actionCta: 'Preparar Proyecto →',
    //   steps: [
    //     {
    //       id: 'r_project',
    //       label: 'Define tu proyecto y metadata',
    //       tier: 'REQUIRED',
    //       done: isRwaProjectDone,
    //       href: `/ecosystem/${organizationSlug}/capital`,
    //       actionText: 'Editar Metadata',
    //     },
    //     {
    //       id: 'r_tokenomics',
    //       label: 'Modela fases de venta y participaciones',
    //       tier: 'RECOMMENDED',
    //       done: isRwaTokenomicsDone,
    //       href: `/ecosystem/${organizationSlug}/capital`,
    //       actionText: 'Configurar Tokenomics',
    //     },
    //     {
    //       id: 'r_deploy',
    //       label: 'Inicia dictamen legal y deploy on-chain',
    //       tier: 'OPTIONAL',
    //       done: isRwaDeployDone,
    //       href: `/ecosystem/${organizationSlug}/capital`,
    //       actionText: 'Desplegar On-Chain',
    //     },
    //   ],
    // },
  ];

  // Filter suites based on provisioned modules. If no initialSummary is provided, assume all are active.
  const suites = allSuites.filter(suite => {
    if (!initialSummary) return true;
    if (suite.short === 'Hermes AI') return !!hermesMod;
    if (suite.short === 'Growth OS') return !!growthMod;
    if (suite.short === 'RWA & Tokenomics') return !!rwaMod;
    return true;
  });

  const totalPercentage = initialSummary
    ? initialSummary.overallPercentage
    : Math.round(
        suites.reduce((acc, s) => acc + s.percentage, 0) / (suites.length || 1)
      );

  const getTierBadge = (tier: StepTier, isDone: boolean) => {
    if (isDone) {
      return (
        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          COMPLETADO
        </span>
      );
    }
    switch (tier) {
      case 'REQUIRED':
        return (
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            PASO INICIAL
          </span>
        );
      case 'RECOMMENDED':
        return (
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            SIGUIENTE
          </span>
        );
      case 'OPTIONAL':
        return (
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/10">
            OPCIONAL
          </span>
        );
    }
  };

  // Determine grid columns dynamically based on number of active suites
  const gridColsClass = suites.length === 1 
    ? 'grid-cols-1' 
    : suites.length === 2 
    ? 'grid-cols-1 md:grid-cols-2' 
    : 'grid-cols-1 md:grid-cols-3';

  return (
    <div className="space-y-6">
      {/* 🚀 SETUP MISSIONS MATRIX & UNIFIED HEADER */}
      <div className="rounded-3xl bg-[#09090E] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/5 via-violet-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Unified Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/5 pb-6">
          <div className="flex items-start gap-4 z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Ecosystem Readiness & Setup Missions
                </span>
                <span className="text-zinc-500 text-xs">· Onboarding Asistido</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {experienceContext && experienceContext.experienceMode !== 'COMMERCIAL_FIRST'
                  ? experienceContext.heroTitle
                  : `Tu ecosistema ${organizationName} está listo. Ahora vamos a configurarlo juntos.`}
              </h3>
              <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed mt-1">
                {experienceContext && experienceContext.experienceMode !== 'COMMERCIAL_FIRST'
                  ? experienceContext.heroSubtitle
                  : (
                    <>
                      Completa los pasos sugeridos para comenzar a operar. Puedes avanzar a tu propio ritmo o dejar que Hermes te acompañe en cada paso.
                    </>
                  )}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 z-10 w-full lg:w-auto">
            <button
              onClick={() => setIsTourOpen(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold font-mono flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all hover:scale-[1.02]"
            >
              <Compass className="w-4 h-4 text-black" />
              <span>🧭 Iniciar Guía con Hermes</span>
            </button>
            <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 p-2.5 px-4 rounded-xl shrink-0">
              <div className="text-right">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">Readiness</div>
                <div className="text-xl font-black font-mono text-white">{totalPercentage}%</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 border border-indigo-500/30 flex items-center justify-center text-emerald-300">
                <Zap className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* ── CENTRAL HUB TRIAL ACTIVATION CONTROL PLANE ── */}
        {initialSummary?.isTrial && (
          <div className={`p-5 sm:p-6 rounded-2xl border transition-all ${
            initialSummary.trialStatus === 'ACTIVE'
              ? 'bg-gradient-to-r from-purple-950/30 via-slate-900/40 to-indigo-950/20 border-purple-500/30'
              : initialSummary.isReadyToActivate
              ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900/50 to-amber-950/30 border-emerald-500/40 shadow-xl shadow-emerald-500/5'
              : 'bg-white/[0.02] border-white/10'
          }`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    initialSummary.trialStatus === 'ACTIVE'
                      ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                      : initialSummary.isReadyToActivate
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                  }`}>
                    {initialSummary.trialStatus === 'ACTIVE'
                      ? '● Prueba de 3 Días Activa (72 Horas)'
                      : initialSummary.isReadyToActivate
                      ? '★ Lista para Activar (Sin Costo de Configuración)'
                      : '⏳ Inyección de Información en Curso'}
                  </span>
                  <span className="text-zinc-500 text-xs font-mono">· Sovereign Free Trial</span>
                </div>

                <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {initialSummary.trialStatus === 'ACTIVE'
                    ? 'Tu prueba gratuita de 3 días está corriendo'
                    : initialSummary.isReadyToActivate
                    ? '¡Tu organización cuenta con información suficiente para comenzar!'
                    : 'Configura tus herramientas y documentos a tu ritmo antes de iniciar'}
                </h4>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  {initialSummary.trialStatus === 'ACTIVE'
                    ? 'Tienes acceso activo a tus verticales provisionadas. El tiempo de 72 horas expira al concluir los 3 días.'
                    : (
                      <>
                        <strong className="text-zinc-200">El tiempo de los 3 días NO corre</strong> mientras inyectas documentos o configuras prospectos (sin costo ni consumo de recursos). Una vez que hagas clic en <span className="text-emerald-300 font-semibold">&quot;Activar Prueba Gratuita&quot;</span>, comenzará formalmente el contador de 72 horas.
                      </>
                    )}
                </p>
              </div>

              {/* Action Side: Activate Button OR Countdown */}
              <div className="shrink-0 flex items-center gap-3">
                {initialSummary.trialStatus === 'ACTIVE' ? (
                  <div className="px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400 animate-pulse" />
                    <span>Prueba en Curso (72h)</span>
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      if (!initialSummary.isReadyToActivate) {
                        alert('Para activar la prueba necesitas ingresar al menos 1 documento en Hermes o un prospecto en Growth OS.');
                        return;
                      }
                      try {
                        const res = await fetch(`/api/v1/projects/${organizationSlug}/trial/activate`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                        });
                        const data = (await res.json()) as { ok?: boolean; message?: string };
                        if (res.ok && data.ok) {
                          alert('¡Prueba gratuita de 3 días activada con éxito!');
                          window.location.reload();
                        } else {
                          alert(data.message ?? 'No fue posible activar la prueba.');
                        }
                      } catch (err: unknown) {
                        const errMsg = err instanceof Error ? err.message : 'Error al conectar con el servidor.';
                        alert(errMsg);
                      }
                    }}
                    disabled={!initialSummary.isReadyToActivate}
                    className={`px-5 py-3 rounded-xl text-xs font-bold font-mono flex items-center gap-2 transition-all ${
                      initialSummary.isReadyToActivate
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-xl shadow-emerald-500/20 hover:scale-[1.02] cursor-pointer'
                        : 'bg-white/5 border border-white/10 text-zinc-500 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {initialSummary.isReadyToActivate
                        ? 'Activar Prueba Gratuita (3 Días)'
                        : 'Completa Requisitos para Activar'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── QUICK RECOMMENDED ACTIONS (TENANT EXPERIENCE CONTEXT) ── */}
        {experienceContext && experienceContext.recommendedActions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold mr-1">
              Siguientes Pasos Sugeridos:
            </span>
            {experienceContext.recommendedActions
              .sort((a, _b) => (a.priority === 'HIGH' ? -1 : 1))
              .map((action) => (
                <Link
                  key={action.id}
                  href={action.actionUrl}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all hover:scale-[1.02] ${
                    action.priority === 'HIGH'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 shadow-lg shadow-amber-500/5'
                      : action.priority === 'MEDIUM'
                      ? 'bg-violet-500/10 border-violet-500/20 text-violet-300 hover:bg-violet-500/20'
                      : 'bg-white/[0.03] border-white/10 text-zinc-300 hover:bg-white/[0.06]'
                  }`}
                >
                  {action.badge && (
                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-white/10 font-sans font-medium text-zinc-300">
                      {action.badge}
                    </span>
                  )}
                  <span>{action.actionLabel}</span>
                  <ArrowUpRight className="w-3 h-3 opacity-70" />
                </Link>
              ))}
          </div>
        )}

        {/* Dynamic Grid of Setup Missions OR Welcome Activation State */}
        {suites.length === 0 ? (
          <div className="bg-black/30 border border-white/[0.06] rounded-2xl p-8 text-center space-y-6">
            <div className="max-w-md mx-auto space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
                <Compass className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white tracking-tight">
                Aún no tienes herramientas activadas
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Selecciona la primera capacidad con la que deseas comenzar para tu organización. Puedes activar tu motor comercial o tu cerrador de ventas asistido por IA.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-violet-500/20 space-y-3">
                <div className="flex items-center gap-2 text-violet-400 font-bold text-sm">
                  <Rocket className="w-4 h-4" />
                  <span>Growth OS (Motor Comercial)</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Gestión de pipeline, captación de prospectos y control de operaciones comerciales.
                </p>
                <Link
                  href={`/growth-os/organizations/${organizationSlug}`}
                  className="inline-flex items-center gap-2 text-xs font-mono font-bold text-violet-400 hover:text-violet-300"
                >
                  <span>Configurar Growth OS</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-emerald-500/20 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Bot className="w-4 h-4" />
                  <span>Hermes AI (Cerrador 24/7)</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Agente autónomo para atención, calificación y cierre en canales conversacionales.
                </p>
                <Link
                  href={`/portal/${organizationSlug}`}
                  className="inline-flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 hover:text-emerald-300"
                >
                  <span>Iniciar con Hermes</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className={`grid ${gridColsClass} gap-6`}>
            {suites.map((suite) => {
              const Icon = suite.icon;
              const isEmerald = suite.color === 'emerald';
              const isViolet = suite.color === 'violet';

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
                                {getTierBadge(step.tier, step.done)}
                              </div>
                            </div>
                          </div>
                          <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition-colors shrink-0 ml-1.5 mt-0.5" />
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
        )}
      </div>

      {/* ── RECOMMENDED EXPANSION (BACKSTAGE DISCOVERY) ── */}
      {experienceContext?.rwaStatus === 'BACKSTAGE' && experienceContext.recommendedExpansions.length > 0 && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/30 via-slate-900/30 to-purple-950/20 border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                Oportunidad de Expansión
              </span>
              <span className="text-xs text-zinc-400 font-medium">· Bóveda de Activos & RWA</span>
            </div>
            <h4 className="text-sm font-bold text-white">
              ¿Listo para tokenizar activos reales o levantar capital institucional?
            </h4>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Pandoras permite estructurar vehículos fiduciarios, smart contracts y emisión de certificados on-chain cuando tu empresa lo requiera.
            </p>
          </div>
          <Link
            href={`/ecosystem/${organizationSlug}/capital`}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold flex items-center gap-2 transition-all"
          >
            <span>Explorar RWA & Capital</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* ── HERMES FLOATING GUIDE FOR TENANT ── */}
      <HermesFloatingGuide
        customStations={tenantStations}
        titleOverride={`Setup · ${organizationSlug.toUpperCase()}`}
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        role={normalizedRole}
        operatorContext={{
          name: actorId?.startsWith('wallet_') ? `${actorId.slice(7, 13)}...` : (actorId ?? 'Operador'),
          email: '',
          role: normalizedRole,
        }}
        organizationSlug={organizationSlug}
      />
    </div>
  );
}

