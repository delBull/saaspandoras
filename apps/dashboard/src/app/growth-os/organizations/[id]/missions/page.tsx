import { ManageActivities } from '@/components/dao/ManageActivities';
import { ProjectRepository } from "@/lib/domain/project-repository";
import { DashApi } from '@/lib/dash-api';

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
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Mission Control</h1>
        <p className="text-slate-500 mt-2">Administra campañas y misiones asignadas.</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <ManageActivities projectId={project?.id ? Number(project.id) : 0} />
      </div>
    </div>
  );
}
