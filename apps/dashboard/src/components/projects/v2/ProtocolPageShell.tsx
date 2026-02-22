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
        <div className="min-h-screen pb-20 md:pb-6 bg-black">
            <ProjectNavigationHeader />
            <div className="w-full">
                <div className="relative">
                    <ProjectSidebar project={project} targetAmount={targetAmount} />
                    <div className="lg:mr-80 xl:mr-80 2xl:mr-80 bg-zinc-950/50 rounded-3xl min-h-[80vh] border border-zinc-800/10">
                        <Suspense fallback={<div className="h-96 animate-pulse bg-zinc-800/20 rounded-xl" />}>
                            {children}
                        </Suspense>
                    </div>
                    <MobileInvestmentCard project={project} targetAmount={targetAmount} />
                </div>
                <div className="mt-8 px-4">
                    <RecommendedProjectsSection currentProjectSlug={currentSlug} />
                </div>
            </div>
        </div>
    );
}
