'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  AlertTriangle,
  Flame,
  Sparkles,
  Info,
  Shield,
  CheckCircle2,
  Trash2,
  Eye,
  RefreshCw,
  ExternalLink,
  Users,
  User,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { NexusBroadcastRenderer } from './NexusBroadcastRenderer';
import type { NexusBroadcastItem } from './NexusCentralNotificationModal';

interface OperationsBroadcastTabProps {
  userName?: string;
  userEmail?: string;
  userRole?: string;
  collaborators?: any[];
}

const QUICK_EMOJIS = ['📢', '🚨', '🚀', '💡', '💎', '⚠️', '📌', '🔗', '✅', '🔥', '🎯', '🏛️'];

export function OperationsBroadcastTab({
  userName = 'Nexus Ops',
  userEmail = '',
  userRole = 'COLLABORATOR',
  collaborators = [],
}: OperationsBroadcastTabProps) {
  const normalizedRole = userRole.toUpperCase().trim();
  const isAdmin = normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'ADMIN';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'ANNOUNCEMENT' | 'ALERT' | 'UPDATE' | 'URGENT'>('ANNOUNCEMENT');
  const [targetType, setTargetType] = useState<'GLOBAL' | 'USER' | 'ROLE'>('GLOBAL');
  const [targetEmail, setTargetEmail] = useState('');
  const [targetRole, setTargetRole] = useState('COLLABORATOR');
  const [expiresInDays, setExpiresInDays] = useState('7');
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [recentBroadcasts, setRecentBroadcasts] = useState<NexusBroadcastItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  const fetchRecentBroadcasts = async () => {
    setIsLoadingList(true);
    try {
      const res = await fetch('/api/nexus/broadcasts?all=true');
      const data = await res.json();
      if (data.success && Array.isArray(data.broadcasts)) {
        setRecentBroadcasts(data.broadcasts);
      }
    } catch (err) {
      console.error('Error fetching broadcasts:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchRecentBroadcasts();
  }, []);

  const handleAddEmoji = (emoji: string) => {
    setContent((prev) => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + emoji + ' ');
  };

  const handlePublish = async () => {
    if (!isAdmin) {
      toast.error('Solo Administradores y SuperAdmins pueden publicar notificaciones.');
      return;
    }

    if (!title.trim()) {
      toast.error('Por favor escribe un título para la notificación.');
      return;
    }

    if (!content.trim()) {
      toast.error('Por favor redacta el cuerpo del mensaje.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Publicando notificación en Nexus...');

    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        type,
        targetType,
        targetEmail: targetType === 'USER' ? targetEmail.trim() : undefined,
        targetRole: targetType === 'ROLE' ? targetRole : undefined,
        authorName: userName,
        authorEmail: userEmail,
        authorRole: normalizedRole,
        expiresInDays: expiresInDays ? Number(expiresInDays) : undefined,
        notifyWhatsApp,
      };

      const res = await fetch('/api/nexus/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al emitir el broadcast');
      }

      const waCount = data.whatsappSummary?.dispatched || 0;
      const waSuffix = notifyWhatsApp ? ` (WhatsApp enviados: ${waCount})` : '';
      toast.success(`¡Notificación central emitida con éxito a Nexus!${waSuffix}`, { id: toastId });
      setTitle('');
      setContent('');
      setShowPreview(false);
      fetchRecentBroadcasts();
    } catch (err: any) {
      toast.error(err.message || 'Fallo al publicar', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/nexus/broadcasts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          isActive: !currentActive,
          authorRole: normalizedRole,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(currentActive ? 'Notificación archivada' : 'Notificación reactivada');
        fetchRecentBroadcasts();
      } else {
        toast.error(data.error || 'No se pudo actualizar el estado');
      }
    } catch (err) {
      toast.error('Error de red al actualizar estado');
    }
  };

  return (
    <div className="p-5 overflow-y-auto flex-1 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
            <Bell className="w-4 h-4 text-purple-400" />
            <span>NEXUS CENTRAL BROADCASTS</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Emite mensajes, avisos centrales o comunicados visibles para todos los usuarios de Nexus.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300">
            {isAdmin ? '🛡️ Acceso Operador (Admin)' : '👁️ Solo Lectura'}
          </span>
          <button
            onClick={fetchRecentBroadcasts}
            disabled={isLoadingList}
            className="p-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Access Warning if not admin */}
      {!isAdmin && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200">
            <p className="font-semibold">Permiso Restringido</p>
            <p className="text-zinc-400 mt-0.5 leading-relaxed">
              Solo los roles <strong>ADMIN</strong> y <strong>SUPER_ADMIN</strong> pueden emitir notificaciones centrales a toda la red. Tu rol actual es <span className="font-mono text-white">{normalizedRole}</span>.
            </p>
          </div>
        </div>
      )}

      {/* Broadcast Creation Form */}
      {isAdmin && (
        <div className="space-y-4 bg-zinc-950/60 p-5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-purple-300 uppercase tracking-wider">
              1. Redactar Nueva Notificación
            </span>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-[11px] font-mono flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-purple-400" />
              <span>{showPreview ? 'Ocultar Preview' : 'Ver Preview'}</span>
            </button>
          </div>

          {/* Type & Audience Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Type */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-zinc-400">Tipo de Notificación</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 'ANNOUNCEMENT', label: '📢 Anuncio', color: 'border-purple-500/30 bg-purple-500/10 text-purple-300' },
                  { id: 'ALERT', label: '⚠️ Alerta', color: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
                  { id: 'UPDATE', label: '💡 Update', color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
                  { id: 'URGENT', label: '🔥 Urgente', color: 'border-rose-500/40 bg-rose-500/20 text-rose-300' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id as any)}
                    className={`px-2 py-1.5 rounded-lg border text-xs font-medium transition-all text-center truncate ${
                      type === t.id ? `${t.color} ring-1 ring-white/20 font-bold` : 'border-white/5 bg-black/40 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Audience */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-zinc-400">Alcance / Destinatario</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'GLOBAL', label: '🌐 Todos' },
                  { id: 'USER', label: '👤 Usuario' },
                  { id: 'ROLE', label: '🛡️ Por Rol' },
                ].map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setTargetType(a.id as any)}
                    className={`px-2 py-1.5 rounded-lg border text-xs font-medium transition-all text-center truncate ${
                      targetType === a.id
                        ? 'border-indigo-500/40 bg-indigo-500/20 text-indigo-300 font-bold'
                        : 'border-white/5 bg-black/40 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Conditional target input */}
          {targetType === 'USER' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-zinc-400">Email del Colaborador Destino</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder="ej: usuario@pandoras.finance"
                  className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
                />
                {collaborators.length > 0 && (
                  <select
                    onChange={(e) => setTargetEmail(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-300 focus:outline-none"
                  >
                    <option value="">O seleccionar de la lista...</option>
                    {collaborators.map((c) => (
                      <option key={c.id} value={c.email}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          {targetType === 'ROLE' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-zinc-400">Rol Destino</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none"
              >
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                <option value="ADMIN">ADMIN</option>
                <option value="DEVELOPER">DEVELOPER</option>
                <option value="COLLABORATOR">COLLABORATOR</option>
                <option value="VIEWER">VIEWER</option>
              </select>
            </div>
          )}

          {/* Quick Emojis Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>Emojis Rápidos (clic para pegar al mensaje):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => handleAddEmoji(em)}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-sm transition-all hover:scale-110 active:scale-95"
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-zinc-400">Título de la Notificación</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ej: 🚀 Lanzamiento Oficial del Módulo de Inteligencia de Hermes"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          {/* Content (Textarea with Enters & Links) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono text-zinc-400">
                Mensaje (soporta enters, saltos de párrafo y links Markdown [texto](url) o URLs directas)
              </label>
              <span className="text-[10px] font-mono text-zinc-500">
                {content.length} caracteres
              </span>
            </div>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe el comunicado aquí...&#10;&#10;Puedes separar párrafos con Enter.&#10;Pega enlaces directos: https://pandoras.finance o en formato markdown: [Ver Guía](https://...)"
              className="w-full p-3.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 leading-relaxed font-sans"
            />
          </div>

          {/* Live Preview Card */}
          {showPreview && (title || content) && (
            <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 space-y-3">
              <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                <span className="text-[11px] font-mono text-purple-300 font-bold flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>VISTA PREVIA DE LA NOTIFICACIÓN CENTRAL</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  {targetType === 'GLOBAL' ? 'Para: Todos los usuarios' : targetType === 'USER' ? `Para: ${targetEmail || 'Usuario'}` : `Para rol: ${targetRole}`}
                </span>
              </div>
              <h4 className="text-base font-bold text-white">{title || 'Título de ejemplo'}</h4>
              <NexusBroadcastRenderer content={content || 'Cuerpo del mensaje de ejemplo con párrafos.'} />
            </div>
          )}

          {/* WhatsApp Notification Dispatch Channel */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-950/20">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 text-sm">
                📱
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-white">Notificar a WhatsApp de Colaboradores</p>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono">
                    Cloud API
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {targetType === 'GLOBAL'
                    ? 'Envía mensaje con detalles de la alerta a todos los colaboradores con WhatsApp vinculado.'
                    : targetType === 'USER'
                    ? `Envía mensaje directo al WhatsApp del colaborador (${targetEmail || 'destinatario'}).`
                    : `Envía mensaje al WhatsApp de los miembros con rol ${targetRole}.`}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifyWhatsApp}
                onChange={(e) => setNotifyWhatsApp(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-zinc-400">Vigencia:</span>
              <select
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-[11px] font-mono text-zinc-300 focus:outline-none"
              >
                <option value="3">3 Días</option>
                <option value="7">7 Días</option>
                <option value="30">30 Días</option>
                <option value="">Indefinido</option>
              </select>
            </div>

            <button
              onClick={handlePublish}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Emitiendo...' : 'Lanzar Notificación a Nexus'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Recent Broadcasts Management List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
            Avisos Emitidos Recientemente ({recentBroadcasts.length})
          </span>
        </div>

        {recentBroadcasts.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-white/5 bg-black/20 text-zinc-500 text-xs font-mono">
            No hay notificaciones emitidas aún.
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentBroadcasts.map((b: any) => {
              const isGlobal = b.targetType === 'GLOBAL';
              const createdStr = new Date(b.createdAt).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={b.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    b.isActive ? 'bg-black/40 border-white/10' : 'bg-black/20 border-white/5 opacity-50'
                  }`}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        b.type === 'ALERT' ? 'bg-amber-500/20 text-amber-300' :
                        b.type === 'URGENT' ? 'bg-rose-500/20 text-rose-300' :
                        b.type === 'UPDATE' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-purple-500/20 text-purple-300'
                      }`}>
                        {b.type}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-zinc-400">
                        {isGlobal ? '🌐 GLOBAL' : b.targetType === 'USER' ? `👤 ${b.targetEmail}` : `🛡️ ROL ${b.targetRole}`}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500">• {createdStr}</span>
                    </div>

                    <h4 className="text-sm font-semibold text-white truncate">{b.title}</h4>
                    <p className="text-xs text-zinc-400 line-clamp-1">{b.content}</p>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleActive(b.id, b.isActive)}
                        className={`px-3 py-1 rounded-lg border text-[11px] font-mono transition-colors ${
                          b.isActive
                            ? 'border-rose-500/30 text-rose-300 hover:bg-rose-500/10'
                            : 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10'
                        }`}
                      >
                        {b.isActive ? 'Archivar / Ocultar' : 'Reactivar'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
