'use client';

import React, { useState } from 'react';

export function ParticipantInjector({ meetingId }: { meetingId: string }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [dealRoomPublicId, setDealRoomPublicId] = useState('');
  const [presentationId, setPresentationId] = useState('celeste');
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<Array<{ ok: boolean; message: string }>>([]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/meet/${meetingId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || undefined,
          dealRoomPublicId: dealRoomPublicId || undefined,
          presentationId: presentationId || undefined,
        }),
      });
      const data = await res.json();
      setLog((prev) => [
        {
          ok: res.ok && data.ok,
          message:
            res.ok && data.ok
              ? `✓ ${email}${data.emailed ? ' · email enviado' : ' · sin email (revisa deal room/Resend)'}`
              : `✕ ${email}: ${data.error ?? 'error'}`,
        },
        ...prev,
      ]);
      if (res.ok) {
        setEmail('');
        setName('');
      }
    } catch (error: unknown) {
      setLog((prev) => [{ ok: false, message: `✕ ${email}: ${error instanceof Error ? error.message : 'error'}` }, ...prev]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-xs text-zinc-400">
            Email del participante
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="eduardo@empresa.com"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
            />
          </label>
          <label className="block text-xs text-zinc-400">
            Nombre (opcional)
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Eduardo"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
            />
          </label>
        </div>
        <label className="block text-xs text-zinc-400">
          Deck (slug)
          <input
            value={presentationId}
            onChange={(e) => setPresentationId(e.target.value)}
            placeholder="celeste"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
          />
        </label>
        <label className="block text-xs text-zinc-400">
          Deal Room (publicId, opcional)
          <input
            value={dealRoomPublicId}
            onChange={(e) => setDealRoomPublicId(e.target.value)}
            placeholder="PDR-63C2E9"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-purple-600 px-5 py-2 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50"
        >
          {busy ? 'Añadiendo…' : 'Añadir participante'}
        </button>
        <p className="text-[11px] text-zinc-500">
          Si la reunión aún no tiene Deal Room, indica el publicId (p. ej. PDR-63C2E9). Se asocia y se envía el enlace.
        </p>
      </form>

      {log.length > 0 && (
        <ul className="space-y-1 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs">
          {log.map((entry, i) => (
            <li key={i} className={entry.ok ? 'text-emerald-300' : 'text-rose-300'}>
              {entry.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
