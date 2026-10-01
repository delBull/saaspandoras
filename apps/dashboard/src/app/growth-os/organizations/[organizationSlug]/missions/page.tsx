import { ManageActivities } from '@/components/dao/ManageActivities';
import { ProjectRepository } from "@/lib/domain/project-repository";
import { DashApi } from '@/lib/dash-api';
import { Target } from 'lucide-react';

export default async function MissionsPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const resolvedParams = await params;
  const orgId = `org_${resolvedParams.organizationSlug}`;
  
  try {
    await DashApi.controlPlane.getOverview(orgId);
  } catch (err) {
    console.warn(`[MissionsPage] Notice:`, err);
  }
  
  const project = await ProjectRepository.findBySlug(resolvedParams.organizationSlug);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <Target className="w-8 h-8 text-violet-400" />
            Mission Control
          </h1>
          <p className="text-zinc-400 text-sm mt-2 max-w-2xl leading-relaxed">
            Administra campañas gamificadas, misiones asignadas y recompensas para la comunidad de {resolvedParams.organizationSlug.toUpperCase()}.
          </p>
        </div>
      </div>

      <div className="relative rounded-3xl border border-white/5 bg-[#09090D]/80 backdrop-blur-xl shadow-2xl overflow-hidden p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <ManageActivities projectId={project?.id ? Number(project.id) : 0} />
        </div>
      </div>
    </div>
  );
}
