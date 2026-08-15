'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

const USED_EMAILS_KEY = 'hermes_used_emails';

export default function PortalLoginPage() {
  return (
    <Suspense fallback={null}>
      <PortalLoginContent />
    </Suspense>
  );
}

function PortalLoginContent() {
  const searchParams = useSearchParams();
  const returnPath = searchParams.get('return') || '';
  const token = searchParams.get('token');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(!!token);
  const [error, setError] = useState<string | null>(null);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [usedEmails, setUsedEmails] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(USED_EMAILS_KEY);
      if (stored) {
        setUsedEmails(JSON.parse(stored).filter((e: unknown) => typeof e === 'string'));
      }
    } catch {
      // ignore corrupted storage
    }
  }, []);

  // Token consumption logic
  useEffect(() => {
    if (!token) return;

    async function consumeToken() {
      try {
        const res = await fetch('/api/v1/portal/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Token inválido o expirado.');
        }

        const data = await res.json();
        
        if (data.sessionToken) {
          // Set cookie and local storage
          localStorage.setItem('pandoras_portal_session', data.sessionToken);
          document.cookie = `pandoras_portal_session=${data.sessionToken}; Max-Age=${60 * 60 * 24 * 30}; Path=/; SameSite=Lax`;
          
          // Redirect
          const target = returnPath.startsWith('/') ? returnPath : '/portal';
          window.location.href = target;
        } else {
          throw new Error('No se recibió token de sesión válido.');
        }
      } catch (err: any) {
        setError(err.message || 'Error al autenticar con el enlace mágico.');
        setLoading(false);
      }
    }

    consumeToken();
  }, [token, returnPath]);

  useEffect(() => {
    const onClickOutside = (ev: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(ev.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const rememberEmail = (value: string) => {
    const clean = value.trim().toLowerCase();
    if (!clean || !clean.includes('@')) return;
    const next = [clean, ...usedEmails.filter((e) => e !== clean)].slice(0, 8);
    setUsedEmails(next);
    try {
      localStorage.setItem(USED_EMAILS_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable
    }
  };

  const suggestions = usedEmails.filter((e) =>
    !email || e.toLowerCase().startsWith(email.trim().toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Por favor ingresa un correo electrónico válido.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const returnTarget = returnPath.startsWith('/') ? returnPath : '';

      const res = await fetch('/api/v1/portal/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, return: returnTarget })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al generar el enlace de acceso');
      }

      setSentSuccess(true);
      rememberEmail(email);
      if (data.magicLink) {
        setGeneratedLink(data.magicLink);
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080C] text-white font-sans flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div 
        className="absolute w-full max-w-[500px] h-[500px] top-[15%] left-1/2 -translate-x-1/2 pointer-events-none rounded-full blur-[100px]"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, rgba(0,0,0,0) 70%)' }}
      />

      <div className="w-full max-w-[440px] bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg mx-auto mb-5 border border-white/10">
            <span className="text-white text-lg font-bold">H</span>
          </div>
          <h1 className="text-2xl font-bold mb-2 tracking-tight">
            Acceso a tu Consola Hermes
          </h1>
          <p className="text-sm text-white/60 leading-relaxed max-w-sm mx-auto">
            Ingresa el correo electrónico asociado a tu cuenta de Hermes para recibir tu enlace mágico de acceso directo.
          </p>
        </div>

        {/* Content Body */}
        {sentSuccess ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">📩</div>
            <div className="text-base font-bold text-emerald-400 mb-1.5">
              ¡Enlace Mágico Enviado!
            </div>
            <div className="text-sm text-white/80 mb-4 leading-relaxed">
              Hemos procesado el acceso para <strong className="text-white font-bold">{email}</strong>.
            </div>

            {generatedLink ? (
              <div className="mt-4 pt-4 border-t border-white/10">
                <a
                  href={generatedLink}
                  className="flex items-center justify-center w-full min-h-[48px] bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-bold text-sm px-4 rounded-xl shadow-[0_4px_18px_rgba(124,58,237,0.5)] hover:scale-[1.02] transition-transform"
                >
                  🚀 Entrar al Portal Ahora (Dev Mode)
                </a>
              </div>
            ) : (
              <p className="text-xs text-white/50 mt-3 leading-relaxed">
                Por seguridad, abre el enlace que enviamos a tu correo para iniciar sesión de forma segura.
              </p>
            )}

            <button
              onClick={() => { setSentSuccess(false); setGeneratedLink(null); }}
              className="mt-5 text-sm text-white/50 hover:text-white underline transition-colors"
            >
              Usar otro correo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl mb-4.5 flex items-start gap-2">
                <span className="shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="mb-5 relative" ref={wrapperRef}>
              <label className="block text-sm font-semibold text-white/80 mb-2">
                Correo Electrónico de Cliente
              </label>
              <input
                ref={inputRef}
                type="email"
                required
                placeholder="ejemplo@tuempresa.com"
                autoComplete="email"
                value={email}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onChange={(e) => { setEmail(e.target.value); setShowSuggestions(true); }}
                className="w-full min-h-[48px] bg-white/[0.05] border border-white/[0.16] rounded-xl px-4 text-white text-base outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all placeholder:text-white/30"
              />
              
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-[#0C0C12] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-20">
                  <div className="px-3.5 py-2 text-[11px] font-bold text-white/40 uppercase tracking-wider">
                    Usados recientemente
                  </div>
                  {suggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        setEmail(sug);
                        setShowSuggestions(false);
                        inputRef.current?.focus();
                      }}
                      className="block w-full text-left bg-transparent text-white/90 text-sm px-3.5 py-3 min-h-[44px] hover:bg-violet-500/15 transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full min-h-[48px] rounded-xl text-sm font-bold flex items-center justify-center transition-all ${
                loading 
                  ? 'bg-violet-600/50 text-white cursor-not-allowed'
                  : 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-[0_4px_18px_rgba(124,58,237,0.45)] hover:shadow-[0_4px_24px_rgba(124,58,237,0.6)]'
              }`}
            >
              {loading ? 'Generando Enlace...' : '✨ Enviar Magic Link de Acceso'}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="mt-6 text-center border-t border-white/10 pt-4">
          <span className="text-xs text-white/50 leading-relaxed">
            ¿Solo usas Hermes OS? Sin descargas ni registros complejos.
          </span>
        </div>
      </div>
    </div>
  );
}
