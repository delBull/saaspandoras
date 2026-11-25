'use client';

import { useState } from 'react';

/**
 * Formulario de captura (cliente).
 *
 * No decide el tenant ni el origen: los recibe del servidor (`page.tsx`) y el
 * endpoint canónico vuelve a resolver el proyecto por slug. Aquí sólo se recogen
 * los datos y se envía el consentimiento explícito.
 */
export function JoinForm({
  organizationSlug,
  attributionCode,
  initialEmail,
}: {
  organizationSlug: string;
  attributionCode: string | null;
  initialEmail?: string;
}) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: initialEmail ?? '',
    interest: '',
  });
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSend =
    consent &&
    form.name.trim().length >= 2 &&
    (form.phone.trim().length >= 8 || form.email.includes('@'));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSend || sending) return;

    setSending(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/marketing/leads/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: organizationSlug,
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phoneNumber: form.phone.trim() || undefined,
          consent: true,
          source: 'community',
          // El código del clic (/l/<code>) es lo que atribuye el lead al post.
          utm_source: attributionCode ?? undefined,
          utm_medium: attributionCode ? 'social' : undefined,
          metadata: {
            interest: form.interest || null,
            consentAt: new Date().toISOString(),
            consentSource: 'join_page',
            attributionCode,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || data?.error || 'No se pudo enviar. Intenta de nuevo.');
      }

      setDone(true);
    } catch (err: any) {
      setError(err?.message || 'Error de red. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-6">
        <p className="text-sm font-semibold text-emerald-200">Listo, ya te tenemos</p>
        <p className="mt-2 text-[12px] leading-relaxed text-zinc-400">
          El equipo te escribirá en breve. Si quieres adelantar algo, responde a ese mensaje con
          tu duda principal.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <div className="space-y-2">
        <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Nombre</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Cómo te llamas"
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-white/25"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">WhatsApp</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+52 …"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-white/25"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Email <span className="normal-case text-zinc-600">(opcional)</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="tu@correo.com"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-white/25"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
          Qué te interesa
        </label>
        <select
          value={form.interest}
          onChange={(e) => setForm({ ...form, interest: e.target.value })}
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-white/25"
        >
          <option value="">Aún no lo sé</option>
          <option value="explorador">Explorador — conocer el proyecto</option>
          <option value="residente">Residente — estancias anuales</option>
          <option value="embajador">Embajador — participación ampliada</option>
          <option value="riviera-owner">Riviera Owner — nivel superior</option>
        </select>
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-emerald-500"
        />
        <span className="text-[11px] leading-relaxed text-zinc-400">
          Acepto que el equipo me contacte por WhatsApp o email sobre el proyecto. Puedo pedir
          que eliminen mis datos en cualquier momento.
        </span>
      </label>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[12px] text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSend || sending}
        className="w-full rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/25 disabled:opacity-40"
      >
        {sending ? 'Enviando…' : 'Quiero que me contacten'}
      </button>

      {!canSend && (
        <p className="text-center text-[10px] text-zinc-600">
          Necesitamos tu nombre, un WhatsApp o email, y tu consentimiento.
        </p>
      )}
    </form>
  );
}
