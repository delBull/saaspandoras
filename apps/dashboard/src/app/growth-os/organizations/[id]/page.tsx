import { CommandCenterTab } from '@/components/shared/command-center/CommandCenter';
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOrganizationOverview } from './actions';

export default async function OverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const orgId = `org_${resolvedParams.id}`;
  
  // Security Check: enforce that the user is authorized for this organization (founder or viewer)
  // This will throw AuthorizationError if not authorized
  const overview = await getOrganizationOverview(orgId);
  const project = await db.query.projects.findFirst({ where: eq(projects.slug, resolvedParams.id) });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{overview.name}</h1>
        <p className="text-slate-500">Workspace Overview</p>
      </div>
      <CommandCenterTab project={project} />
    </div>
  );
}
