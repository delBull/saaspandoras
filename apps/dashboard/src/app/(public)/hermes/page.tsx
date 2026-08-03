'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SANDBOX_URL = '/api/v1/hermes/sandbox';

const INDUSTRIES = [
  {
    id: 'real_estate',
    label: '🏠 Real Estate',
    agentName: 'Hermes Patrimonial',
    accent: '#f59e0b',
    description: 'Calificación de leads, cotizaciones, reservas y seguimiento de inversores.',
    capabilities: ['Calificación automática', 'SPEI Fast Lane', 'Dossier por canal', 'CRM integrado'],
    starterMessages: [
      'Hola, me interesa invertir. ¿Cuánto cuesta un certificado?',
      '¿Puedo pagar en pesos mexicanos?',
      '¿Cuál es el retorno proyectado?',
    ],
  },
  {
    id: 'automotive',
    label: '🚗 Automotriz',
    agentName: 'Hermes AutoAdvisor',
    accent: '#3b82f6',
    description: 'Atención 24/7, cotizaciones instantáneas y agendado de pruebas de manejo.',
    capabilities: ['Cotización automática', 'Agenda prueba de manejo', 'Inventario en tiempo real', 'Seguimiento CRM'],
    starterMessages: [
      'Quiero información sobre el BMW Serie 3 2025',
      '¿Tienen disponibilidad en color negro?',
      '¿Puedo agendar una prueba este fin de semana?',
    ],
  },
  {
    id: 'legal',
    label: '⚖️ Legal / Firma',
    agentName: 'Hermes Legal',
    accent: '#8b5cf6',
    description: 'Recepción de casos, calificación y agenda de consultas automática.',
    capabilities: ['Recepción 24/7', 'Calificación de casos', 'Agenda automática', 'Knowledge Base legal'],
    starterMessages: [
      'Necesito asesoría para constituir una empresa',
      '¿Cuánto cuesta una consulta?',
      '¿Manejan contratos mercantiles?',
    ],
  },
  {
    id: 'saas',
    label: '💻 SaaS / Tech',
    agentName: 'Hermes SaaS',
    accent: '#10b981',
    description: 'Soporte técnico, onboarding y upsell automatizado para productos digitales.',
    capabilities: ['Soporte Nivel 1', 'Onboarding guiado', 'Detección de churn', 'Upsell inteligente'],
    starterMessages: [
      '¿Cuál es la diferencia entre los planes?',
      'Tengo problemas para conectar mi cuenta',
      '¿Puedo integrar con Slack?',
    ],
  },
  {
    id: 'healthcare',
    label: '🏥 Salud',
    agentName: 'Hermes Health',
    accent: '#ef4444',
    description: 'Agenda de citas, recordatorios y triaje inicial para clínicas y consultorios.',
    capabilities: ['Agenda de citas', 'Recordatorios automáticos', 'Triaje inicial', 'Historial básico'],
    starterMessages: [
      'Quiero agendar una cita con el Dr. García',
      '¿Atienden sin cita?',
      '¿Cuáles son los horarios?',
    ],
  },
] as const;

type Industry = typeof INDUSTRIES[number];
type Message = { role: 'user' | 'agent'; text: string };

const DEFAULT_INDUSTRY: Industry = INDUSTRIES[0];

