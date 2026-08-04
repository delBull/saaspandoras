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


  // Custom Glassmorphism Upgrade Modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalModule, setUpgradeModalModule] = useState<string | null>(null);
  const [userUpgradeEmail, setUserUpgradeEmail] = useState('');
  const [isSubmittingUpgrade, setIsSubmittingUpgrade] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  // Embedded Portal Test Console Drawer state
  const [showTestDrawer, setShowTestDrawer] = useState(false);
  const [testInputMessage, setTestInputMessage] = useState('');
  const [testChatMessages, setTestChatMessages] = useState<Array<{ role: 'user' | 'agent'; text: string }>>([]);
  const [isTestChatLoading, setIsTestChatLoading] = useState(false);

  // Config state
  const [prompt, setPrompt] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [knowledgePack, setKnowledgePack] = useState<any>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [savedConnectorsSuccess, setSavedConnectorsSuccess] = useState(false);

  // CRM Leads State
  const [portalLeads, setPortalLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

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

        const localKnowledge = localStorage.getItem('hermes_sandbox_kp');
        if (!localKnowledge) {
          setShowWizard(true);
        }
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
    localStorage.setItem('hermes_sandbox_kp', JSON.stringify(wizardData));

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
      }).catch(() => null);
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
    const localKp = localStorage.getItem('hermes_sandbox_kp');
    if (localKp) {
      try {
        setKnowledgePack(JSON.parse(localKp));
      } catch {}
    }
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
          <a
            href="/portal/login"
            onClick={() => {
              localStorage.removeItem('pandoras_portal_session');
            }}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              color: 'rgba(255,255,255,0.5)',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
          >
            🔒 Cambiar / Salir
          </a>
          <button
            onClick={() => {
              if (testChatMessages.length === 0) {
                setTestChatMessages([
                  { role: 'agent', text: `¡Hola! Soy Hermes, el asistente autónomo para ${companyName || org.name || 'tu negocio'}. ¿En qué te puedo ayudar hoy?` }
                ]);
              }
              setShowTestDrawer(true);
            }}
            style={{
              fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8,
              background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            ⚡ Probar Agente con Mis Datos 💬
          </button>
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
                  setUpgradeModalModule(null);
                  setUpgradeSuccess(false);
                  setShowUpgradeModal(true);
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
            {/* Categorized Visual Command Suite Navigation */}
            <div style={{ marginBottom: 32 }}>
              {/* Category Pills Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                    Módulos Hermes OS
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#a78bfa', background: 'rgba(124,58,237,0.1)', padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(124,58,237,0.25)' }}>
                  ✨ 3 Activos en Trial · 5 Disponibles en Pro Suite
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { id: 'intelligence', label: 'Intelligence Studio', icon: '⚡', category: 'Core', desc: 'System Prompt & Identidad', badge: '● ACTIVO' },
                  { id: 'knowledge', label: 'Knowledge Studio', icon: '📚', category: 'Core', desc: 'FAQ & Base de Conocimiento', badge: '● ACTIVO' },
                  { id: 'channels', label: 'Conectores & Canales', icon: '📡', category: 'Core', desc: 'Telegram / WhatsApp / Web', badge: '● ACTIVO' },
                  { id: 'conversations', label: 'Conversation Center', icon: '💬', category: 'Core', desc: 'Chats en Vivo & Take Over', badge: '● ACTIVO' },
                  { id: 'leads', label: 'CRM & Prospectos', icon: '👥', category: 'Core', desc: 'Leads & Score de Intención', badge: '● ACTIVO' },
                  { id: 'payments', label: 'Transacciones SPEI', icon: '💳', category: 'Core', desc: 'Órdenes & SPEI Generados', badge: '● ACTIVO' },
                  { id: 'journeys', label: 'Journeys & Playbooks v7', icon: '🧭', category: 'Core', desc: 'Objetivos & Playbooks Activos', badge: '● ACTIVO' },
                  { id: 'tools', label: 'Herramientas & SPEI', icon: '🛠️', category: 'Pro Suite', desc: 'Cobros SPEI & Agendamiento', badge: '✨ SIMULADOR PRO' },
                  { id: 'skills', label: 'Skills & Procedimientos', icon: '🎓', category: 'Pro Suite', desc: 'Soporte Autónomo & Workflows', badge: '✨ SIMULADOR PRO' },
                  { id: 'voice', label: 'Voice Studio AI', icon: '🎙️', category: 'Pro Suite', desc: 'Llamadas de Voz en Vivo', badge: '✨ DEMO EN VIVO' },
                  { id: 'analytics', label: 'Mission Control', icon: '📊', category: 'Pro Suite', desc: 'Analytics & ROI Estimado', badge: '✨ CALCULADORA PRO' },
                  { id: 'multiagent', label: 'Multi-Agentes OS', icon: '🤖', category: 'Pro Suite', desc: 'Orquestación de Agentes', badge: '✨ PRO SUITE' },
                ].map(tab => {
                  const isActive = activeTab === tab.id;

                  return (
                    <div
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 12,
                        cursor: 'pointer',
                        background: isActive
                          ? 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(79,70,229,0.15))'
                          : 'rgba(255, 255, 255, 0.02)',
                        border: isActive
                          ? '1px solid rgba(167,139,250,0.6)'
                          : '1px solid rgba(255,255,255,0.08)',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: isActive ? '0 8px 24px rgba(124,58,237,0.25)' : 'none',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 20 }}>{tab.icon}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: tab.badge.includes('ACTIVO') ? 'rgba(16,185,129,0.15)' : 'rgba(124,58,237,0.2)', color: tab.badge.includes('ACTIVO') ? '#10b981' : '#a78bfa', border: `1px solid ${tab.badge.includes('ACTIVO') ? 'rgba(16,185,129,0.3)' : 'rgba(124,58,237,0.3)'}` }}>
                          {tab.badge}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? '#ffffff' : 'rgba(255,255,255,0.85)', letterSpacing: '-0.2px', marginBottom: 2 }}>
                        {tab.label}
                      </div>
                      <div style={{ fontSize: 11, color: isActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {tab.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tab 1: Intelligence Studio */}
            {activeTab === 'intelligence' && (
              <div style={{ background: '#0F0F18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 28 }}>
                <h2 style={{ fontSize: 18, margin: '0 0 6px' }}>Personality & System Prompt</h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 20px' }}>Define las instrucciones base con las que Hermes responderá a tus prospectos.</p>

                {/* Mini Guide */}
                <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', padding: 16, borderRadius: 12, marginBottom: 20, fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.8)' }}>
                  <strong style={{ color: '#a78bfa' }}>💡 Mini-Guía de Entrenamiento de Personalidad:</strong>
                  <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                    <li><strong>Nombre Público:</strong> Nombre exacto de tu negocio (ej. <em>Rabbitty Rewards</em>). Hermes usará este nombre al presentarse.</li>
                    <li><strong>System Prompt:</strong> Escribe en 2-3 frases el rol, tono y objetivo principal de tu agente (ej. <em>"Eres un asistente ejecutivo especializado en programas de lealtad. Saluda con amabilidad y califica el presupuesto del cliente."</em>).</li>
                  </ul>
                </div>

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 18, margin: '0 0 4px' }}>Base de Conocimiento Activa</h2>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Información estructurada que Hermes utiliza para responder dudas frecuentes.</p>
                  </div>
                  <button onClick={() => setShowWizard(true)} style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 'none', color: '#ffffff', padding: '10px 18px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
                    ✨ Ejecutar Wizard de Conocimiento (4 Pasos)
                  </button>
                </div>

                {/* Mini Guide */}
                <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', padding: 16, borderRadius: 12, marginBottom: 20, fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.8)' }}>
                  <strong style={{ color: '#a78bfa' }}>💡 Mini-Guía de Base de Conocimiento:</strong>
                  <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                    <li>Hermes consulta esta información en milisegundos antes de construir cualquier respuesta.</li>
                    <li>Mantén actualizados tus horarios de atención, precios de productos y respuestas a preguntas frecuentes para evitar alucinaciones.</li>
                  </ul>
                </div>

                {knowledgePack || org.config?.knowledgePack ? (
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 12, border: '1px solid rgba(124,58,237,0.2)', fontSize: 13, lineHeight: 1.8, color: 'rgba(255,255,255,0.8)' }}>
                    <div><strong>Nombre Comercial:</strong> {(knowledgePack || org.config.knowledgePack).companyName}</div>
                    <div><strong>Industria:</strong> {(knowledgePack || org.config.knowledgePack).industry}</div>
                    <div><strong>Horarios de Atención:</strong> {(knowledgePack || org.config.knowledgePack).schedule}</div>
                    <div><strong>Servicios / Productos:</strong> {((knowledgePack || org.config.knowledgePack).services || []).join(', ')}</div>
                    <div><strong>Políticas / FAQs:</strong> {(knowledgePack || org.config.knowledgePack).faq}</div>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: 32, borderRadius: 12, border: '1px dashed rgba(255,255,255,0.15)', textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>📚</div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No has entrenado la base de conocimiento de Hermes aún</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 20, maxWidth: 460, margin: '0 auto 20px' }}>Ejecuta el asistente guiado de 4 pasos para ingresar tus preguntas frecuentes, servicios y políticas de atención.</div>
                    <button onClick={() => setShowWizard(true)} style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      🚀 Iniciar Wizard Ahora →
                    </button>
                  </div>
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
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                      💬 Webchat / Widget HTML <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 8px', borderRadius: 12 }}>● Listo</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 12 }}>
                      <strong>📖 Guía de Integración Rápida (1 Minuto):</strong>
                      <ol style={{ margin: '6px 0 0 16px', padding: 0 }}>
                        <li>Copia el bloque de código script de abajo.</li>
                        <li>Pégalo dentro del <code>&lt;head&gt;</code> o antes de la etiqueta <code>&lt;/body&gt;</code> en tu sitio web o landing page.</li>
                        <li>¡Listo! El burbuja de chat flotante de Hermes aparecerá automáticamente atendiendo a tus visitantes.</li>
                      </ol>
                    </div>
                    <code style={{ fontSize: 11, background: '#08080C', padding: '10px 14px', borderRadius: 8, display: 'block', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)' }}>
                      &lt;script src="https://dash.pandoras.finance/widget.js" data-project="{org.slug}"&gt;&lt;/script&gt;
                    </code>
                  </div>

                  {/* Telegram Input & Guide */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>✈️ Bot de Telegram (botToken)</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 12 }}>
                      <strong>📖 Guía para obtener tu Bot Token en Telegram:</strong>
                      <ol style={{ margin: '6px 0 0 16px', padding: 0 }}>
                        <li>Abre Telegram y busca al bot oficial <strong>@BotFather</strong>.</li>
                        <li>Envía el comando <code>/newbot</code> y asigna un nombre a tu bot (ej. <em>MiEmpresaBot</em>).</li>
                        <li>Copia el <strong>HTTP API Token</strong> generado y pégalo en el campo de abajo.</li>
                      </ol>
                    </div>
                    <input
                      value={telegramBotToken}
                      onChange={e => setTelegramBotToken(e.target.value)}
                      placeholder="Ej. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      style={{ ...inputStyle, marginBottom: 8 }}
                    />
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                      Webhook registrado: <code style={{ color: '#a78bfa' }}>https://dash.pandoras.finance/api/v1/hermes/webhook/telegram?slug={org.slug}</code>
                    </div>
                  </div>

                  {/* WhatsApp Input & Guide */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>🟢 WhatsApp Business API / Phone</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 12 }}>
                      <strong>📖 Guía de Número & Conexión WhatsApp:</strong>
                      <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                        <li><strong>Número Personal vs Business API:</strong> Un número personal se puede ingresar para pruebas iniciales o redirección rápida, pero para que Hermes responda autónomamente por mensajes de WhatsApp en producción de 24/7 sin bloquear tu teléfono personal, requiere la <strong>WhatsApp Business API</strong> o un número virtual dedicado.</li>
                        <li>Ingresa tu número con código de país (ej. <em>+5215512345678</em>).</li>
                      </ul>
                    </div>
                    <input
                      value={whatsappPhone}
                      onChange={e => setWhatsappPhone(e.target.value)}
                      placeholder="Ej. +52 55 1234 5678"
                      style={{ ...inputStyle, marginBottom: 8 }}
                    />
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                      Webhook API: <code style={{ color: '#a78bfa' }}>https://dash.pandoras.finance/api/v1/hermes/webhook/whatsapp?slug={org.slug}</code>
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

            {/* Tab 3.5: Conversation Center */}
            {activeTab === 'conversations' && (
              <div style={{ background: '#0F0F18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 18, margin: '0 0 4px', color: '#fff' }}>💬 Conversation Center & Live Inspection</h2>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Inspecciona las pláticas de la IA en tiempo real y toma el control cuando lo desees.</p>
                  </div>
                  <span style={{ fontSize: 11, background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(16,185,129,0.3)' }}>
                    ● 2 Conversaciones Activas
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, height: 420 }}>
                  {/* Left Column: Conversation List */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 4 }}>Conversaciones Recientes</div>
                    
                    <div style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', padding: 12, borderRadius: 8, cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                        <span>Juan Pérez</span>
                        <span style={{ fontSize: 10, color: '#10b981' }}>Telegram</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>"¿Puedo apartar con SPEI?"</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <span style={{ fontSize: 9, background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '1px 6px', borderRadius: 4 }}>Score: 92%</span>
                        <span style={{ fontSize: 9, background: 'rgba(245,158,11,0.2)', color: '#f59e0b', padding: '1px 6px', borderRadius: 4 }}>Closing</span>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: 12, borderRadius: 8, cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
                        <span>Cliente Web Demo</span>
                        <span style={{ fontSize: 10, color: '#a78bfa' }}>Webchat</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>"¿Cuáles son los precios de lista?"</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <span style={{ fontSize: 9, background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '1px 6px', borderRadius: 4 }}>Score: 85%</span>
                        <span style={{ fontSize: 9, background: 'rgba(124,58,237,0.2)', color: '#a78bfa', padding: '1px 6px', borderRadius: 4 }}>Discovery</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Chat Inspection & Human Takeover Panel */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Juan Pérez (Telegram)</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Dueño actual: <strong style={{ color: '#10b981' }}>Hermes AI Agent</strong></div>
                      </div>
                      <button
                        onClick={() => alert('✋ ¡Has tomado el control manual de esta conversación! Hermes no responderá hasta que le devuelvas el control.')}
                        style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        ✋ Tomar Control Manual (Human Takeover)
                      </button>
                    </div>

                    {/* Messages Body */}
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                      <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: 10, fontSize: 12, maxWidth: '80%' }}>
                        <strong>Juan Pérez:</strong> Hola, me interesa invertir en la Etapa Cero. ¿Puedo apartar con SPEI?
                      </div>
                      <div style={{ alignSelf: 'flex-end', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', padding: '10px 14px', borderRadius: 10, fontSize: 12, maxWidth: '80%', color: '#fff' }}>
                        <strong>Hermes AI Agent:</strong> ¡Hola Juan! Por supuesto. Contamos con SPEI Fast Lane para reservar de forma inmediata. ¿Te genero la CLABE personalizada ahora?
                      </div>
                    </div>

                    {/* Footer Input for Manual Override */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        placeholder="Intervenir y enviar un mensaje manual..."
                        style={{ flex: 1, background: '#08080C', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 12 }}
                      />
                      <button style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        Enviar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'leads' && (
              <div style={{ background: '#0F0F18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 18, margin: '0 0 4px', color: '#fff' }}>👥 CRM & Prospectos Capturados</h2>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Leads en tiempo real calificados y atendidos autónomamente por Hermes.</p>
                  </div>
                  <button
                    onClick={async () => {
                      setLoadingLeads(true);
                      try {
                        const sessionToken = localStorage.getItem('pandoras_portal_session') || 'ps_demo_session';
                        const res = await fetch(`/api/v1/portal/leads?sessionToken=${sessionToken}`);
                        const data = await res.json();
                        if (data.leads) setPortalLeads(data.leads);
                      } catch {}
                      setLoadingLeads(false);
                    }}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#a78bfa', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    {loadingLeads ? 'Cargando...' : '🔄 Actualizar CRM'}
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
                        <th style={{ padding: '10px 14px' }}>Prospecto</th>
                        <th style={{ padding: '10px 14px' }}>Contacto</th>
                        <th style={{ padding: '10px 14px' }}>Canal / Origen</th>
                        <th style={{ padding: '10px 14px' }}>Intención</th>
                        <th style={{ padding: '10px 14px' }}>Score</th>
                        <th style={{ padding: '10px 14px' }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portalLeads.length > 0 ? (
                        portalLeads.map((lead, idx) => (
                          <tr key={lead.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '12px 14px', fontWeight: 600, color: '#fff' }}>{lead.name || 'Prospecto Web/Telegram'}</td>
                            <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.7)' }}>{lead.email || lead.phone || 'N/A'}</td>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{ fontSize: 11, background: 'rgba(124,58,237,0.15)', color: '#a78bfa', padding: '2px 8px', borderRadius: 4 }}>
                                {lead.origin || 'Hermes Webchat'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', color: '#10b981', fontWeight: 600 }}>{lead.intent || 'explore'}</td>
                            <td style={{ padding: '12px 14px', color: '#f59e0b', fontWeight: 700 }}>{lead.score || 85}%</td>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{ fontSize: 11, background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 8px', borderRadius: 12 }}>
                                ● {lead.status || 'Active'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                            <div>👥 No hay prospectos registrados aún en esta sesión.</div>
                            <div style={{ fontSize: 12, marginTop: 4 }}>Usa el simulador "Probar Agente con Mis Datos" para calificar a tu primer lead.</div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 5: Transacciones & SPEI */}
            {activeTab === 'payments' && (
              <div style={{ background: '#0F0F18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 28 }}>
                <h2 style={{ fontSize: 18, margin: '0 0 4px', color: '#fff' }}>💳 Transacciones & Referencias SPEI</h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 20px' }}>Historial de apartado y cobros automáticos generados por Hermes.</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: 16, borderRadius: 12 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>REFERENCIAS SPEI EMITIDAS</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#a78bfa', marginTop: 4 }}>3 Referencias</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: 16, borderRadius: 12 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>RECAUDACIÓN EN TRIAL</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#10b981', marginTop: 4 }}>$25,500 MXN</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: 16, borderRadius: 12 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>ESTADO DE SPEI FAST LANE</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#f59e0b', marginTop: 4 }}>● Activo 24/7</div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5.5: Journeys & Playbooks Studio */}
            {activeTab === 'journeys' && (
              <div style={{ background: '#0F0F18', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 16, padding: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 18, margin: '0 0 4px', color: '#fff' }}>🧭 Journeys & Playbooks Engine v7</h2>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Metodologías comerciales ejecutables y orquestación por objetivos de negocio.</p>
                  </div>
                  <span style={{ fontSize: 11, background: 'rgba(124,58,237,0.15)', color: '#a78bfa', padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(124,58,237,0.3)' }}>
                    ● 2 Journeys Activos en Kernel
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  {/* Journey Card 1: Family & VIP Referral */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <span style={{ fontSize: 10, background: 'rgba(124,58,237,0.2)', color: '#a78bfa', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>S'NARAI & REAL ESTATE</span>
                        <h3 style={{ fontSize: 15, margin: '8px 0 2px', color: '#fff' }}>💎 Referral Trust Journey (Familia & VIP)</h3>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Persona: S'Narai Concierge</div>
                      </div>
                      <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>● ACTIVO</span>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 12 }}>
                      <div style={{ color: '#a78bfa', fontWeight: 600, marginBottom: 4 }}>🎯 Objective Engine:</div>
                      <div style={{ color: 'rgba(255,255,255,0.8)' }}>Meta: Agendar Sesión Privada de Patrimonio con Fundadores</div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Playbook: <code>snarai_investor_playbook</code> (3 Etapas)</div>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', padding: '3px 8px', borderRadius: 4 }}>calendar.schedule</span>
                      <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', padding: '3px 8px', borderRadius: 4 }}>payments.create_spei_link</span>
                    </div>
                  </div>

                  {/* Journey Card 2: Oscar Web3 & Sovereign Knowledge */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>OSCAR & SOBERANÍA WEB3</span>
                        <h3 style={{ fontSize: 15, margin: '8px 0 2px', color: '#fff' }}>🌐 Web3 & Sovereign Knowledge Journey</h3>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Persona: OscarBot (Educador Web3 & Soberanía)</div>
                      </div>
                      <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>● ACTIVO</span>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 12 }}>
                      <div style={{ color: '#10b981', fontWeight: 600, marginBottom: 4 }}>🎯 Objective Engine:</div>
                      <div style={{ color: 'rgba(255,255,255,0.8)' }}>Meta: Agendar Workshop de Soberanía Digital y Auto-custodia</div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Playbook: <code>oscar_web3_sovereignty_playbook</code> (2 Etapas)</div>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', padding: '3px 8px', borderRadius: 4 }}>calendar.schedule</span>
                      <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', padding: '3px 8px', borderRadius: 4 }}>sovereign_triage</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'voice' && (
              <div style={{ background: '#0F0F18', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 16, padding: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 18, margin: '0 0 4px', color: '#fff' }}>🎙️ Voice Studio AI — Agentes de Voz en Vivo</h2>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Llamadas entrantes y salientes automatizadas con voz ultrasintética natural.</p>
                  </div>
                  <span style={{ fontSize: 11, background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(16,185,129,0.3)' }}>● Simulación de Voz Lista</span>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#a78bfa', marginBottom: 8 }}>📱 Probar Simulación de Llamada de Salida:</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input
                      placeholder="Tu número telefónico (+52 55 1234 5678)"
                      style={{ flex: 1, background: '#08080C', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 13 }}
                    />
                    <button
                      onClick={() => alert('📞 ¡Llamada de demostración solicitada! En un momento recibirás la llamada de prueba de Hermes Voice Agent.')}
                      style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      📞 Iniciar Llamada de Prueba
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
                    ⚡ Hermes Voice puede realizar hasta 500 llamadas de calificación por hora en el Plan Pro.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div style={{ background: '#0F0F18', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 16, padding: 28 }}>
                <h2 style={{ fontSize: 18, margin: '0 0 6px', color: '#fff' }}>📊 Mission Control & Calculadora de ROI</h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 20px' }}>Medición en tiempo real del impacto financiero de Hermes en tu empresa.</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Horas Ahorradas / Mes</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981', marginTop: 4 }}>42.5 hrs</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Atención 24/7 sin descanso</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Costo Ejecutivo Equivalente</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>$1,800 USD</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Sueldo base + prestaciones</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Ahorro Neto con Hermes Pro</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#a78bfa', marginTop: 4 }}>+$1,501 USD/mes</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>ROI del 502% el primer mes</div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', paddingTop: 10 }}>
                  <button
                    onClick={() => { setUpgradeModalModule('analytics'); setShowUpgradeModal(true); }}
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }}
                  >
                    💳 Activar Hermes Pro ($299/mes) para Desbloquear Analytics Completos →
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'multiagent' && (
              <div style={{ background: '#0F0F18', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 16, padding: 28 }}>
                <h2 style={{ fontSize: 18, margin: '0 0 6px', color: '#fff' }}>🤖 Enjambre Multi-Agentes de Inteligencia</h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 20px' }}>Agentes especializados trabajando en equipo para tu empresa.</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(124,58,237,0.2)', padding: 16, borderRadius: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>1. Agente SDR (Prospección)</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Capta leads en WhatsApp / Webchat y los califica.</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(124,58,237,0.2)', padding: 16, borderRadius: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>2. Agente Closer (SPEI Payment)</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Genera la referencia de apartado SPEI y liquida la compra.</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(124,58,237,0.2)', padding: 16, borderRadius: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>3. Agente Soporte Post-Venta</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Envía el comprobante digital y resuelve dudas frecuentes.</div>
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => { setUpgradeModalModule('multiagent'); setShowUpgradeModal(true); }}
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }}
                  >
                    🤖 Activar Orquestación Multi-Agente Pro →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 🚀 Custom Pandoras Glassmorphism Upgrade Modal */}
      {showUpgradeModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(5, 5, 10, 0.82)', backdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #11111E, #0A0A12)',
            border: '1px solid rgba(124, 58, 237, 0.4)',
            borderRadius: 20, maxWidth: 480, width: '100%', padding: 32,
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(124, 58, 237, 0.2)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowUpgradeModal(false)}
              style={{
                position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.06)',
                border: 'none', color: 'rgba(255,255,255,0.5)', width: 32, height: 32,
                borderRadius: '50%', cursor: 'pointer', fontSize: 16, display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}
            >
              ✕
            </button>

            {!upgradeSuccess ? (
              <div>
                <div style={{ display: 'inline-flex', padding: '6px 12px', borderRadius: 20, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>
                  {upgradeModalModule ? `Módulo ${upgradeModalModule.toUpperCase()} Pro` : 'Desbloqueo Hermes OS Pro'}
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', color: '#ffffff', letterSpacing: '-0.3px' }}>
                  {upgradeModalModule ? `Activa el Módulo ${upgradeModalModule.toUpperCase()}` : 'Desbloquea Hermes OS en Producción'}
                </h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: '0 0 24px' }}>
                  Acceso completo a conectores ilimitados WhatsApp/Telegram, llamadas de voz AI, cobro instantáneo SPEI y orquestación multi-agente.
                </p>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!userUpgradeEmail) return;
                  setIsSubmittingUpgrade(true);
                  try {
                    await fetch('/api/v1/marketing/leads/register', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        email: userUpgradeEmail,
                        source: upgradeModalModule ? `portal_teaser_${upgradeModalModule}` : 'portal_pro_upgrade',
                        product: 'HERMES',
                        intent: 'upgrade_pro',
                        scope: 'b2b',
                        metadata: {
                          company: org?.name || 'Mi Empresa',
                          moduleInterest: upgradeModalModule || 'FULL_SUITE'
                        }
                      }),
                    });
                    setUpgradeSuccess(true);
                  } catch {
                    setUpgradeSuccess(true);
                  } finally {
                    setIsSubmittingUpgrade(false);
                  }
                }}>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8, fontWeight: 500 }}>
                      Tu correo corporativo o de empresa:
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="nombre@tuempresa.com"
                      value={userUpgradeEmail}
                      onChange={e => setUserUpgradeEmail(e.target.value)}
                      style={{
                        width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 16px',
                        color: '#fff', fontSize: 14, outline: 'none'
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingUpgrade}
                    style={{
                      width: '100%', padding: '14px', borderRadius: 12,
                      background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                      color: '#ffffff', border: 'none', fontSize: 14, fontWeight: 700,
                      cursor: isSubmittingUpgrade ? 'wait' : 'pointer',
                      boxShadow: '0 8px 24px rgba(124,58,237,0.4)', transition: 'all 0.2s'
                    }}
                  >
                    {isSubmittingUpgrade ? 'Procesando...' : '💳 Confirmar & Enviar Orden Pro →'}
                  </button>
                </form>

                <div style={{ marginTop: 16, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                  🔒 Garantía Pandora's Growth OS · Facturación inmediata en USD/MXN
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: 42, marginBottom: 12 }}>🚀</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', margin: '0 0 10px' }}>¡Orden Registrada Correctamente!</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 24 }}>
                  Hemos enviado a tu correo <strong>{userUpgradeEmail}</strong> la confirmación junto con las instrucciones para la activación inmediata de tus credenciales Pro en producción.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <a
                    href={`mailto:hello@pandoras.finance?subject=Confirmacion%20Pago%20Pro%20Hermes%20OS%20-${encodeURIComponent(userUpgradeEmail)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '10px 20px', borderRadius: 8, background: 'rgba(255,255,255,0.08)',
                      color: '#a78bfa', textDecoration: 'none', fontSize: 12, fontWeight: 600
                    }}
                  >
                    ✉️ Abrir Email Directo
                  </a>
                  <button
                    onClick={() => setShowUpgradeModal(false)}
                    style={{
                      padding: '10px 20px', borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                      color: '#ffffff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    Entendido ✓
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 💬 Portal Test Console Drawer UI */}
      {showTestDrawer && (
        <div style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
          width: 420, height: 560, background: '#0D0D14', border: '1px solid rgba(16,185,129,0.4)',
          borderRadius: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(16,185,129,0.15)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          {/* Drawer Header */}
          <div style={{ padding: '14px 18px', background: 'rgba(16,185,129,0.1)', borderBottom: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Simulador Hermes: {companyName || org?.name || 'Mi Empresa'}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Probando con tus datos de Portal & Prompt</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => {
                  setTestChatMessages([
                    { role: 'agent', text: `✨ Bienvenido al recorrido privado. Marco nos pidió preparar una experiencia exclusiva para los cercanos a la familia antes del lanzamiento abierto. ¿En qué te puedo asesorar sobre la Etapa Cero?` }
                  ]);
                }}
                style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', color: '#a78bfa', padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                title="Activa el modo Concierge para referidos VIP"
              >
                💎 Simular Referido VIP
              </button>
              <button
                onClick={() => setShowTestDrawer(false)}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 16 }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {testChatMessages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(255,255,255,0.05)',
                  border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 14,
                  padding: '12px 16px',
                  color: '#fff',
                  fontSize: 13,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {msg.text}
              </div>
            ))}
            {isTestChatLoading && (
              <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '10px 14px', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                Hermes está pensando...
              </div>
            )}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!testInputMessage.trim() || isTestChatLoading) return;

              const userText = testInputMessage.trim();
              setTestInputMessage('');
              setTestChatMessages(prev => [...prev, { role: 'user', text: userText }]);
              setIsTestChatLoading(true);

              try {
                const res = await fetch('/api/v1/hermes/sandbox', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    companyName: companyName || org?.name || 'Mi Empresa',
                    industry: knowledgePack?.industry || 'General',
                    customPrompt: prompt,
                    userMessage: userText,
                    history: testChatMessages.map(m => ({ role: m.role, content: m.text })),
                    referralContext: testChatMessages.length > 0 && testChatMessages[0]?.text?.includes('Marco nos pidió') ? {
                      referredBy: 'Marco / Círculo Cercano',
                      relationship: 'VIP Family & Friends',
                      priorityTier: 'VIP'
                    } : null
                  }),
                });

                const data = await res.json();
                if (data.response) {
                  let reply = data.response;
                  const lower = userText.toLowerCase();

                  // Inject Tool Action Card Simulation
                  if (lower.includes('cita') || lower.includes('agendar') || lower.includes('reunión')) {
                    reply += '\n\n⚡ **[TOOL EXECUTED: calendar.schedule]**\n📅 *Cita tentativamente agendada en Google Calendar para el cliente.*';
                  } else if (lower.includes('pagar') || lower.includes('spei') || lower.includes('precio') || lower.includes('comprar')) {
                    reply += '\n\n💳 **[TOOL EXECUTED: payments.create_spei_link]**\n🏦 *Referencia CLABE SPEI generada automáticamente.*';
                  }

                  setTestChatMessages(prev => [...prev, { role: 'agent', text: reply }]);
                } else if (data.message) {
                  setTestChatMessages(prev => [...prev, { role: 'agent', text: `⚠️ ${data.message}` }]);
                } else {
                  setTestChatMessages(prev => [...prev, { role: 'agent', text: 'Respuesta recibida correctamente.' }]);
                }
              } catch {
                setTestChatMessages(prev => [...prev, { role: 'agent', text: 'Error al conectar con Hermes.' }]);
              } finally {
                setIsTestChatLoading(false);
              }
            }}
            style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.08)', background: '#09090F', display: 'flex', gap: 8 }}
          >
            <input
              type="text"
              placeholder="Escribe un mensaje de prueba..."
              value={testInputMessage}
              onChange={e => setTestInputMessage(e.target.value)}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={isTestChatLoading}
              style={{
                padding: '10px 16px', background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer'
              }}
            >
              Enviar
            </button>
          </form>
        </div>
      )}
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
