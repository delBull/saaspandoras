import { ManageActivities } from '@/components/dao/ManageActivities';
import { ProjectRepository } from "@/lib/domain/project-repository";
import { DashApi } from '@/lib/dash-api';
import { Target } from 'lucide-react';

export default async function MissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const orgId = `org_${resolvedParams.id}`;
  
  try {
    await DashApi.controlPlane.getOverview(orgId);
  } catch (err) {
    console.warn(`[MissionsPage] Notice:`, err);
  }
  
  const project = await ProjectRepository.findBySlug(resolvedParams.id);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
            <Target className="w-7 h-7 text-violet-400" />
            Mission Control
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Administra campañas y misiones asignadas para la comunidad de {resolvedParams.id.toUpperCase()}.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 shadow-2xl">
        <ManageActivities projectId={project?.id ? Number(project.id) : 0} />
      </div>
    </div>
  );
}
