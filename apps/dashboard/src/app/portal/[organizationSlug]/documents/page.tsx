import React from "react";
import { resolvePortalContext } from "@/lib/portal/resolve-portal-context";
import { redirect } from "next/navigation";
import DealRoomConsole from "@/app/nexus/rooms/DealRoomConsole";

interface DealRoomPageProps {
  params: Promise<{ organizationSlug: string }>;
}

export default async function TenantDealRoomPage({ params }: DealRoomPageProps) {
  const { organizationSlug } = await params;

  // 1. Resolve Auth & Tenant Context (throws on failure)
  const context = await resolvePortalContext(organizationSlug);

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white">
          Deal Room & Documents
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl">
          Gestiona contratos, NDAs y documentos legales del proyecto.
        </p>
      </div>

      <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
        <DealRoomConsole />
      </div>
    </div>
  );
}
