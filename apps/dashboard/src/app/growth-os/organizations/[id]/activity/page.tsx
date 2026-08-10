import { getMissionAuditTrail } from '../actions';

export default async function ActivityAuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: requestedOrganizationId } = await Promise.resolve(params);
  const audit = await getMissionAuditTrail(requestedOrganizationId);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'MISSION_EVENT': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'STRATEGY_DECISION': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'OPERATIONAL_INTENT': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'GOVERNANCE': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'EXECUTION': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto font-sans">
      <header className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900">Activity & Audit Trail</h1>
        <p className="text-gray-500">Immutable history of organizational actions</p>
      </header>

      <div className="relative border-l border-gray-200 ml-3">
        <div className="space-y-10">
          {audit.timeline.map((event, idx) => (
            <div key={event.id} className="relative pl-8">
              <span className={`absolute -left-3 top-1 flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-white bg-white`}>
                <div className={`h-2.5 w-2.5 rounded-full ${(getTypeColor(event.type).split(' ')[0] ?? '').replace('100', '500')}`} />
              </span>
              
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getTypeColor(event.type)}`}>
                  {event.type.replace('_', ' ')}
                </span>
                <time className="text-xs text-gray-400 font-mono">
                  {event.timestamp.toLocaleTimeString()}
                </time>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mt-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{event.title}</h3>
                <p className="text-gray-600 text-sm whitespace-pre-line">{event.description}</p>
                
                {event.actor && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-xs text-gray-500 font-mono">Actor: {event.actor}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
