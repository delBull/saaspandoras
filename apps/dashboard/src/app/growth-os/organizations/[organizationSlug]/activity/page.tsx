import { EventsTab } from '@/components/shared/tabs/EventsTab';
import { ProjectRepository } from "@/lib/domain/project-repository";
import { DashApi } from '@/lib/dash-api';
import { Activity } from 'lucide-react';

export default async function ActivityPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const resolvedParams = await params;
  const orgId = `org_${resolvedParams.organizationSlug}`;

  try {
    await DashApi.controlPlane.getOverview(orgId);
  } catch (err) {
    console.warn(`[ActivityPage] Notice:`, err);
  }

  const project = await ProjectRepository.findBySlug(resolvedParams.organizationSlug);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 sm:p-6 md:p-8">
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
          <Activity className="w-8 h-8 text-indigo-400" />
          Activity & Audit
        </h1>
        <p className="text-zinc-400 text-sm mt-2 max-w-2xl leading-relaxed">
          Feed inmutable de auditoría, firmas criptográficas y registros de eventos verificables para {resolvedParams.organizationSlug.toUpperCase()}.
        </p>
      </div>

      <div className="relative rounded-3xl border border-white/5 bg-[#09090D]/80 backdrop-blur-xl shadow-2xl overflow-hidden p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          {project ? (
            <EventsTab project={project} />
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-lg">
                <Activity className="w-8 h-8 text-zinc-600" />
              </div>
              <p className="text-xl font-black text-white mb-2 tracking-tight">Workspace No Encontrado</p>
              <p className="text-sm text-zinc-500">El proyecto no pudo ser localizado en el sistema.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
