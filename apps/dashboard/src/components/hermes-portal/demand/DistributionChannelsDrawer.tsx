'use client';

/**
 * 📡 HERMES DISTRIBUTION CHANNELS DRAWER (FASE 1)
 * apps/dashboard/src/components/hermes-portal/demand/DistributionChannelsDrawer.tsx
 *
 * Tenant-Owned Channel Control Plane with Encrypted Secret Isolation:
 * - Direct Telegram Bot configuration with envelope-encrypted credentials.
 * - X (Twitter) OAuth scaffold / connect manager.
 * - Newsletter / Dispatch channel management.
 * - Capability inspector (independent from connection status).
 * - Logical revocation with cryptographic destruction.
 */

import React, { useState, useEffect } from 'react';
import {
  X as CloseIcon,
  Radio,
  Send,
  Twitter,
  Mail,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Plus,
  Shield,
  Key,
  RefreshCw,
  ExternalLink,
  Layers,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type {
  SanitizedChannelDTO,
  ChannelCapabilityCatalogItem,
} from '@/lib/hermes/channels/tenant-channel.service';

interface DistributionChannelsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tenantSlug?: string;
}

export function DistributionChannelsDrawer({
  isOpen,
  onClose,
  tenantSlug,
}: DistributionChannelsDrawerProps) {
  const [channels, setChannels] = useState<SanitizedChannelDTO[]>([]);
  const [catalog, setCatalog] = useState<ChannelCapabilityCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedChannelType, setSelectedChannelType] = useState<'telegram' | 'x' | 'newsletter'>('telegram');
  const [accountName, setAccountName] = useState('');
  const [accountHandle, setAccountHandle] = useState('');
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [newsletterKey, setNewsletterKey] = useState('');
  const [connecting, setConnecting] = useState(false);

  // Revocation State
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Fetch channels from API
  const fetchChannels = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = tenantSlug
        ? `/api/v1/hermes/channels?tenantId=${encodeURIComponent(tenantSlug)}`
        : '/api/v1/hermes/channels';

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to load channels');
      }

      setChannels(data.channels || []);
      setCatalog(data.catalog || []);
    } catch (err: any) {
      console.error('[DistributionChannelsDrawer] Fetch error:', err);
      setError(err?.message || 'Error al conectar con el servidor de canales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchChannels();
    }
  }, [isOpen, tenantSlug]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setConnecting(true);

    try {
      const credentials: Record<string, unknown> = {};

      if (selectedChannelType === 'telegram') {
        if (!botToken.trim() || !chatId.trim()) {
          throw new Error('Bot Token y Chat ID son requeridos para Telegram.');
        }
        credentials.botToken = botToken.trim();
        credentials.chatId = chatId.trim();
      } else if (selectedChannelType === 'x') {
        // Phase 1 scaffold
        credentials.authType = 'OAUTH2_PKCE_SCAFFOLD';
      } else if (selectedChannelType === 'newsletter') {
        if (!newsletterKey.trim()) {
          throw new Error('API Key es requerida para Newsletter.');
        }
        credentials.apiKey = newsletterKey.trim();
      }

      const res = await fetch('/api/v1/hermes/channels/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: selectedChannelType,
          accountName: accountName.trim(),
          accountHandle: accountHandle.trim(),
          credentials,
          tenantId: tenantSlug, // client hint, verified server-side
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Error al registrar el canal');
      }

      setSuccessMessage(`Canal ${selectedChannelType.toUpperCase()} conectado y cifrado en el Vault institucional.`);
      // Reset form
      setShowAddForm(false);
      setAccountName('');
      setAccountHandle('');
      setBotToken('');
      setChatId('');
      setNewsletterKey('');
      // Reload list
      await fetchChannels();
    } catch (err: any) {
      setError(err?.message || 'Error al registrar canal');
    } finally {
      setConnecting(false);
    }
  };

  const handleRevoke = async (id: string, channelName: string) => {
    if (!confirm(`¿Estás seguro de revocar el canal ${channelName}? Sus credenciales cifradas serán destruidas inmediatamente de forma irreversible.`)) {
      return;
    }

    setRevokingId(id);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/v1/hermes/channels/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Error al revocar canal');
      }

      setSuccessMessage(`Canal ${channelName} revocado y credenciales destruidas.`);
      await fetchChannels();
    } catch (err: any) {
      setError(err?.message || 'Error al revocar canal');
    } finally {
      setRevokingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-zinc-950 border-l border-zinc-800/90 h-full flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* ── HEADER ── */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-medium text-white tracking-tight">Canales de Distribución Soberana</h3>
                <Badge variant="outline" className="text-[10px] font-mono border-indigo-500/30 text-indigo-400">
                  Control Plane
                </Badge>
              </div>
              <p className="text-xs text-zinc-400">
                Canales propios del tenant con bóveda de secretos en sobre criptográfico (AES-256-GCM).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchChannels}
              disabled={loading}
              className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── ALERTS / FEEDBACK ── */}
        {error && (
          <div className="mx-5 mt-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-5 mt-4 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ── BODY ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* VAULT STATUS BANNER */}
          <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-950/10 flex items-start gap-3">
            <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-medium text-white">Bóveda Criptográfica en RAM Aislada</p>
              <p className="text-zinc-400 leading-relaxed font-light">
                Tus credenciales y tokens nunca se almacenan en texto plano. Cada canal se cifra individualmente
                usando AES-256-GCM con el <code className="text-indigo-300 font-mono">canonicalOrgId</code> como
                dato autenticado adicional (AAD). Al revocar, las llaves son destruidas inmediatamente.
              </p>
            </div>
          </div>

          {/* ACTIVE CHANNELS SECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Canales Configurados ({channels.length})
              </h4>
              {!showAddForm && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddForm(true)}
                  className="h-7 text-xs border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200 rounded-lg"
                >
                  <Plus className="w-3 h-3 mr-1.5" />
                  Conectar Canal
                </Button>
              )}
            </div>

            {channels.length === 0 && !loading && !showAddForm && (
              <div className="p-8 border border-dashed border-zinc-800 rounded-2xl text-center space-y-2">
                <Radio className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-sm text-zinc-400 font-medium">Aún no hay canales conectados</p>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto font-light">
                  Conecta tu canal de Telegram para habilitar la publicación soberana de contenidos aprobados.
                </p>
                <Button
                  size="sm"
                  onClick={() => setShowAddForm(true)}
                  className="mt-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-xl"
                >
                  <Plus className="w-3 h-3 mr-1.5" />
                  Conectar Primer Canal
                </Button>
              </div>
            )}

            <div className="space-y-3">
              {channels.map((ch) => {
                const isConnected = ch.status === 'CONNECTED';
                const isConnecting = ch.status === 'CONNECTING';
                const isRevoked = ch.status === 'REVOKED';

                return (
                  <div
                    key={ch.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isRevoked
                        ? 'border-zinc-800/40 bg-zinc-950/40 opacity-60'
                        : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-zinc-800/80 text-white shrink-0 mt-0.5">
                          {ch.channel === 'telegram' && <Send className="w-4 h-4 text-sky-400" />}
                          {ch.channel === 'x' && <Twitter className="w-4 h-4 text-zinc-200" />}
                          {ch.channel === 'newsletter' && <Mail className="w-4 h-4 text-amber-400" />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{ch.accountName}</span>
                            <span className="text-xs text-zinc-500 font-mono">{ch.accountHandle}</span>
                          </div>

                          {/* Capabilities badges (independent from status) */}
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <span className="text-[10px] text-zinc-500 font-mono">Capacidades:</span>
                            {ch.supportedCapabilities.map((cap) => (
                              <Badge
                                key={cap}
                                variant="outline"
                                className="text-[9px] px-1.5 py-0 border-zinc-800 bg-zinc-900 text-zinc-300 font-mono"
                              >
                                {cap}
                              </Badge>
                            ))}
                          </div>

                          {/* Vault fingerprint */}
                          {ch.credentialFingerprint && (
                            <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono pt-0.5">
                              <Lock className="w-2.5 h-2.5 text-zinc-600" />
                              <span>Vault AAD hash: {ch.credentialFingerprint}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status + Actions */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {isConnected && (
                          <Badge className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[10px]">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Conectado
                          </Badge>
                        )}
                        {isConnecting && (
                          <Badge className="bg-amber-950/80 border border-amber-500/40 text-amber-400 text-[10px]">
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Conectando
                          </Badge>
                        )}
                        {isRevoked && (
                          <Badge className="bg-zinc-900 border border-zinc-700 text-zinc-400 text-[10px]">
                            Revocado
                          </Badge>
                        )}

                        {!isRevoked && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevoke(ch.id, ch.accountName)}
                            disabled={revokingId === ch.id}
                            className="h-7 px-2 text-[11px] text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            {revokingId === ch.id ? 'Revocando...' : 'Revocar'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── ADD CHANNEL FORM ── */}
          {showAddForm && (
            <div className="p-5 rounded-2xl border border-indigo-500/30 bg-zinc-900/80 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-sm font-medium text-white">Conectar Nuevo Canal</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>

              {/* Selector de Canal */}
              <div className="grid grid-cols-3 gap-2">
                {catalog.map((cat) => {
                  const isSelected = selectedChannelType === cat.channel;
                  return (
                    <button
                      key={cat.channel}
                      type="button"
                      onClick={() => setSelectedChannelType(cat.channel)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/15 text-white'
                          : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium capitalize">{cat.channel}</span>
                        {cat.channel === 'telegram' && <Send className="w-3.5 h-3.5 text-sky-400" />}
                        {cat.channel === 'x' && <Twitter className="w-3.5 h-3.5 text-zinc-200" />}
                        {cat.channel === 'newsletter' && <Mail className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <p className="text-[10px] text-zinc-500 line-clamp-1">
                        {cat.defaultCapabilities.join(', ')}
                      </p>
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleConnect} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Nombre de la Cuenta / Canal</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. S'Narai Canal Oficial"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Handle / Identificador Público</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. @snarai_oficial"
                    value={accountHandle}
                    onChange={(e) => setAccountHandle(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* TELEGRAM CREDENTIALS */}
                {selectedChannelType === 'telegram' && (
                  <div className="space-y-3 pt-2 border-t border-zinc-800/80">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-zinc-400">Telegram Bot Token</label>
                        <span className="text-[10px] text-indigo-400 font-mono">Cifrado AES-256-GCM</span>
                      </div>
                      <input
                        type="password"
                        required
                        placeholder="123456789:ABCdefGhIJKlmNoPQRstuVWXyz"
                        value={botToken}
                        onChange={(e) => setBotToken(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                      />
                      <p className="text-[10px] text-zinc-500 mt-1">
                        Obtenlo de @BotFather. El bot debe ser administrador en el canal de destino.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Target Chat ID o Username</label>
                      <input
                        type="text"
                        required
                        placeholder="@tu_canal o -100123456789"
                        value={chatId}
                        onChange={(e) => setChatId(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {/* X (TWITTER) OAUTH SCAFFOLD */}
                {selectedChannelType === 'x' && (
                  <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 text-xs space-y-2">
                    <p className="text-zinc-300 font-medium">Scaffold de Conexión OAuth 2.0 (Fase 1)</p>
                    <p className="text-zinc-500 font-light leading-relaxed">
                      El canal quedará registrado en estado <code className="text-amber-400">CONNECTING</code>.
                      El flujo completo de autorización PKCE se activará en la fase de distribución directa.
                    </p>
                  </div>
                )}

                {/* NEWSLETTER API KEY */}
                {selectedChannelType === 'newsletter' && (
                  <div className="space-y-3 pt-2 border-t border-zinc-800/80">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Provider API Key (Resend / SMTP)</label>
                      <input
                        type="password"
                        required
                        placeholder="re_1234567890..."
                        value={newsletterKey}
                        onChange={(e) => setNewsletterKey(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddForm(false)}
                    className="text-xs text-zinc-400 hover:text-white"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={connecting}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-xl px-4"
                  >
                    {connecting ? 'Cifrando y Guardando...' : 'Cifrar y Conectar'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* CATALOG REFERENCE SECTION */}
          <div className="space-y-3 pt-4 border-t border-zinc-800/60">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Capacidades de Canales Soportados
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {catalog.map((cat) => (
                <div key={cat.channel} className="p-3 rounded-xl border border-zinc-800/80 bg-zinc-900/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white">{cat.displayName}</span>
                    <Badge variant="outline" className="text-[9px] border-zinc-800 text-zinc-400 font-mono">
                      {cat.connectionType}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                  <div className="flex items-center gap-1 flex-wrap pt-1">
                    {cat.defaultCapabilities.map((c) => (
                      <span key={c} className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800/60 text-zinc-300 font-mono">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
