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
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-emerald-400" /> Academy & Content
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage educational content and onboarding courses for {portalCtx.organization.name}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {courses.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border border-white/5 bg-white/[0.02] rounded-3xl">
               <AlertCircle className="w-12 h-12 text-zinc-600 mb-4" />
               <h3 className="text-lg font-medium text-white mb-2">No Courses Found</h3>
               <p className="text-sm text-zinc-400 max-w-sm">
                  You haven't created any courses yet. Academy content helps you onboard new users and educate your audience.
               </p>
            </div>
         ) : (
            courses.map(course => (
               <GlassCard key={course.id} className="overflow-hidden flex flex-col group">
                  <div className="relative w-full h-40 bg-zinc-900 border-b border-white/10">
                     {course.imageUrl ? (
                        <Image src={course.imageUrl} alt={course.title} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                     ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-teal-900/40">
                           <BookOpen className="w-12 h-12 text-emerald-500/50" />
                        </div>
                     )}
                     <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full flex items-center gap-1.5 text-xs font-medium text-white">
                        <Clock size={12} className="text-emerald-400" /> 
                        {course.duration || '45m'}
                     </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                     <h3 className="text-base font-semibold text-white line-clamp-1 mb-1">{course.title}</h3>
                     <p className="text-xs text-zinc-400 line-clamp-2 mb-4 flex-1">
                        {course.description || 'No description provided.'}
                     </p>
                     
                     <div className="flex items-center justify-between mt-auto">
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                           course.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                        }`}>
                           {course.isActive ? 'published' : 'draft'}
                        </span>
                        
                        <button className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                           <PlayCircle size={14} /> Preview
                        </button>
                     </div>
                  </div>
               </GlassCard>
            ))
         )}
      </div>
    </div>
  );
}
