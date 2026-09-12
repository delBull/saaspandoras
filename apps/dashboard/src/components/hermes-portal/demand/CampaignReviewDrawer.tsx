'use client';

/**
 * 🏛️ HERMES CAMPAIGN CONTENT REVIEW DRAWER
 * apps/dashboard/src/components/hermes-portal/demand/CampaignReviewDrawer.tsx
 *
 * Lightweight Content Review / Campaign Preview Layer.
 * "Hermes muestra decisiones y resultados. Media Co almacena y ejecuta producción."
 *
 * - Zero raw 4GB video masters; only lightweight thumbnails & web previews.
 * - Per-channel preview: Copy, Asset, CTA, Destination, Scheduled Time.
 * - Individual piece actions: [Approve], [Edit/Directive], [Reject].
 * - Post-publication: Transforms into an attributed performance surface (Reach, Clicks, Chats, Leads, Meetings).
 */

import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  MessageSquare,
  Users,
  Calendar,
  Send,
  Edit3,
  RotateCcw,
  Sparkles,
  BarChart3,
  Eye,
  FileText,
  Video,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ContentPiece, DemandCampaign } from '@/lib/hermes/demand/demand-distribution.service';

interface CampaignReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: DemandCampaign | null;
  onPieceUpdated: (updatedPiece: ContentPiece) => void;
}

