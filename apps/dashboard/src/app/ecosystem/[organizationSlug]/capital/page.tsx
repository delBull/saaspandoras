import { notFound } from "next/navigation";
import { ProjectRepository } from "@/lib/domain/project-repository";
import ProjectFounderDashboard from "@/app/()/profile/projects/[slug]/manage/dashboard-client";
import { DashApi } from "@/lib/dash-api";

export default async function EcosystemCapitalPage({ 
  params 
}: { 
  params: Promise<{ organizationSlug: string }> 
}) {
  const { organizationSlug } = await params;

  // Fetch Project by Slug
  const project = await ProjectRepository.findBySlug(organizationSlug);

  if (!project) {
    notFound();
  }

  let hasGrowthOs = false;
  try {
    const overview = await DashApi.controlPlane.getOverview(`org_${organizationSlug}`);
    hasGrowthOs = overview.hasHermes || true;
  } catch (error: any) {
    hasGrowthOs = false;
  }

  return (
    <div className="w-full text-white">
      <ProjectFounderDashboard project={project} hasGrowthOs={hasGrowthOs} />
    </div>
  );
}
