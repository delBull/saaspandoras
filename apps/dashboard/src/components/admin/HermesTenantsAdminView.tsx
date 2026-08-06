'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Cpu, Terminal, ExternalLink, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function HermesTenantsAdminView() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/projects');
      if (res.ok) {
        const data = await res.json();
        const hermesList = Array.isArray(data) 
          ? data.filter((p: any) => p.slug === 'snarai' || p.slug.includes('hermes') || (p.w2eConfig as any)?.isHermes)
          : [];
        setTenants(hermesList);
      }
    } catch (err) {
      console.error('Failed to fetch Hermes tenants', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="flex justify-between items-center bg-zinc-900/60 p-6 rounded-2xl border border-purple-500/20 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-purple-400">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">Hermes OS Tenants & Runtimes</h2>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 font-mono text-[10px]">
                Control Plane v1
              </Badge>
            </div>
            <p className="text-zinc-400 text-xs mt-1 font-mono">
              Gestión aislada de empresas y proyectos operando sobre el SO Cognitivo de Hermes.
            </p>
          </div>
        </div>

        <Button 
          onClick={fetchTenants} 
          variant="outline"
          className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white font-mono text-xs gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Sincronizar Runtimes
        </Button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-zinc-500 font-mono text-xs animate-pulse">
          Cargando topología de tenants en Control Plane...
        </div>
      ) : tenants.length === 0 ? (
        <div className="p-12 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-3xl text-center space-y-3">
          <Cpu className="w-10 h-10 text-purple-400/50 mx-auto animate-pulse" />
          <h4 className="text-white font-bold text-base">No hay tenants de Hermes registrados aún</h4>
          <p className="text-zinc-500 text-xs max-w-sm mx-auto">
            El proyecto S'Narai (ID 17) y los proyectos con indicador Hermes aparecerán aquí con su telemetría y consola aislada.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
          {tenants.map((t) => (
            <div 
              key={t.id}
              className="bg-zinc-900/60 border border-zinc-800/80 hover:border-purple-500/40 p-6 rounded-2xl space-y-4 transition-all duration-300 group shadow-lg"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                    <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                      {t.title || t.slug}
                    </h3>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono">Slug: {t.slug} • Tenant ID: #{t.id}</span>
                </div>

                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                  ONLINE
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-black/40 p-3 rounded-xl border border-white/5 text-[11px]">
                <div>
                  <span className="text-zinc-600 block uppercase text-[9px] font-bold">Kernel Version</span>
                  <span className="text-zinc-300 font-bold">v1.0-STABLE</span>
                </div>
                <div>
                  <span className="text-zinc-600 block uppercase text-[9px] font-bold">Proveedores Mesh</span>
                  <span className="text-zinc-300 font-bold">4 Activos</span>
                </div>
                <div>
                  <span className="text-zinc-600 block uppercase text-[9px] font-bold">Routing Profile</span>
                  <span className="text-purple-400 font-bold">Operator</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-[10px] text-zinc-500">
                  DB ID: #{t.id} • {t.applicantEmail || 'System Tenant'}
                </span>
                
                <a
                  href={`/growth-os/hermes/portal?slug=${t.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  Abrir Workbench
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
