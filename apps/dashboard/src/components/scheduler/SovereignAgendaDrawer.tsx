'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  Globe,
  Link as LinkIcon,
  Check,
  Copy,
  Terminal,
  Save,
  RotateCcw,
  Sliders,
  Shield,
  Users,
  Video,
  AlertCircle,
  Loader2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import type { SovereignCalendarConfig, DayAvailability } from '@/lib/scheduling/sovereign-calendar-engine';

interface SovereignAgendaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tenantSlug?: string;
  userRole?: string;
  onConfigSaved?: (config: SovereignCalendarConfig) => void;
}

const CANONICAL_TIMEZONES = [
  { label: 'Ciudad de México (GMT-6)', value: 'America/Mexico_City' },
  { label: 'Bogotá / Lima / Quito (GMT-5)', value: 'America/Bogota' },
  { label: 'Nueva York (EDT/EST)', value: 'America/New_York' },
  { label: 'Buenos Aires / Santiago (GMT-3)', value: 'America/Argentina/Buenos_Aires' },
  { label: 'Madrid / Barcelona (CET)', value: 'Europe/Madrid' },
  { label: 'Londres (GMT/BST)', value: 'Europe/London' },
];

const DAYS_ORDER = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
] as const;

export function SovereignAgendaDrawer({
  isOpen,
  onClose,
  tenantSlug = 'pandoras',
  userRole = 'ADMIN',
  onConfigSaved,
}: SovereignAgendaDrawerProps) {
  const [activeTab, setActiveTab] = useState<'visual' | 'terminal'>('visual');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Core Configuration State
  const [config, setConfig] = useState<SovereignCalendarConfig>({
    isActive: true,
    timezone: 'America/Mexico_City',
    durationMinutes: 30,
    bufferMinutes: 15,
    minAdvanceHours: 24,
    maxDaysInFuture: 14,
    meetingType: 'video',
    defaultMeetingLink: 'https://meet.google.com/pdr-sovereign-call',
    notificationChannels: ['email', 'whatsapp'],
    availability: {
      monday: { enabled: true, start: '09:00', end: '18:00' },
      tuesday: { enabled: true, start: '09:00', end: '18:00' },
      wednesday: { enabled: true, start: '09:00', end: '18:00' },
      thursday: { enabled: true, start: '09:00', end: '18:00' },
      friday: { enabled: true, start: '09:00', end: '18:00' },
      saturday: { enabled: false, start: '10:00', end: '14:00' },
      sunday: { enabled: false, start: '10:00', end: '14:00' },
    },
  });

  // Terminal CLI State
  const [cliLogs, setCliLogs] = useState<Array<{ text: string; type: 'system' | 'user' | 'success' | 'error' }>>([
    { text: 'Sovereign Agenda Hermes CLI v1.0 initialized.', type: 'system' },
    { text: 'Escribe "status", "test-slots" o "help" para comenzar.', type: 'system' },
  ]);
  const [commandInput, setCommandInput] = useState('');
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // Load config on mount or open
  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen, tenantSlug]);

  async function loadConfig() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/scheduling/config?tenantSlug=${tenantSlug}`);
      const data = await res.json();
      if (res.ok && data.ok && data.config) {
        setConfig(data.config);
      }
    } catch (err) {
      console.error('Error loading calendar config:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(newConfig?: SovereignCalendarConfig) {
    const configToSave = newConfig || config;
    setSaving(true);
    try {
      const res = await fetch('/api/v1/scheduling/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantSlug, config: configToSave }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        toast.success('Agenda Soberana sincronizada en todas las verticales');
        onConfigSaved?.(configToSave);
        addCliLog(`Configuración guardada exitosamente para ${tenantSlug}`, 'success');
      } else {
        toast.error(data.error || 'Error al guardar la agenda');
        addCliLog(`Error: ${data.error || 'No se pudo guardar'}`, 'error');
      }
    } catch (err: any) {
      toast.error('Fallo de conexión al sincronizar');
      addCliLog(`Error de conexión: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  }

  function addCliLog(text: string, type: 'system' | 'user' | 'success' | 'error' = 'system') {
    setCliLogs((prev) => [...prev, { text, type }]);
    setTimeout(() => {
      terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }

  function handleDayToggle(dayKey: keyof SovereignCalendarConfig['availability']) {
    setConfig((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [dayKey]: {
          ...prev.availability[dayKey],
          enabled: !prev.availability[dayKey]?.enabled,
        },
      },
    }));
  }

  function handleHourChange(dayKey: keyof SovereignCalendarConfig['availability'], field: 'start' | 'end', val: string) {
    setConfig((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [dayKey]: {
          ...prev.availability[dayKey],
          [field]: val,
        },
      },
    }));
  }

  async function handleCommandSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cmd = commandInput.trim();
    if (!cmd) return;

    addCliLog(`> ${cmd}`, 'user');
    setCommandInput('');

    const lower = cmd.toLowerCase();

    if (lower === 'help') {
      addCliLog('Comandos disponibles:', 'system');
      addCliLog('  status                     - Muestra el estado actual de la agenda', 'system');
      addCliLog('  test-slots                 - Simula y lista los 3 próximos slots libres', 'system');
      addCliLog('  set-duration <15|30|45|60> - Cambia la duración de reunión', 'system');
      addCliLog('  set-buffer <0|10|15|30>    - Cambia el buffer entre reuniones', 'system');
      addCliLog('  save                       - Guarda y sincroniza la configuración', 'system');
      return;
    }

    if (lower === 'status') {
      addCliLog(`Tenant: ${tenantSlug}`, 'system');
      addCliLog(`Zona Horaria: ${config.timezone}`, 'system');
      addCliLog(`Duración: ${config.durationMinutes} min | Buffer: ${config.bufferMinutes} min`, 'system');
      addCliLog(`Anticipación: ${config.minAdvanceHours}h | Ventana Futura: ${config.maxDaysInFuture} días`, 'system');
      const activeDays = Object.entries(config.availability)
        .filter(([, v]) => v.enabled)
        .map(([k, v]) => `${k} (${v.start}-${v.end})`)
        .join(', ');
      addCliLog(`Días activos: ${activeDays || 'Ninguno'}`, 'system');
      return;
    }

    if (lower === 'test-slots') {
      addCliLog('Calculando slots dinámicos...', 'system');
      try {
        const res = await fetch(`/api/v1/scheduling/slots?tenantSlug=${tenantSlug}`);
        const data = await res.json();
        if (data.ok && data.slots && data.slots.length > 0) {
          addCliLog(`Disponibilidad calculada: ${data.slots.length} slots libres`, 'success');
          data.slots.slice(0, 3).forEach((s: any, idx: number) => {
            addCliLog(`  #${idx + 1}: ${s.formattedLocalDate} a las ${s.formattedLocalTime}`, 'system');
          });
        } else {
          addCliLog('No hay slots disponibles con las reglas actuales.', 'error');
        }
      } catch (err: any) {
        addCliLog(`Error al consultar slots: ${err.message}`, 'error');
      }
      return;
    }

    if (lower.startsWith('set-duration ')) {
      const dur = parseInt(lower.replace('set-duration ', '').trim(), 10);
      if ([15, 20, 30, 45, 60].includes(dur)) {
        setConfig((prev) => ({ ...prev, durationMinutes: dur }));
        addCliLog(`Duración actualizada a ${dur} minutos. Escribe "save" para aplicar.`, 'success');
      } else {
        addCliLog('Duración no válida. Usa: 15, 20, 30, 45 o 60.', 'error');
      }
      return;
    }

    if (lower.startsWith('set-buffer ')) {
      const buf = parseInt(lower.replace('set-buffer ', '').trim(), 10);
      if ([0, 10, 15, 30].includes(buf)) {
        setConfig((prev) => ({ ...prev, bufferMinutes: buf }));
        addCliLog(`Buffer actualizado a ${buf} minutos. Escribe "save" para aplicar.`, 'success');
      } else {
        addCliLog('Buffer no válido. Usa: 0, 10, 15 o 30.', 'error');
      }
      return;
    }

    if (lower === 'save') {
      await handleSave();
      return;
    }

    addCliLog(`Comando desconocido: "${cmd}". Escribe "help" para ver opciones.`, 'error');
  }

  const publicLink = typeof window !== 'undefined'
    ? `${window.location.origin}/schedule/${tenantSlug}`
    : `https://dash.pandoras.finance/schedule/${tenantSlug}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Drawer Sidebar */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-2xl h-full bg-[#0C0C10] border-l border-[#D4A853]/20 shadow-2xl flex flex-col z-10 text-white"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4A853]/10 border border-[#D4A853]/30 flex items-center justify-center text-[#D4A853]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold tracking-wide text-zinc-100">
                      Agenda Soberana
                    </h2>
                    <span className="px-2 py-0.5 text-[10px] uppercase font-mono rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Sincronizada
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Tenant: <span className="font-mono text-[#D4A853]">{tenantSlug}</span> · Multi-Vertical (Hermes · Growth · RWA)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mode Tabs */}
            <div className="flex border-b border-zinc-800/80 bg-zinc-900/30 px-6 pt-3 gap-2">
              <button
                onClick={() => setActiveTab('visual')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-t-lg transition-colors ${
                  activeTab === 'visual'
                    ? 'bg-[#0C0C10] text-[#D4A853] border-t border-x border-[#D4A853]/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Configuración Visual
              </button>
              <button
                onClick={() => setActiveTab('terminal')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-t-lg transition-colors ${
                  activeTab === 'terminal'
                    ? 'bg-[#0C0C10] text-[#D4A853] border-t border-x border-[#D4A853]/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                Consola Hermes CLI
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-[#D4A853]" />
                  <p className="text-xs text-zinc-400">Cargando doctrina de agenda...</p>
                </div>
              ) : activeTab === 'visual' ? (
                <>
                  {/* Public Link Box */}
                  <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400 font-medium">Enlace Público Soberano:</span>
                      <span className="text-[10px] text-zinc-500 font-mono">Compatible con Widget e iFrame</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={publicLink}
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 font-mono select-all focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(publicLink);
                          setCopiedLink(true);
                          toast.success('Enlace copiado al portapapeles');
                          setTimeout(() => setCopiedLink(false), 2000);
                        }}
                        className="p-2 rounded-lg bg-[#D4A853]/10 hover:bg-[#D4A853]/20 border border-[#D4A853]/30 text-[#D4A853] transition-colors"
                        title="Copiar enlace"
                      >
                        {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <a
                        href={publicLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                        title="Abrir agenda"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Timezone & Core Settings */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Zona Horaria (IANA)</label>
                      <select
                        value={config.timezone}
                        onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#D4A853]/40"
                      >
                        {CANONICAL_TIMEZONES.map((tz) => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Duración de Reunión</label>
                      <select
                        value={config.durationMinutes}
                        onChange={(e) => setConfig({ ...config, durationMinutes: Number(e.target.value) })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#D4A853]/40"
                      >
                        <option value={15}>15 minutos</option>
                        <option value={20}>20 minutos</option>
                        <option value={30}>30 minutos (Estándar)</option>
                        <option value={45}>45 minutos</option>
                        <option value={60}>60 minutos (Institucional)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Buffer entre reuniones</label>
                      <select
                        value={config.bufferMinutes}
                        onChange={(e) => setConfig({ ...config, bufferMinutes: Number(e.target.value) })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#D4A853]/40"
                      >
                        <option value={0}>Sin buffer</option>
                        <option value={10}>10 minutos</option>
                        <option value={15}>15 minutos (Recomendado)</option>
                        <option value={30}>30 minutos</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Anticipación Mínima</label>
                      <select
                        value={config.minAdvanceHours}
                        onChange={(e) => setConfig({ ...config, minAdvanceHours: Number(e.target.value) })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#D4A853]/40"
                      >
                        <option value={2}>2 horas</option>
                        <option value={12}>12 horas</option>
                        <option value={24}>24 horas (Recomendado)</option>
                        <option value={48}>48 horas</option>
                      </select>
                    </div>
                  </div>

                  {/* Meeting Link */}
                  <div>
                    <label className="text-xs text-zinc-400 mb-1 block">Enlace de Videollamada por Defecto</label>
                    <div className="relative">
                      <Video className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                      <input
                        type="url"
                        placeholder="https://meet.google.com/xyz-abc"
                        value={config.defaultMeetingLink || ''}
                        onChange={(e) => setConfig({ ...config, defaultMeetingLink: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#D4A853]/40"
                      />
                    </div>
                  </div>

                  {/* Weekly Days & Hours */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Disponibilidad Semanal
                    </h3>

                    <div className="space-y-2">
                      {DAYS_ORDER.map(({ key, label }) => {
                        const day = config.availability[key] || { enabled: false, start: '09:00', end: '18:00' };
                        return (
                          <div
                            key={key}
                            className={`p-3 rounded-xl border transition-colors flex items-center justify-between ${
                              day.enabled
                                ? 'bg-zinc-900/60 border-zinc-800'
                                : 'bg-zinc-950/40 border-zinc-900 opacity-60'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={day.enabled}
                                onChange={() => handleDayToggle(key)}
                                className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-[#D4A853] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                              />
                              <span className="text-xs font-medium text-zinc-200 w-20">{label}</span>
                            </div>

                            {day.enabled ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="time"
                                  value={day.start}
                                  onChange={(e) => handleHourChange(key, 'start', e.target.value)}
                                  className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none font-mono"
                                />
                                <span className="text-zinc-500 text-xs">-</span>
                                <input
                                  type="time"
                                  value={day.end}
                                  onChange={(e) => handleHourChange(key, 'end', e.target.value)}
                                  className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none font-mono"
                                />
                              </div>
                            ) : (
                              <span className="text-xs text-zinc-600 italic">No disponible</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                /* Terminal CLI View */
                <div className="h-full flex flex-col space-y-3 font-mono text-xs">
                  <div className="flex-1 bg-black/80 border border-zinc-800 rounded-xl p-4 overflow-y-auto max-h-96 space-y-1.5">
                    {cliLogs.map((log, i) => (
                      <div
                        key={i}
                        className={
                          log.type === 'user'
                            ? 'text-zinc-200 font-semibold'
                            : log.type === 'success'
                            ? 'text-emerald-400'
                            : log.type === 'error'
                            ? 'text-rose-400'
                            : 'text-zinc-400'
                        }
                      >
                        {log.text}
                      </div>
                    ))}
                    <div ref={terminalBottomRef} />
                  </div>

                  <form onSubmit={handleCommandSubmit} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="help, status, test-slots, save..."
                      value={commandInput}
                      onChange={(e) => setCommandInput(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#D4A853]/40"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#D4A853] hover:bg-[#c49845] text-black font-semibold rounded-lg text-xs transition-colors"
                    >
                      Ejecutar
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                <Shield className="w-3.5 h-3.5 text-[#D4A853]" />
                Sincronización atómica inmediata
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => handleSave()}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#D4A853] hover:bg-[#c49845] text-black font-semibold text-xs transition-all shadow-lg disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Guardar y Sincronizar
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
