'use client';

import { Suspense } from 'react';
import type { ProjectData } from '@/app/()/projects/types';
import ProjectSidebar from '../ProjectSidebar';
import MobileInvestmentCard from '../MobileInvestmentCard';
import RecommendedProjectsSection from '../RecommendedProjectsSection';
import { StatusAlert } from '../ProjectStatusIndicators';
import { getTargetAmount } from '@/lib/project-utils';

interface ProtocolPageShellProps {
    project: ProjectData;
    children: React.ReactNode;
    currentSlug: string;
}

export default function ProtocolPageShell({ project, children, currentSlug }: ProtocolPageShellProps) {
    const targetAmount = getTargetAmount(project);
    return (
        <div className="min-h-screen pb-20 md:pb-6 bg-black">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row-reverse gap-8 xl:gap-12 items-start relative">
                    <ProjectSidebar project={project} targetAmount={targetAmount} />
                    <div className="flex-1 min-w-0 p-6 lg:p-10 bg-zinc-950/50 rounded-3xl min-h-[80vh] border border-zinc-800/10 w-full">
                        <StatusAlert status={project.status} />
                        <Suspense fallback={<div className="h-96 animate-pulse bg-zinc-800/20 rounded-xl" />}>
                            {children}
                        </Suspense>
                    </div>
                </div>
                <div className="mt-8 px-4">
                    <RecommendedProjectsSection currentProjectSlug={currentSlug} />
                </div>
            </div>
        </div>
    );
}
