import { getActiveMissions } from '../actions';

export default async function MissionControlPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: requestedOrganizationId } = await Promise.resolve(params);
  const missions = await getActiveMissions(requestedOrganizationId);

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mission Control</h1>
        <p className="text-gray-500">Observing active operations for Organization {requestedOrganizationId}</p>
      </header>

      <div className="space-y-12">
        {missions.map(mission => (
          <article key={mission.missionId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold tracking-wider text-gray-500 uppercase mb-1">Goal</p>
                  <h2 className="text-2xl font-semibold text-gray-900">{mission.goalName}</h2>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold tracking-wider text-gray-500 uppercase mb-1">Mission ID</p>
                  <p className="font-mono text-sm text-gray-600">{mission.missionId}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Phase: {mission.phase}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Pack: {mission.pack}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
              {/* Milestones Panel */}
              <div className="p-6">
                <h3 className="text-sm font-bold tracking-wider text-gray-500 uppercase mb-4">Milestones</h3>
                <ul className="space-y-3">
                  {mission.milestones.map((milestone, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                        milestone.completed 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-gray-300 bg-transparent text-transparent'
                      }`}>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className={`font-mono text-sm ${milestone.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                        {milestone.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Next Strategic Decision Panel */}
              <div className="p-6 bg-slate-50">
                <h3 className="text-sm font-bold tracking-wider text-gray-500 uppercase mb-4">Next Strategic Decision</h3>
                
                {mission.nextStrategicDecision ? (
                  <div className="space-y-6">
                    <div>
                      <p className="text-xl font-medium text-gray-900 mb-2">
                        "{mission.nextStrategicDecision.decision}"
                      </p>
                      <p className="text-sm text-gray-600">
                        {mission.nextStrategicDecision.reasonSummary}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold tracking-wider text-gray-500 uppercase mb-3">Decision Factors (Why)</p>
                      <div className="space-y-2">
                        {mission.nextStrategicDecision.factors.map((factor, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-center">
                            <div>
                              <span className="text-xs font-medium text-gray-400 uppercase mr-2">{factor.type}</span>
                              <span className="font-mono text-sm text-gray-800">{factor.source}</span>
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${
                              factor.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              factor.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' :
                              factor.status === 'AVAILABLE' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {factor.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No pending strategic decisions.</p>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
