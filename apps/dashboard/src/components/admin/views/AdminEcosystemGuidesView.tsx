'use client';

/**
 * 🧭 ADMIN ECOSYSTEM GUIDES CONTROL PLANE & CUSTOMIZER
 * apps/dashboard/src/components/admin/views/AdminEcosystemGuidesView.tsx
 *
 * Master cockpit for platform operators to inspect, customize, preview,
 * and dispatch Hermes Reconnaissance Guides for both internal team roles (Nexus)
 * and client tenant verticals (RWA, SaaS B2B, Creators).
 */

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Share2,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Eye,
  Shield,
  Layers,
  Sparkles,
  Bot,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Edit3,
  Plus,
  RotateCcw,
  Sliders,
  Building2,
  Users,
  Zap,
  Landmark,
  X,
  Trash2,
  Save,
} from 'lucide-react';
import {
  EcosystemTourRole,
  ECOSYSTEM_STATIONS,
  getStationsForRole,
  generateTourShareLink,
  generateWhatsAppShareText,
  EcosystemStation,
} from '@/lib/guides/ecosystem-guides.data';
import {
  TenantVertical,
  TENANT_VERTICALS_CONFIG,
  getStationsForTenantVertical,
  generateTenantTourShareLink,
  generateTenantWhatsAppShareText,
} from '@/lib/guides/tenant-vertical-guides.data';
import { HermesFloatingGuide } from '@/components/guides/HermesFloatingGuide';

const ROLES_CONFIG: {
  role: EcosystemTourRole;
  label: string;
  badgeClass: string;
  description: string;
}[] = [
  {
    role: 'SUPER_ADMIN',
    label: 'Super Admin',
    badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    description: 'Sovereign Owner. Acceso total a infraestructura HQ, bóveda constitucional y gobierno.',
  },
  {
    role: 'ADMIN',
    label: 'Administrador',
    badgeClass: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    description: 'Gestión de operaciones, Deal Rooms, finanzas RWA, academia y gobierno de plataforma.',
  },
  {
    role: 'MANAGER',
    label: 'Manager / Operador',
    badgeClass: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    description: 'Operación de Deal Rooms, pipeline comercial CRM, aprobaciones RWA y certificación académica.',
  },
  {
    role: 'COLLABORATOR',
    label: 'Colaborador',
    badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    description: 'Acceso focalizado al pipeline comercial de Growth OS y portales de proyectos.',
  },
];

