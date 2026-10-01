'use client';

import { useState } from 'react';
import { X, Mail, Loader2, CheckCircle2, Send } from 'lucide-react';

interface NewCampaignModalProps {
  organizationSlug: string;
  templates?: Array<{ id: string; name: string }>;
  onSuccess?: () => void;
}

export function NewCampaignModal({ organizationSlug, templates = [], onSuccess }: NewCampaignModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    templateId: '',
    subject: '',
    scheduledAt: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('El nombre de la campaña es requerido.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/growth/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: `org_${organizationSlug}`,
          name: form.name.trim(),
          templateId: form.templateId || undefined,
          subject: form.subject.trim() || undefined,
          scheduledAt: form.scheduledAt || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al crear la campaña.');

      setDone(true);
      setTimeout(() => {
        setOpen(false);
        setDone(false);
        setForm({ name: '', templateId: '', subject: '', scheduledAt: '' });
        onSuccess?.();
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 bg-violet-500 hover:bg-violet-400 text-white font-bold rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)]"
      >
        <Send size={18} /> Nueva Campaña
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !loading && setOpen(false)}
          />

          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#09090D]/95 backdrop-blur-2xl shadow-2xl p-8 z-10 animate-in fade-in zoom-in-95 duration-300">
            <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-8 relative z-10">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Nueva Campaña</h2>
                <p className="text-zinc-400 text-sm mt-1">Programa una nueva campaña de email marketing.</p>
              </div>
              <button
                onClick={() => !loading && setOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors border border-white/10"
              >
                <X size={18} />
              </button>
            </div>

            {done ? (
              <div className="flex flex-col items-center justify-center py-12 text-center relative z-10">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4" />
                <p className="text-xl font-black text-white tracking-tight">¡Campaña Creada!</p>
                <p className="text-zinc-400 text-sm mt-2">La campaña fue agendada correctamente.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Nombre de la Campaña *</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Ej. Lanzamiento Token Q4 2025"
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.08] transition-all font-medium"
                  />
                </div>

                {templates.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Template de Email</label>
                    <select
                      name="templateId"
                      value={form.templateId}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50 transition-all font-medium"
                    >
                      <option value="" className="bg-zinc-900">— Sin template base —</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id} className="bg-zinc-900">{t.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Asunto del Email</label>
                  <input
                    type="text"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="Ej. Nueva oportunidad de inversión disponible"
                    className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.08] transition-all font-medium"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Fecha de Envío</label>
                  <input
                    type="datetime-local"
                    name="scheduledAt"
                    value={form.scheduledAt}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50 transition-all font-medium"
                  />
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-sm font-bold transition-all border border-white/10 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-violet-500 hover:bg-violet-400 text-white font-black rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                    {loading ? 'Creando...' : 'Crear Campaña'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
