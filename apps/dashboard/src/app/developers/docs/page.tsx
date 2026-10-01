'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Code2, Globe, Zap, ArrowLeft, Terminal, Key } from 'lucide-react';
import Link from 'next/link';
import { getDashboardDomain } from '@/lib/utils';

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('auth');

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col md:flex-row font-sans text-zinc-300">
      
      {/* Sidebar Navigation (Gitbook style) */}
      <aside className="w-full md:w-64 border-r border-white/5 bg-zinc-900/50 flex flex-col h-auto md:h-screen sticky top-0">
        <div className="p-6 border-b border-white/5">
          <Link href="/developers" className="flex items-center text-xs font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Hub
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <BookOpen className="w-4 h-4 text-indigo-400" />
            </div>
            <h1 className="font-bold text-white text-lg">API Docs</h1>
          </div>
        </div>
        
        <nav className="p-4 space-y-1 overflow-y-auto">
          <SectionLink 
            id="auth" 
            title="Autenticación" 
            icon={<Key className="w-4 h-4" />} 
            active={activeSection === 'auth'} 
            onClick={() => setActiveSection('auth')} 
          />
          <SectionLink 
            id="widget" 
            title="1. Widget Injection" 
            icon={<Globe className="w-4 h-4" />} 
            active={activeSection === 'widget'} 
            onClick={() => setActiveSection('widget')} 
          />
          <SectionLink 
            id="checkout" 
            title="2. Commerce Checkout" 
            icon={<Zap className="w-4 h-4" />} 
            active={activeSection === 'checkout'} 
            onClick={() => setActiveSection('checkout')} 
          />
          <SectionLink 
            id="api" 
            title="3. Advanced REST API" 
            icon={<Terminal className="w-4 h-4" />} 
            active={activeSection === 'api'} 
            onClick={() => setActiveSection('api')} 
          />
          <SectionLink 
            id="webhooks" 
            title="4. Webhooks" 
            icon={<Code2 className="w-4 h-4" />} 
            active={activeSection === 'webhooks'} 
            onClick={() => setActiveSection('webhooks')} 
          />
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 md:p-16 lg:p-24 overflow-y-auto h-screen bg-zinc-950">
        <div className="max-w-3xl space-y-12 pb-32">
          
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={activeSection}>
            {activeSection === 'auth' && (
              <div className="space-y-6">
                <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Autenticación</h1>
                <p className="text-lg text-zinc-400 leading-relaxed">
                  Todas las peticiones a la API REST de Pandora's Growth OS requieren autenticación mediante un API Key.
                  Debes incluir tu <strong>Publishable Key</strong> o <strong>Secret Key</strong> en los encabezados.
                </p>
                <div className="p-4 bg-zinc-900 border border-white/10 rounded-xl font-mono text-sm">
                  <span className="text-indigo-400">x-api-key:</span> <span className="text-emerald-400">pk_grow_live_...</span>
                </div>
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mt-6">
                  <p className="text-amber-400 text-sm">
                    <strong>Nota:</strong> Las llaves públicas (<code className="bg-black/20 px-1 rounded">pk_...</code>) son seguras para el frontend (ej. Widget). 
                    Las llaves secretas (<code className="bg-black/20 px-1 rounded">sk_...</code>) solo deben usarse de servidor a servidor.
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'widget' && (
              <div className="space-y-6">
                <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Widget Injection (Frontend)</h1>
                <p className="text-lg text-zinc-400 leading-relaxed">
                  La forma más rápida de integrar Pandora's en tu frontend es mediante nuestro Widget inyectado dinámicamente.
                </p>
                <h3 className="text-xl font-bold text-white mt-8 mb-4">Instalación</h3>
                <p className="text-zinc-400">Coloca este snippet justo antes de la etiqueta <code className="bg-white/10 text-white px-1.5 py-0.5 rounded text-sm">&lt;/body&gt;</code> de tu aplicación:</p>
                <pre className="p-6 bg-zinc-900 border border-white/10 rounded-2xl overflow-x-auto text-sm font-mono leading-relaxed">
                  <span className="text-zinc-500">&lt;!-- Growth OS Global Script --&gt;</span>{'\n'}
                  <span className="text-zinc-400">&lt;</span><span className="text-blue-400">script</span>{'\n'}
                  {'  '}<span className="text-indigo-400">src</span>=<span className="text-emerald-300">"https://{getDashboardDomain()}/api/widget/v1.js"</span>{'\n'}
                  {'  '}<span className="text-indigo-400">data-project-id</span>=<span className="text-emerald-300">"YOUR_PROJECT_SLUG"</span>{'\n'}
                  {'  '}<span className="text-indigo-400">data-api-key</span>=<span className="text-emerald-300">"pk_grow_live_..."</span>{'\n'}
                  {'  '}<span className="text-indigo-400">data-theme</span>=<span className="text-emerald-300">"premium"</span>{'\n'}
                  {'  '}<span className="text-indigo-400">defer</span>{'\n'}
                  <span className="text-zinc-400">&gt;&lt;/</span><span className="text-blue-400">script</span><span className="text-zinc-400">&gt;</span>
                </pre>
              </div>
            )}

            {activeSection === 'checkout' && (
              <div className="space-y-6">
                <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Commerce Checkout</h1>
                <p className="text-lg text-zinc-400 leading-relaxed">
                  Una vez que el Widget está cargado, puedes disparar el flujo de Checkout Soberano directamente desde cualquier elemento HTML usando Data Attributes o JavaScript programático.
                </p>
                
                <h3 className="text-xl font-bold text-white mt-8 mb-4">A. Vía Data Attributes (Zero-Code)</h3>
                <pre className="p-6 bg-zinc-900 border border-white/10 rounded-2xl overflow-x-auto text-sm font-mono leading-relaxed">
                  <span className="text-zinc-400">&lt;</span><span className="text-blue-400">button</span>{'\n'}
                  {'  '}<span className="text-indigo-400">data-pd-checkout-slug</span>=<span className="text-emerald-300">"YOUR_PROJECT_SLUG"</span>{'\n'}
                  {'  '}<span className="text-indigo-400">data-pd-checkout-tier</span>=<span className="text-emerald-300">"default"</span>{'\n'}
                  <span className="text-zinc-400">&gt;</span>{'\n'}
                  {'  '}Comprar Ahora{'\n'}
                  <span className="text-zinc-400">&lt;/</span><span className="text-blue-400">button</span><span className="text-zinc-400">&gt;</span>
                </pre>

                <h3 className="text-xl font-bold text-white mt-8 mb-4">B. Vía Programática</h3>
                <pre className="p-6 bg-zinc-900 border border-white/10 rounded-2xl overflow-x-auto text-sm font-mono leading-relaxed">
                  <span className="text-zinc-500">// Abre el popup de checkout programáticamente</span>{'\n'}
                  <span className="text-indigo-400">window</span>.<span className="text-indigo-300">PandorasGrowth</span>.<span className="text-blue-400">openCheckout</span>(<span className="text-emerald-300">'YOUR_PROJECT_SLUG'</span>, <span className="text-emerald-300">'default'</span>);
                </pre>
              </div>
            )}

            {activeSection === 'api' && (
              <div className="space-y-6">
                <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Advanced REST API</h1>
                <p className="text-lg text-zinc-400 leading-relaxed">
                  Para tener control absoluto sobre el registro de usuarios (ej. formularios custom, integraciones B2B), utiliza nuestra API REST server-to-server.
                </p>
                
                <div className="p-4 bg-zinc-900 border border-white/10 rounded-xl font-mono text-sm flex items-center gap-4">
                  <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-md font-bold text-xs">POST</span> 
                  <span className="text-white">/api/v1/leads/register</span>
                </div>

                <h3 className="text-xl font-bold text-white mt-8 mb-4">Request Body (JSON)</h3>
                <pre className="p-6 bg-zinc-900 border border-white/10 rounded-2xl overflow-x-auto text-sm font-mono leading-relaxed">
                  {`{
  "projectId": "YOUR_PROJECT_SLUG",
  "email": "investor@example.com",
  "metadata": {
    "tags": ["FULL_UNIT", "VIP"],
    "utm_source": "linkedin"
  }
}`}
                </pre>

                <h3 className="text-xl font-bold text-white mt-8 mb-4">Response (200 OK)</h3>
                <pre className="p-6 bg-zinc-900 border border-white/10 rounded-2xl overflow-x-auto text-sm font-mono leading-relaxed">
                  {`{
  "success": true,
  "leadId": "ld_123456789",
  "status": "QUALIFIED"
}`}
                </pre>
              </div>
            )}

            {activeSection === 'webhooks' && (
              <div className="space-y-6">
                <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Webhooks</h1>
                <p className="text-lg text-zinc-400 leading-relaxed">
                  Escucha eventos asíncronos (como un checkout completado o una intención de fast-lane) configurando un Webhook en tu Dashboard.
                </p>
                
                <h3 className="text-xl font-bold text-white mt-8 mb-4">Evento: <code className="bg-white/10 px-2 py-1 rounded text-indigo-400 font-mono">lead.fastlane_checkout</code></h3>
                <p className="text-zinc-400">Se dispara cuando el usuario inicia un flujo de pago y se le envían las instrucciones financieras.</p>
                <pre className="p-6 bg-zinc-900 border border-white/10 rounded-2xl overflow-x-auto text-sm font-mono leading-relaxed mt-4">
                  {`{
  "event": "lead.fastlane_checkout",
  "timestamp": "2026-10-01T12:00:00Z",
  "data": {
    "email": "investor@example.com",
    "projectId": "YOUR_PROJECT_SLUG",
    "status": "pending_payment"
  }
}`}
                </pre>

                <h3 className="text-xl font-bold text-white mt-8 mb-4">Evento: <code className="bg-white/10 px-2 py-1 rounded text-indigo-400 font-mono">lead.new</code></h3>
                <p className="text-zinc-400">Se dispara cuando se captura un nuevo lead vía el Widget o la API.</p>
                <pre className="p-6 bg-zinc-900 border border-white/10 rounded-2xl overflow-x-auto text-sm font-mono leading-relaxed mt-4">
                  {`{
  "event": "lead.new",
  "timestamp": "2026-10-01T12:05:00Z",
  "data": {
    "email": "investor@example.com",
    "intent": "HIGH",
    "source": "widget"
  }
}`}
                </pre>
              </div>
            )}

          </motion.div>
        </div>
      </main>
    </div>
  );
}

function SectionLink({ id, title, icon, active, onClick }: { id: string, title: string, icon: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active 
          ? 'bg-white/5 text-white shadow-sm border border-white/10' 
          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
      }`}
    >
      <span className={active ? 'text-indigo-400' : 'text-zinc-500'}>{icon}</span>
      {title}
    </button>
  );
}
