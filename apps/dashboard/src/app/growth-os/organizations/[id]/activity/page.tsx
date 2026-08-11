import { EventsTab } from '@/components/shared/tabs/EventsTab';
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";

import { getOrganizationOverview } from '../actions';

export default async function ActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const orgId = `org_${resolvedParams.id}`;
  const overview = await getOrganizationOverview(orgId);
  const project = await db.query.projects.findFirst({ where: eq(projects.slug, resolvedParams.id) });


  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Activity & Audit</h1>
        <p className="text-slate-500 mt-2">Feed de actividad, registros y eventos del Workspace.</p>
      </div>
      {project ? (
         <EventsTab project={project} />
      ) : (
         <div className="text-slate-400">Workspace not found</div>
      )}
    </div>
  );
}
