import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { projects, projectBriefings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export default async function AccessHubPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;

  // 1. Validate project
  const project = await db.query.projects.findFirst({
    where: eq(projects.slug, slug),
  });

  if (!project) {
    notFound();
  }

  // 2. Fetch active briefings for this project
  const briefings = await db.query.projectBriefings.findMany({
    where: and(
      eq(projectBriefings.projectId, project.id),
      eq(projectBriefings.status, 'published')
    ),
  });

  if (!briefings.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <h1 className="text-2xl font-bold mb-4 text-black">Próximamente</h1>
        <p className="text-black/60">El centro de conocimiento para {project.title} aún no está disponible.</p>
      </div>
    );
  }

  // Organize by slug to enforce ordering if they exist, else just list them
  const orderMap: Record<string, number> = {
    'participate': 1,
    'realtors': 2,
    'developers': 3,
    'thesis': 4,
  };
  
  briefings.sort((a, b) => (orderMap[a.slug] || 99) - (orderMap[b.slug] || 99));

  return (
    <div className="flex flex-col justify-center min-h-[75vh] px-6 md:px-12 lg:px-24">
      <div className="max-w-2xl">
        <span className="inline-block text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-black/50 mb-12 border border-black/10 px-3 py-1">
          {project.title} Knowledge Center
        </span>

        <h1 className="text-3xl md:text-5xl lg:text-7xl font-medium tracking-tighter text-black mb-8 leading-[0.9]">
          Acceso
        </h1>
        <p className="text-lg text-black/50 font-light mb-16">
          Selecciona el briefing más relevante para ti.
        </p>

        <div className="flex flex-col space-y-6">
          {briefings.map((briefing, index) => (
            <React.Fragment key={briefing.slug}>
              <Link
                href={`/p/${slug}/access/${briefing.slug}`}
                className="group flex items-center justify-between text-2xl md:text-4xl font-light text-black hover:italic transition-all duration-300"
              >
                <span>
                  {briefing.slug === 'participate' ? 'Quiero participar' :
                   briefing.slug === 'realtors' ? 'Comercializo desarrollos' :
                   briefing.slug === 'developers' ? 'Desarrollo proyectos' :
                   briefing.slug === 'thesis' ? 'Nuestra tesis' :
                   briefing.title}
                </span>
                <span className="opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                  →
                </span>
              </Link>
              {index < briefings.length - 1 && (
                <div className="h-[1px] w-full bg-black/10" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
