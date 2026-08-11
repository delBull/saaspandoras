import { getOrganizationOverview } from '../../actions';

export default async function HermesConversationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await getOrganizationOverview(`org_${id}`);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Conversations & Leads</h1>
        <p className="text-slate-500 mt-2">Explorador de chats y leads manejados por Hermes.</p>
      </div>
      <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
        Próximamente: Historial detallado de interacciones y pipeline de leads.
      </div>
    </div>
  );
}
