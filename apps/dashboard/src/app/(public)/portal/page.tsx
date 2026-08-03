'use client';

import React, { useState, useEffect } from 'react';
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
  const [knowledgePack, setKnowledgePack] = useState<any>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

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
        } else if (sessionToken) {
          // Validate existing session
          res = await fetch(`/api/v1/portal/session?sessionToken=${sessionToken}`);
        } else {
          setError('Enlace o sesión no válida. Solicita un nuevo acceso.');
          setLoading(false);
          return;
        }

        const data = await res.json();
        if (!res.ok || data.error) {
          setError(data.error || 'No se pudo cargar el portal');
        } else {
          if (data.sessionToken) {
            localStorage.setItem('pandoras_portal_session', data.sessionToken);
          }
          setOrg(data.organization);
          setPrompt(data.organization.config?.prompt || '');
          setCompanyName(data.organization.name || '');

          // Check if knowledge wizard is needed
          if (!data.organization.config?.knowledgePack) {
            setShowWizard(true);
          }
        }
      } catch (err: any) {
        setError('Error al conectar con la plataforma.');
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

  const handleSaveConfig = async () => {
    const sessionToken = localStorage.getItem('pandoras_portal_session');
    if (!sessionToken || !org?.activeProduct?.id) return;

    try {
      const res = await fetch('/api/v1/portal/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken,
          installedProductId: org.activeProduct.id,
          config: { prompt, companyName },
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch {
      alert('Error al guardar cambios');
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

  if (error || !org) {
    return (
      <div style={{ minHeight: '100vh', background: '#08080C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#0F0F18', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 16, padding: 32, maxWidth: 440, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <h2 style={{ fontSize: 18, margin: '0 0 8px' }}>Acceso Inválido o Expirado</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: '0 0 20px' }}>{error}</p>
          <a href="mailto:hello@pandoras.finance" style={{ display: 'inline-block', padding: '10px 20px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: '#a78bfa', textDecoration: 'none', fontSize: 13 }}>Solicitar nuevo enlace →</a>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: org.status === 'trial' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', color: org.status === 'trial' ? '#f59e0b' : '#10b981', border: `1px solid ${org.status === 'trial' ? '#f59e0b33' : '#10b98133'}` }}>
            ● Status: {org.status.toUpperCase()}
          </span>
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
            {/* Dynamic Module Tabs based on Registry & Active Capabilities */}
            <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12, marginBottom: 28, overflowX: 'auto' }}>
              {org.visibleModules.map(mod => {
                const labelMap: Record<string, string> = {
                  intelligence: '⚡ Intelligence Studio',
                  knowledge: '📚 Knowledge Studio',
                  channels: '📡 Conectores & Canales',
                  voice: '🎙️ Voice Studio',
                  analytics: '📊 Mission Control',
                  multiagent: '🤖 Multi-Agentes',
                };
                return (
                  <button
                    key={mod}
                    onClick={() => setActiveTab(mod)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: activeTab === mod ? 600 : 400,
                      cursor: 'pointer',
                      background: activeTab === mod ? 'rgba(124,58,237,0.2)' : 'transparent',
                      border: activeTab === mod ? '1px solid rgba(124,58,237,0.4)' : '1px solid transparent',
                      color: activeTab === mod ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {labelMap[mod] || mod}
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

            {/* Tab 3: Channels */}
            {activeTab === 'channels' && (
              <div style={{ background: '#0F0F18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 28 }}>
                <h2 style={{ fontSize: 18, margin: '0 0 6px' }}>Webhooks & Canales Activos</h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 20px' }}>Conecta tus canales de comunicación a la infraestructura de Hermes.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>💬 Webchat / Widget</div>
                    <div style={{ fontSize: 12, color: '#10b981', marginBottom: 8 }}>● Listo para usar</div>
                    <code style={{ fontSize: 11, background: '#08080C', padding: '8px 12px', borderRadius: 6, display: 'block', color: 'rgba(255,255,255,0.6)' }}>
                      &lt;script src="https://dash.pandoras.finance/widget.js" data-project="{org.slug}"&gt;&lt;/script&gt;
                    </code>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>✈️ Telegram Webhook</div>
                    <code style={{ fontSize: 11, background: '#08080C', padding: '8px 12px', borderRadius: 6, display: 'block', color: 'rgba(255,255,255,0.6)' }}>
                      https://dash.pandoras.finance/api/v1/hermes/telegram/webhook?project={org.slug}
                    </code>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Analytics */}
            {activeTab === 'analytics' && (
              <div style={{ background: '#0F0F18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 28 }}>
                <h2 style={{ fontSize: 18, margin: '0 0 6px' }}>Mission Control Analytics</h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 20px' }}>Resumen de actividad conversacional de tu agente.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: 16, borderRadius: 10 }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Conversaciones Totales</div>
                    <div style={{ fontSize: 24, fontWeight: 700, margin: '4px 0 0' }}>14</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: 16, borderRadius: 10 }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Leads Capturados</div>
                    <div style={{ fontSize: 24, fontWeight: 700, margin: '4px 0 0', color: '#10b981' }}>3</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: 16, borderRadius: 10 }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Tiempo Promedio Respuesta</div>
                    <div style={{ fontSize: 24, fontWeight: 700, margin: '4px 0 0', color: '#a78bfa' }}>1.2s</div>
                  </div>
                </div>
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
