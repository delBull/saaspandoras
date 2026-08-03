'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SANDBOX_URL = '/api/v1/hermes/sandbox';

const INDUSTRIES = [
  { id: 'real_estate', label: '🏠 Real Estate',   agentName: 'Hermes Patrimonial' },
  { id: 'automotive',  label: '🚗 Automotriz',     agentName: 'Hermes AutoAdvisor' },
  { id: 'legal',       label: '⚖️ Legal / Firma',  agentName: 'Hermes Legal' },
  { id: 'saas',        label: '💻 SaaS / Tech',    agentName: 'Hermes SaaS' },
  { id: 'healthcare',  label: '🏥 Salud',           agentName: 'Hermes Health' },
] as const;

type Industry = typeof INDUSTRIES[number];

interface Message { role: 'user' | 'agent'; text: string; }

const DEFAULT_INDUSTRY: Industry = INDUSTRIES[0];

export default function HermesPublicSandbox() {
  const [industry, setIndustry] = useState<Industry>(DEFAULT_INDUSTRY);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'agent', text: `Hola, soy ${DEFAULT_INDUSTRY.agentName}. ¿En qué puedo ayudarte hoy?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [blocked, setBlocked] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const switchIndustry = (ind: Industry) => {
    setIndustry(ind);
    setMessages([{ role: 'agent', text: `Hola, soy ${ind.agentName}. ¿En qué puedo ayudarte hoy?` }]);
    setBlocked(false);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading || blocked) return;

    setMessages(m => [...m, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(SANDBOX_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, industry: industry.id, companyName: "Pandora's" }),
      });

      const data = await res.json();

      if (res.status === 429 || data.limitReached) {
        setBlocked(true);
        setMessages(m => [...m, {
          role: 'agent',
          text: '⚠️ Has alcanzado el límite del Sandbox. Contacta a nuestro equipo para activar tu acceso completo a Hermes Runtime.'
        }]);
      } else {
        setMessages(m => [...m, { role: 'agent', text: data.reply || data.message || '...' }]);
        if (data.remaining !== undefined) setRemaining(data.remaining);
      }
    } catch {
      setMessages(m => [...m, { role: 'agent', text: 'Error de conexión. Intenta de nuevo.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#08080C', fontFamily: "'Helvetica Neue', sans-serif", color: '#fff' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/apple-touch-icon.png" alt="Pandora's" width={36} height={36} style={{ objectFit: 'contain', borderRadius: 8 }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px' }}>Pandora's Platform OS</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '2px', textTransform: 'uppercase' }}>Hermes Runtime — Sandbox</div>
          </div>
        </div>
        <a href="https://pandoras.finance" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'rgba(124,58,237,0.8)', textDecoration: 'none', letterSpacing: '0.5px' }}>
          pandoras.finance →
        </a>
      </div>

      {/* Hero text */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, letterSpacing: '4px', color: 'rgba(124,58,237,0.7)', textTransform: 'uppercase', marginBottom: 12 }}>Demo Sandbox</div>
        <h1 style={{ fontSize: 36, fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
          Hermes Runtime
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>
          Prueba la infraestructura de inteligencia autónoma de Pandora's.<br />
          Selecciona una industria y conversa directamente con Hermes.
        </p>
      </div>

      {/* Industry selector */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px 24px', display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {INDUSTRIES.map(ind => (
          <button
            key={ind.id}
            onClick={() => switchIndustry(ind)}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
              background: industry.id === ind.id ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.05)',
              border: industry.id === ind.id ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.08)',
              color: industry.id === ind.id ? '#a78bfa' : 'rgba(255,255,255,0.6)',
              fontWeight: industry.id === ind.id ? 600 : 400
            }}
          >
            {ind.label}
          </button>
        ))}
      </div>

      {/* Chat container */}
      <div style={{ maxWidth: 680, margin: '0 auto 40px', padding: '0 24px' }}>
        <div style={{ background: '#0F0F18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>

          {/* Agent header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚡</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{industry.agentName}</div>
              <div style={{ fontSize: 11, color: 'rgba(124,58,237,0.7)' }}>● En línea</div>
            </div>
            {remaining !== null && (
              <div style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                {remaining} mensajes restantes hoy
              </div>
            )}
          </div>

          {/* Messages */}
          <div style={{ height: 320, overflowY: 'auto', padding: '20px 20px 8px' }}>
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}
                >
                  <div style={{
                    maxWidth: '75%', padding: '10px 14px', borderRadius: 12, fontSize: 14, lineHeight: 1.6,
                    background: msg.role === 'user' ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.05)',
                    border: msg.role === 'user' ? '1px solid rgba(124,58,237,0.3)' : '1px solid rgba(255,255,255,0.07)',
                    color: msg.role === 'user' ? '#e9d5ff' : 'rgba(255,255,255,0.85)'
                  }}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <div style={{ display: 'flex', gap: 4, padding: '8px 0' }}>
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                    style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed' }}
                  />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
              disabled={loading || blocked}
              placeholder={blocked ? 'Límite alcanzado — contacta al equipo' : 'Escribe tu mensaje...'}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none',
                opacity: blocked ? 0.5 : 1
              }}
            />
            <button
              onClick={() => void send()}
              disabled={loading || blocked || !input.trim()}
              style={{
                padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none',
                opacity: (loading || blocked || !input.trim()) ? 0.5 : 1
              }}
            >
              Enviar
            </button>
          </div>
        </div>

        {/* CTA when blocked */}
        {blocked && (
          <div style={{ marginTop: 20, padding: '20px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>¿Listo para activar Hermes en tu empresa?</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>Agenda una sesión de assessment con nuestro equipo.</div>
            <a href="https://pandoras.finance" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
              Contactar al equipo →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
