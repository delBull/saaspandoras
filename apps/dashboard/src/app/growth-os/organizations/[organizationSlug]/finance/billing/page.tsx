import { redirect } from "next/navigation";
import { HermesUnifiedCheckout } from "@/components/payments/HermesUnifiedCheckout";
import { Zap, Landmark } from "lucide-react";
import { GenerateBillingIntentButton } from "./GenerateBillingIntentButton";

export default async function TenantBillingPage({
  params,
  searchParams
}: {
  params: Promise<{ organizationSlug: string }>;
  searchParams: Promise<{ intentId?: string }>;
}) {
  const { organizationSlug } = await params;
  const { intentId } = await searchParams;

  if (!intentId) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
              <Landmark className="w-8 h-8 text-lime-400" />
              Central Billing Hub
            </h1>
            <p className="text-sm text-zinc-400 mt-2 max-w-2xl leading-relaxed">Gestiona tu subscripción y pagos de Growth OS & Hermes OS para {organizationSlug.toUpperCase()}.</p>
          </div>
        </div>

        <div className="relative rounded-3xl border border-white/5 bg-[#09090D]/80 backdrop-blur-xl p-8 shadow-2xl overflow-hidden group hover:border-lime-500/30 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/10 rounded-full blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <h2 className="text-xl font-black text-white tracking-tight">Renovación de Subscripción</h2>
            <p className="text-sm text-zinc-400 mt-1 leading-relaxed">Selecciona tu plan para continuar con el pago soberano.</p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-lime-500/10 text-lime-400 border border-lime-500/20 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono">
              <Zap className="w-3 h-3" /> Growth Starter ($499/mo)
            </div>
          </div>
          <div className="relative z-10 w-full md:w-auto">
            <GenerateBillingIntentButton organizationSlug={organizationSlug} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] w-full flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-8 text-center relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-6 shadow-lg">
          <Landmark className="w-8 h-8 text-lime-400" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Portal de Pagos Soberano</h1>
        <p className="text-zinc-400 text-sm mt-2 font-mono">Organización: <span className="text-white font-bold">{organizationSlug.toUpperCase()}</span></p>
      </div>
      
      <div className="w-full max-w-md relative z-10 shadow-2xl">
        <div className="absolute inset-0 bg-lime-500/5 blur-2xl rounded-3xl" />
        <HermesUnifiedCheckout intentId={intentId} />
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-[11px] text-zinc-500 font-mono font-bold tracking-wider uppercase relative z-10">
        <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10 shadow-sm"><Zap className="w-4 h-4 text-lime-400" /> Liquidación Web3 Inmediata</span>
        <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10 shadow-sm"><Landmark className="w-4 h-4 text-blue-400" /> Wire SPEI Banregio Integrado</span>
      </div>
    </div>
  );
}
