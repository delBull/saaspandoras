'use client';

import { notFound } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
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

export default function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlug, setCurrentSlug] = useState<string>('');
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
    const loadProject = async () => {
      try {
        const resolvedParams = await params;
        const slug = resolvedParams.slug;
        setCurrentSlug(slug);
        const response = await fetch(`/api/projects/${slug}`);
        if (response.ok) {
          const projectData = await response.json() as ProjectData;
          setProject(projectData);
        } else {
          notFound();
        }
      } catch (error) {
        console.error('Error loading project:', error);
        notFound();
      } finally {
        setIsLoading(false);
      }
    };
    void loadProject();
  }, [params]);

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

  if (!project) { notFound(); }

  // ── V2 Detection ──────────────────────────────────────────────────────────
  // V2 if it has artifacts[] in w2eConfig, explicit protocol_version=2, or pageLayoutType
  const isV2 = project.protocol_version === 2
    || !!(project.w2eConfig?.artifacts && project.w2eConfig.artifacts.length > 0)
    || !!(project.artifacts && project.artifacts.length > 0)
    || !!(project.pageLayoutType);

  // ── V2 Route ──────────────────────────────────────────────────────────────
  if (isV2) {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      }>
        <ProtocolPageDispatcher project={project} currentSlug={currentSlug} />
      </Suspense>
    );
  }

  // ── V1 Legacy Layout (unchanged, backwards-compatible) ───────────────────
  const targetAmount = Number(project.target_amount ?? 1);

  return (
    <div className="min-h-screen pb-20 md:pb-6 bg-black">
      <ProjectNavigationHeader />
      <div className="w-full">
        <div className="relative">
          <ProjectSidebar project={project} targetAmount={targetAmount} />
          <div className="lg:mr-80 xl:mr-80 2xl:mr-80">
            <ProjectHeader project={project} onVideoClick={showVideoFromHeader} />
            <ProjectVideoSection ref={videoRef} project={project} />
            <Suspense fallback={<div className="h-96 animate-pulse bg-zinc-800/20 rounded-xl" />}>
              <ProjectContentTabs project={project} />
            </Suspense>
            <ProjectDetails project={project} />
          </div>
          <MobileInvestmentCard project={project} targetAmount={targetAmount} />
        </div>
        <RecommendedProjectsSection currentProjectSlug={currentSlug} />
      </div>
    </div>
  );
}
