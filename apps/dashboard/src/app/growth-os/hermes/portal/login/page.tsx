'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const USED_EMAILS_KEY = 'hermes_used_emails';

export default function PortalLoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
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
      const res = await fetch('/api/v1/portal/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
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
    <div style={{
      minHeight: '100vh',
      background: '#08080C',
      color: '#fff',
      fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Glow */}
      <div style={{
        position: 'absolute',
        width: 500,
        height: 500,
        background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, rgba(0,0,0,0) 70%)',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: 440,
        width: '100%',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: 36,
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(124,58,237,0.1)',
            border: '1px solid rgba(124,58,237,0.3)',
            color: '#a78bfa',
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 12px',
            borderRadius: 20,
            marginBottom: 16
          }}>
            <span>✨ HERMES OS PORTAL</span>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Acceso a tu Consola Hermes
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: '1.5' }}>
            Ingresa el correo electrónico asociado a tu cuenta de Hermes para recibir tu enlace mágico de acceso directo.
          </p>
        </div>

        {/* Content Body */}
        {sentSuccess ? (
          <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📩</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#10b981', marginBottom: 6 }}>
              ¡Enlace Mágico Enviado!
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>
              Hemos procesado el acceso para <strong>{email}</strong>.
            </div>

            {generatedLink ? (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <a
                  href={generatedLink}
                  style={{
                    display: 'block',
                    width: '100%',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                    color: '#fff',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: 14,
                    padding: '12px 16px',
                    borderRadius: 10,
                    textAlign: 'center',
                    boxShadow: '0 4px 14px rgba(124,58,237,0.4)'
                  }}
                >
                  🚀 Entrar al Portal Ahora (Dev Mode)
                </a>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 12, lineHeight: 1.5 }}>
                Por seguridad, abre el enlace que enviamos a tu correo para iniciar sesión de forma segura.
              </p>
            )}

            <button
              onClick={() => { setSentSuccess(false); setGeneratedLink(null); }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.4)',
                fontSize: 12,
                marginTop: 16,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Usar otro correo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171',
                fontSize: 13,
                padding: '10px 14px',
                borderRadius: 10,
                marginBottom: 18
              }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
                Correo Electrónico de Cliente
              </label>
              <div ref={wrapperRef} style={{ position: 'relative' }}>
                <input
                  ref={inputRef}
                  type="email"
                  required
                  placeholder="ejemplo@tuempresa.com"
                  autoComplete="email"
                  value={email}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onChange={(e) => { setEmail(e.target.value); setShowSuggestions(true); }}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 10,
                    padding: '12px 16px',
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    background: '#12121a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    overflow: 'hidden',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
                    zIndex: 20
                  }}>
                    <div style={{ padding: '6px 12px', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
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
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          background: 'transparent',
                          border: 'none',
                          color: 'rgba(255,255,255,0.85)',
                          fontSize: 13,
                          padding: '10px 14px',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = 'rgba(124,58,237,0.12)'; }}
                        onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = 'transparent'; }}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '14px',
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(124,58,237,0.4)',
                transition: 'all 0.2s'
              }}
            >
              {loading ? 'Generando Enlace...' : '✨ Enviar Magic Link de Acceso'}
            </button>
          </form>
        )}

        {/* Footer */}
        <div style={{ marginTop: 24, textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            ¿Solo usas Hermes OS? Sin descargas ni registros complejos.
          </span>
        </div>
      </div>
    </div>
  );
}
