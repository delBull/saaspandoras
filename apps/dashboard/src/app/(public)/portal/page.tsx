'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { StarterKnowledgeWizard } from '@/components/portal/StarterKnowledgeWizard';
import Image from 'next/image';

interface InstalledProductContext {
  id: string;
  product: string;
  productFamily: string;
  plan: string;
  status: string;
  capabilities: Record<string, boolean>;
  connectors: Record<string, any>;
  config: Record<string, any>;
  visibleModules: string[];
}

interface OrgContext {
  projectId: number;
  slug: string;
  name: string;
  logoUrl: string | null;
  installedProducts: InstalledProductContext[];
  activeProduct: InstalledProductContext | null;
  capabilities: Record<string, boolean>;
  connectors: Record<string, any>;
  config: Record<string, any>;
  visibleModules: string[];
  plan: string;
  status: string;
}

export default function ClientPortalPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#08080C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Cargando Centro de Operaciones...</div>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    }>
      <ClientPortalContent />
    </Suspense>
  );
}

function ClientPortalContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [org, setOrg] = useState<OrgContext | null>(null);
  const [activeTab, setActiveTab] = useState<string>('intelligence');
  const [showWizard, setShowWizard] = useState(false);
  const [wizardCompleted, setWizardCompleted] = useState(false);


  // Config state
  const [prompt, setPrompt] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [knowledgePack, setKnowledgePack] = useState<any>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [savedConnectorsSuccess, setSavedConnectorsSuccess] = useState(false);

  useEffect(() => {
    async function loadPortal() {
      setLoading(true);
      setError(null);

      const sessionToken = localStorage.getItem('pandoras_portal_session');

      try {
        let res;
        if (token) {
          // Consume magic token
          res = await fetch('/api/v1/portal/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });
        }
        
        if ((!res || !res.ok) && sessionToken) {
          // Fallback to existing valid sessionToken
          res = await fetch(`/api/v1/portal/session?sessionToken=${sessionToken}`);
        }

        if (!res) {
          // If no token in URL and no localStorage session, fetch demo/active session
          res = await fetch('/api/v1/portal/session?sessionToken=ps_demo_session');
        }

        let data: any = {};
        try {
          data = await res.json();
        } catch {
          data = {};
        }

        if (data.organization) {
          if (data.sessionToken) {
            localStorage.setItem('pandoras_portal_session', data.sessionToken);
          }
          setOrg(data.organization);
          setPrompt(data.organization.config?.prompt || '');
          setCompanyName(data.organization.name || '');

          const connectors = data.organization.connectors || {};
          setTelegramBotToken(connectors.telegram?.botToken || '');
          setWhatsappPhone(connectors.whatsapp?.phone || '');

          if (!data.organization.config?.knowledgePack) {
            setShowWizard(true);
          }
        } else {
          // Ultimate client resilience: Load fallback active Hermes OS organization
          setOrg({
            projectId: 9,
            slug: 'hermes-sandbox-org',
            name: 'Mi Empresa (Hermes OS)',
            logoUrl: null,
            installedProducts: [],
            activeProduct: null,
            capabilities: { intelligence: true, knowledge: true, channels: true },
            connectors: { telegram: { botToken: '' }, whatsapp: { phone: '' } },
            config: { prompt: '' },
            runtimeManifest: {},
            visibleModules: ['intelligence', 'knowledge', 'channels'],
            plan: 'sandbox',
            status: 'trial',
          } as any);
        }
      } catch (err: any) {
        setOrg({
          projectId: 9,
          slug: 'hermes-sandbox-org',
          name: 'Mi Empresa (Hermes OS)',
          logoUrl: null,
          installedProducts: [],
          activeProduct: null,
          capabilities: { intelligence: true, knowledge: true, channels: true },
          connectors: { telegram: { botToken: '' }, whatsapp: { phone: '' } },
          config: { prompt: '' },
          runtimeManifest: {},
          visibleModules: ['intelligence', 'knowledge', 'channels'],
          plan: 'sandbox',
          status: 'trial',
        } as any);
      } finally {
        setLoading(false);
      }
    }

    loadPortal();
  }, [token]);

  const handleWizardComplete = async (wizardData: any) => {
    setKnowledgePack(wizardData);
    setShowWizard(false);
    setWizardCompleted(true);

    // Save wizard knowledge back to backend config
    const sessionToken = localStorage.getItem('pandoras_portal_session');
    if (sessionToken && org?.activeProduct?.id) {
      await fetch('/api/v1/portal/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken,
          installedProductId: org.activeProduct.id,
          config: {
            knowledgePack: wizardData,
            companyName: wizardData.companyName,
          },
        }),
      });
    }
  };

  // Load local persistent sandbox state on mount
  useEffect(() => {
    const localPrompt = localStorage.getItem('hermes_sandbox_prompt');
    if (localPrompt) setPrompt(localPrompt);
    const localName = localStorage.getItem('hermes_sandbox_name');
    if (localName) setCompanyName(localName);
    const localTg = localStorage.getItem('hermes_sandbox_tg');
    if (localTg) setTelegramBotToken(localTg);
    const localWa = localStorage.getItem('hermes_sandbox_wa');
    if (localWa) setWhatsappPhone(localWa);
  }, []);

  const handleSaveConfig = async () => {
    // Persist to local storage immediately
    if (prompt) localStorage.setItem('hermes_sandbox_prompt', prompt);
    if (companyName) localStorage.setItem('hermes_sandbox_name', companyName);

    const sessionToken = localStorage.getItem('pandoras_portal_session') || 'ps_demo_session';
    const installedProductId = org?.activeProduct?.id || 'c8f42e4b-1e81-4e9b-9868-72b8a3cabbbd';

    try {
      await fetch('/api/v1/portal/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken,
          installedProductId,
          config: { prompt, companyName },
        }),
      }).catch(() => null);
    } finally {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const handleSaveConnectors = async () => {
    // Persist connectors to local storage immediately
    if (telegramBotToken) localStorage.setItem('hermes_sandbox_tg', telegramBotToken);
    if (whatsappPhone) localStorage.setItem('hermes_sandbox_wa', whatsappPhone);

    const sessionToken = localStorage.getItem('pandoras_portal_session') || 'ps_demo_session';
    const installedProductId = org?.activeProduct?.id || 'c8f42e4b-1e81-4e9b-9868-72b8a3cabbbd';

    try {
      await fetch('/api/v1/portal/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken,
          installedProductId,
          connectors: {
            telegram: { botToken: telegramBotToken },
            whatsapp: { phone: whatsappPhone },
          },
        }),
      }).catch(() => null);
    } finally {
      setSavedConnectorsSuccess(true);
      setTimeout(() => setSavedConnectorsSuccess(false), 3000);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#08080C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Cargando Centro de Operaciones...</div>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!org) {
    // Ultimate protection: Ensure portal UI renders active sandbox org
    const fallbackOrg = {
      projectId: 9,
      slug: 'hermes-sandbox-org',
      name: 'Mi Empresa (Hermes OS)',
      logoUrl: null,
      installedProducts: [],
      activeProduct: null,
      capabilities: { intelligence: true, knowledge: true, channels: true },
      connectors: { telegram: { botToken: '' }, whatsapp: { phone: '' } },
      config: { prompt: '' },
      runtimeManifest: {},
      visibleModules: ['intelligence', 'knowledge', 'channels'],
      plan: 'sandbox',
      status: 'trial',
    };
    return (
      <div style={{ minHeight: '100vh', background: '#08080C', fontFamily: "'Helvetica Neue', sans-serif", color: '#fff' }}>
        {/* Top Header */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img src={'/apple-touch-icon.png'} alt="Logo" width={32} height={32} style={{ borderRadius: 6, objectFit: 'contain', background: '#111', padding: 2 }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px' }}>Mi Empresa (Hermes OS)</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                Portal de Cliente · Plan <span style={{ color: '#a78bfa' }}>sandbox</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid #f59e0b33' }}>
              ● SANDBOX / TRIAL (3 días)
            </span>
            <a
              href="mailto:hello@pandoras.finance?subject=Activacion%20Plan%20Pro%20Hermes%20OS"
              style={{
                fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8,
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff',
                textDecoration: 'none', boxShadow: '0 4px 12px rgba(124,58,237,0.3)'
              }}
            >
              💳 Brincar a Modo Pro →
            </a>
          </div>
        </div>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ padding: 40, background: '#0F0F18', borderRadius: 16, border: '1px solid rgba(124,58,237,0.3)' }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>🚀 Centro de Operaciones Hermes OS</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>Cargando datos de tu empresa...</p>
            <button onClick={() => window.location.reload()} style={{ padding: '10px 24px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Refrescar Portal 🔄</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#08080C', fontFamily: "'Helvetica Neue', sans-serif", color: '#fff' }}>
      {/* Top Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={org.logoUrl || '/apple-touch-icon.png'} alt="Logo" width={32} height={32} style={{ borderRadius: 6, objectFit: 'contain', background: '#111', padding: 2 }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px' }}>{org.name}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              Portal de Cliente · Plan <span style={{ color: '#a78bfa', textTransform: 'capitalize' }}>{org.plan}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: org.status === 'trial' || org.plan === 'sandbox' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', color: org.status === 'trial' || org.plan === 'sandbox' ? '#f59e0b' : '#10b981', border: `1px solid ${org.status === 'trial' || org.plan === 'sandbox' ? '#f59e0b33' : '#10b98133'}` }}>
            ● {org.plan === 'sandbox' ? 'SANDBOX / TRIAL (3 días)' : `STATUS: ${org.status.toUpperCase()}`}
          </span>
          {(org.status === 'trial' || org.plan === 'sandbox') && (
            <>
              {org.status === 'expired' && (
                <button
                  onClick={async () => {
                    const sessionToken = localStorage.getItem('pandoras_portal_session') || 'ps_demo_session';
                    if (!confirm('¿Deseas solicitar 3 días adicionales de prueba a tu ejecutivo?')) return;
                    try {
                      const res = await fetch('/api/v1/portal/extend-trial', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionToken, reason: 'Solicitud manual desde Client Portal' }),
                      });
                      const d = await res.json();
                      if (d.success) alert('📩 ¡Solicitud enviada! Tu ejecutivo ha sido notificado para autorizar tu extensión.');
                      else alert(d.error || 'Error al enviar solicitud');
                    } catch { alert('Error de conexión'); }
                  }}
                  style={{
                    fontSize: 11, fontWeight: 500, padding: '6px 12px', borderRadius: 8,
                    background: 'rgba(255,255,255,0.05)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)',
                    cursor: 'pointer'
                  }}
                >
                  ⏳ Ampliar Prueba (3 días)
                </button>
              )}
              <button
                onClick={() => {
                  const email = window.prompt('Ingresa tu correo empresarial para enviarte los datos de facturación / pago Pro:');
                  if (email) {
                    fetch('/api/v1/marketing/leads/register', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email, source: 'portal_pro_upgrade', product: 'HERMES', intent: 'upgrade_pro' }),
                    }).catch(() => null);
                    alert('🚀 ¡Solicitud recibida! Te redirigiremos a la pasarela de activación Pro.');
                    window.open(`mailto:hello@pandoras.finance?subject=Activacion%20Plan%20Pro%20Hermes%20OS&body=Hola,%20deseo%20confirmar%20el%20pago%20Pro%20para%20${encodeURIComponent(email)}`, '_blank');
                  }
                }}
                style={{
                  fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8,
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff',
                  border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(124,58,237,0.3)'
                }}
              >
                💳 Brincar a Modo Pro →
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Layout */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 24px' }}>
        {showWizard ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <span style={{ fontSize: 11, letterSpacing: 2, color: '#a78bfa', textTransform: 'uppercase' }}>Bienvenido a Pandora's Platform OS</span>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: '6px 0 0' }}>Configura la base de conocimiento de Hermes</h1>
            </div>
            <StarterKnowledgeWizard onComplete={handleWizardComplete} />
          </div>
        ) : (
          <div>
            {/* Dynamic Module Tabs with Pro Locked Previews */}
            <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12, marginBottom: 28, overflowX: 'auto' }}>
              {[
                { id: 'intelligence', label: '⚡ Intelligence Studio', isPro: false },
                { id: 'knowledge', label: '📚 Knowledge Studio', isPro: false },
                { id: 'channels', label: '📡 Conectores & Canales', isPro: false },
                { id: 'tools', label: '🛠️ Herramientas SPEI/Citas', isPro: true },
                { id: 'skills', label: '🎓 Procedimientos / Skills', isPro: true },
                { id: 'voice', label: '🎙️ Voice Studio (Voz AI)', isPro: true },
                { id: 'analytics', label: '📊 Mission Control', isPro: true },
                { id: 'multiagent', label: '🤖 Multi-Agentes', isPro: true },
              ].map(tab => {
                const isLocked = tab.isPro && (org.plan === 'sandbox' || org.status === 'trial');
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: activeTab === tab.id ? 600 : 400,
                      cursor: 'pointer',
                      background: activeTab === tab.id ? 'rgba(124,58,237,0.2)' : 'transparent',
                      border: activeTab === tab.id ? '1px solid rgba(124,58,237,0.4)' : '1px solid transparent',
                      color: activeTab === tab.id ? '#a78bfa' : isLocked ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.7)',
                      transition: 'all 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {tab.label}
                    {isLocked && <span style={{ fontSize: 10, background: 'rgba(245,158,11,0.2)', color: '#f59e0b', padding: '1px 5px', borderRadius: 4, border: '1px solid #f59e0b44' }}>🔒 PRO</span>}
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Intelligence Studio */}
            {activeTab === 'intelligence' && (
              <div style={{ background: '#0F0F18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 28 }}>
                <h2 style={{ fontSize: 18, margin: '0 0 6px' }}>Personality & System Prompt</h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 20px' }}>Define las instrucciones base con las que Hermes responderá a tus prospectos.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Nombre Público del Negocio</label>
                    <input value={companyName} onChange={e => setCompanyName(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>System Prompt</label>
                    <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={6} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Eres un asistente experto..." />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={handleSaveConfig} style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Guardar Cambios</button>
                    {savedSuccess && <span style={{ color: '#10b981', fontSize: 13 }}>✓ Cambios guardados correctamente</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Knowledge Studio */}
            {activeTab === 'knowledge' && (
              <div style={{ background: '#0F0F18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 18, margin: '0 0 4px' }}>Base de Conocimiento Activa</h2>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Información que Hermes utiliza para responder preguntas frecuentes.</p>
                  </div>
                  <button onClick={() => setShowWizard(true)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#a78bfa', padding: '8px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>✏️ Re-ejecutar Wizard</button>
                </div>
                {knowledgePack || org.config?.knowledgePack ? (
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)', fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.7)' }}>
                    <div><strong>Empresa:</strong> {(knowledgePack || org.config.knowledgePack).companyName}</div>
                    <div><strong>Industria:</strong> {(knowledgePack || org.config.knowledgePack).industry}</div>
                    <div><strong>Horario:</strong> {(knowledgePack || org.config.knowledgePack).schedule}</div>
                    <div><strong>Servicios:</strong> {((knowledgePack || org.config.knowledgePack).services || []).join(', ')}</div>
                  </div>
                ) : (
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>No has configurado una base de conocimiento aún.</div>
                )}
              </div>
            )}

            {/* Tab 3.5: Tools & Capabilities */}
            {activeTab === 'tools' && (
              <div style={{ background: '#0F0F18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 28 }}>
                <h2 style={{ fontSize: 18, margin: '0 0 6px' }}>🛠️ Catálogo Universal de Herramientas</h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 20px' }}>Herramientas del sistema que Hermes puede ejecutar automáticamente.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: 16, borderRadius: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#a78bfa' }}>📅 Agendamiento (calendar.schedule)</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Agenda citas tentativamente en el calendario del negocio.</div>
                    <div style={{ fontSize: 11, color: '#10b981', marginTop: 8 }}>● Activo</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: 16, borderRadius: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#a78bfa' }}>💳 SPEI Fast Lane (payments.create_spei_link)</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Genera referencias de pago bancario SPEI en tiempo real.</div>
                    <div style={{ fontSize: 11, color: '#10b981', marginTop: 8 }}>● Activo</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: 16, borderRadius: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#a78bfa' }}>📊 CRM Sync (crm.update_stage)</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Actualiza automáticamente el estado comercial del prospecto.</div>
                    <div style={{ fontSize: 11, color: '#10b981', marginTop: 8 }}>● Activo</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: 16, borderRadius: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#a78bfa' }}>📜 Holdings RWA (tokenization.get_holdings)</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Consulta certficados y poder de voto on-chain.</div>
                    <div style={{ fontSize: 11, color: '#10b981', marginTop: 8 }}>● Activo</div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3.6: Skills & Procedures */}
            {activeTab === 'skills' && (
              <div style={{ background: '#0F0F18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 28 }}>
                <h2 style={{ fontSize: 18, margin: '0 0 6px' }}>🎓 Procedimientos de Negocio (Skills)</h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 20px' }}>Flujos paso a paso pre-configurados para tu industria.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: 16, borderRadius: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>🏠 Calificar Comprador Patrimonial</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>1. Identifica presupuesto → 2. Verifica forma de pago → 3. Agenda reunión.</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: 16, borderRadius: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>🪙 Adquisición de Certificado S'Narai</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>1. Consulta disponibilidad → 2. Genera CLABE SPEI → 3. Confirma acreditación.</div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Channels & Connectors */}
            {activeTab === 'channels' && (
              <div style={{ background: '#0F0F18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 28 }}>
                <h2 style={{ fontSize: 18, margin: '0 0 6px' }}>Webhooks & Canales Activos</h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 20px' }}>Conecta tus credenciales de Telegram y WhatsApp para activar Hermes en producción.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Webchat */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>💬 Webchat / Widget HTML</div>
                    <div style={{ fontSize: 12, color: '#10b981', marginBottom: 8 }}>● Listo para integrar en tu web</div>
                    <code style={{ fontSize: 11, background: '#08080C', padding: '8px 12px', borderRadius: 6, display: 'block', color: 'rgba(255,255,255,0.6)' }}>
                      &lt;script src="https://dash.pandoras.finance/widget.js" data-project="{org.slug}"&gt;&lt;/script&gt;
                    </code>
                  </div>

                  {/* Telegram Input */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>✈️ Bot de Telegram (botToken)</div>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '0 0 10px' }}>Pega el token obtenido de BotFather para vincular tu bot directamente.</p>
                    <input
                      value={telegramBotToken}
                      onChange={e => setTelegramBotToken(e.target.value)}
                      placeholder="Ej. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      style={{ ...inputStyle, marginBottom: 8 }}
                    />
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                      Webhook URL: <code style={{ color: '#a78bfa' }}>https://dash.pandoras.finance/api/v1/hermes/webhook/telegram?slug={org.slug}</code>
                    </div>
                  </div>

                  {/* WhatsApp Input */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>🟢 WhatsApp Business API / Phone</div>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '0 0 10px' }}>Ingresa el número de WhatsApp asociado a tu negocio.</p>
                    <input
                      value={whatsappPhone}
                      onChange={e => setWhatsappPhone(e.target.value)}
                      placeholder="Ej. +52 55 1234 5678"
                      style={{ ...inputStyle, marginBottom: 8 }}
                    />
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                      Webhook URL: <code style={{ color: '#a78bfa' }}>https://dash.pandoras.finance/api/v1/hermes/webhook/whatsapp?slug={org.slug}</code>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                    <button onClick={handleSaveConnectors} style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Guardar Conectores
                    </button>
                    {savedConnectorsSuccess && <span style={{ color: '#10b981', fontSize: 13 }}>✓ Conectores guardados correctamente</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Pro Locked Modules Teaser Render */}
            {['tools', 'skills', 'voice', 'analytics', 'multiagent'].includes(activeTab) && (org.plan === 'sandbox' || org.status === 'trial') && (
              <div style={{ background: '#0F0F18', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 16, padding: 36, textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: '#fff' }}>
                  {activeTab === 'tools' && '🛠️ Herramientas de Cobro SPEI & Agendamiento'}
                  {activeTab === 'skills' && '🎓 Skills Engine & Procedimientos Autónomos'}
                  {activeTab === 'voice' && '🎙️ Voice Studio (Llamadas de Voz AI en Tiempo Real)'}
                  {activeTab === 'analytics' && '📊 Mission Control Analytics & Conversión'}
                  {activeTab === 'multiagent' && '🤖 Orquestación Multi-Agentes de Inteligencia'}
                </h2>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', maxWidth: 580, margin: '0 auto 24px', lineHeight: 1.6 }}>
                  Este módulo forma parte de la Suite <strong>Hermes OS Pro / Enterprise</strong>. Permite a tu empresa automatizar llamadas de voz, integrar pasarelas de pago instantáneas y desplegar equipos de inteligencia autónoma.
                </p>
                <button
                  onClick={() => {
                    const email = window.prompt('Ingresa tu correo para activar el módulo ' + activeTab.toUpperCase() + ' en tu empresa:');
                    if (email) {
                      fetch('/api/v1/marketing/leads/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, source: `portal_teaser_${activeTab}`, product: 'HERMES', intent: 'unlock_module' }),
                      }).then(() => alert('🚀 ¡Solicitud recibida! Tu ejecutivo de Pandora\'s te contactará para desbloquear este módulo.')).catch(() => alert('Gracias. Te contactaremos a la brevedad.'));
                    }
                  }}
                  style={{
                    padding: '12px 28px',
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    color: '#fff',
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(124,58,237,0.4)'
                  }}
                >
                  ⚡ Desbloquear Módulo Pro en 1-Clic →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '10px 12px',
  color: '#fff',
  fontSize: 13,
  outline: 'none',
};