export function CampaignReviewDrawer({
  isOpen,
  onClose,
  campaign,
  onPieceUpdated,
}: CampaignReviewDrawerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCopy, setEditedCopy] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isOpen || !campaign || !campaign.pieces || campaign.pieces.length === 0) {
    return null;
  }

  const pieces = campaign.pieces;
  const currentPiece = pieces[currentIndex] ?? pieces[0];

  if (!currentPiece) {
    return null;
  }

  const handleSelectPiece = (index: number) => {
    setCurrentIndex(index);
    setIsEditing(false);
    setEditedCopy(pieces[index]?.copy || '');
    setActionError(null);
  };

  const handleNext = () => {
    if (currentIndex < pieces.length - 1) {
      handleSelectPiece(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      handleSelectPiece(currentIndex - 1);
    }
  };

  const handlePieceAction = async (action: 'APPROVE' | 'REJECT' | 'EDIT') => {
    try {
      setSubmittingAction(true);
      setActionError(null);

      const res = await fetch('/api/v1/hermes/demand/review-piece', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign.id,
          pieceId: currentPiece.id,
          action,
          feedback: action === 'EDIT' ? { copy: editedCopy } : undefined,
        }),
      });

      const data = await res.json();
      if (data.ok && data.piece) {
        onPieceUpdated(data.piece);
        setIsEditing(false);
      } else {
        setActionError(data.message || 'Error al actualizar la pieza.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Fallo de red al enviar directiva a Media Co.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const isPublished = currentPiece.status === 'PUBLISHED';
  const isGenerating = currentPiece.status === 'GENERATING' || currentPiece.status === 'PENDING';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      {/* Drawer Container */}
      <div className="w-full max-w-2xl bg-[#0a0a0f] border-l border-zinc-800/90 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* ── HEADER ── */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-medium text-white tracking-tight">Campaign Content Review</h3>
                <Badge variant="outline" className="text-[10px] font-mono border-zinc-700 text-zinc-400">
                  {currentIndex + 1} / {pieces.length}
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 truncate max-w-sm">{campaign.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── PIECE SELECTOR NAVIGATION ── */}
        <div className="px-5 py-3 border-b border-zinc-800/60 bg-zinc-900/30 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="text-xs text-zinc-400 hover:text-white disabled:opacity-30 h-8 px-2"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
          </Button>

          {/* Numeric Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {pieces.map((p, idx) => {
              const isSelected = idx === currentIndex;
              const isApproved = p.status === 'APPROVED' || p.status === 'PUBLISHED';
              const isRejected = p.status === 'REJECTED';
              const isGen = p.status === 'GENERATING';

              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPiece(idx)}
                  className={`w-7 h-7 rounded-lg text-xs font-mono flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30 ring-1 ring-purple-400'
                      : isApproved
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                      : isRejected
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
                      : isGen
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30 animate-pulse'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            disabled={currentIndex === pieces.length - 1}
            className="text-xs text-zinc-400 hover:text-white disabled:opacity-30 h-8 px-2"
          >
            Siguiente <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* ── DRAWER BODY (SCROLLABLE) ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {actionError && (
            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* CHANNEL & STATUS HEADER */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/30 text-xs font-mono uppercase px-2.5 py-0.5">
                {currentPiece.channel.toUpperCase()} · {currentPiece.format}
              </Badge>
              <span className="text-xs text-zinc-500 font-mono">ID: {currentPiece.id}</span>
            </div>

            <Badge
              variant="outline"
              className={`text-xs font-mono ${
                currentPiece.status === 'PUBLISHED'
                  ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'
                  : currentPiece.status === 'APPROVED'
                  ? 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10'
                  : currentPiece.status === 'REJECTED'
                  ? 'border-rose-500/30 text-rose-400 bg-rose-500/5'
                  : currentPiece.status === 'GENERATING'
                  ? 'border-blue-500/30 text-blue-400 bg-blue-500/10 animate-pulse'
                  : 'border-amber-500/30 text-amber-400 bg-amber-500/10'
              }`}
            >
              {currentPiece.status}
            </Badge>
          </div>

          {/* ASSET PREVIEW (LIGHTWEIGHT) */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                {currentPiece.asset?.type === 'video' ? (
                  <Video className="w-4 h-4 text-purple-400" />
                ) : currentPiece.asset?.type === 'text' ? (
                  <FileText className="w-4 h-4 text-blue-400" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                )}
                <span className="font-medium text-white">Visual Preview</span>
                {currentPiece.asset?.dimensions && (
                  <span className="text-[10px] text-zinc-500 font-mono">({currentPiece.asset.dimensions})</span>
                )}
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">Lightweight projection</span>
            </div>

            {isGenerating ? (
              <div className="h-48 rounded-xl border border-dashed border-zinc-800 flex flex-col items-center justify-center bg-zinc-900/30 text-zinc-500 text-xs gap-2">
                <RotateCcw className="w-5 h-5 animate-spin text-purple-400" />
                <span>Sofia / Media Co está generando el render visual...</span>
              </div>
            ) : currentPiece.asset?.previewUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-black max-h-72 flex items-center justify-center">
                <img
                  src={currentPiece.asset.previewUrl}
                  alt={currentPiece.title}
                  className="w-full h-auto object-cover max-h-72 rounded-xl"
                  loading="lazy"
                />
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-zinc-800 text-[10px] font-mono text-zinc-400">
                  {currentPiece.asset.mimeType || 'web-optimized'}
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 text-center text-xs text-zinc-500">
                Esta pieza no requiere asset gráfico (formato basado en texto puro).
              </div>
            )}
          </div>

          {/* COPY & CONTENT DETAILS */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white">Copy & Publicación</span>
              {!isPublished && !isEditing && (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditedCopy(currentPiece.copy);
                  }}
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Editar copy
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={editedCopy}
                  onChange={(e) => setEditedCopy(e.target.value)}
                  rows={6}
                  className="w-full text-xs font-mono p-3 rounded-xl bg-zinc-900 border border-purple-500/50 text-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                  placeholder="Escribe las modificaciones para esta pieza..."
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    className="text-xs h-7 rounded-lg border-zinc-800 text-zinc-400"
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handlePieceAction('EDIT')}
                    disabled={submittingAction}
                    className="text-xs h-7 rounded-lg bg-purple-600 hover:bg-purple-500 text-white"
                  >
                    {submittingAction ? 'Guardando directiva...' : 'Guardar Directiva'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/60 text-xs text-zinc-300 font-light whitespace-pre-line leading-relaxed">
                {currentPiece.copy}
              </div>
            )}

            {/* CALL TO ACTION & DESTINATION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800/60 text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
                <span className="text-[10px] text-zinc-500 uppercase block font-mono">Call to Action</span>
                <strong className="text-purple-300 text-xs">{currentPiece.cta}</strong>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
                <span className="text-[10px] text-zinc-500 uppercase block font-mono">Destino (Golden Link)</span>
                <a
                  href={currentPiece.destination}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:underline text-xs flex items-center gap-1 truncate"
                >
                  <span className="truncate">{currentPiece.destination}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            </div>

            {/* SCHEDULED TIME */}
            <div className="flex items-center gap-2 text-xs text-zinc-400 pt-1">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>Programado: <strong className="text-zinc-300">{currentPiece.publishAt}</strong></span>
            </div>

            {/* ARTIFACT & PROVENANCE (F5/F6) */}
            {currentPiece.artifactId && (
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-2 border-t border-zinc-800/60">
                <span className="text-zinc-500">Sovereign Artifact:</span>
                <span className="text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 truncate max-w-[200px]">
                  {currentPiece.artifactId}
                </span>
              </div>
            )}
          </div>

          {/* FINANCIAL AUDIT 3-WAY BREAKDOWN (F5/F6) */}
          {currentPiece.financialBreakdown && (
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-4 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-zinc-500 uppercase text-[10px]">Auditoría Financiera GPU (3-Way)</span>
                <span className="text-emerald-400 text-[10px]">LEDGER SETTLED</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/50">
                  <span className="text-[9px] text-zinc-500 block uppercase">Raw GPU</span>
                  <span className="text-zinc-300 font-medium">${currentPiece.financialBreakdown.rawCostUsd.toFixed(4)}</span>
                </div>
                <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/50">
                  <span className="text-[9px] text-zinc-500 block uppercase">Markup (+35%)</span>
                  <span className="text-zinc-300 font-medium">${currentPiece.financialBreakdown.markupCostUsd.toFixed(4)}</span>
                </div>
                <div className="p-2 rounded-lg bg-zinc-950/60 border border-purple-500/30">
                  <span className="text-[9px] text-purple-400 block uppercase">Total Cobrado</span>
                  <span className="text-purple-300 font-bold">${currentPiece.financialBreakdown.totalChargedUsd.toFixed(4)}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── POST-PUBLICATION PERFORMANCE SURFACE (IF PUBLISHED) ── */}
          {isPublished && currentPiece.performance && (
            <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-950/20 to-zinc-950/40 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-medium text-white tracking-tight uppercase font-mono">
                    Performance Atribuida de la Pieza
                  </h4>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-mono">
                  LIVE TELEMETRY
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">Reach</span>
                  <strong className="text-sm text-zinc-300">
                    {currentPiece.performance.reach !== null ? currentPiece.performance.reach.toLocaleString() : '—'}
                  </strong>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">Clicks</span>
                  <strong className="text-sm text-indigo-300">
                    {currentPiece.performance.clicks !== null ? currentPiece.performance.clicks : '—'}
                  </strong>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">Conversations</span>
                  <strong className="text-sm text-purple-300">{currentPiece.performance.conversations}</strong>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">Leads</span>
                  <strong className="text-sm text-emerald-300">{currentPiece.performance.leads}</strong>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">Meetings</span>
                  <strong className="text-sm text-amber-300">{currentPiece.performance.meetings}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ACTIONS (PER-PIECE APPROVE/REJECT) ── */}
        {!isPublished && (
          <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/90 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePieceAction('REJECT')}
              disabled={submittingAction || currentPiece.status === 'REJECTED'}
              className="text-xs rounded-xl border-zinc-800 text-rose-400 hover:bg-rose-950/30 hover:border-rose-800/50"
            >
              Rechazar y Regenerar
            </Button>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => handlePieceAction('APPROVE')}
                disabled={submittingAction || currentPiece.status === 'APPROVED' || isGenerating}
                className="text-xs rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20"
              >
                {currentPiece.status === 'APPROVED' ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-300" /> Pieza Aprobada
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Aprobar Pieza
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
