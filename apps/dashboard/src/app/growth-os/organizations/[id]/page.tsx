import { CommandCenterTab } from '@/components/shared/command-center/CommandCenter';
import { DashApi } from '@/lib/dash-api';

export default async function OverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const orgId = `org_${resolvedParams.id}`;

  const overview = await DashApi.controlPlane.getOverview(orgId);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{overview.name}</h1>
        <p className="text-slate-500">Workspace Overview</p>
      </div>
      <CommandCenterTab project={{ slug: overview.slug, title: overview.name } as any} />
    </div>
  );
}
