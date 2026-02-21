'use client';

import { Suspense } from 'react';
import type { ProjectData } from '@/app/()/projects/types';
import ProjectNavigationHeader from '../ProjectNavigationHeader';
import ProjectSidebar from '../ProjectSidebar';
import MobileInvestmentCard from '../MobileInvestmentCard';
import RecommendedProjectsSection from '../RecommendedProjectsSection';

interface ProtocolPageShellProps {
    project: ProjectData;
    children: React.ReactNode;
    currentSlug: string;
}

export default function ProtocolPageShell({ project, children, currentSlug }: ProtocolPageShellProps) {
    const targetAmount = Number(project.target_amount ?? 1);
    return (
        <div className="min-h-screen pb-20 md:pb-6">
            <ProjectNavigationHeader />
            <div className="max-w-[95%] 2xl:max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
                <div className="relative">
                    <ProjectSidebar project={project} targetAmount={targetAmount} />
                    <div className="lg:mr-80 xl:mr-80 2xl:mr-80">
                        <Suspense fallback={<div className="h-96 animate-pulse bg-zinc-800/20 rounded-xl" />}>
                            {children}
                        </Suspense>
                    </div>
                    <MobileInvestmentCard project={project} targetAmount={targetAmount} />
                </div>
                <RecommendedProjectsSection currentProjectSlug={currentSlug} />
            </div>
        </div>
    );
}
