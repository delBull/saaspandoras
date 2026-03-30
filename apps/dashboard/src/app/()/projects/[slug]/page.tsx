'use client';

import { notFound } from "next/navigation";
import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import type { ProjectData } from "../types";
import ProjectVideoSection, { type ProjectVideoSectionRef } from "../../../../components/projects/ProjectVideoSection";
import ProjectNavigationHeader from "../../../../components/projects/ProjectNavigationHeader";
import ProjectSidebar from "../../../../components/projects/ProjectSidebar";
import ProjectHeader from "../../../../components/projects/ProjectHeader";
import ProjectContentTabs from "../../../../components/projects/ProjectContentTabs";
import ProjectDetails from "../../../../components/projects/ProjectDetails";
import MobileInvestmentCard from "../../../../components/projects/MobileInvestmentCard";
import RecommendedProjectsSection from "../../../../components/projects/RecommendedProjectsSection";
import ProtocolPageDispatcher from "../../../../components/projects/v2/ProtocolPageDispatcher";
import { StatusAlert } from "../../../../components/projects/ProjectStatusIndicators";
import { getTargetAmount } from "../../../../lib/project-utils";

/**
 * Normalize legacy V1 project fields into the canonical ProjectData shape.
 * This lets tabs, sidebar, and details components work off a single consistent object.
 */
function normalizeV1Project(p: ProjectData): ProjectData {
  return {
    ...p,
    // ── Content tab fields (Campaña / Mecánica / Estrategia / etc.) ──
    // Prefer the new optimized field; fall back on legacy snake_case / camelCase variants.
    fund_usage:
      p.fund_usage
      || (p as any).fundUsage
      || (p as any).how_it_works
      || (p as any).details
      || null,

    lockup_period:
      p.lockup_period
      || (p as any).lockupPeriod
      || (p as any).utility_period
      || null,

    protoclMecanism:
      p.protoclMecanism
      || (p as any).protocolMechanism
      || (p as any).mechanism
      || (p as any).protocol_mecanism
      || null,

    artefactUtility:
      p.artefactUtility
      || (p as any).artefact_utility
      || (p as any).artifact_utility
      || null,

    worktoearnMecanism:
      p.worktoearnMecanism
      || (p as any).worktoearn_mecanism
      || (p as any).work_to_earn
      || null,

    monetizationModel:
      p.monetizationModel
      || (p as any).monetization_model
      || (p as any).business_model
      || null,

    adquireStrategy:
      p.adquireStrategy
      || (p as any).adquire_strategy
      || (p as any).go_to_market
      || null,

    mitigationPlan:
      p.mitigationPlan
      || (p as any).mitigation_plan
      || (p as any).risk_mitigation
      || null,

    // ── Video pitch ──
    video_pitch:
      p.video_pitch
      || (p as any).videoPitch
      || (p as any).video_url
      || null,

    // ── Creator fields ──
    applicant_name:
      p.applicant_name
      || (p as any).applicantName
      || (p as any).creator_name
      || null,

    applicant_wallet_address:
      p.applicant_wallet_address
      || (p as any).applicantWalletAddress
      || (p as any).creator_wallet
      || null,

    integrationPlan:
      p.integrationPlan
      || (p as any).integration_plan
      || false,

    // ── Contract addresses: pre-resolve so sidebar can use a single field ──
    licenseContractAddress:
      p.licenseContractAddress
      || p.w2eConfig?.licenseToken?.address
      || (p as any).contractAddress
      || (p as any).contract_address
      || null,
  };
}

export default function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>('');
  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const videoRef = useRef<ProjectVideoSectionRef>(null);

  const showVideoFromHeader = () => {
    if (videoRef.current) videoRef.current.showVideo();
  };

  useEffect(() => {
    if (videoRef.current) {
      (window as Window & { projectVideoRef?: ProjectVideoSectionRef }).projectVideoRef = videoRef.current;
    }
  }, []);

  useEffect(() => {
    let active = true;
    const loadProject = async () => {
      try {
        const resolvedParams = await params;
        if (!active) return;
        setSlug(resolvedParams.slug);

        const response = await fetch(`/api/projects/${resolvedParams.slug}`);
        if (response.ok) {
          const projectData = await response.json() as ProjectData;
          if (active) setProject(projectData);
        } else {
          if (active) setIsError(true);
        }
      } catch (error) {
        console.error('Error loading project:', error);
        if (active) setIsError(true);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void loadProject();
    return () => { active = false; };
  }, [params]);

  // ── Normalizer — must be above early returns (rules-of-hooks) ───────────
  // useMemo runs unconditionally; null-safe because project may not be loaded yet.
  const normalizedProject = useMemo(
    () => (project ? normalizeV1Project(project) : project),
    [project]
  );

  // ── targetAmount — MUST also be above all early returns (rules-of-hooks) ──
  const targetAmount = useMemo(() => getTargetAmount(normalizedProject!), [normalizedProject]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-lime-500 border-t-transparent animate-spin" />
          <p className="text-zinc-400 text-sm">Cargando protocolo…</p>
        </div>
      </div>
    );
  }

  if (isError || !project) { notFound(); }

  // ── V2 Detection — explicit semantic signals ONLY ─────────────────────────
  // ❌ Do NOT check artifacts.length — V1 protocols can have partial w2eConfig
  // ✅ Only trust an explicit version/schema marker written at V2 deploy time
  const isV2 =
    project.protocol_version === 2
    || (project.w2eConfig as any)?.version === '2'
    || (project.w2eConfig as any)?.schema === 'v2';

  // ── V2 Route ──────────────────────────────────────────────────────────────
  if (isV2) {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      }>
        <ProtocolPageDispatcher project={project} currentSlug={slug} />
      </Suspense>
    );
  }

  // ── V1 Legacy Layout ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pb-20 md:pb-6 bg-black">
      <ProjectNavigationHeader />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative">
          <ProjectSidebar project={normalizedProject!} targetAmount={targetAmount} />
          <div className="lg:mr-80 xl:mr-80 2xl:mr-80">
            <StatusAlert status={project.status} />
            <ProjectHeader project={normalizedProject!} onVideoClick={showVideoFromHeader} />
            <ProjectVideoSection ref={videoRef} project={normalizedProject!} />
            <Suspense fallback={<div className="h-96 animate-pulse bg-zinc-800/20 rounded-xl" />}>
              <ProjectContentTabs project={normalizedProject!} />
            </Suspense>
            <ProjectDetails project={normalizedProject!} />
          </div>
          <MobileInvestmentCard project={normalizedProject!} targetAmount={targetAmount} />
        </div>
        <RecommendedProjectsSection currentProjectSlug={slug} />
      </div>
    </div>
  );
}
