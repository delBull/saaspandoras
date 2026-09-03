'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getTenantWhitelabelConfig, updateTenantWhitelabelConfig, WhitelabelConfig } from '@/app/actions/admin/whitelabel.actions';

interface AdminWhitelabelConfigProps {
  tenantSlug: string;
}

export function AdminWhitelabelConfig({ tenantSlug }: AdminWhitelabelConfigProps) {
  const [config, setConfig] = useState<WhitelabelConfig>({
    domain: '',
    brandColor: '#000000',
    logoUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const data = await getTenantWhitelabelConfig(tenantSlug);
        if (data) {
          setConfig(data);
        }
      } catch (err) {
        console.error('Error fetching whitelabel config:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [tenantSlug]);

  const handleSave = async () => {
    setSaving(true);
    setStatus('idle');
    try {
      const res = await updateTenantWhitelabelConfig(tenantSlug, config);
      if (res.success) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    } finally {
      setSaving(false);
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 border border-white/[0.08] rounded-xl bg-white/[0.02]">
        <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-[#14141E] border border-white/[0.08] space-y-4">
      <div className="space-y-3">
        <div>
          <label className="block text-[10px] font-mono text-zinc-500 mb-1">Custom Domain</label>
          <input
            type="text"
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
            placeholder="app.snarai.com"
            value={config.domain}
            onChange={(e) => setConfig({ ...config, domain: e.target.value })}
          />
        </div>
        
        <div>
          <label className="block text-[10px] font-mono text-zinc-500 mb-1">Brand Color (Hex)</label>
          <div className="flex gap-2">
            <input
              type="color"
              className="w-8 h-8 rounded border border-white/[0.08] bg-transparent cursor-pointer"
              value={config.brandColor}
              onChange={(e) => setConfig({ ...config, brandColor: e.target.value })}
            />
            <input
              type="text"
              className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
              placeholder="#000000"
              value={config.brandColor}
              onChange={(e) => setConfig({ ...config, brandColor: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-mono text-zinc-500 mb-1">Logo URL</label>
          <input
            type="text"
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
            placeholder="https://..."
            value={config.logoUrl}
            onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        <span>Guardar Configuración</span>
      </button>

      {status === 'success' && (
        <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] bg-emerald-500/10 p-2 rounded-md">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Configuración guardada exitosamente</span>
        </div>
      )}
      
      {status === 'error' && (
        <div className="flex items-center gap-1.5 text-rose-400 text-[11px] bg-rose-500/10 p-2 rounded-md">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Error al guardar</span>
        </div>
      )}
    </div>
  );
}
