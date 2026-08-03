'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Bot, 
  Sliders, 
  KeyRound, 
  Database, 
  Webhook, 
  Sparkles, 
  CheckCircle2, 
  Save, 
  ArrowLeft,
  Copy,
  Check,
  Globe,
  Cpu,
  Layers,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HermesAgentStudioPage() {
  const [activeTab, setActiveTab] = useState<'prompt' | 'knowledge' | 'llm' | 'channels'>('prompt');
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form State
  const [companyName, setCompanyName] = useState('Mi Empresa SaaS');
  const [projectSlug, setProjectSlug] = useState('mi-empresa');
  const [agentName, setAgentName] = useState('Hermes Concierge');
  const [industry, setIndustry] = useState('real_estate');
  const [systemInstructions, setSystemInstructions] = useState(
    `Eres Hermes Concierge, el Agente Autónomo de Atención y Ventas de Mi Empresa SaaS.\nTu objetivo es atender a los clientes con elegancia, calificar prospectos y guiarlos a agendar una llamada o contratar.`
  );
  const [salesPitch, setSalesPitch] = useState(
    `Ofrecemos soluciones de alto valor con infraestructura Web3 y automatización de crecimiento.`
  );
  
  // Custom LLM Provider State
  const [providerType, setProviderType] = useState<'platform' | 'custom_ollama' | 'openai' | 'groq'>('platform');
  const [customBaseUrl, setCustomBaseUrl] = useState('https://ollama.com/api');
  const [customApiKey, setCustomApiKey] = useState('');
  const [customModel, setCustomModel] = useState('gpt-oss:20b');

  // Channel Tokens
  const [telegramToken, setTelegramToken] = useState('');
  const [whatsappPhoneId, setWhatsappPhoneId] = useState('');

  const webhookUrl = `https://dash.pandoras.finance/api/v1/projects/${projectSlug || 'mi-empresa'}/bot/webhook`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleSaveSettings = () => {
    setIsSaving(true);
    setSavedSuccess(false);
    setTimeout(() => {
      setIsSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans selection:bg-amber-500 selection:text-black">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link 
              href="/growth-os/hermes" 
              className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-light tracking-tight text-white">Hermes Agent Studio</h1>
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] font-mono">
                  Enterprise Config
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 font-light mt-0.5">
                Configura la personalidad, base de conocimiento RAG, proveedores de IA y canales de tu organización.
              </p>
            </div>
          </div>

          <Button 
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="bg-amber-500 hover:bg-amber-400 text-black font-medium text-xs px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-all"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-black" />
                Configuración Guardada
              </>
            ) : isSaving ? (
              'Guardando...'
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Ajustes de Tenant
              </>
            )}
          </Button>
        </div>

        {/* Studio Navigation Tabs */}
        <div className="flex border-b border-zinc-800 mb-8 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('prompt')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'prompt' 
                ? 'border-amber-400 text-amber-400 bg-amber-500/5' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            1. Prompt & Personalidad
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'knowledge' 
                ? 'border-amber-400 text-amber-400 bg-amber-500/5' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Database className="w-4 h-4" />
            2. Knowledge Pack RAG
          </button>
          <button
            onClick={() => setActiveTab('llm')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'llm' 
                ? 'border-amber-400 text-amber-400 bg-amber-500/5' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            3. Proveedor LLM & API Keys
          </button>
          <button
            onClick={() => setActiveTab('channels')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'channels' 
                ? 'border-amber-400 text-amber-400 bg-amber-500/5' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Webhook className="w-4 h-4" />
            4. Canales Omnicanal & Webhooks
          </button>
        </div>

        {/* Tab 1: Prompt & Personalidad */}
        {activeTab === 'prompt' && (
          <div className="space-y-6 bg-zinc-900/40 border border-zinc-800 p-6 md:p-8 rounded-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Nombre de la Empresa</label>
                <input 
                  type="text" 
                  value={companyName} 
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Identificador de Proyecto (Slug)</label>
                <input 
                  type="text" 
                  value={projectSlug} 
                  onChange={e => setProjectSlug(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500/50 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Nombre del Agente</label>
                <input 
                  type="text" 
                  value={agentName} 
                  onChange={e => setAgentName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Industria</label>
                <select 
                  value={industry} 
                  onChange={e => setIndustry(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500/50"
                >
                  <option value="real_estate">Real Estate & Desarrollos</option>
                  <option value="automotive">Automotriz & Concesionarias</option>
                  <option value="legal">Servicios Legales & Firma</option>
                  <option value="healthcare">Salud & Clínicas Médicas</option>
                  <option value="saas">SaaS & Servicios Digitales</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">
                Instrucciones del Sistema (Prompt de Hermes)
              </label>
              <textarea 
                rows={6}
                value={systemInstructions}
                onChange={e => setSystemInstructions(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-xs text-zinc-200 outline-none focus:border-amber-500/50 leading-relaxed font-mono"
              />
              <p className="text-[11px] text-zinc-500 mt-2 font-light">
                Define el rol, el tono ejecutivo, las reglas estrictas de seguridad y los llamados a la acción de tu empresa.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Knowledge Pack RAG */}
        {activeTab === 'knowledge' && (
          <div className="space-y-6 bg-zinc-900/40 border border-zinc-800 p-6 md:p-8 rounded-3xl">
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">
                Pitch Principal de Ventas (Sales Pitch)
              </label>
              <textarea 
                rows={3}
                value={salesPitch}
                onChange={e => setSalesPitch(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-xs text-zinc-200 outline-none focus:border-amber-500/50 leading-relaxed font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-4">
                Matriz de Preguntas Frecuentes (FAQs)
              </label>
              <div className="space-y-3">
                <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl">
                  <span className="text-xs font-medium text-white block mb-1">¿Cómo contratar los servicios de {companyName}?</span>
                  <span className="text-xs text-zinc-400 block font-light">Puedes agendar una llamada con nuestro equipo o seleccionar un plan directamente en nuestro portal.</span>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl">
                  <span className="text-xs font-medium text-white block mb-1">¿Cuáles son los métodos de pago aceptados?</span>
                  <span className="text-xs text-zinc-400 block font-light">Aceptamos transferencias bancarias (SPEI), tarjetas corporativas y pagos digitales en USDC.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Proveedor LLM & API Keys */}
        {activeTab === 'llm' && (
          <div className="space-y-6 bg-zinc-900/40 border border-zinc-800 p-6 md:p-8 rounded-3xl">
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-3">Modalidad de Inteligencia Artificial</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  onClick={() => setProviderType('platform')}
                  className={`p-4 border rounded-2xl cursor-pointer transition-all ${
                    providerType === 'platform' ? 'border-amber-500/50 bg-amber-500/10' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-sm font-medium text-white block">🌐 Infraestructura Pandoras (Default)</span>
                  <span className="text-xs text-zinc-400 font-light block mt-1">Usa nuestra nube optimizada con cuotas y límites incluidos.</span>
                </div>

                <div 
                  onClick={() => setProviderType('custom_ollama')}
                  className={`p-4 border rounded-2xl cursor-pointer transition-all ${
                    providerType === 'custom_ollama' ? 'border-amber-500/50 bg-amber-500/10' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-sm font-medium text-white block">🦙 Tu Propia IA (Bring Your Own Key / Ollama)</span>
                  <span className="text-xs text-zinc-400 font-light block mt-1">Conecta tu propia URL de Ollama Cloud, OpenAI o Groq de forma privada.</span>
                </div>
              </div>
            </div>

            {providerType === 'custom_ollama' && (
              <div className="p-6 bg-black/40 border border-zinc-800 rounded-2xl space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Base URL de Tu Servidor o Proveedor</label>
                  <input 
                    type="text"
                    value={customBaseUrl}
                    onChange={e => setCustomBaseUrl(e.target.value)}
                    placeholder="https://ollama.com/api o https://api.openai.com/v1"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500/50 font-mono"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Tu API Key Privada</label>
                    <input 
                      type="password"
                      value={customApiKey}
                      onChange={e => setCustomApiKey(e.target.value)}
                      placeholder="sk-... o tu token de Ollama"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500/50 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Modelo a Ejecutar</label>
                    <input 
                      type="text"
                      value={customModel}
                      onChange={e => setCustomModel(e.target.value)}
                      placeholder="gpt-oss:20b, llama3.1:latest, gpt-4o-mini"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500/50 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Canales Omnicanal & Webhooks */}
        {activeTab === 'channels' && (
          <div className="space-y-6 bg-zinc-900/40 border border-zinc-800 p-6 md:p-8 rounded-3xl">
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">
                Webhook Autoservicio para Tu Bot (Telegram / WhatsApp)
              </label>
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-2.5 rounded-2xl">
                <input 
                  type="text" 
                  readOnly 
                  value={webhookUrl}
                  className="bg-transparent text-xs text-amber-400 font-mono flex-grow outline-none px-2"
                />
                <Button 
                  onClick={handleCopyWebhook}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5"
                >
                  {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedWebhook ? 'Copiado' : 'Copiar URL'}
                </Button>
              </div>
              <p className="text-[11px] text-zinc-500 mt-2 font-light">
                Copia esta URL y agrégala a la configuración de Webhook de tu bot de Telegram o WhatsApp Business para que Hermes responda en tiempo real.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-800">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Telegram Bot Token Privado</label>
                <input 
                  type="password"
                  value={telegramToken}
                  onChange={e => setTelegramToken(e.target.value)}
                  placeholder="8639272150:AAHxY..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500/50 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">WhatsApp Business Phone ID</label>
                <input 
                  type="text"
                  value={whatsappPhoneId}
                  onChange={e => setWhatsappPhoneId(e.target.value)}
                  placeholder="685462974640240"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500/50 font-mono"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
