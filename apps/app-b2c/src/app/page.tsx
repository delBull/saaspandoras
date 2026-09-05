import { apiClient } from "@/lib/api-client";
import { ArrowRight, Wallet, Activity, ShieldCheck } from "lucide-react";

import { ConnectButton } from "thirdweb/react";
import { client } from "@/lib/thirdweb-client";
import { siweConfig } from "@/components/AuthProvider";

export default async function Home() {
  // Using S'Narai as the default project for the retail landing
  const projectState = await apiClient.getProjectState("snarai").catch(() => null);

  if (!projectState) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        Error al cargar los datos del proyecto.
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center min-h-screen pt-24 pb-12 px-6">
      {/* Hero Section */}
      <section className="w-full max-w-5xl flex flex-col items-center text-center space-y-6 mt-12 mb-24">
        <div className="inline-flex items-center px-3 py-1 rounded-full glass-panel text-xs text-white/70 tracking-widest uppercase mb-4">
          <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
          Fase Activa: {projectState.metadata.phaseName}
        </div>
        
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-tight">
          {projectState.title}
        </h1>
        
        <p className="text-xl md:text-2xl text-white/60 max-w-3xl font-light">
          {projectState.tagline || "Explora oportunidades de capital fraccionado institucional."}
        </p>
        
        <div className="pt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <ConnectButton
            client={client}
            auth={siweConfig}
            connectButton={{
              label: "Conectar Billetera",
            }}
          />
          <button className="px-8 py-4 glass-panel text-white rounded-lg font-medium hover:bg-white/10 transition flex items-center justify-center gap-2">
            Ver Inteligencia de Proyecto
            {/* @ts-expect-error React 19 type mismatch */}
          <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Financial Metrics Cards */}
      <section className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
        <div className="financial-card p-6 flex flex-col gap-2">
          <span className="text-sm text-white/50 uppercase tracking-wider font-medium flex items-center gap-2">
            {/* @ts-expect-error React 19 type mismatch */}
            <Activity className="w-4 h-4 text-emerald-400" />
            Supply Disponible
          </span>
          <span className="text-3xl font-semibold">{projectState.metadata.availableUnits.toLocaleString()}</span>
          <span className="text-sm text-white/40">Unidades Fraccionadas</span>
        </div>

        <div className="financial-card p-6 flex flex-col gap-2">
          <span className="text-sm text-white/50 uppercase tracking-wider font-medium flex items-center gap-2">
            {/* @ts-expect-error React 19 type mismatch */}
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            Participantes
          </span>
          <span className="text-3xl font-semibold">{projectState.holdersCount.toLocaleString()}</span>
          <span className="text-sm text-white/40">Holders on-chain</span>
        </div>

        <div className="financial-card p-6 flex flex-col gap-2">
          <span className="text-sm text-white/50 uppercase tracking-wider font-medium">
            Valor de Unidad
          </span>
          <span className="text-3xl font-semibold">${projectState.metadata.tokenPriceUsd}</span>
          <span className="text-sm text-white/40">USD</span>
        </div>
      </section>

      {/* Data Room Preview */}
      <section className="w-full max-w-5xl glass-card p-10 flex flex-col gap-6">
        <h3 className="text-2xl font-semibold">Data Room Público</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projectState.documents.slice(0, 4).map((doc, i) => (
            <div key={i} className="flex flex-col p-4 border border-white/5 bg-black/20 rounded-lg hover:bg-white/5 transition cursor-pointer">
              <span className="text-xs text-white/40 mb-1">{doc.intent}</span>
              <span className="font-medium">{doc.title}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
