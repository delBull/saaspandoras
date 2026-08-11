import { HermesWorkbench } from '@pandoras/hermes-console';
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";

import { getOrganizationOverview } from '../actions';

export default async function HermesOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const orgId = `org_${resolvedParams.id}`;
  const overview = await getOrganizationOverview(orgId);
  const project = await db.query.projects.findFirst({ where: eq(projects.slug, resolvedParams.id) });


  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Hermes Overview</h1>
        <p className="text-slate-500 mt-2">Status del agente, conteo de conversaciones, leads, conversión.</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <HermesWorkbench tenantId={project?.id ? Number(project.id) : 0} />
      </div>
    </div>
  );
}
