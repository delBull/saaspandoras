'use client';

/**
 * 🎨 HERMES MEDIA STUDIO — TENANT SELF-SERVICE CONSOLE
 * apps/dashboard/src/components/hermes-portal/media/MediaStudioDashboard.tsx
 *
 * Mounted at /portal/[organizationSlug]/media for the tenant's OWN workspace.
 * Tenant identity is derived from the portal session (resolvePortalContext),
 * NOT from client-supplied tenant selectors.
 *
 * 1. Generates media via A2A Protocol v1.1 (capability.request → Sofía).
 * 2. Requests Media Co ACTIVATION for capabilities not yet granted (self-service
 *    request that routes a Discord + Hermes bot notification to ops).
 * 3. Inspects sovereign IPFS artifacts with cryptographic provenance.
 *
 * Grant toggle/approval is admin-only (Hermes Tenants tab → /admin/dashboard).
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Video,
  FileText,
  Radio,
  Search,
  Lock,
  CheckCircle2,
  Clock,
  Layers,
  RefreshCw,
  ExternalLink,
  Sliders,
  Send,
  AlertCircle,
  Megaphone,
  FlaskConical,
  Coins,
  Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInspector } from '../InspectorContext';
import { CreditTopupModal } from './CreditTopupModal';

const CAPABILITY_SPECS: Record<string, {
  title: string;
  type: string;
  description: string;
  engine: string;
  producer: string;
  outputFormat: string;
  sovereignProof: string;
}> = {
  'media.image.create': {
    title: 'Generación de Fotos & Renders',
    type: 'Media.Image',
    description: 'Renderizado generativo fotorrealista y assets de branding con trazabilidad en IPFS.',
    engine: 'A2A Protocol v1.1 + SDXL Pipeline',
    producer: 'Pixel (Creative Diffusion Agent)',
    outputFormat: 'WebP / PNG 2048x2048 Master',
    sovereignProof: 'K25 Sovereign Knowledge Vault + IPFS CID',
  },
  'media.video.create': {
    title: 'Producción de Videos & Reels',
    type: 'Media.Video',
    description: 'Generación de micro-videos cinemáticos y motion graphics para captación de inversionistas.',
    engine: 'Hermes Video Motion Engine (A2A)',
    producer: 'Sofía & Pixel Video Unit',
    outputFormat: 'MP4 4K / 60fps Web3 Master',
    sovereignProof: 'EIP-712 Cryptographic Signature',
  },
  'media.copy.create': {
    title: 'Redacción de Copies & Textos',
    type: 'Media.Copy',
    description: 'Copywriting persuasivo multicanal adaptado a la narrativa y tono del proyecto.',
    engine: 'Hermes LLM Prompt Engine',
    producer: 'Sofía (Growth Director)',
    outputFormat: 'Markdown / HTML Rich Snippet',
    sovereignProof: 'K26/K27 Immutable Knowledge Hash',
  },
  'media.newsletter.create': {
    title: 'Estructuración de Newsletter',
    type: 'Media.Editorial',
    description: 'Boletines institucionales periódicos para inversionistas y miembros de la DAO.',
    engine: 'Omnichannel Editorial Synthesizer',
    producer: 'Sofía Editorial Agent',
    outputFormat: 'HTML Email Template + IPFS Mirror',
    sovereignProof: 'Merkle Root Registry Proof',
  },
  'media.podcast.create': {
    title: 'Podcast & Audio Sintético',
    type: 'Media.Audio',
    description: 'Episodios de audio con voces neuronales para resúmenes de gobernanza y producto.',
    engine: 'Neural Voice Synthesis (ElevenLabs A2A)',
    producer: 'Hermes Audio Unit',
    outputFormat: 'MP3 320kbps High Fidelity',
    sovereignProof: 'IPFS Content-Addressed Storage',
  },
  'research.report.create': {
    title: 'Reportes de Research & Mercado',
    type: 'Media.Research',
    description: 'Análisis de mercado, benchmarking competitivo y proyecciones de retorno RWA.',
    engine: 'Hermes Deep Research Engine',
    producer: 'Hermes Intelligence Officer',
    outputFormat: 'PDF Document + On-Chain Attestation',
    sovereignProof: 'Hermes Sovereign Notarization',
  },
};

interface CapabilityItem {
  capability: string;
  label: string;
  enabled: boolean;
  status: string;
}

interface ArtifactItem {
  id: string;
  artifactId: string;
  tenantId: string;
  artifactType: string;
  title: string;
  cid: string;
  ipfsUri: string;
  sha256: string;
  mimeType: string;
  producer: string;
  sourceAgent: string;
  createdAt: string;
  provenanceJson?: Record<string, any> | null;
  metadataJson?: Record<string, any> | null;
  isSandbox?: boolean;
}

export function MediaStudioDashboard({ organizationSlug }: { organizationSlug: string }) {
  const tenantId = organizationSlug || 'snarai';
  const [capabilities, setCapabilities] = useState<CapabilityItem[]>([]);
  const [artifacts, setArtifacts] = useState<ArtifactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCap, setSelectedCap] = useState<string>('media.image.create');
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [dispatching, setDispatching] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<{ ok: boolean; message: string } | null>(null);

  // Activation Request State
  const [activationStatus, setActivationStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [activating, setActivating] = useState(false);

  // Tenant Credits & Sandbox Mode State
  const [credits, setCredits] = useState<{
    creditBalanceUsd: number;
    sandboxBalanceUsd: number;
    markupPercentage: number;
    isSandboxEnabled: boolean;
  } | null>(null);
  const [isSandboxMode, setIsSandboxMode] = useState<boolean>(true);
  const [topupModalOpen, setTopupModalOpen] = useState<boolean>(false);

  // Load capabilities, artifacts, and credits
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Grants (server-side portal session scopes to own tenant)
      const grantsRes = await fetch(`/api/v1/hermes/tenants/grants?tenantId=${tenantId}`);
      const grantsData = await grantsRes.json();
      if (grantsData.ok) {
        setCapabilities(grantsData.grants || []);
      }

      // 2. Fetch Artifacts
      const artRes = await fetch(`/api/v1/hermes/media/artifacts?tenantId=${tenantId}`);
      const artData = await artRes.json();
      if (artData.ok) {
        setArtifacts(artData.artifacts || []);
      }

      // 3. Fetch Tenant Credits & Sandbox Status
      const credsRes = await fetch(`/api/v1/hermes/media/credits?tenantId=${tenantId}`);
      const credsData = await credsRes.json();
      if (credsData.ok && credsData.credits) {
        setCredits(credsData.credits);
      }
    } catch (err) {
      console.error('Error loading media dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const { inspect } = useInspector();

  useEffect(() => {
    const spec = CAPABILITY_SPECS[selectedCap] || {
      title: selectedCap,
      type: 'Media.A2A',
      description: 'Capacidad de producción multimedia Hermes A2A.',
      engine: 'A2A Protocol v1.1',
      producer: 'Sofía & Pixel',
      outputFormat: 'Verificado en IPFS',
      sovereignProof: 'K25 Sovereign Knowledge Vault',
    };

    const isGranted = capabilities.find(c => c.capability === selectedCap)?.enabled ?? false;

    inspect({
      title: spec.title,
      type: spec.type,
      description: spec.description,
      badge: isGranted ? 'CAPACIDAD ACTIVA' : 'BLOQUEADO • REQUIERE ACTIVACIÓN',
      badgeColor: isGranted ? 'emerald' : 'amber',
      attributes: {
        'Identificador': selectedCap,
        'Estado en Bóveda': isGranted ? 'Habilitado para @' + tenantId : 'Bloqueado por Gobernanza',
        'Motor de IA': spec.engine,
        'Agente Productor': spec.producer,
        'Formato de Salida': spec.outputFormat,
        'Prueba Criptográfica': spec.sovereignProof,
        'Tenant Asignado': `@${tenantId}`,
      },
      complianceNote: isGranted
        ? 'Capacidad verificada y aprobada para producción continua con almacenamiento en IPFS.'
        : 'Para habilitar este módulo, envía la solicitud al equipo Hermes con el botón de activación.',
    });
  }, [selectedCap, capabilities, tenantId, inspect]);

  const handleInspectArtifact = (art: ArtifactItem) => {
    const isTest = Boolean(art.provenanceJson?.isSandbox || art.metadataJson?.isSandbox);
    inspect({
      title: art.title,
      type: `Artifact.${art.artifactType.toUpperCase()}`,
      description: `Pieza verificada producida por ${art.producer || 'Pixel'} (${art.sourceAgent || 'Sofía'})`,
      badge: isTest ? 'TEST • MODO SANDBOX' : 'IPFS VERIFICADO',
      badgeColor: isTest ? 'amber' : 'emerald',
      attributes: {
        'Artifact ID': art.artifactId,
        'CID': art.cid,
        'Ambiente': isTest ? 'Prueba / Sandbox (No oficial)' : 'Producción Soberana',
        'Tipo MIME': art.mimeType || 'image/png',
        'Agente Creador': art.producer || 'Pixel',
        'SHA256 Hash': art.sha256 ? `${art.sha256.slice(0, 10)}...${art.sha256.slice(-8)}` : 'Verificado',
        'Fecha de Notarización': new Date(art.createdAt).toLocaleString(),
        'Enlace IPFS': art.ipfsUri,
      },
      complianceNote: isTest
        ? 'Pieza generada en ambiente de pruebas (Sandbox). No computa en métricas de producción ni en campañas oficiales.'
        : 'El contenido está firmado criptográficamente y protegido en el Sovereign Knowledge Vault.',
    });
  };

  // Request Media Co Activation (self-service → Discord + Hermes bot)
  const handleRequestActivation = async (capability: string, label: string) => {
    setActivating(true);
    setActivationStatus(null);
    try {
      const res = await fetch('/api/v1/hermes/media/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, capability }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setActivationStatus({
          ok: true,
          message: `✅ Activación de '${label}' solicitada. El equipo Hermes ha sido notificado y la aprobará desde la consola de administración.`,
        });
      } else {
        setActivationStatus({
          ok: false,
          message: data.error || 'Error al solicitar la activación',
        });
      }
    } catch (err: any) {
      setActivationStatus({
        ok: false,
        message: err?.message || 'Error de conexión al solicitar activación',
      });
    } finally {
      setActivating(false);
    }
  };

  // Dispatch Media Generation Request
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setDispatching(true);
    setDispatchStatus(null);

    try {
      const res = await fetch('/api/v1/hermes/media/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          capability: selectedCap,
          prompt,
          isSandbox: isSandboxMode,
          options: {
            aspectRatio,
            requestedAt: new Date().toISOString(),
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setDispatchStatus({
          ok: true,
          message: `✅ Solicitud enviada a Sofía (Media Co). Tracking ID: ${data.requestId}`,
        });
        setPrompt('');
        // Refresh artifacts after a brief moment
        setTimeout(loadData, 2000);
      } else {
        setDispatchStatus({
          ok: false,
          message: data.error || 'Error al despachar la solicitud a Media Co',
        });
      }
    } catch (err: any) {
      setDispatchStatus({
        ok: false,
        message: err?.message || 'Error de conexión con el A2A Dispatcher',
      });
    } finally {
      setDispatching(false);
    }
  };

  const isCurrentCapEnabled = capabilities.find(c => c.capability === selectedCap)?.enabled ?? false;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 text-zinc-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Hermes Media Factory & Studio</h1>
              <p className="text-sm text-zinc-400">
                A2A Protocol v1.1 • Orquestación creativa con Sofía & Pixel sobre IPFS Soberano
              </p>
            </div>
          </div>
        </div>

        {/* Tenant Scope, Sandbox Switcher, Credits & Refresh */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Mode Switcher */}
          <button
            onClick={() => setIsSandboxMode(!isSandboxMode)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              isSandboxMode
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
            }`}
            title="Cambiar entre modo Sandbox de prueba y producción real"
          >
            {isSandboxMode ? (
              <>
                <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
                <span>Modo Prueba (Sandbox)</span>
              </>
            ) : (
              <>
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span>Modo Producción</span>
              </>
            )}
          </button>

          {/* Balance Pill */}
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 ${
              isSandboxMode
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>
              {isSandboxMode
                ? `Test: $${credits ? credits.sandboxBalanceUsd.toFixed(2) : '0.00'} USD`
                : `Créditos: $${credits ? credits.creditBalanceUsd.toFixed(2) : '0.00'} USD`}
            </span>
          </div>

          {/* Topup Button */}
          <Button
            size="sm"
            onClick={() => setTopupModalOpen(true)}
            className="h-8 px-3 rounded-xl border border-purple-500/40 bg-purple-500/15 hover:bg-purple-500/25 text-purple-200 text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Coins className="w-3.5 h-3.5 text-purple-400" />
            <span>Recargar</span>
          </Button>

          <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/30 font-mono text-xs px-3 py-1.5">
            @{tenantId}
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ─── MEDIA STUDIO ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Studio Composer */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <Sliders className="w-5 h-5 text-purple-400" />
                  Compositor Creativo
                </h2>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  isSandboxMode
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                }`}>
                  {isSandboxMode ? 'SANDBOX ACTIVO' : 'PRODUCCIÓN RUNPOD'}
                </span>
              </div>

              {/* Sandbox vs Prod banner */}
              {isSandboxMode ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Modo Pruebas Sandbox (Mínimo de recarga: $5 USD). Aislado de producción.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTopupModalOpen(true)}
                    className="underline font-bold text-amber-300 hover:text-amber-100 shrink-0 text-xs cursor-pointer ml-2"
                  >
                    + Recargar
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>RunPod Serverless activo (scale-to-zero). Descuenta de tus créditos oficiales.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTopupModalOpen(true)}
                    className="underline font-bold text-emerald-300 hover:text-emerald-100 shrink-0 text-xs cursor-pointer ml-2"
                  >
                    + Recargar
                  </button>
                </div>
              )}

              {/* Capability Selection */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider font-mono">
                  Tipo de Capacidad
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'media.image.create', label: 'Fotos / Renders', icon: ImageIcon },
                    { id: 'media.video.create', label: 'Video / Reels', icon: Video },
                    { id: 'media.copy.create', label: 'Copies / Textos', icon: FileText },
                    { id: 'media.newsletter.create', label: 'Newsletter', icon: Layers },
                    { id: 'media.podcast.create', label: 'Podcast', icon: Radio },
                    { id: 'research.report.create', label: 'Research', icon: Search },
                  ].map(item => {
                    const isGranted = capabilities.find(c => c.capability === item.id)?.enabled;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedCap(item.id)}
                        className={`p-3 sm:p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                          selectedCap === item.id
                            ? 'border-purple-500 bg-purple-500/15 shadow-lg shadow-purple-950/40 text-white ring-1 ring-purple-500/30'
                            : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className={`p-1.5 rounded-lg ${selectedCap === item.id ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-zinc-400'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          {isGranted ? (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Activo
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-400 border border-zinc-700/60">
                              Bloqueado
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-semibold tracking-tight text-white/90">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Capability Status Banner */}
              {!isCurrentCapEnabled ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col gap-3 w-full overflow-hidden">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                    <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 shrink-0">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">Capacidad no autorizada para @{tenantId}</span>
                  </div>
                  <p className="text-amber-200/80 text-[11px] leading-relaxed">
                    Solicita la activación para que el equipo Hermes habilite la producción de este formato en tu espacio.
                  </p>
                  <Button
                    size="sm"
                    disabled={activating}
                    onClick={() => {
                      const cap = capabilities.find(c => c.capability === selectedCap);
                      handleRequestActivation(selectedCap, cap?.label || selectedCap);
                    }}
                    className="w-full h-auto py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-semibold gap-2 rounded-lg cursor-pointer transition-all flex items-center justify-center"
                  >
                    <Megaphone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{activating ? 'Solicitando...' : 'Solicitar Activación'}</span>
                  </Button>
                </div>
              ) : null}

              {activationStatus && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                    activationStatus.ok
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      : 'bg-red-500/10 border-red-500/20 text-red-300'
                  }`}
                >
                  {activationStatus.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <span>{activationStatus.message}</span>
                </div>
              )}

              {/* Prompt Input */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Prompt o Instrucción Creativa
                </label>
                <textarea
                  rows={4}
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder={`Ej: Rooftop lounge al atardecer en Bucerías, iluminación dorada cálida, estilo editorial arquitectónico de alta gama para ${tenantId}...`}
                  className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl p-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/60 transition-all resize-none"
                />
              </div>

              {/* Aspect Ratio (if image/video) */}
              {(selectedCap.includes('image') || selectedCap.includes('video')) && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Aspect Ratio
                  </label>
                  <div className="flex gap-2">
                    {['16:9', '9:16', '1:1', '4:3'].map(ratio => (
                      <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${
                          aspectRatio === ratio
                            ? 'border-purple-500 bg-purple-500/10 text-white'
                            : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dispatch Action */}
              <Button
                disabled={!isCurrentCapEnabled || dispatching || !prompt.trim()}
                onClick={handleGenerate}
                className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-purple-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {dispatching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Despachando a Sofía (A2A)...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Generar vía Media Co (Sofía)
                  </>
                )}
              </Button>

              {/* Feedback Status */}
              {dispatchStatus && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                    dispatchStatus.ok
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      : 'bg-red-500/10 border-red-500/20 text-red-300'
                  }`}
                >
                  {dispatchStatus.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <span>{dispatchStatus.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Artifacts Gallery */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                <Layers className="w-5 h-5 text-purple-400" />
                Artefactos Verificados en IPFS ({artifacts.length})
              </h2>
              <span className="text-xs text-zinc-500 font-mono">
                Scope: {tenantId.toUpperCase()}
              </span>
            </div>

            {artifacts.length === 0 ? (
              <div className="p-12 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-zinc-800/60 flex items-center justify-center mx-auto text-zinc-500">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-medium text-zinc-300">No hay artefactos registrados todavía</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Genera una pieza creativa con el compositor para que Sofía y Pixel la produzcan y publiquen en IPFS.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {artifacts.map(art => (
                  <div
                    key={art.id}
                    onClick={() => handleInspectArtifact(art)}
                    className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-purple-500/50 hover:bg-zinc-900/80 transition-all space-y-3 cursor-pointer group shadow-sm"
                    title="Haz clic para inspeccionar detalles criptográficos en el Inspector"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px]">
                          {art.artifactType.toUpperCase()}
                        </Badge>
                        {(art.provenanceJson?.isSandbox || art.metadataJson?.isSandbox) && (
                          <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[9px] font-mono">
                            TEST / SANDBOX
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {new Date(art.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-purple-300 transition-colors">{art.title}</h4>
                      <p className="text-xs text-zinc-400 font-mono mt-1 truncate">
                        CID: {art.cid}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
                      <span className="text-[11px]">Producer: <strong className="text-zinc-200">{art.producer || 'Pixel'}</strong></span>
                      <a
                        href={`https://ipfs.io/ipfs/${art.cid}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium text-[11px]"
                      >
                        Ver en IPFS <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      {/* Credit Topup Modal */}
      <CreditTopupModal
        isOpen={topupModalOpen}
        onClose={() => setTopupModalOpen(false)}
        tenantId={tenantId}
        defaultSandbox={isSandboxMode}
        onSuccess={loadData}
      />
    </div>
  );
}
