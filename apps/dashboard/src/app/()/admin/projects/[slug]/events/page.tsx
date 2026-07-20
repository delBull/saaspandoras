import { notFound } from "next/navigation";
import Link from "next/link";
import { ProjectRepository } from "@/lib/domain/project-repository";
import { EventRepository } from "@/lib/domain/event-repository";

export default async function ProjectEventsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await ProjectRepository.findBySlug(slug);

  if (!project) notFound();

  const events = await EventRepository.getEventsByProject(project.id);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Event Dashboard</h1>
          <p className="text-zinc-400 text-sm">Operación y telemetría de los eventos del proyecto</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(event => (
          <Link href={`/admin/projects/${slug}/events/${event.id}`} key={event.id} className="bg-[#1a1a1a] border border-white/5 p-6 rounded-2xl hover:border-blue-500/50 transition-colors group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono text-zinc-500">{event.type}</span>
              <span className={`w-2 h-2 rounded-full ${event.isActive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{event.title}</h3>
            <p className="text-xs text-zinc-400 font-mono">
              {event.date ? new Date(event.date).toLocaleDateString() : 'Sin Fecha'}
            </p>
          </Link>
        ))}
        {events.length === 0 && (
          <div className="col-span-3 text-center py-12 text-zinc-500 border border-dashed border-white/10 rounded-2xl">
            No hay eventos creados. Usa el perfil de Creador para crearlos.
          </div>
        )}
      </div>
    </div>
  );
}
