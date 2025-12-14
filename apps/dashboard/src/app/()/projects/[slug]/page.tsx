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

export default function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlug, setCurrentSlug] = useState<string>('');
  const videoRef = useRef<ProjectVideoSectionRef>(null);

  // Función para mostrar el video
  const showVideoFromHeader = () => {
    if (videoRef.current) {
      videoRef.current.showVideo();
    }
  };

  // Exponer el ref del video para uso global
  useEffect(() => {
    if (videoRef.current) {
      (window as Window & { projectVideoRef?: ProjectVideoSectionRef }).projectVideoRef = videoRef.current;
    }
  }, []);

  // Load project data on mount
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
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!project) {
    notFound();
  }

  // --- Conversión de datos segura ---
  const targetAmount = Number(project.target_amount ?? 1);

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      {/* Navigation Header */}
      <ProjectNavigationHeader />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
        {/* Main Layout with Sidebar */}
        <div className="relative">
          {/* Sidebar (Right side) */}
          <ProjectSidebar project={project} targetAmount={targetAmount} />

          {/* Main Content Area (Left side) */}
          <div className="lg:mr-80 xl:mr-80 2xl:mr-80">
            {/* Project Header Component */}
            <ProjectHeader project={project} onVideoClick={showVideoFromHeader} />

            {/* Video Section */}
            <ProjectVideoSection ref={videoRef} project={project} />

            {/* New Utility-Focused Content Tabs */}
            <Suspense fallback={<div className="h-96 animate-pulse bg-zinc-800/20 rounded-xl" />}>
              <ProjectContentTabs project={project} />
            </Suspense>

            {/* Additional Dynamic Sections */}
            <ProjectDetails project={project} />
          </div>

          {/* Mobile Investment Card */}
          <MobileInvestmentCard project={project} targetAmount={targetAmount} />
        </div>

        {/* Recommended Projects Section */}
        <RecommendedProjectsSection currentProjectSlug={currentSlug} />
      </div>
    </div>
  );
}