export function AdminEcosystemGuidesView() {
  // Main Navigation Modes
  const [guideMode, setGuideMode] = useState<'ROLES' | 'VERTICALS'>('ROLES');

  // Role State (for Nexus)
  const [selectedRole, setSelectedRole] = useState<EcosystemTourRole>('SUPER_ADMIN');

  // Tenant Vertical State (for Clients)
  const [selectedVertical, setSelectedVertical] = useState<TenantVertical>('RWA_REAL_ESTATE');
  const [tenantSlug, setTenantSlug] = useState('snarai');

  // Customization & Toggle State
  const [disabledStationIds, setDisabledStationIds] = useState<Record<string, boolean>>({});
  const [customStationOverrides, setCustomStationOverrides] = useState<Record<string, EcosystemStation>>({});
  const [extraStations, setExtraStations] = useState<EcosystemStation[]>([]);

  // Editing Station Modal
  const [editingStation, setEditingStation] = useState<EcosystemStation | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Sharing & Preview Feedback
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWaText, setCopiedWaText] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Load custom configurations from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pandoras_guides_customizer_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.disabledStationIds) setDisabledStationIds(parsed.disabledStationIds);
        if (parsed.customStationOverrides) setCustomStationOverrides(parsed.customStationOverrides);
        if (parsed.extraStations) setExtraStations(parsed.extraStations);
      }
    } catch {
      // safe fallback
    }
  }, []);

  // Save to localStorage when modified
  const persistCustomizations = (
    disabled = disabledStationIds,
    overrides = customStationOverrides,
    extras = extraStations
  ) => {
    try {
      localStorage.setItem(
        'pandoras_guides_customizer_v1',
        JSON.stringify({
          disabledStationIds: disabled,
          customStationOverrides: overrides,
          extraStations: extras,
        })
      );
    } catch {
      // ignore in SSR
    }
  };

  // Resolve base stations according to active mode
  const baseStations: EcosystemStation[] =
    guideMode === 'ROLES'
      ? getStationsForRole(selectedRole)
      : getStationsForTenantVertical(selectedVertical, tenantSlug);

  // Apply overrides and filter out disabled ones
  const activeStations: EcosystemStation[] = [
    ...baseStations.map((station) => customStationOverrides[station.id] || station),
    ...extraStations,
  ].filter((station) => !disabledStationIds[station.id]);

  // Compute active deep link and WhatsApp text
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://dash.pandoras.finance';
  const tourLink =
    guideMode === 'ROLES'
      ? generateTourShareLink(selectedRole, currentOrigin)
      : generateTenantTourShareLink(selectedVertical, tenantSlug, currentOrigin);

  const waMessage =
    guideMode === 'ROLES'
      ? generateWhatsAppShareText(selectedRole, tourLink)
      : generateTenantWhatsAppShareText(selectedVertical, tenantSlug, tourLink);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(tourLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyWaText = () => {
    navigator.clipboard.writeText(waMessage);
    setCopiedWaText(true);
    setTimeout(() => setCopiedWaText(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(waMessage);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const toggleStationVisibility = (stationId: string) => {
    const next = { ...disabledStationIds, [stationId]: !disabledStationIds[stationId] };
    setDisabledStationIds(next);
    persistCustomizations(next, customStationOverrides, extraStations);
  };

  const handleSaveStationEdit = (updated: EcosystemStation) => {
    const nextOverrides = { ...customStationOverrides, [updated.id]: updated };
    setCustomStationOverrides(nextOverrides);
    persistCustomizations(disabledStationIds, nextOverrides, extraStations);
    setEditingStation(null);
  };

  const handleSaveNewStation = (newStation: EcosystemStation) => {
    const nextExtras = [...extraStations, newStation];
    setExtraStations(nextExtras);
    persistCustomizations(disabledStationIds, customStationOverrides, nextExtras);
    setIsAddingNew(false);
  };

  const handleResetDefaults = () => {
    if (window.confirm('¿Deseas restablecer todas las estaciones a su configuración predeterminada?')) {
      setDisabledStationIds({});
      setCustomStationOverrides({});
      setExtraStations([]);
      localStorage.removeItem('pandoras_guides_customizer_v1');
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto text-white">
      {/* ── TOP HEADER & MODE SWITCHER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Compass className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Guías de Reconocimiento del Ecosistema
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-3xl leading-relaxed">
            Consola central de inducción interactiva guiada por Hermes AI. Personaliza las estaciones,
            edita narrativas y comparte accesos para colaboradores o clientes por vertical.
          </p>
        </div>

        {/* Global Live Preview Button */}
        <button
          onClick={() => setIsPreviewOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold transition-all shadow-lg shadow-amber-500/20 shrink-0"
        >
          <Eye className="w-4 h-4" />
          <span>Lanzar Previsualización en Vivo</span>
        </button>
      </div>

      {/* ── SUBTABS: COLABORADORES VS CLIENTES POR VERTICAL ── */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <button
          onClick={() => setGuideMode('ROLES')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            guideMode === 'ROLES'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>1. Colaboradores &amp; Roles Internos (Nexus)</span>
        </button>

        <button
          onClick={() => setGuideMode('VERTICALS')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            guideMode === 'VERTICALS'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>2. Clientes de Tenants (Por Vertical)</span>
        </button>
      </div>

      {/* ── TARGET CONFIGURATOR & DISPATCH WIDGET ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Target Selector (Role or Vertical) */}
        <div className="lg:col-span-2 bg-[#0C0C12] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              {guideMode === 'ROLES'
                ? 'Selecciona el Rol Institucional a Inspeccionar'
                : 'Selecciona la Vertical de Negocio del Tenant'}
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">
              {activeStations.length} Estaciones Activas
            </span>
          </div>

          {guideMode === 'ROLES' ? (
            /* Roles Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ROLES_CONFIG.map((item) => {
                const isSelected = selectedRole === item.role;
                return (
                  <button
                    key={item.role}
                    onClick={() => setSelectedRole(item.role)}
                    className={`text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-purple-600/15 border-purple-500/40 shadow-sm'
                        : 'bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white">{item.label}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${item.badgeClass}`}
                      >
                        {item.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2">
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Verticals Grid + Tenant Slug Input */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TENANT_VERTICALS_CONFIG.map((v) => {
                  const isSelected = selectedVertical === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVertical(v.id)}
                      className={`text-left p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/40 shadow-sm'
                          : 'bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-mono text-amber-400 font-bold block mb-1">
                        {v.badge}
                      </span>
                      <h4 className="text-xs font-bold text-white leading-tight mb-1">{v.name}</h4>
                      <p className="text-[11px] text-zinc-400 line-clamp-2">{v.description}</p>
                    </button>
                  );
                })}
              </div>

              {/* Slug Input for Deep Links */}
              <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                <span className="text-xs text-zinc-400 font-mono">Slug del Tenant de Destino:</span>
                <input
                  type="text"
                  value={tenantSlug}
                  onChange={(e) => setTenantSlug(e.target.value)}
                  placeholder="ej. snarai"
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500/50 w-44"
                />
                <span className="text-[11px] text-zinc-500">
                  (Resuelve URLs dinámicas para /profile/projects/{tenantSlug}/manage)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Dispatch & Sharing Center */}
        <div className="bg-[#0C0C12] border border-white/10 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Share2 className="w-4 h-4 text-amber-400" />
              <span>Compartir Guía de Inducción</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Genera un enlace directo para{' '}
              <strong className="text-white">
                {guideMode === 'ROLES' ? selectedRole : `${selectedVertical} (${tenantSlug})`}
              </strong>{' '}
              o envía la invitación prediseñada por WhatsApp con las estaciones activas.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/5">
            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-white flex items-center justify-center gap-2 transition-all"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Enlace Copiado al Portapapeles</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-zinc-400" />
                  <span>Copiar Enlace Directo</span>
                </>
              )}
            </button>

            <button
              onClick={handleOpenWhatsApp}
              className="w-full py-2.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-300 flex items-center justify-center gap-2 transition-all"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Abrir en WhatsApp</span>
            </button>

            <button
              onClick={handleCopyWaText}
              className="w-full text-center text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors pt-1"
            >
              {copiedWaText ? '✓ Mensaje copiado' : 'Copiar solo el texto para WhatsApp'}
            </button>
          </div>
        </div>
      </div>

      {/* ── STATION MATRIX & CUSTOMIZER ACTIONS ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Estaciones Programadas en esta Guía</span>
            </h2>
            <span className="text-xs font-mono text-zinc-400">
              ({activeStations.length} activas)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingNew(true)}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Añadir Estación Personalizada</span>
            </button>

            <button
              onClick={handleResetDefaults}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 text-xs text-zinc-400 hover:text-rose-300 flex items-center gap-1.5 transition-all"
              title="Restablecer todas las estaciones a su valor predeterminado"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>
          </div>
        </div>

        {/* Stations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {baseStations.map((station, idx) => {
            const currentStation = customStationOverrides[station.id] || station;
            const isDisabled = Boolean(disabledStationIds[station.id]);

            return (
              <div
                key={station.id}
                className={`bg-[#0C0C12] border rounded-2xl p-5 flex flex-col justify-between transition-all group ${
                  isDisabled
                    ? 'border-white/5 opacity-50 bg-black/40'
                    : 'border-white/10 hover:border-purple-500/30'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-zinc-400">
                      Estación #{idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                        {currentStation.category}
                      </span>
                      {/* Toggle Active Switch */}
                      <button
                        onClick={() => toggleStationVisibility(station.id)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-all ${
                          !isDisabled
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                        title="Activar o desactivar esta estación para el recorrido"
                      >
                        {!isDisabled ? 'ACTIVA' : 'INACTIVA'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                      {currentStation.title}
                    </h3>
                    <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                      {currentStation.subtitle}
                    </p>
                  </div>

                  {/* Hermes Brief Quote */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-[11px] text-zinc-300 italic">
                    &ldquo;{currentStation.hermesGreeting}&rdquo;
                  </div>

                  {/* Key Highlights */}
                  <div className="space-y-1.5 pt-1">
                    {currentStation.keyHighlights.slice(0, 2).map((point, pIdx) => (
                      <div key={pIdx} className="flex items-start gap-2 text-[11px] text-zinc-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
                  <button
                    onClick={() => setEditingStation(currentStation)}
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Personalizar</span>
                  </button>

                  <a
                    href={currentStation.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors"
                  >
                    <span>Abrir en vivo</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── EDIT STATION MODAL / DRAWER ── */}
      {editingStation && (
        <StationEditModal
          station={editingStation}
          onClose={() => setEditingStation(null)}
          onSave={handleSaveStationEdit}
        />
      )}

      {/* ── ADD NEW STATION MODAL ── */}
      {isAddingNew && (
        <StationAddModal
          order={activeStations.length + 1}
          onClose={() => setIsAddingNew(false)}
          onSave={handleSaveNewStation}
        />
      )}

      {/* ── LIVE PREVIEW MODAL ── */}
      {isPreviewOpen && (
        <HermesFloatingGuide
          customStations={activeStations}
          titleOverride={
            guideMode === 'ROLES' ? `Rol: ${selectedRole}` : `Vertical: ${selectedVertical}`
          }
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </div>
  );
}

// ── MODAL DE EDICIÓN DE ESTACIÓN ──
function StationEditModal({
  station,
  onClose,
  onSave,
}: {
  station: EcosystemStation;
  onClose: () => void;
  onSave: (updated: EcosystemStation) => void;
}) {
  const [form, setForm] = useState({
    title: station.title,
    subtitle: station.subtitle,
    targetUrl: station.targetUrl,
    hermesGreeting: station.hermesGreeting,
    hermesNarrative: station.hermesNarrative,
    highlightsText: station.keyHighlights.join('\n'),
  });

  const handleSave = () => {
    let safeUrl = form.targetUrl.trim();
    if (safeUrl.toLowerCase().startsWith('javascript:') || safeUrl.toLowerCase().startsWith('data:')) {
      safeUrl = 'about:blank';
    }

    onSave({
      ...station,
      title: form.title,
      subtitle: form.subtitle,
      targetUrl: safeUrl,
      hermesGreeting: form.hermesGreeting,
      hermesNarrative: form.hermesNarrative,
      keyHighlights: form.highlightsText.split('\n').filter((l) => l.trim().length > 0),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0F0F16] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Personalizar Estación</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="text-zinc-400 block mb-1 font-semibold">Título de la Estación</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="text-zinc-400 block mb-1 font-semibold">Subtítulo / Misión</label>
            <input
              type="text"
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="text-zinc-400 block mb-1 font-semibold">URL de Destino (Pantalla a explorar)</label>
            <input
              type="text"
              value={form.targetUrl}
              onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>

          <div>
            <label className="text-zinc-400 block mb-1 font-semibold">Saludo de Hermes</label>
            <input
              type="text"
              value={form.hermesGreeting}
              onChange={(e) => setForm({ ...form, hermesGreeting: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="text-zinc-400 block mb-1 font-semibold">Narrativa Pedagógica de Hermes</label>
            <textarea
              rows={4}
              value={form.hermesNarrative}
              onChange={(e) => setForm({ ...form, hermesNarrative: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white leading-relaxed"
            />
          </div>

          <div>
            <label className="text-zinc-400 block mb-1 font-semibold">
              Capacidades Clave (Una viñeta por línea)
            </label>
            <textarea
              rows={3}
              value={form.highlightsText}
              onChange={(e) => setForm({ ...form, highlightsText: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MODAL PARA AGREGAR NUEVA ESTACIÓN PERSONALIZADA ──
function StationAddModal({
  order,
  onClose,
  onSave,
}: {
  order: number;
  onClose: () => void;
  onSave: (newStation: EcosystemStation) => void;
}) {
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    targetUrl: 'https://',
    category: 'COMMERCIAL' as const,
    hermesGreeting: 'Te presento un recurso complementario para tu operación.',
    hermesNarrative: '',
    highlightsText: '',
  });

  const handleSave = () => {
    if (!form.title.trim()) return;

    let safeUrl = form.targetUrl.trim();
    if (safeUrl.toLowerCase().startsWith('javascript:') || safeUrl.toLowerCase().startsWith('data:')) {
      safeUrl = 'about:blank';
    }

    const newStation: EcosystemStation = {
      id: `custom_station_${Date.now()}`,
      order,
      title: form.title,
      subtitle: form.subtitle || 'Recurso Externo / Documentación',
      category: form.category,
      badgeColor: 'amber',
      iconName: 'Globe',
      targetUrl: safeUrl,
      allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COLLABORATOR'],
      hermesGreeting: form.hermesGreeting,
      hermesNarrative: form.hermesNarrative || 'Explora este enlace para acceder a la documentación o canal de trabajo.',
      keyHighlights: form.highlightsText.split('\n').filter((l) => l.trim().length > 0),
      faqs: [],
    };
    onSave(newStation);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0F0F16] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Añadir Estación Personalizada</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="text-zinc-400 block mb-1 font-semibold">Título de la Estación *</label>
            <input
              type="text"
              placeholder="ej. Documentación Notion / Figma"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="text-zinc-400 block mb-1 font-semibold">Subtítulo Descriptivo</label>
            <input
              type="text"
              placeholder="ej. Guía de diseño de marca y assets"
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="text-zinc-400 block mb-1 font-semibold">URL de Destino</label>
            <input
              type="text"
              value={form.targetUrl}
              onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>

          <div>
            <label className="text-zinc-400 block mb-1 font-semibold">Mensaje de Hermes</label>
            <textarea
              rows={3}
              placeholder="¿Qué le dirá Hermes al usuario al llegar a esta estación?"
              value={form.hermesNarrative}
              onChange={(e) => setForm({ ...form, hermesNarrative: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!form.title.trim()}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold flex items-center gap-1.5 disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Estación</span>
          </button>
        </div>
      </div>
    </div>
  );
}
