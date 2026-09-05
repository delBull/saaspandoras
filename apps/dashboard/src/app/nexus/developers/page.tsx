import React from "react";
import { redirect } from "next/navigation";
import { getNexusAuthContext, checkNexusPermission } from "@/lib/nexus/nexus-rbac";
import { NexusAccessGate } from "../../../components/nexus/NexusAccessGate";
import { Terminal, Code, BookOpen, Key } from "lucide-react";

export default async function NexusDevelopersPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedSearchParams = await searchParams;
  const token = typeof resolvedSearchParams.token === 'string' ? resolvedSearchParams.token : undefined;
  
  // 1. Authenticate with Nexus Engine
  const auth = await getNexusAuthContext(null, token);

  if (!auth.isAuthenticated) {
    redirect("/portal/login?return=/nexus/developers");
  }

  // 2. Authorize capability (ecosystem access is enough for this)
  if (!checkNexusPermission(auth, 'ecosystem')) {
    return <NexusAccessGate reason="Se requiere capacidad 'ecosystem' para acceder al Developer Hub." />;
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white">
          Developer Hub
        </h1>
        <p className="text-zinc-400 text-lg">
          Recursos para desarrolladores, documentación de APIs y SDKs del ecosistema Pandoras.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {[
          {
            title: "Hermes API",
            desc: "Documentación para integrar el AI Engine y el Knowledge Vault.",
            icon: Terminal,
            link: "#"
          },
          {
            title: "Growth OS SDK",
            desc: "Librerías para conectar frontends Web3 y gestionar claims.",
            icon: Code,
            link: "#"
          },
          {
            title: "Architecture & Specs",
            desc: "Protocolos, Smart Contracts y arquitectura de la plataforma.",
            icon: BookOpen,
            link: "#"
          }
        ].map((item, i) => (
          <a
            key={i}
            href={item.link}
            className="group relative bg-zinc-900/50 border border-white/5 rounded-2xl p-6 overflow-hidden hover:border-pandoras-500/50 transition-colors"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-pandoras-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-zinc-800/50 border border-white/5 flex items-center justify-center mb-4 text-zinc-400 group-hover:text-pandoras-400 transition-colors">
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-zinc-400 leading-relaxed">{item.desc}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
