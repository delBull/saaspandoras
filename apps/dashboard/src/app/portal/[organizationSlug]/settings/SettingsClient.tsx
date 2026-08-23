'use client';

import React, { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Globe,
  Sliders,
  Key,
  Shield,
  Save,
  Loader2,
  Plus,
  Trash2,
  Copy,
  Check,
  Phone,
  Send,
  Sparkles,
  Lock,
  ExternalLink,
  Info,
  Server,
  Cpu
} from 'lucide-react';
import { updateTenantSettingsAction, generateApiKeyAction, revokeApiKeyAction, TenantSettingsFormData } from './actions';
import { toast } from 'sonner';

export interface ApiKeyItem {
  id: string;
  name: string;
  keyFingerprint: string;
  permissions: string[];
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface TenantSettingsData {
  title: string;
  tagline: string;
  description: string;
  website: string;
  whatsappPhone: string;
  telegramUrl: string;
  logoUrl: string;
  runtimeConfig: {
    language?: string;
    tonePreset?: string;
    humanHandoffContact?: string;
    maxResponseTokens?: number;
  };
  apiKeys: ApiKeyItem[];
}

export function SettingsClient({
  organizationSlug,
  initialData,
}: {
  organizationSlug: string;
  initialData: TenantSettingsData;
}) {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'KERNEL' | 'API_KEYS' | 'VAULT'>('GENERAL');
  const [isPending, startTransition] = useTransition();

  // Form states
  const [formData, setFormData] = useState<TenantSettingsFormData>({
    title: initialData.title || '',
    tagline: initialData.tagline || '',
    description: initialData.description || '',
    website: initialData.website || '',
    whatsappPhone: initialData.whatsappPhone || '',
    telegramUrl: initialData.telegramUrl || '',
    language: initialData.runtimeConfig?.language || 'es',
    tonePreset: initialData.runtimeConfig?.tonePreset || 'institutional_concierge',
    humanHandoffContact: initialData.runtimeConfig?.humanHandoffContact || '',
    maxResponseTokens: initialData.runtimeConfig?.maxResponseTokens || 1024,
  });

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(initialData.apiKeys || []);
  const [newKeyModalOpen, setNewKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateTenantSettingsAction(organizationSlug, formData);
        toast.success('Configuración guardada y sincronizada en el Kernel de Hermes.');
      } catch (err: any) {
        toast.error(err.message || 'Error al guardar configuración');
      }
    });
  };

  const handleCreateApiKey = () => {
    if (!newKeyName.trim()) {
      toast.error('Ingresa un nombre descriptivo para la llave');
      return;
    }

    startTransition(async () => {
      try {
        const res = await generateApiKeyAction(organizationSlug, newKeyName);
        if (res.success && res.key && res.apiKey) {
          const created = res.key;
          setApiKeys((prev) => [
            {
              id: created.id,
              name: created.name,
              keyFingerprint: created.keyFingerprint,
              permissions: ['hermes.chat', 'knowledge.read'],
              isActive: true,
              lastUsedAt: null,
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ]);
          setGeneratedKey(res.apiKey);
          setNewKeyName('');
          toast.success('Llave de API generada con éxito');
        }
      } catch (err: any) {
        toast.error(err.message || 'Error al generar llave de API');
      }
    });
  };

  const handleRevokeApiKey = (keyId: string) => {
    if (!confirm('¿Estás seguro de revocar esta llave de API? Cualquier integración que la use dejará de funcionar.')) {
      return;
    }

    startTransition(async () => {
      try {
        await revokeApiKeyAction(organizationSlug, keyId);
        setApiKeys((prev) => prev.map((k) => (k.id === keyId ? { ...k, isActive: false } : k)));
        toast.success('Llave de API revocada');
      } catch (err: any) {
        toast.error(err.message || 'Error al revocar llave');
      }
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-white tracking-tight">System Preferences & Tenant Kernel</h1>
          <span className="text-xs bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded-full border border-indigo-500/30">
            {organizationSlug}
          </span>
        </div>
        <p className="text-sm text-zinc-400">
          Configuraciones generales, parámetros del modelo cognitivo Hermes, llaves de integración y bóveda soberana.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/5">
        {(
          [
            { id: 'GENERAL', label: 'General & Whitelabel', icon: Globe },
            { id: 'KERNEL', label: 'Hermes AI Kernel', icon: Cpu },
            { id: 'API_KEYS', label: 'API Keys & Integraciones', icon: Key },
            { id: 'VAULT', label: 'Bóveda Criptográfica', icon: Shield },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
                isActive
                  ? 'bg-white/15 text-white border border-white/20 shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon size={15} className={isActive ? 'text-indigo-400' : 'text-zinc-500'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form Content */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* TAB 1: GENERAL */}
        {activeTab === 'GENERAL' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 bg-[#0C0C12] border border-white/5 p-6 rounded-2xl"
          >
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-base font-bold text-white">Identidad & Marca Whitelabel</h2>
              <p className="text-xs text-zinc-400">Datos públicos de la organización visibles para clientes e inversores.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Nombre del Proyecto / Organización</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                  placeholder="Ej. S'Narai Tokenized RWA"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Tagline / Lema Institucional</label>
                <input
                  type="text"
                  value={formData.tagline || ''}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                  placeholder="Ej. Real Estate Tokenizado en Riviera Maya"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium text-zinc-300">Descripción del Proyecto</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                  placeholder="Resumen del modelo de negocio, activos y propuesta..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Sitio Web Oficial</label>
                <input
                  type="url"
                  value={formData.website || ''}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                  placeholder="https://snarai.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">WhatsApp Oficial de Atención</label>
                <input
                  type="text"
                  value={formData.whatsappPhone || ''}
                  onChange={(e) => setFormData({ ...formData, whatsappPhone: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                  placeholder="+52 998 123 4567"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: KERNEL */}
        {activeTab === 'KERNEL' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 bg-[#0C0C12] border border-white/5 p-6 rounded-2xl"
          >
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-base font-bold text-white">Parámetros del Kernel Hermes AI</h2>
              <p className="text-xs text-zinc-400">Directivas de inferencia, límites de tokens y escalación humana.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Idioma Principal de Respuesta</label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="es">Español (es)</option>
                  <option value="en">English (en)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Preconfiguración de Tono Base</label>
                <select
                  value={formData.tonePreset}
                  onChange={(e) => setFormData({ ...formData, tonePreset: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="institutional_concierge">Concierge Patrimonial Institucional</option>
                  <option value="family_office_advisor">Family Office & Sindicación de Activos</option>
                  <option value="trusted_advisor">Asesor de Confianza & Educación</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Contacto para Human Gate / Escalación</label>
                <input
                  type="text"
                  value={formData.humanHandoffContact || ''}
                  onChange={(e) => setFormData({ ...formData, humanHandoffContact: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                  placeholder="director@snarai.com o +52 1 55..."
                />
                <span className="text-[10px] text-zinc-500 font-mono block">
                  Canal donde se enviarán las alertas cuando un prospecto requiera reunión con fundadores.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Límite de Tokens por Respuesta</label>
                <input
                  type="number"
                  min={256}
                  max={4096}
                  step={128}
                  value={formData.maxResponseTokens || 1024}
                  onChange={(e) => setFormData({ ...formData, maxResponseTokens: Number(e.target.value) })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: API KEYS */}
        {activeTab === 'API_KEYS' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 bg-[#0C0C12] border border-white/5 p-6 rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h2 className="text-base font-bold text-white">Llaves de API & Webhooks</h2>
                <p className="text-xs text-zinc-400">Credenciales para integrar Hermes OS en aplicaciones externas o widgets.</p>
              </div>

              <button
                type="button"
                onClick={() => setNewKeyModalOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
              >
                <Plus size={14} />
                <span>Generar API Key</span>
              </button>
            </div>

            {/* API Keys Table */}
            <div className="space-y-3">
              {apiKeys.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-xs">
                  No hay llaves de API activas. Genera una para conectar el widget o tu backend.
                </div>
              ) : (
                apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                      key.isActive
                        ? 'border-white/10 bg-black/40'
                        : 'border-red-500/10 bg-red-500/[0.02] opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">{key.name}</span>
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                            key.isActive
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                          }`}
                        >
                          {key.isActive ? 'ACTIVA' : 'REVOCADA'}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 font-mono mt-1 flex items-center gap-2">
                        <span>Fingerprint: {key.keyFingerprint}</span>
                        <span>·</span>
                        <span>Creada: {new Date(key.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {key.isActive && (
                      <button
                        type="button"
                        onClick={() => handleRevokeApiKey(key.id)}
                        disabled={isPending}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-all flex items-center gap-1.5 self-end sm:self-center"
                      >
                        <Trash2 size={13} />
                        <span>Revocar</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 4: VAULT */}
        {activeTab === 'VAULT' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 bg-[#0C0C12] border border-white/5 p-6 rounded-2xl"
          >
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-base font-bold text-white">Sovereign Knowledge Vault & IPFS Anchor (K25)</h2>
              <p className="text-xs text-zinc-400">Estado de soberanía criptográfica y gobernanza de datos.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-300 font-mono">
                  <Lock size={14} className="text-emerald-400" />
                  <span>Envelope Encryption (AES-GCM-256)</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Todo el conocimiento soberano se almacena cifrado en IPFS con Data Encryption Keys (DEKs) efímeras y AAD vinculado al tenant.
                </p>
                <div className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded inline-block">
                  ESTADO: FAIL-CLOSED ACTIVO
                </div>
              </div>

              <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-300 font-mono">
                  <Sparkles size={14} className="text-purple-400" />
                  <span>Firma Criptográfica EIP-712</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Cada Claim Contract y certificado emitido por Hermes contiene una firma verificable en EVM generada por la Agent Wallet.
                </p>
                <div className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded inline-block">
                  ESTADO: SOVEREIGN PROVENANCE ACTIVO
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Save Button Bar */}
        {(activeTab === 'GENERAL' || activeTab === 'KERNEL') && (
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>Guardar Cambios</span>
            </button>
          </div>
        )}
      </form>

      {/* Generated Key Modal */}
      <AnimatePresence>
        {newKeyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0C0C12] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl"
            >
              <div>
                <h3 className="text-base font-bold text-white">Generar Nueva Llave de API</h3>
                <p className="text-xs text-zinc-400 mt-1">Crea una credencial para consumir el runtime de Hermes.</p>
              </div>

              {!generatedKey ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Nombre de la Llave</label>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="Ej. Widget Web Landing / App Móvil"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setNewKeyModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-zinc-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateApiKey}
                      disabled={isPending}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5"
                    >
                      {isPending && <Loader2 size={13} className="animate-spin" />}
                      <span>Generar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                    <Info size={16} className="shrink-0 mt-0.5" />
                    <span>Copia esta llave ahora. Por seguridad, no volverá a mostrarse en texto plano.</span>
                  </div>

                  <div className="bg-black/60 p-3 rounded-xl border border-white/10 flex items-center justify-between gap-2 font-mono text-xs text-emerald-400">
                    <span className="break-all">{generatedKey}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedKey);
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
                      }}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white shrink-0"
                    >
                      {copiedKey ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setGeneratedKey(null);
                        setNewKeyModalOpen(false);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white"
                    >
                      Entendido y Guardado
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
