'use client';

import React, { useState } from 'react';
import { Code2, Terminal, Key, Copy, CheckCircle2 } from 'lucide-react';

interface DeveloperHubClientProps {
  organizationId: string;
  projectId: number;
  publicApiKey: string;
}

export function DeveloperHubClient({ organizationId, projectId, publicApiKey }: DeveloperHubClientProps) {
  const [copied, setCopied] = useState(false);

  const snippet = `<script>
  window.PandorasConfig = {
    projectId: '${projectId}',
    apiKey: '${publicApiKey}'
  };
</script>
<script src="https://dash.pandoras.finance/js/hermes-intake.js" async></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Developer Hub</h1>
          <p className="text-zinc-400 mt-1">
            Integra el cerebro de Hermes y las herramientas de Growth OS en cualquier aplicación externa.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Universal Intake Script */}
            <div className="bg-[#14141E] border border-white/[0.08] rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                    <Code2 className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Universal Lead Intake</h3>
                    <p className="text-sm text-zinc-400">Inserta este script en tu WordPress, Webflow o landing page.</p>
                  </div>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg text-sm font-medium text-white transition-all"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                  {copied ? 'Copiado' : 'Copiar Snippet'}
                </button>
              </div>
              <div className="p-5 bg-black/40">
                <pre className="text-sm font-mono text-emerald-400 overflow-x-auto">
                  <code>{snippet}</code>
                </pre>
              </div>
            </div>

            {/* Endpoints Info */}
            <div className="bg-[#14141E] border border-white/[0.08] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Endpoints Disponibles</h3>
                  <p className="text-sm text-zinc-400">API REST para integración directa</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.04] rounded-lg">
                  <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded">POST</span>
                  <code className="text-sm text-zinc-300">/api/v1/hermes/intake/webhook</code>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.04] rounded-lg">
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded">GET</span>
                  <code className="text-sm text-zinc-300">/api/v1/projects/{organizationId}/analytics</code>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* API Keys Panel */}
            <div className="bg-[#14141E] border border-white/[0.08] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <Key className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">API Keys</h3>
                  <p className="text-sm text-zinc-400">Credenciales de acceso</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 block">Public Key (Client-side)</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      readOnly 
                      value={publicApiKey}
                      className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-zinc-300 font-mono focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">Segura para incluir en tu frontend o landing page.</p>
                </div>

                <div className="pt-4 border-t border-white/[0.08]">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 block">Secret Key (Server-side)</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      readOnly 
                      value="sk_live_************************"
                      className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-zinc-300 font-mono focus:outline-none"
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">Nunca expongas esta llave en código cliente.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
