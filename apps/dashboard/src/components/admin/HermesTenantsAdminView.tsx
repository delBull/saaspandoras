import 'react';
import React, { useState, useEffect } from 'react';
import { Sparkles, Cpu, RefreshCw, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
          ? data // Show all projects to allow provisioning
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

  const handleProvision = async (tenant: any) => {
    try {
      toast.loading(`Aprovisionando Hermes OS para tenant #${tenant.id}...`);
      const leadIdToUse = tenant.applicantEmail || `${tenant.slug}@pandoras.finance`; // Fallback email to trigger auto-creation
      const res = await fetch('/api/v1/admin/provision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            leadId: leadIdToUse, 
            existingProjectId: tenant.id, 
            product: 'HERMES', 
            plan: 'starter' 
          }),
      });
      const d = await res.json();
      toast.dismiss();
      if (d.success) {
          toast.success(`🚀 ¡Hermes Aprovisionado! Magic URL generada.`);
          fetchTenants();
      } else {
          toast.error(`Error: ${d.error || 'Aprovisionamiento completado con fallback demo.'}`);
          fetchTenants();
      }
    } catch (e: any) { 
        toast.dismiss();
        toast.error(`Error: ${e?.message || 'Falla de conexión'}`); 
    }
  };

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
          <h4 className="text-white font-bold text-base">No hay proyectos disponibles</h4>
          <p className="text-zinc-500 text-xs max-w-sm mx-auto">
            Los proyectos aparecerán aquí para ser aprovisionados con Hermes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
          {tenants.map((t) => {
            const isProvisioned = t.hermesBinding != null;
            return (
              <div 
                key={t.id}
                className={`bg-zinc-900/60 border ${isProvisioned ? 'border-purple-500/30 hover:border-purple-500/60' : 'border-zinc-800/80'} p-6 rounded-2xl space-y-4 transition-all duration-300 group shadow-lg`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      {isProvisioned ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-zinc-600" />
                      )}
                      <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                        {t.title || t.slug}
                      </h3>
                    </div>
                    <span className="text-[11px] text-zinc-500 font-mono">Slug: {t.slug} • Tenant ID: #{t.id}</span>
                  </div>

                  <Badge variant="outline" className={`text-[10px] ${isProvisioned ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                    {isProvisioned ? 'ONLINE' : 'UNPROVISIONED'}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-black/40 p-3 rounded-xl border border-white/5 text-[11px]">
                  <div>
                    <span className="text-zinc-600 block uppercase text-[9px] font-bold">Kernel Version</span>
                    <span className="text-zinc-300 font-bold">{isProvisioned ? 'v1.0-STABLE' : '—'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-600 block uppercase text-[9px] font-bold">Proveedores Mesh</span>
                    <span className="text-zinc-300 font-bold">{isProvisioned ? '4 Activos' : '—'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-600 block uppercase text-[9px] font-bold">Routing Profile</span>
                    <span className="text-purple-400 font-bold">{isProvisioned ? 'Operator' : 'None'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-[10px] text-zinc-500">
                    DB ID: #{t.id} • {t.applicantEmail || 'System Tenant'}
                  </span>
                  
                  {!isProvisioned ? (
                    <Button
                      size="sm"
                      onClick={() => handleProvision(t)}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white border border-purple-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      Aprovisionar Hermes
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 rounded-xl text-xs font-bold transition-all cursor-default"
                    >
                      Instancia Gestionada (Vía API)
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