export default function HermesPublicSandbox() {
  const [industry, setIndustry] = useState<Industry>(DEFAULT_INDUSTRY);
  const [companyName, setCompanyName] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'agent', text: `Hola, soy ${DEFAULT_INDUSTRY.agentName}. ¿En qué puedo ayudarte hoy?` },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const updateCompanyName = (name: string) => {
    setCompanyName(name);
    const cleanName = name.trim() || 'tu empresa';
    setMessages([{ role: 'agent', text: `Hola, soy ${industry.agentName} de ${cleanName}. ¿En qué puedo ayudarte hoy?` }]);
  };

  const switchIndustry = (ind: Industry) => {
    setIndustry(ind);
    const name = companyName.trim() || 'tu empresa';
    setMessages([{ role: 'agent', text: `Hola, soy ${ind.agentName} de ${name}. ¿En qué puedo ayudarte hoy?` }]);
    setBlocked(false);
    setStarted(false);
  };

  const handleStarter = (msg: string) => { setInput(msg); };

  const send = async () => {
    const text = input.trim();
    if (!text || loading || blocked) return;
    setStarted(true);
    setMessages(m => [...m, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(SANDBOX_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          industry: industry.id,
          companyName: companyName.trim() || "Pandora's",
        }),
      });
      const data = await res.json();

      if (res.status === 429 || data.limitReached) {
        setBlocked(true);
        setMessages(m => [...m, {
          role: 'agent',
          text: '⚠️ Has alcanzado el límite de la sesión de demostración. Contacta a nuestro equipo para activar tu acceso completo a Hermes Runtime en producción.',
        }]);
      } else {
        setMessages(m => [...m, { role: 'agent', text: data.reply || data.message || '...' }]);
        if (typeof data.remaining === 'number') setRemaining(data.remaining);
      }
    } catch {
      setMessages(m => [...m, { role: 'agent', text: 'Error de conexión. Intenta de nuevo.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#08080C', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", color: '#fff' }}>

      {/* ── HEADER ── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/apple-touch-icon.png" alt="Pandora's" width={34} height={34} style={{ objectFit: 'contain', background: '#111', borderRadius: 8, padding: 3 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.3px' }}>Pandora's Platform OS</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '2.5px', textTransform: 'uppercase' }}>Hermes Runtime — Demo Sandbox</div>
          </div>
        </div>
        <a href="https://pandoras.finance" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 12, color: 'rgba(124,58,237,0.8)', textDecoration: 'none' }}>
          pandoras.finance →
        </a>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>

        {/* ── HERO ── */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 11, letterSpacing: '4px', color: 'rgba(124,58,237,0.7)', textTransform: 'uppercase', marginBottom: 10 }}>Demo interactivo</div>
          <h1 style={{ fontSize: 38, fontWeight: 700, margin: '0 0 14px', letterSpacing: '-0.5px', lineHeight: 1.15 }}>
            Habla con Hermes ahora
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: 0 }}>
            Simula exactamente cómo Hermes Runtime respondería a tus clientes.<br />
            Selecciona tu industria, escribe el nombre de tu empresa y comienza.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>

          {/* ── LEFT PANEL ── */}
          <div>
            {/* Company name */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 8 }}>
                Tu empresa
              </label>
              <input
                value={companyName}
                onChange={e => updateCompanyName(e.target.value)}
                placeholder="Ej: BMW México, Rabbitty, Clínica Sana..."
                style={{
                  width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 12px',
                  color: '#fff', fontSize: 13, outline: 'none',
                }}
              />
            </div>

            {/* Industry selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 8 }}>
                Industria
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {INDUSTRIES.map(ind => (
                  <button key={ind.id} onClick={() => switchIndustry(ind)} style={{
                    padding: '10px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s',
                    background: industry.id === ind.id ? `rgba(${ind.accent === '#f59e0b' ? '245,158,11' : ind.accent === '#3b82f6' ? '59,130,246' : ind.accent === '#8b5cf6' ? '139,92,246' : ind.accent === '#10b981' ? '16,185,129' : '239,68,68'},0.12)` : 'rgba(255,255,255,0.03)',
                    border: industry.id === ind.id ? `1px solid ${ind.accent}44` : '1px solid rgba(255,255,255,0.07)',
                    color: industry.id === ind.id ? '#fff' : 'rgba(255,255,255,0.5)',
                    fontWeight: industry.id === ind.id ? 600 : 400,
                  }}>
                    {ind.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Capabilities */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '14px' }}>
              <div style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>
                Capacidades activas
              </div>
              {industry.capabilities.map((cap, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: industry.accent, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{cap}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── CHAT PANEL ── */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: '#0F0F18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>

              {/* Agent header */}
              <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg, ${industry.accent}, #4f46e5)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>⚡</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{industry.agentName}</div>
                  <div style={{ fontSize: 11, color: 'rgba(124,58,237,0.7)' }}>● En línea · Respondiendo en segundos</div>
                </div>
                {remaining !== null && (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: 20 }}>
                    {remaining} msg restantes
                  </div>
                )}
              </div>

              {/* Messages */}
              <div style={{ flex: 1, minHeight: 280, overflowY: 'auto', padding: '18px 18px 8px' }}>
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                      <div style={{
                        maxWidth: '78%', padding: '10px 14px', borderRadius: 12, fontSize: 14, lineHeight: 1.65,
                        background: msg.role === 'user' ? 'rgba(124,58,237,0.28)' : 'rgba(255,255,255,0.05)',
                        border: msg.role === 'user' ? '1px solid rgba(124,58,237,0.3)' : '1px solid rgba(255,255,255,0.07)',
                        color: msg.role === 'user' ? '#e9d5ff' : 'rgba(255,255,255,0.85)',
                      }}>
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {loading && (
                  <div style={{ display: 'flex', gap: 4, padding: '6px 0' }}>
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                        style={{ width: 6, height: 6, borderRadius: '50%', background: industry.accent }} />
                    ))}
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Starter suggestions */}
              {!started && !blocked && (
                <div style={{ padding: '8px 18px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 6 }}>Sugerencias rápidas:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {industry.starterMessages.map((s, i) => (
                      <button key={i} onClick={() => handleStarter(s)} style={{
                        fontSize: 12, padding: '5px 10px', borderRadius: 20, cursor: 'pointer',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.55)', transition: 'all 0.15s',
                      }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 8 }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
                  disabled={loading || blocked}
                  placeholder={blocked ? 'Sesión finalizada — contacta al equipo' : `Escribe a ${industry.agentName}...`}
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none',
                    opacity: blocked ? 0.4 : 1,
                  }}
                />
                <button onClick={() => void send()} disabled={loading || blocked || !input.trim()}
                  style={{
                    padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    background: `linear-gradient(135deg, ${industry.accent}, #4f46e5)`, color: '#fff', border: 'none',
                    opacity: (loading || blocked || !input.trim()) ? 0.45 : 1, transition: 'opacity 0.15s',
                  }}>
                  Enviar
                </button>
              </div>
            </div>

            {/* Permanent Pro / Custom Integration Banner */}
            <div style={{ marginTop: 16, padding: '18px 22px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 3 }}>
                  🚀 Desbloquea Hermes OS en Producción
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                  Planes desde $299 USD/mes. Incluye conectores Telegram/WhatsApp, base de conocimiento propia e integración con S'Narai.
                </div>
              </div>
              <a href="mailto:hello@pandoras.finance?subject=Solicitud%20Plan%20Pro%20Hermes%20OS"
                style={{ padding: '9px 18px', borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                Activar Plan Pro →
              </a>
            </div>

            {/* CTA when blocked */}
            {blocked && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: 16, padding: '20px 24px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>¿Listo para activar Hermes en {companyName.trim() || 'tu empresa'}?</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 14 }}>
                  Has consumido tus mensajes de prueba. Solicita la activación de tu instancia dedicada de Hermes OS en 48 hrs.
                </div>
                <a href="mailto:hello@pandoras.finance?subject=Hermes%20Assessment%20Request"
                  style={{ display: 'inline-block', padding: '10px 22px', borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                  Solicitar Instancia Dedicada →
                </a>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
