import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { tryResolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { ContentDomainService } from '@/lib/academy/content.service';
import { GlassCard } from '@/components/ui/glass-card';
import { GraduationCap, PlayCircle, Clock, BookOpen, AlertCircle } from 'lucide-react';
import Image from 'next/image';

export default async function PortalContentPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params;
  
  // 1. Verify auth context
  const portalCtx = await tryResolvePortalContext(organizationSlug);
  if (!portalCtx) {
    notFound();
  }

  // 2. Capabilities check
  if (!portalCtx.tenant.permissions.includes('growth.content')) {
    redirect(`/portal/${organizationSlug}/overview?error=unauthorized`);
  }

  // 3. Fetch data via Domain Service
  const service = new ContentDomainService(portalCtx.tenant);
  const courses = await service.getCourses();

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-rose-400" /> Academy & Content
          </h1>
          <p className="text-sm text-zinc-400 mt-2 max-w-2xl leading-relaxed">
            Gestiona el contenido educativo, cursos de onboarding y la base de conocimiento para {portalCtx.organization.name}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {courses.length === 0 ? (
            <div className="col-span-full py-24 flex flex-col items-center justify-center text-center border border-white/5 bg-[#09090D]/80 backdrop-blur-xl rounded-3xl shadow-2xl relative overflow-hidden">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
               <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 relative z-10 shadow-lg">
                 <AlertCircle className="w-10 h-10 text-zinc-600" />
               </div>
               <h3 className="text-xl font-black text-white mb-3 tracking-tight relative z-10">Sin Cursos Disponibles</h3>
               <p className="text-sm text-zinc-400 max-w-md leading-relaxed relative z-10">
                  No has creado ningún curso todavía. El contenido de la Academia te ayuda a educar a tu audiencia y retener prospectos de alto valor.
               </p>
            </div>
         ) : (
            courses.map(course => (
               <div key={course.id} className="rounded-3xl border border-white/5 bg-[#09090D]/80 backdrop-blur-xl shadow-xl overflow-hidden flex flex-col group hover:border-rose-500/30 transition-all hover:shadow-[0_0_30px_rgba(244,63,114,0.15)] relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative w-full h-48 bg-zinc-900/50 border-b border-white/5">
                     {course.imageUrl ? (
                        <Image src={course.imageUrl} alt={course.title} fill className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                     ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-rose-500/10 to-[#09090D] group-hover:from-rose-500/20 transition-all duration-700">
                           <BookOpen className="w-14 h-14 text-rose-500/30" />
                        </div>
                     )}
                     <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold text-white shadow-lg">
                        <Clock size={14} className="text-rose-400" /> 
                        {course.duration || '45m'}
                     </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col relative z-10">
                     <h3 className="text-lg font-black text-white line-clamp-1 mb-2 tracking-tight">{course.title}</h3>
                     <p className="text-sm text-zinc-400 line-clamp-2 mb-6 flex-1 leading-relaxed">
                        {course.description || 'Sin descripción proporcionada.'}
                     </p>
                     
                     <div className="flex items-center justify-between mt-auto">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-lg shadow-sm ${
                           course.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                        }`}>
                           {course.isActive ? 'Publicado' : 'Borrador'}
                        </span>
                        
                        <button className="flex items-center gap-2 text-sm font-bold text-rose-400 hover:text-rose-300 transition-colors bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-xl border border-rose-500/20">
                           <PlayCircle size={16} /> Preview
                        </button>
                     </div>
                  </div>
               </div>
            ))
         )}
      </div>
    </div>
  );
}
