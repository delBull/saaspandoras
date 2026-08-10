import { getOrganizationOverview } from './actions';

export default async function OrganizationOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: requestedOrganizationId } = await Promise.resolve(params);
  const overview = await getOrganizationOverview(requestedOrganizationId);

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{overview.name}</h1>
        <p className="text-gray-500">Organization Control Plane</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <MetricCard title="Active Goals" value={overview.metrics.activeGoals} />
        <MetricCard title="Active Missions" value={overview.metrics.activeMissions} />
        <MetricCard title="Pending Decisions" value={overview.metrics.pendingDecisions} highlight={overview.metrics.pendingDecisions > 0} />
        <MetricCard title="Installed Packs" value={overview.metrics.installedPacks} />
      </div>

      {overview.currentStrategicActivity && (
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Current Strategic Activity</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase">Mission</p>
              <p className="text-lg text-gray-900">{overview.currentStrategicActivity.missionName}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase">Phase</p>
                <p className="text-gray-900">{overview.currentStrategicActivity.phase}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase">Status</p>
                <p className="text-amber-600 font-medium">{overview.currentStrategicActivity.status}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500 uppercase mb-1">Progress</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-black h-2.5 rounded-full" 
                  style={{ width: `${overview.currentStrategicActivity.progressPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-500 uppercase">Next Action Proposed by Hermes</p>
              <p className="text-gray-900 font-medium">{overview.currentStrategicActivity.nextAction}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function MetricCard({ title, value, highlight = false }: { title: string, value: number, highlight?: boolean }) {
  return (
    <div className={`p-6 rounded-xl border ${highlight ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-white'}`}>
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <p className={`text-4xl font-light ${highlight ? 'text-amber-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}
