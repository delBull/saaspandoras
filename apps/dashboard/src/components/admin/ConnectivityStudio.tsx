'use client';

/**
 * ConnectivityStudio — Organization Operations Center: Studio #3
 *
 * Where the B2B client "connects their business" with Pandora's Platform OS.
 *
 * Provider Positioning Table:
 * ┌─────────────────────┬────────────────────────────────────┬─────────────────────────────────┐
 * │ Provider            │ Client Ideal                       │ Recommendation                  │
 * ├─────────────────────┼────────────────────────────────────┼─────────────────────────────────┤
 * │ Meta Cloud API      │ Enterprise, high-volume, critical  │ ⭐ Recommended for production    │
 * │ Baileys QR Bridge   │ Pymes, pilots, sandbox             │ ⚠️  Quick-connect with limitations│
 * └─────────────────────┴────────────────────────────────────┴─────────────────────────────────┘
 *
 * Architecture:
 *  Hermes Runtime → IWhatsAppProvider → Meta | Baileys → WHATSAPP_GATEWAY_URL
 *  The Runtime ONLY knows IWhatsAppProvider — never a specific vendor.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, MessageSquare, Mail, Zap, CheckCircle2,
  AlertCircle, Bot, QrCode, ShieldAlert,
  RefreshCw, Wifi, WifiOff, Settings2, Link2,
  Phone, Clock, Activity
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type ProviderCategory = 'whatsapp' | 'telegram' | 'web' | 'email' | 'crm' | 'calendar' | 'webhooks';

interface SessionHealth {
  status: 'connected' | 'pending_qr' | 'disconnected' | 'reconnecting';
  phoneNumber?: string;
  deviceName?: string;
  lastHeartbeat?: string;
  reconnectAttempts?: number;
  qr?: string | null;
}

// ─── WhatsApp Provider Marketplace data ───────────────────────────────────────

const WHATSAPP_PROVIDERS = [
  {
    id: 'meta',
    name: 'Meta Cloud API',
    description: 'API oficial de Meta. Alta disponibilidad, SLA garantizado. Recomendado para empresas con operación crítica y volumen alto.',
    tier: 'enterprise' as const,
    recommended: true,
    badge: '⭐ Producción',
    badgeStyle: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    available: true,
  },
  {
    id: 'baileys',
    name: 'Baileys QR Quick-Connect',
    description: 'Escanea un código QR con tu WhatsApp personal — como WhatsApp Web. Ideal para pymes, pilotos y sandbox. Sin cuenta Meta Business.',
    tier: 'quick_connect' as const,
    recommended: false,
    badge: '⚠️ Pyme / Sandbox',
    badgeStyle: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    available: true,
  },
  {
    id: 'twilio',
    name: 'Twilio WhatsApp',
    description: 'API de WhatsApp vía Twilio con soporte global y failover automático.',
    tier: 'enterprise' as const,
    recommended: false,
    badge: 'Próximamente',
    badgeStyle: 'bg-zinc-800 text-zinc-500 border-zinc-700',
    available: false,
  },
];

// ─── Session Health Panel (Baileys connected state) ───────────────────────────

function SessionHealthPanel({ health }: { health: SessionHealth }) {
  const statusColor = {
    connected: 'text-emerald-400',
    pending_qr: 'text-amber-400',
    disconnected: 'text-red-400',
    reconnecting: 'text-amber-400',
  }[health.status];

  const statusLabel = {
    connected: '🟢 Conectado',
    pending_qr: '🟡 Esperando escaneo',
    disconnected: '🔴 Desconectado',
    reconnecting: '🟡 Reconectando...',
  }[health.status];

  return (
    <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <Activity className="w-4 h-4 text-zinc-400" />
        <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Session Health</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Estado</p>
          <p className={`text-xs font-medium ${statusColor}`}>{statusLabel}</p>
        </div>
        {health.phoneNumber && (
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Número</p>
            <p className="text-xs text-white font-mono">{health.phoneNumber}</p>
          </div>
        )}
        {health.deviceName && (
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Dispositivo</p>
            <p className="text-xs text-zinc-300">{health.deviceName}</p>
          </div>
        )}
        {health.lastHeartbeat && (
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Último heartbeat</p>
            <p className="text-xs text-zinc-300">{new Date(health.lastHeartbeat).toLocaleTimeString()}</p>
          </div>
        )}
        {health.reconnectAttempts !== undefined && health.reconnectAttempts > 0 && (
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Reintentos</p>
            <p className="text-xs text-amber-400">{health.reconnectAttempts}</p>
          </div>
        )}
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Proveedor</p>
          <p className="text-xs text-zinc-400 font-mono">Baileys Bridge</p>
        </div>
      </div>
    </div>
  );
}

// ─── Baileys QR Scanner ────────────────────────────────────────────────────────

function BaileysQRScanner({ tenantId }: { tenantId: string }) {
  const [phase, setPhase] = useState<'idle' | 'loading' | 'qr' | 'connected' | 'error'>('idle');
  const [health, setHealth] = useState<SessionHealth>({ status: 'disconnected' });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => { if (pollRef.current) clearInterval(pollRef.current); };

  const pollHealth = () => {
    pollRef.current = setInterval(async () => {
      const r = await fetch(`/api/whatsapp/baileys?tenantId=${tenantId}`);
      const d = await r.json() as SessionHealth & { connected: boolean };
      setHealth(d);
      if (d.connected) {
        setPhase('connected');
        stopPolling();
      } else if (d.qr) {
        setHealth(d);
      }
    }, 3000);
  };

  const startSession = async () => {
    setPhase('loading');
    stopPolling();
    try {
      const res = await fetch('/api/whatsapp/baileys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'init', tenantId }),
      });
      const data = await res.json() as SessionHealth & { error?: string };

      if (!res.ok || data.status === 'disconnected') {
        setPhase('error');
        return;
      }

      setHealth(data);
      if (data.status === 'connected') {
        setPhase('connected');
      } else {
        setPhase('qr');
        pollHealth();
      }
    } catch {
      setPhase('error');
    }
  };

  const terminate = async () => {
    stopPolling();
    await fetch('/api/whatsapp/baileys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'terminate', tenantId }),
    });
    setPhase('idle');
    setHealth({ status: 'disconnected' });
  };

  useEffect(() => () => stopPolling(), []);

  return (
    <div className="mt-4 space-y-3">
      {/* Limitations warning — always visible for Baileys */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-[11px] text-amber-300 font-medium">Limitaciones de WhatsApp Web</p>
          <ul className="text-[10px] text-amber-300/70 space-y-0.5 list-disc list-inside">
            <li>Requiere teléfono encendido con internet</li>
            <li>Meta puede actualizar el protocolo sin previo aviso</li>
            <li>Puede requerir re-autenticación periódica</li>
            <li>Sin SLA oficial — no apto para operación crítica</li>
          </ul>
          <p className="text-[10px] text-amber-400/60 mt-1">
            Para alta disponibilidad Enterprise → usa <strong>Meta Cloud API</strong>.
          </p>
        </div>
      </div>

      {phase === 'idle' && (
        <button
          onClick={startSession}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition-colors"
        >
          <QrCode className="w-4 h-4" />
          Generar Código QR
        </button>
      )}

      {phase === 'loading' && (
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Conectando con WhatsApp Gateway...
        </div>
      )}

      {phase === 'qr' && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-300">
            Abre WhatsApp en tu teléfono → Dispositivos vinculados → Vincular dispositivo:
          </p>
          <div className="w-48 h-48 bg-white rounded-xl flex items-center justify-center">
            {health.qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={health.qr} alt="WhatsApp QR Code" className="w-full h-full rounded-xl object-contain p-2" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-zinc-400">
                <QrCode className="w-8 h-8" />
                <p className="text-[10px]">Generando QR...</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Esperando escaneo...
          </div>
        </div>
      )}

      {phase === 'connected' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
            <Wifi className="w-4 h-4" />
            WhatsApp vinculado exitosamente
          </div>
          <SessionHealthPanel health={health} />
          <button
            onClick={terminate}
            className="text-xs text-red-400 hover:text-red-300 underline"
          >
            Desvincular sesión
          </button>
        </div>
      )}

      {phase === 'error' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-red-400 text-xs">
            <WifiOff className="w-4 h-4" />
            Gateway no disponible. Verifica la variable <code className="font-mono text-[10px] bg-zinc-800 px-1 rounded">WHATSAPP_GATEWAY_URL</code>.
          </div>
          <button onClick={() => setPhase('idle')} className="text-xs text-zinc-400 underline">
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Tab navigation ────────────────────────────────────────────────────────────

const SECTION_TABS: { id: ProviderCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'telegram', label: 'Telegram', icon: <Bot className="w-4 h-4" /> },
  { id: 'web', label: 'Web Widget', icon: <Globe className="w-4 h-4" /> },
  { id: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
  { id: 'crm', label: 'CRM', icon: <Link2 className="w-4 h-4" /> },
  { id: 'calendar', label: 'Calendario', icon: <Clock className="w-4 h-4" /> },
  { id: 'webhooks', label: 'Webhooks & APIs', icon: <Zap className="w-4 h-4" /> },
];

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ConnectivityStudio({ tenantId = 'default' }: { tenantId?: string }) {
  const [activeTab, setActiveTab] = useState<ProviderCategory>('whatsapp');
  const [selectedWaProvider, setSelectedWaProvider] = useState<string | null>(null);
  const [metaPhoneId, setMetaPhoneId] = useState('');
  const [metaToken, setMetaToken] = useState('');
  const [telegramToken, setTelegramToken] = useState('');
  const [savedMeta, setSavedMeta] = useState(false);
  const [savedTelegram, setSavedTelegram] = useState(false);

  const handleSaveMeta = async () => {
    // TODO: POST /api/v1/tenant/[tenantId]/connectors/whatsapp {provider: 'meta', phoneNumberId, token}
    setSavedMeta(true);
    setTimeout(() => setSavedMeta(false), 3000);
  };

  const handleSaveTelegram = async () => {
    // TODO: POST /api/v1/tenant/[tenantId]/connectors/telegram {token}
    setSavedTelegram(true);
    setTimeout(() => setSavedTelegram(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <Globe className="w-5 h-5 text-indigo-400" />
            </div>
            Connectivity Studio
          </h2>
          <p className="text-sm text-zinc-400 mt-1 font-light">
            Conecta tu empresa con Pandora's OS — canales, APIs, CRMs y más.
          </p>
        </div>
        <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30 text-xs font-mono">
          Studio #3
        </Badge>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {SECTION_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
              activeTab === tab.id
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
        >

          {/* ─── WhatsApp Providers ─── */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              {/* Provider comparison table */}
              <div className="border border-zinc-800/60 rounded-2xl bg-zinc-950/60 overflow-hidden">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left px-4 py-2.5 text-zinc-500 font-medium">Proveedor</th>
                      <th className="text-left px-4 py-2.5 text-zinc-500 font-medium">Cliente ideal</th>
                      <th className="text-left px-4 py-2.5 text-zinc-500 font-medium">Recomendación</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-zinc-800/50">
                      <td className="px-4 py-2.5 text-white font-medium">Meta Cloud API</td>
                      <td className="px-4 py-2.5 text-zinc-400">Empresas con operación crítica y volumen alto</td>
                      <td className="px-4 py-2.5"><span className="text-emerald-400">⭐ Recomendado para producción</span></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 text-white font-medium">Baileys QR Bridge</td>
                      <td className="px-4 py-2.5 text-zinc-400">Pymes, pruebas, pilotos y sandbox</td>
                      <td className="px-4 py-2.5"><span className="text-amber-400">⚠️ Conexión rápida — limitaciones de WA Web</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Provider selector */}
              <p className="text-xs text-zinc-400 font-light">Selecciona el proveedor activo para tu organización:</p>

              {WHATSAPP_PROVIDERS.map((provider) => {
                const isSelected = selectedWaProvider === provider.id;
                return (
                  <div
                    key={provider.id}
                    className={`border rounded-2xl p-5 transition-all ${
                      provider.available ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'
                    } ${isSelected ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700'}`}
                    onClick={() => provider.available && setSelectedWaProvider(isSelected ? null : provider.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 transition-all ${
                          isSelected ? 'border-indigo-400 bg-indigo-400' : 'border-zinc-600'
                        }`} />
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-medium text-white">{provider.name}</span>
                            <Badge className={`text-[9px] ${provider.badgeStyle}`}>{provider.badge}</Badge>
                          </div>
                          <p className="text-xs text-zinc-400 font-light">{provider.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Meta config */}
                    {isSelected && provider.id === 'meta' && (
                      <div className="mt-4 space-y-3 pl-7">
                        <div>
                          <label className="text-xs text-zinc-400 mb-1 block">Phone Number ID</label>
                          <input
                            type="text"
                            value={metaPhoneId}
                            onChange={(e) => setMetaPhoneId(e.target.value)}
                            placeholder="109823490..."
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-400 mb-1 block">Permanent Access Token</label>
                          <input
                            type="password"
                            value={metaToken}
                            onChange={(e) => setMetaToken(e.target.value)}
                            placeholder="EAABxxxxxx..."
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
                          />
                        </div>
                        <button
                          onClick={handleSaveMeta}
                          disabled={!metaPhoneId || !metaToken}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium transition-colors"
                        >
                          {savedMeta ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Settings2 className="w-4 h-4" />}
                          {savedMeta ? 'Guardado' : 'Guardar y Activar'}
                        </button>
                      </div>
                    )}

                    {/* Baileys QR */}
                    {isSelected && provider.id === 'baileys' && (
                      <div className="pl-7">
                        <BaileysQRScanner tenantId={tenantId} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── Telegram ─── */}
          {activeTab === 'telegram' && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400 font-light">
                Conecta un Bot de Telegram creado con @BotFather. Hermes Runtime responderá a los mensajes entrantes.
              </p>
              <div className="border border-zinc-800 rounded-2xl bg-zinc-900/30 p-5 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-medium text-white">Token del Bot</span>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Token de @BotFather</label>
                  <input
                    type="password"
                    value={telegramToken}
                    onChange={(e) => setTelegramToken(e.target.value)}
                    placeholder="1234567890:AAF..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
                <button
                  onClick={handleSaveTelegram}
                  disabled={!telegramToken}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium transition-colors"
                >
                  {savedTelegram ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Settings2 className="w-4 h-4" />}
                  {savedTelegram ? 'Guardado' : 'Guardar y Activar'}
                </button>
              </div>
            </div>
          )}

          {/* ─── Web Widget ─── */}
          {activeTab === 'web' && (
            <div className="border border-zinc-800 rounded-2xl bg-zinc-900/30 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium text-white">Embed de Web Widget</span>
              </div>
              <p className="text-xs text-zinc-400 font-light">
                Pega este script antes del cierre de <code className="font-mono text-[10px] bg-zinc-800 px-1 rounded">&lt;/body&gt;</code> en tu sitio web.
              </p>
              <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-[11px] text-emerald-300 overflow-x-auto">
{`<script
  src="https://dash.pandoras.finance/widget/hermes.js"
  data-tenant="${tenantId}"
  data-theme="dark"
  defer
></script>`}
              </pre>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Activo — sin configuración adicional
              </Badge>
            </div>
          )}

          {/* ─── Coming Soon ─── */}
          {(['email', 'crm', 'calendar', 'webhooks'] as ProviderCategory[]).includes(activeTab) && (
            <div className="border border-zinc-800/60 rounded-2xl bg-zinc-950/60 p-8 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-zinc-600 mx-auto" />
              <h3 className="text-sm font-medium text-zinc-400">
                {activeTab === 'email' && 'Email Provider (Resend / Postmark)'}
                {activeTab === 'crm' && 'CRM Connector (HubSpot / Salesforce / Zoho)'}
                {activeTab === 'calendar' && 'Calendar Connector (Google Calendar / Cal.com)'}
                {activeTab === 'webhooks' && 'Outbound Webhooks & Partner API Keys'}
              </h3>
              <p className="text-xs text-zinc-600 font-light max-w-sm mx-auto">
                En el catálogo de proveedores de Pandora's OS. Se habilitará en la siguiente fase de la hoja de ruta.
              </p>
              <Badge className="bg-zinc-800 text-zinc-500 border-zinc-700 text-[10px]">Próximamente</Badge>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
