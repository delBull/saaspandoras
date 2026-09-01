import { getPendingIntents } from '../actions';
import GovernanceButtons from './components/GovernanceButtons';

export default async function GovernanceCenterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await Promise.resolve(params);
  const requestedOrganizationId = `org_${id}`;
  
  let data = { pendingIntents: [] as any[] };
  let errorMsg: string | null = null;

  try {
    data = await getPendingIntents(requestedOrganizationId);
  } catch (err: any) {
    console.warn(`[GovernanceCenterPage] Notice:`, err.message);
    errorMsg = err.message;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto font-sans">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Governance Center</h1>
        <p className="text-gray-500">Authority surface for Organization {requestedOrganizationId}</p>
      </header>

      {errorMsg && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-center justify-between">
          <span>{errorMsg.includes('UNAUTHENTICATED') ? 'Sesión no verificada. Inicia sesión en el portal o conecta tu wallet de fundador.' : errorMsg}</span>
        </div>
      )}

      {data.pendingIntents.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center border border-gray-200">
          <p className="text-gray-500">No operational intents require governance approval at this time.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {data.pendingIntents.map(intent => (
            <div key={intent.intentId} className="bg-white rounded-xl shadow-lg shadow-gray-200/50 border border-gray-200 overflow-hidden">
              <div className="p-4 bg-amber-50 border-b border-amber-100 flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <span className="text-sm font-bold tracking-wider text-amber-800 uppercase">
                  Pending Approval
                </span>
              </div>
              
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{intent.missionName}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-1">Strategy Decision (Why)</p>
                      <p className="text-lg font-medium text-gray-900 mb-1">"{intent.strategyDecision}"</p>
                      <p className="text-sm text-gray-600">{intent.reasonSummary}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-1">Pack</p>
                      <p className="text-sm text-gray-800">{intent.pack}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 space-y-4">
                    <div>
                      <p className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-1">Operational Intent (What)</p>
                      <p className="font-mono text-sm text-indigo-700 font-medium">{intent.intentType}</p>
                    </div>
                    
                    {intent.budget && (
                      <div>
                        <p className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-1">Budget Constraint</p>
                        <p className="text-lg font-medium text-gray-900">{intent.budget}</p>
                      </div>
                    )}

                    {intent.authorityRequired && (
                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-xs font-bold tracking-wider text-amber-600 uppercase mb-1">Authority Required</p>
                        <p className="text-sm font-medium text-gray-900">{intent.authorityRequired}</p>
                      </div>
                    )}

                    {intent.consequence && (
                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-xs font-bold tracking-wider text-red-600 uppercase mb-1">Consequence (If Approved)</p>
                        <p className="text-sm font-medium text-gray-900">{intent.consequence}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end">
                  <GovernanceButtons intentId={intent.intentId} requestedOrganizationId={requestedOrganizationId} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
