import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { ProjectRepository } from "@/lib/domain/project-repository";
import { EventRepository } from "@/lib/domain/event-repository";
import { EventRegistrationRepository } from "@/lib/domain/event-registration-repository";

export default async function EventDashboardPage({ params }: { params: Promise<{ slug: string, eventId: string }> }) {
  const { slug, eventId } = await params;
  
  const project = await ProjectRepository.findBySlug(slug);
  if (!project) notFound();

  const eventAsset = await EventRepository.findByProjectIdAndId(project.id, parseInt(eventId));
  if (!eventAsset) notFound();

  const registrations = await EventRegistrationRepository.getRegistrationsByEventId(parseInt(eventId));

  const event = {
    ...eventAsset,
    registrations
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4 mb-4">
          <Link href={`/admin/projects/${slug}/events`} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
              <ArrowLeftIcon className="w-5 h-5 text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{event.title}</h1>
            <p className="text-zinc-400 text-sm font-mono">Event Dashboard</p>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-[#1a1a1a] border border-white/5 p-6 rounded-2xl">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Registrados</p>
              <p className="text-3xl font-bold text-white">{event.registrations?.length || 0}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/5 p-6 rounded-2xl">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Asistieron</p>
              <p className="text-3xl font-bold text-emerald-400">{event.registrations?.filter((r: any) => r.status === 'ATTENDED').length || 0}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/5 p-6 rounded-2xl">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Cancelados</p>
              <p className="text-3xl font-bold text-red-400">{event.registrations?.filter((r: any) => r.status === 'CANCELLED').length || 0}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/5 p-6 rounded-2xl">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Asistencia</p>
              <p className="text-3xl font-bold text-blue-400">
                  {event.registrations?.length ? Math.round((event.registrations.filter((r: any) => r.status === 'ATTENDED').length / event.registrations.length) * 100) : 0}%
              </p>
          </div>
      </div>

      <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/5">
              <h2 className="text-lg font-bold text-white">Asistentes</h2>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-400">
                  <thead className="text-xs uppercase bg-black/50 text-zinc-500">
                      <tr>
                          <th className="px-6 py-4">Nombre</th>
                          <th className="px-6 py-4">Email</th>
                          <th className="px-6 py-4">Teléfono</th>
                          <th className="px-6 py-4">Status</th>
                      </tr>
                  </thead>
                  <tbody>
                      {event.registrations?.map((reg: any) => (
                          <tr key={reg.id} className="border-b border-white/5 hover:bg-white/5">
                              <td className="px-6 py-4 text-white">{reg.nombre}</td>
                              <td className="px-6 py-4">{reg.email}</td>
                              <td className="px-6 py-4">{reg.telefono}</td>
                              <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${reg.status === 'CONFIRMED' ? 'bg-blue-500/20 text-blue-400' : reg.status === 'ATTENDED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                      {reg.status}
                                  </span>
                              </td>
                          </tr>
                      ))}
                      {(!event.registrations || event.registrations.length === 0) && (
                          <tr>
                              <td colSpan={4} className="px-6 py-8 text-center text-zinc-600">No hay registros para este evento</td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
}
