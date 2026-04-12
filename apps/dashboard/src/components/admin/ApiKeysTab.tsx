'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Copy, Eye, EyeOff, Trash2, Plus, RefreshCw, Key, Shield, Zap, Globe } from 'lucide-react';

interface IntegrationClient {
  id: string;
  name: string;
  environment: string;
  projectId: number | null;
  keyFingerprint: string;
  permissions: string[];
  isActive: boolean;
  callbackUrl: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

interface NewKeyResult {
  success: boolean;
  api_key: string;
  key_fingerprint: string;
  name: string;
  permissions: string[];
  environment: string;
  callbackUrl: string | null;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'read:growth_os', label: 'Growth OS', desc: 'Leads, métricas, campañas, newsletter', icon: '📊', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  { id: 'read:projects', label: 'Proyectos', desc: 'Proyectos públicos y fases', icon: '🏗️', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { id: 'read:users', label: 'Usuarios', desc: 'Datos no sensibles de usuarios', icon: '👥', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
];

export function ApiKeysTab() {
  const { user } = useAuth();
  const walletAddress = user?.address ?? '';
  const [clients, setClients] = useState<IntegrationClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyResult, setNewKeyResult] = useState<NewKeyResult | null>(null);
  const [hasRevealedKey, setHasRevealedKey] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEnvironment, setFormEnvironment] = useState<'staging' | 'production'>('production');
  const [formPermissions, setFormPermissions] = useState<string[]>(['read:growth_os']);
  const [formCallbackUrl, setFormCallbackUrl] = useState('');

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/internal/api-keys', {
        headers: {
          'x-thirdweb-address': walletAddress,
          'x-wallet-address': walletAddress,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (e) {
      toast.error('Error cargando API keys');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleCreate = async () => {
    if (!formName.trim()) { toast.error('El nombre es requerido'); return; }
    if (formPermissions.length === 0) { toast.error('Selecciona al menos un permiso'); return; }

    setCreating(true);
    try {
      const res = await fetch('/api/v1/internal/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-thirdweb-address': walletAddress,
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({
          name: formName.trim(),
          environment: formEnvironment,
          permissions: formPermissions,
          callbackUrl: formCallbackUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Error al crear key'); return; }

      setNewKeyResult(data);
      setHasRevealedKey(false);
      setShowCreateForm(false);
      setFormName('');
      setFormCallbackUrl('');
      setFormPermissions(['read:growth_os']);
      await fetchClients();
      toast.success('✅ API Key creada — guárdala ahora, no se mostrará de nuevo');
    } catch (e) {
      toast.error('Error al crear API key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (fingerprint: string, name: string) => {
    if (!confirm(`¿Revocar la key "${name}"? Esta acción desactiva el acceso inmediatamente.`)) return;

    try {
      const res = await fetch('/api/v1/internal/api-keys', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-thirdweb-address': walletAddress,
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({ fingerprint }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        await fetchClients();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Error al revocar key');
    }
  };

  const copyToClipboard = (text: string, label = 'Copiado') => {
    navigator.clipboard.writeText(text);
    toast.success(`✅ ${label} al portapapeles`);
  };

  const togglePermission = (perm: string) => {
    setFormPermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-yellow-400" />
            API Keys
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-xs">
              Read-Only
            </Badge>
          </h2>
          <p className="text-zinc-500 text-sm mt-1">
            Genera tokens de acceso para integrar sistemas externos como Bull's Lab con datos de Pandoras.
          </p>
        </div>
        <Button
          onClick={() => { setShowCreateForm(true); setNewKeyResult(null); }}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nueva API Key
        </Button>
      </div>

      {/* Security Notice */}
      <div className="flex items-start gap-3 bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
        <Shield className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-300 text-sm font-semibold">Seguridad</p>
          <p className="text-zinc-500 text-xs mt-1">
            Todas las keys son <strong className="text-zinc-400">estrictamente read-only</strong>. No pueden modificar datos ni ejecutar transacciones.
            El key raw solo se muestra <strong className="text-zinc-400">una vez</strong> al momento de creación — igual que Stripe o OpenAI.
          </p>
        </div>
      </div>

      {/* Creation Form */}
      {showCreateForm && (
        <div className="bg-zinc-900/70 border border-yellow-500/20 rounded-2xl p-6 space-y-5">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            Crear nueva API Key
          </h3>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Nombre del cliente</label>
            <input
              type="text"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="ej. bullslab-readonly, sofia-bridge"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:border-yellow-500 focus:outline-none transition-colors text-sm"
            />
          </div>

          {/* Environment */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Entorno</label>
            <div className="flex gap-3">
              {(['staging', 'production'] as const).map(env => (
                <button
                  key={env}
                  onClick={() => setFormEnvironment(env)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${formEnvironment === env
                    ? env === 'production' ? 'bg-green-500/15 border-green-500/40 text-green-400' : 'bg-yellow-500/15 border-yellow-500/40 text-yellow-400'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600'
                  }`}
                >
                  {env === 'production' ? '🟢 Production' : '🟡 Staging'}
                </button>
              ))}
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Permisos</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {AVAILABLE_PERMISSIONS.map(perm => (
                <button
                  key={perm.id}
                  onClick={() => togglePermission(perm.id)}
                  className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${formPermissions.includes(perm.id)
                    ? perm.color + ' border-current/30'
                    : 'bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{perm.icon}</span>
                    <span className="text-xs font-bold uppercase tracking-widest">{perm.label}</span>
                    {formPermissions.includes(perm.id) && (
                      <span className="ml-auto text-[10px] bg-current/20 px-1.5 py-0.5 rounded">ON</span>
                    )}
                  </div>
                  <p className="text-[10px] opacity-70 leading-tight">{perm.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Webhook callback URL */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5" />
              URL Webhook (opcional)
            </label>
            <input
              type="url"
              value={formCallbackUrl}
              onChange={e => setFormCallbackUrl(e.target.value)}
              placeholder="https://api.bullslab.io/webhooks/pandoras"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:border-yellow-500 focus:outline-none transition-colors text-sm font-mono"
            />
            <p className="text-[11px] text-zinc-500">El sistema enviará eventos en tiempo real (lead.new, lead.converted) a esta URL.</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold gap-2"
            >
              {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              {creating ? 'Generando...' : 'Generar API Key'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowCreateForm(false)}
              className="text-zinc-400 hover:text-white"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* New Key Result - ONE TIME REVEAL */}
      {newKeyResult && (
        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border border-yellow-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
              🔑
            </div>
            <div>
              <p className="text-yellow-400 font-bold">API Key generada para: {newKeyResult.name}</p>
              <p className="text-red-400 text-xs font-semibold">⚠️ COPIA ESTA KEY AHORA — No se mostrará de nuevo</p>
            </div>
          </div>

          <div className="bg-black/40 rounded-xl p-4 border border-yellow-500/20">
            <div className="flex items-center gap-3">
              <code className="flex-1 text-sm font-mono text-yellow-300 break-all">
                {hasRevealedKey ? newKeyResult.api_key : newKeyResult.api_key.replace(/pk_(live|test)_[a-f0-9]{10}/, 'pk_****_••••••••••')}
              </code>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setHasRevealedKey(v => !v)}
                  className="p-2 text-zinc-400 hover:text-white transition-colors"
                  title={hasRevealedKey ? 'Ocultar' : 'Revelar'}
                >
                  {hasRevealedKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => copyToClipboard(newKeyResult.api_key, 'API Key copiada')}
                  className="p-2 text-zinc-400 hover:text-yellow-400 transition-colors"
                  title="Copiar key"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <InfoChip label="Fingerprint" value={newKeyResult.key_fingerprint} copyable onCopy={() => copyToClipboard(newKeyResult.key_fingerprint, 'Fingerprint copiado')} />
            <InfoChip label="Entorno" value={newKeyResult.environment} />
            <InfoChip label="Permisos" value={newKeyResult.permissions.join(', ')} />
          </div>

          <p className="text-xs text-zinc-500">
            Usa el header <code className="text-zinc-300 font-mono bg-zinc-800 px-1 rounded">x-api-key: {newKeyResult.api_key.slice(0, 15)}...</code> en cada request a{' '}
            <code className="text-zinc-300 font-mono bg-zinc-800 px-1 rounded">/api/v1/external/*</code>
          </p>

          <Button
            variant="ghost"
            onClick={() => setNewKeyResult(null)}
            className="text-zinc-500 hover:text-white text-xs"
          >
            ✓ Ya guardé la key
          </Button>
        </div>
      )}

      {/* Keys List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
            Clientes registrados ({clients.length})
          </h3>
          <button
            onClick={fetchClients}
            className="text-zinc-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-zinc-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-20 bg-zinc-800/40 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12 text-zinc-600">
            <Key className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay API Keys registradas</p>
            <p className="text-xs mt-1">Crea la primera key para Bull's Lab</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clients.map(client => (
              <div
                key={client.id}
                className={`bg-zinc-900/50 border rounded-xl p-4 transition-all ${client.isActive ? 'border-zinc-700/50' : 'border-red-500/20 opacity-60'}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${client.isActive ? 'bg-green-400 shadow-[0_0_6px_#4ade80]' : 'bg-red-500'}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-semibold text-sm truncate">{client.name}</span>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${client.environment === 'production' ? 'text-green-400 border-green-500/20 bg-green-500/5' : 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5'}`}>
                          {client.environment}
                        </Badge>
                        {!client.isActive && (
                          <Badge variant="outline" className="text-[10px] text-red-400 border-red-500/20 bg-red-500/5">
                            Revocada
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-zinc-500 text-xs font-mono">
                          fp: <span className="text-zinc-400">{client.keyFingerprint}</span>
                        </span>
                        {client.callbackUrl && (
                          <span className="text-zinc-500 text-xs flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            <span className="truncate max-w-[200px]">{client.callbackUrl}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(client.permissions as string[]).map(p => (
                          <span key={p} className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-700">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] text-zinc-600">Último uso</p>
                      <p className="text-[10px] text-zinc-500">
                        {client.lastUsedAt ? new Date(client.lastUsedAt).toLocaleDateString('es-MX') : 'Nunca'}
                      </p>
                    </div>
                    {client.isActive && (
                      <button
                        onClick={() => handleRevoke(client.keyFingerprint, client.name)}
                        className="p-2 text-zinc-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                        title="Revocar key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Reference */}
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5 space-y-3">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Referencia rápida de endpoints</h4>
        <div className="space-y-2">
          {[
            { method: 'GET', path: '/api/v1/external/growth-os/metrics', perm: 'read:growth_os', desc: 'Dashboard ejecutivo' },
            { method: 'GET', path: '/api/v1/external/growth-os/leads', perm: 'read:growth_os', desc: 'Lista de leads (filtrable)' },
            { method: 'GET', path: '/api/v1/external/growth-os/campaigns', perm: 'read:growth_os', desc: 'Campañas + estadísticas' },
            { method: 'GET', path: '/api/v1/external/growth-os/newsletter', perm: 'read:growth_os', desc: 'Métricas de suscriptores' },
          ].map(ep => (
            <div key={ep.path} className="flex items-center gap-3 text-xs">
              <span className="text-green-400 font-mono font-bold w-8 shrink-0">{ep.method}</span>
              <code className="text-zinc-300 font-mono flex-1 truncate">{ep.path}</code>
              <span className="text-zinc-600 hidden sm:block">{ep.desc}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-zinc-600 mt-2">
          Header: <code className="text-zinc-400 font-mono bg-zinc-800 px-1.5 py-0.5 rounded">x-api-key: pk_live_...</code>
        </p>
      </div>
    </div>
  );
}

// Small helper component
function InfoChip({ label, value, copyable, onCopy }: { label: string; value: string; copyable?: boolean; onCopy?: () => void }) {
  return (
    <div className="bg-black/30 rounded-lg p-3 border border-zinc-800">
      <p className="text-[10px] text-zinc-600 uppercase font-bold mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <p className="text-xs text-zinc-300 font-mono truncate flex-1">{value}</p>
        {copyable && onCopy && (
          <button onClick={onCopy} className="text-zinc-500 hover:text-white">
            <Copy className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
