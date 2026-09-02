import { EventsTab } from '@/components/shared/tabs/EventsTab';
import { ProjectRepository } from "@/lib/domain/project-repository";
import { DashApi } from '@/lib/dash-api';
import { Activity } from 'lucide-react';

export default async function ActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const orgId = `org_${resolvedParams.id}`;

  try {
    await DashApi.controlPlane.getOverview(orgId);
  } catch (err) {
    console.warn(`[ActivityPage] Notice:`, err);
  }

  const project = await ProjectRepository.findBySlug(resolvedParams.id);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
          <Activity className="w-7 h-7 text-indigo-400" />
          Activity & Audit
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Feed inmutable de auditoría, firmas y registros de eventos para {resolvedParams.id.toUpperCase()}.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 shadow-2xl">
        {project ? (
          <EventsTab project={project} />
        ) : (
          <div className="text-zinc-500 font-mono text-center p-12">Workspace no encontrado</div>
        )}
      </div>
    </div>
  );
}
