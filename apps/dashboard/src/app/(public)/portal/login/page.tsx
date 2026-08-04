'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function PortalLoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

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

            {generatedLink && (
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
                  🚀 Entrar al Portal Ahora
                </a>
              </div>
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
              <input
                type="email"
                required
                placeholder="ejemplo@tuempresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
