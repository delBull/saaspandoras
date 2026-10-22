'use client';

import { useState } from 'react';
import { X, Target, Loader2, Sparkles, CheckCircle2, Send } from 'lucide-react';
import { createMarketAttackDraftAction } from '../../actions';

interface NewMarketAttackDraftModalProps {
  organizationSlug: string;
  onSuccess?: () => void;
}

export function NewMarketAttackDraftModal({ organizationSlug, onSuccess }: NewMarketAttackDraftModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    platform: 'multi',
    angle: 'direct_response',
    emotion: 'curiosity',
    hook: '',
    script: '',
    cta: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGenerateWithHermes = () => {
    setGenerating(true);
    setTimeout(() => {
      setForm(prev => ({
        ...prev,
        name: prev.name || `Campaña ${prev.angle.replace('_', ' ').toUpperCase()} — ${new Date().toLocaleDateString('es-MX')}`,
        hook: prev.hook || '¿Por qué los métodos tradicionales de retención ya no funcionan en Web3?',
        script: prev.script || 'Analizamos 50,000 interacciones en comunidades activas y descubrimos que el 80% del valor se concentra en usuarios autónomos. Con Hermes OS, automatizas el follow-up sin perder la relación humana.',
        cta: prev.cta || 'Agenda tu sesión estratégica con Hermes o solicita acceso a la deal room privada.',
      }));
      setGenerating(false);
    }, 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.hook.trim()) {
      setError('El nombre y el Hook de demanda son requeridos.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await createMarketAttackDraftAction({
        organizationSlug,
        name: form.name.trim(),
        hook: form.hook.trim(),
        script: form.script.trim(),
        cta: form.cta.trim() || 'Comienza ahora',
        platform: form.platform,
        angle: form.angle,
        emotion: form.emotion,
      });

      if (!res.success) {
        throw new Error(res.message || 'Error al desplegar el draft.');
      }

      setDone(true);
      setTimeout(() => {
        setOpen(false);
        setDone(false);
        setForm({
          name: '',
          platform: 'multi',
          angle: 'direct_response',
          emotion: 'curiosity',
          hook: '',
          script: '',
          cta: '',
        });
        onSuccess?.();
        window.location.reload();
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] cursor-pointer"
      >
        <Target size={18} /> Nuevo Draft
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-[#0C0D12] p-6 shadow-2xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Target size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Desplegar Market Attack Draft</h2>
                  <p className="text-xs text-zinc-400">Diseña o genera con Hermes un ángulo de demanda</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Nombre de la Campaña *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ej. Campaña Inversores RWA Q4"
                  className="w-full px-3 py-2 text-sm rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Canal / Plataforma</label>
                  <select
                    name="platform"
                    value={form.platform}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                  >
                    <option value="multi" className="bg-zinc-900">Omnichannel</option>
                    <option value="twitter" className="bg-zinc-900">Twitter / X</option>
                    <option value="telegram" className="bg-zinc-900">Telegram</option>
                    <option value="linkedin" className="bg-zinc-900">LinkedIn</option>
                    <option value="meta" className="bg-zinc-900">Meta / IG</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Ángulo Estratégico</label>
                  <select
                    name="angle"
                    value={form.angle}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                  >
                    <option value="direct_response" className="bg-zinc-900">Direct Response</option>
                    <option value="authority" className="bg-zinc-900">Autoridad & Prueba</option>
                    <option value="scarcity" className="bg-zinc-900">Escasez & FOMO</option>
                    <option value="educational" className="bg-zinc-900">Educacional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Emoción Primaria</label>
                  <select
                    name="emotion"
                    value={form.emotion}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                  >
                    <option value="curiosity" className="bg-zinc-900">Curiosidad</option>
                    <option value="urgency" className="bg-zinc-900">Urgencia</option>
                    <option value="aspiration" className="bg-zinc-900">Aspiración</option>
                    <option value="certainty" className="bg-zinc-900">Certeza</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-zinc-300">Hook de Captura (Gancho) *</label>
                  <button
                    type="button"
                    onClick={handleGenerateWithHermes}
                    disabled={generating}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold transition-colors disabled:opacity-50"
                  >
                    <Sparkles size={12} className={generating ? 'animate-spin' : ''} />
                    {generating ? 'Hermes redactando...' : 'Autogenerar con Hermes'}
                  </button>
                </div>
                <input
                  type="text"
                  name="hook"
                  value={form.hook}
                  onChange={handleChange}
                  placeholder="La primera línea que detiene el scroll..."
                  className="w-full px-3 py-2 text-sm rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Cuerpo / Script del Mensaje</label>
                <textarea
                  name="script"
                  rows={3}
                  value={form.script}
                  onChange={handleChange}
                  placeholder="Desarrollo del ángulo persuasivo..."
                  className="w-full px-3 py-2 text-sm rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Call to Action (CTA)</label>
                <input
                  type="text"
                  name="cta"
                  value={form.cta}
                  onChange={handleChange}
                  placeholder="Ej. Haz clic para reservar tu lugar en la preventa"
                  className="w-full px-3 py-2 text-sm rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || done}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-black bg-emerald-500 hover:bg-emerald-400 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Desplegando...
                    </>
                  ) : done ? (
                    <>
                      <CheckCircle2 size={16} className="text-black" />
                      ¡Draft Lanzado!
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Lanzar Draft
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
