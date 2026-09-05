import React from "react";
import { resolvePortalContext } from "@/lib/portal/resolve-portal-context";
import { redirect } from "next/navigation";
import { TelegramBridgePanel } from "@/components/admin/TelegramBridgePanel";
import { DiscordManager } from "@/components/admin/DiscordManager";

interface ChannelsPageProps {
  params: Promise<{ organizationSlug: string }>;
}

export default async function TenantChannelsPage({ params }: ChannelsPageProps) {
  const { organizationSlug } = await params;

  // 1. Resolve Auth & Tenant Context (throws on failure)
  const context = await resolvePortalContext(organizationSlug);

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white">
          Social Channels & Bridges
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl">
          Configura y monitorea los puentes de integración con Telegram y Discord.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-blue-400">Telegram</span> Bridge
          </h2>
          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <TelegramBridgePanel />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-indigo-400">Discord</span> Manager
          </h2>
          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <DiscordManager />
          </div>
        </section>
      </div>
    </div>
  );
}
