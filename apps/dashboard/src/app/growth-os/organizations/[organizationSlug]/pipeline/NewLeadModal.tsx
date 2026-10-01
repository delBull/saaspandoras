'use client';

import { useState } from 'react';
import { X, Users, Loader2, CheckCircle2, Sparkles } from 'lucide-react';

interface NewLeadModalProps {
  organizationSlug: string;
  onSuccess?: () => void;
}

export function NewLeadModal({ organizationSlug, onSuccess }: NewLeadModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    hermesNarrative: '',
    source: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name && !form.email) {
      setError('Ingresa al menos el nombre o el email del prospecto.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/growth/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: `org_${organizationSlug}`,
          name: form.name.trim() || undefined,
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          source: form.source || 'Growth OS — Manual',
          notes: form.notes.trim() || undefined,
          hermesNarrative: form.hermesNarrative.trim() || undefined, // omnichannel — Hermes reads this narrative
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al crear el prospecto.');

      setDone(true);
      setTimeout(() => {
        setOpen(false);
        setDone(false);
        setForm({ name: '', email: '', phone: '', source: '', notes: '', hermesNarrative: '' });
        onSuccess?.();
        // Soft reload to refetch server data
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
      <div className="pt-2">
            <label className="text-[10px] text-violet-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Hermes Concierge · Contexto Multicanal
            </label>
            <textarea
              rows={2}
              value={form.hermesNarrative}
              onChange={(e) => setForm({ ...form, hermesNarrative: e.target.value })}
              placeholder="Dísele a Hermes dónde, cómo y por qué quiere este lead (ej. 'vino del portal de S'Narai, interesado en la fase 2')"
              className="mt-1 w-full rounded-xl border border-violet-500/20 bg-white/[0.02] bg-transparent px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-violet-500/40 focus:outline-none"
            />
          </div>
          <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
      >
        <Users size={18} /> Nuevo Prospecto
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !loading && setOpen(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#09090D]/95 backdrop-blur-2xl shadow-2xl p-8 z-10 animate-in fade-in zoom-in-95 duration-300">
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-8 relative z-10">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Nuevo Prospecto</h2>
                <p className="text-zinc-400 text-sm mt-1">Registra un prospecto directo en el CRM soberano.</p>
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
                <p className="text-xl font-black text-white tracking-tight">¡Prospecto Registrado!</p>
                <p className="text-zinc-400 text-sm mt-2">El prospecto ya está disponible en el pipeline.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Nombre</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Ej. Ana García"
                      className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all font-medium"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="ana@empresa.com"
                      className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Teléfono / WhatsApp</label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+52 55 1234 5678"
                      className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all font-medium"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Fuente / Canal</label>
                    <select
                      name="source"
                      value={form.source}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                    >
                      <option value="" className="bg-zinc-900">Seleccionar origen</option>
                      <option value="Referido" className="bg-zinc-900">Referido</option>
                      <option value="Instagram" className="bg-zinc-900">Instagram</option>
                      <option value="WhatsApp" className="bg-zinc-900">WhatsApp</option>
                      <option value="LinkedIn" className="bg-zinc-900">LinkedIn</option>
                      <option value="Evento" className="bg-zinc-900">Evento</option>
                      <option value="Hermes AI" className="bg-zinc-900">Hermes AI</option>
                      <option value="Growth OS — Manual" className="bg-zinc-900">Registro Manual</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Notas Internas</label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Información relevante del prospecto, motivaciones, contexto..."
                    className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all font-medium resize-none"
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
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-black rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
                    {loading ? 'Guardando...' : 'Crear Prospecto'}
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
