'use client';

/**
 * 🏛️ HERMES DEMAND & DISTRIBUTION CONSOLE
 * apps/dashboard/src/components/hermes-portal/demand/DemandDistributionConsole.tsx
 *
 * "Turn your business knowledge into demand"
 *
 * Minimalist 4-Quadrant Architecture:
 * - A. Objective: Commercial goal selector
 * - B. Campaign: Recommended weekly campaign (CTA -> Hermes, CTA -> Agenda)
 * - C. Distribution: Channel checklist (Telegram, X, Newsletter, etc.)
 * - D. Results: Real business impact metrics (reach, clicks, chats, bookings)
 * + Closed-Loop Strategic Learning Card
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Target,
  Send,
  CheckCircle2,
  Circle,
  BarChart3,
  TrendingUp,
  Radio,
  Calendar,
  MessageSquare,
  Users,
  Briefcase,
  Layers,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  Zap,
  Eye,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type {
  DemandObjective,
  ObjectiveMetadata,
  DemandCampaign,
  ChannelStatus,
  CampaignPerformanceMetrics,
  StrategicInsight,
  ContentPiece,
} from '@/lib/hermes/demand/demand-distribution.service';
import { CampaignReviewDrawer } from './CampaignReviewDrawer';

interface DemandConsoleProps {
  organizationSlug: string;
}

export function DemandDistributionConsole({ organizationSlug }: DemandConsoleProps) {
  const [loading, setLoading] = useState(true);
  const [proposing, setProposing] = useState(false);
  const [approving, setApproving] = useState(false);
  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<DemandObjective>('GENERATE_LEADS');

  const [objectives, setObjectives] = useState<ObjectiveMetadata[]>([]);
  const [campaign, setCampaign] = useState<DemandCampaign | null>(null);
  const [channels, setChannels] = useState<ChannelStatus[]>([]);
  const [performance, setPerformance] = useState<CampaignPerformanceMetrics | null>(null);
  const [insight, setInsight] = useState<StrategicInsight | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load state from API
  const loadDemandState = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/hermes/demand', {
        headers: { 'Cache-Control': 'no-cache' },
      });
      const data = await res.json();
      if (data.ok) {
        setObjectives(data.objectives || []);
        setCampaign(data.activeCampaign || null);
        if (data.activeCampaign?.objective) {
          setSelectedObjective(data.activeCampaign.objective);
        }
        setChannels(data.channels || []);
        setPerformance(data.performance || null);
        setInsight(data.insight || null);
      }
    } catch (err) {
      console.error('Failed to load demand state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDemandState();
  }, [organizationSlug]);

  // Handle Propose Campaign
  const handleSelectObjective = async (obj: DemandObjective) => {
    setSelectedObjective(obj);
    try {
      setProposing(true);
      setFeedbackMessage(null);
      const res = await fetch('/api/v1/hermes/demand/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective: obj }),
      });
      const data = await res.json();
      if (data.ok && data.campaign) {
        setCampaign(data.campaign);
        setFeedbackMessage({ type: 'success', text: `Campaña para "${data.campaign.name}" formulada por Hermes.` });
      } else {
        setFeedbackMessage({ type: 'error', text: data.message || 'No se pudo generar la propuesta.' });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Error de red al formular campaña.' });
    } finally {
      setProposing(false);
    }
  };

  // Handle Approve & Distribute
  const handleApprove = async () => {
    if (!campaign) return;
    try {
      setApproving(true);
      setFeedbackMessage(null);
      const idempotencyKey = `idem_${organizationSlug}_${campaign.id}_${Date.now()}`;
      const res = await fetch('/api/v1/hermes/demand/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign.id,
          idempotencyKey,
        }),
      });
      const data = await res.json();
      if (data.ok && data.campaign) {
        setCampaign(data.campaign);
        setFeedbackMessage({
          type: 'success',
          text: `Campaña aprobada. Despachada a Sofia / Media Co hacia ${data.dispatchedChannels.join(', ').toUpperCase()}.`,
        });
        loadDemandState();
      } else {
        setFeedbackMessage({ type: 'error', text: data.message || 'Fallo durante el despacho de distribución.' });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Error al conectar con A2A Dispatcher.' });
    } finally {
      setApproving(false);
    }
  };

  // Sync piece update from CampaignReviewDrawer
  const handlePieceUpdated = (updatedPiece: ContentPiece) => {
    if (!campaign) return;
    const newPieces = (campaign.pieces || []).map((p) =>
      p.id === updatedPiece.id ? updatedPiece : p
    );
    setCampaign({
      ...campaign,
      pieces: newPieces,
    });
  };

  const unreadyPiecesCount =
    campaign?.pieces?.filter((p) => p.status === 'GENERATING' || p.status === 'PENDING').length || 0;

  return (
    <div className="min-h-screen bg-[#070709] text-white p-6 md:p-8 space-y-8 max-w-7xl mx-auto font-sans">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl md:text-3xl font-light tracking-tight text-white">
              Demand & Distribution
            </h1>
          </div>
          <p className="text-sm md:text-base text-zinc-400 font-light ml-11">
            Turn your business knowledge into demand · <span className="text-zinc-500">Convierte el conocimiento de tu negocio en demanda comercial</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDemandState}
            disabled={loading}
            className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 text-xs rounded-xl"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-3 border ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* ── 4 CUADRANTES DE OPERACIÓN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── CUADRANTE A: OBJECTIVE ── */}
        <div className="rounded-2xl border border-zinc-800/90 bg-zinc-950/60 backdrop-blur-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-400" />
                <h2 className="text-base font-medium text-white tracking-tight">A. Objective</h2>
              </div>
              <span className="text-xs text-zinc-500 font-mono">¿Qué quieres conseguir?</span>
            </div>

            <p className="text-xs text-zinc-400 font-light mb-5">
              Selecciona el objetivo comercial prioritario para esta semana. Hermes estructurará la campaña y las llamadas a la acción en consecuencia.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {objectives.map((obj) => {
                const isSelected = selectedObjective === obj.id;
                return (
                  <button
                    key={obj.id}
                    onClick={() => handleSelectObjective(obj.id)}
                    disabled={proposing}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/15 text-white shadow-lg shadow-purple-500/10'
                        : 'border-zinc-800/80 bg-zinc-900/40 text-zinc-400 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate">{obj.title}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-zinc-500 line-clamp-2 leading-tight">
                      {obj.recommendedFocus}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
            <span>Objetivo activo: <strong className="text-purple-300">{objectives.find(o => o.id === selectedObjective)?.title || 'Generar leads'}</strong></span>
            {proposing && <span className="text-purple-400 flex items-center gap-1 font-mono text-[11px]"><RefreshCw className="w-3 h-3 animate-spin" /> Formulando propuesta...</span>}
          </div>
        </div>

        {/* ── CUADRANTE B: CAMPAIGN ── */}
        <div className="rounded-2xl border border-zinc-800/90 bg-zinc-950/60 backdrop-blur-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-indigo-400" />
                <h2 className="text-base font-medium text-white tracking-tight">B. Campaign</h2>
              </div>
              <Badge
                className={`text-[10px] font-mono uppercase px-2 py-0.5 ${
                  campaign?.status === 'COMPLETED'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : campaign?.status === 'DISPATCHING'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                {campaign?.status || 'PROPOSED'}
              </Badge>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 mb-4">
              <h3 className="text-sm font-medium text-white mb-1">
                {campaign?.name || 'Campaña recomendada: Educación + Captación'}
              </h3>
              <p className="text-xs text-zinc-400 font-light mb-3">
                Basada en tu base de conocimiento y perfil de prospectos.
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/50">
                  <span className="text-[10px] text-zinc-500 uppercase block font-mono">Volumen</span>
                  <strong className="text-white text-sm">{campaign?.piecesCount || 5} piezas</strong> esta semana
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/50">
                  <span className="text-[10px] text-zinc-500 uppercase block font-mono">Canales</span>
                  <strong className="text-white text-sm">{campaign?.channelsCount || 3} canales</strong> activos
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-zinc-400 pt-2 border-t border-zinc-800/60">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">CTA Primario:</span>
                  <span className="text-purple-300 font-mono text-[11px]">{campaign?.primaryCta || 'CTA → Hermes Agent'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">CTA Secundario:</span>
                  <span className="text-indigo-300 font-mono text-[11px]">{campaign?.secondaryCta || 'CTA → Agenda Soberana'}</span>
                </div>
              </div>
            </div>

            {/* ── EXPANDABLE CONTENT PREVIEW SNIPPET LIST ── */}
            {campaign?.pieces && campaign.pieces.length > 0 && (
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5 space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-white">
                    <Eye className="w-3.5 h-3.5 text-purple-400" />
                    <span>CONTENT PREVIEW</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {campaign.pieces.filter((p) => p.status === 'APPROVED' || p.status === 'PUBLISHED').length} / {campaign.pieces.length} aprobadas
                  </span>
                </div>

                <div className="space-y-2">
                  {campaign.pieces.slice(0, 4).map((piece, idx) => (
                    <div
                      key={piece.id}
                      onClick={() => setReviewDrawerOpen(true)}
                      className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/60 hover:border-zinc-700 cursor-pointer transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded flex items-center justify-center bg-zinc-800 text-[10px] font-mono text-zinc-400 shrink-0">
                          {piece.asset?.type === 'video' ? '▶' : piece.asset?.type === 'text' ? 'T' : 'IMG'}
                        </span>
                        <div className="truncate">
                          <span className="text-zinc-300 font-medium truncate block text-[11px]">
                            {piece.title}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono uppercase">
                            {piece.channel} · {piece.format}
                          </span>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={`text-[9px] font-mono shrink-0 ml-2 ${
                          piece.status === 'APPROVED' || piece.status === 'PUBLISHED'
                            ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                            : piece.status === 'GENERATING'
                            ? 'border-blue-500/30 text-blue-400 animate-pulse'
                            : 'border-zinc-800 text-zinc-400'
                        }`}
                      >
                        {piece.status}
                      </Badge>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReviewDrawerOpen(true)}
                  className="w-full text-xs h-7 rounded-lg border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" /> Review all ({campaign.piecesCount || campaign.pieces.length})
                </Button>
              </div>
            )}

            {/* GATING NOTICE IF CONTENT IS STILL BEING GENERATED */}
            {unreadyPiecesCount > 0 && (
              <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-500/30 text-blue-300 text-xs flex items-center gap-2 mb-3">
                <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0 text-blue-400" />
                <span>Your campaign is almost ready. {unreadyPiecesCount} piece(s) still being generated by Sofia.</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectObjective(selectedObjective)}
                disabled={approving || proposing}
                className="border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white text-xs rounded-xl"
              >
                Regenerar
              </Button>

              {campaign?.pieces && campaign.pieces.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReviewDrawerOpen(true)}
                  className="border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 text-xs rounded-xl"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  Review
                </Button>
              )}
            </div>

            <Button
              size="sm"
              onClick={handleApprove}
              disabled={
                approving ||
                campaign?.status === 'COMPLETED' ||
                campaign?.status === 'DISPATCHING' ||
                unreadyPiecesCount > 0
              }
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-medium px-5 rounded-xl transition-all shadow-lg shadow-purple-600/20 disabled:opacity-40"
            >
              {approving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Despachando A2A...
                </>
              ) : campaign?.status === 'COMPLETED' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-300" />
                  Distribuida Exitosamente
                </>
              ) : unreadyPiecesCount > 0 ? (
                <>
                  <Clock className="w-3.5 h-3.5 mr-2" />
                  Generando piezas...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 mr-2" />
                  Aprobar y Distribuir
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ── CUADRANTE C: DISTRIBUTION ── */}
        <div className="rounded-2xl border border-zinc-800/90 bg-zinc-950/60 backdrop-blur-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h2 className="text-base font-medium text-white tracking-tight">C. Distribution</h2>
              </div>
              <span className="text-xs text-zinc-500 font-mono">THIS WEEK</span>
            </div>

            <p className="text-xs text-zinc-400 font-light mb-4">
              Intersección dinámica de canales conectados y autorizados por Media Co.
            </p>

            <div className="space-y-2.5 mb-6">
              {channels.map((ch) => (
                <div
                  key={ch.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/70"
                >
                  <div className="flex items-center gap-3">
                    {ch.isAvailable ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-zinc-600" />
                    )}
                    <div>
                      <span className="text-xs font-medium text-white block">{ch.name}</span>
                      <span className="text-[10px] text-zinc-500">
                        {ch.isAvailable ? 'Conectado · Listo para despacho' : 'No conectado en Ajustes'}
                      </span>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-[10px] font-mono ${
                      ch.isAvailable
                        ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'
                        : 'border-zinc-800 text-zinc-600 bg-zinc-900/20'
                    }`}
                  >
                    {ch.isAvailable ? 'ACTIVO' : 'INACTIVO'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
            <span><strong>{campaign?.piecesCount || 5}</strong> pieces</span>
            <span className="text-zinc-600">·</span>
            <span><strong>{channels.filter(c => c.isAvailable).length}</strong> channels</span>
            <span className="text-zinc-600">·</span>
            <span><strong>1</strong> campaign</span>
          </div>
        </div>

        {/* ── CUADRANTE D: RESULTS ── */}
        <div className="rounded-2xl border border-zinc-800/90 bg-zinc-950/60 backdrop-blur-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <h2 className="text-base font-medium text-white tracking-tight">D. Results</h2>
              </div>
              <span className="text-xs text-zinc-500 font-mono">CAMPAIGN PERFORMANCE</span>
            </div>

            <p className="text-xs text-zinc-400 font-light mb-4">
              Métricas reales de impacto comercial atribuido a las campañas y Golden Links.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/70">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Content distributed</span>
                <span className="text-lg font-light text-white">{performance?.contentDistributed ?? 5}</span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/70">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Reach</span>
                <span className="text-lg font-light text-zinc-400">{performance?.reach !== null && performance?.reach !== undefined ? performance.reach.toLocaleString() : '—'}</span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/70">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Clicks (Golden Links)</span>
                <span className="text-lg font-light text-indigo-300">{performance?.clicks !== null && performance?.clicks !== undefined ? performance.clicks : '—'}</span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/70">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Hermes conversations</span>
                <span className="text-lg font-light text-purple-300">{performance?.hermesConversations ?? 0}</span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/70">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Qualified leads</span>
                <span className="text-lg font-light text-emerald-300">{performance?.qualifiedLeads ?? 0}</span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/70">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Meetings booked</span>
                <span className="text-lg font-light text-amber-300">{performance?.meetingsBooked ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
            <span>Opportunities cerradas: <strong className="text-white">{performance?.opportunities !== null && performance?.opportunities !== undefined ? performance.opportunities : '—'}</strong></span>
            <span className="text-[11px] font-mono">Ventana: últimos 7 días</span>
          </div>
        </div>
      </div>

      {/* ── CLOSED-LOOP STRATEGIC LEARNING CARD ── */}
      {insight && (
        <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-950/20 via-zinc-950/40 to-indigo-950/20 p-6 backdrop-blur-xl">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-[10px] font-mono uppercase">
                  Hermes Strategic Learning
                </Badge>
                <span className="text-xs text-zinc-500">{insight.metricComparison}</span>
              </div>
              <h4 className="text-sm font-medium text-white">{insight.headline}</h4>
              <p className="text-xs text-zinc-300 font-light leading-relaxed">
                {insight.recommendation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── CAMPAIGN CONTENT REVIEW DRAWER ── */}
      <CampaignReviewDrawer
        isOpen={reviewDrawerOpen}
        onClose={() => setReviewDrawerOpen(false)}
        campaign={campaign}
        onPieceUpdated={handlePieceUpdated}
      />
    </div>
  );
}
