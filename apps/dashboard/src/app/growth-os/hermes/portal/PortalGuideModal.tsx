'use client';

import React, { useState } from 'react';
import { X, BookOpen, ShieldCheck, Route, Cpu, Send, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PortalGuideModal({ isOpen, onClose }: GuideModalProps) {
  const [activeTab, setActiveTab] = useState<'quickstart' | 'evidence' | 'journey' | 'llm' | 'channels'>('quickstart');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0C0C12] border border-purple-500/20 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-[0_0_50px_rgba(147,51,234,0.2)] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Guía de Operación — Hermes OS Kernel</h2>
              <p className="text-xs text-zinc-400">Manual de gobernanza, inyección de conocimiento y supervisión autónoma</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-zinc-900/30 overflow-x-auto px-6 pt-3 gap-2">
          {[
            { id: 'quickstart', label: '🚀 Inicio Rápido', icon: BookOpen },
            { id: 'evidence', label: '🛡️ Capa de Evidencias', icon: ShieldCheck },
            { id: 'journey', label: '🗺️ Motor de Viajes (NBA)', icon: Route },
            { id: 'llm', label: '⚙️ Motor IA (BYOK)', icon: Cpu },
            { id: 'channels', label: '📡 Canales & Telegram', icon: Send },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap border-b-2 ${
                activeTab === tab.id 
                  ? 'border-purple-500 text-purple-300 bg-purple-500/10' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-zinc-300">

          {/* TAB 1: Quickstart */}
          {activeTab === 'quickstart' && (
            <div className="space-y-6">
              <div className="bg-purple-950/20 border border-purple-500/30 p-5 rounded-2xl">
                <h3 className="text-base font-bold text-purple-300 mb-1">¿Cómo funciona Hermes OS?</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Hermes no es un simple chatbot. Es un **Sistema Operativo Cognitivo Autónomo (Serverless OS)** gobernado por reglas de negocio, embudos (*playbooks*) y declaraciones de evidencia verificada.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                    <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs">1</span>
                    Configura la Identidad
                  </div>
                  <p className="text-xs text-zinc-400">
                    Establece el nombre del agente, instrucciones base y nivel de autonomía (Nivel 1: Human-in-the-loop, Nivel 2: Co-pilot, Nivel 3: Autónomo).
                  </p>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                    <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs">2</span>
                    Inyecta Evidencias Verificadas
                  </div>
                  <p className="text-xs text-zinc-400">
                    En la pestaña <strong className="text-white font-mono">Know</strong>, añade los hechos de tu Data Room. Hermes <em>únicamente</em> usará afirmaciones marcadas como <span className="text-emerald-400 font-semibold">Verificado ✓</span>.
                  </p>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                    <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs">3</span>
                    Selecciona tu Motor IA
                  </div>
                  <p className="text-xs text-zinc-400">
                    Usa la infraestructura de Pandoras o conecta tu propio modelo en la pestaña <strong className="text-white font-mono">Sett</strong> (Bring Your Own Key / Ollama / Groq).
                  </p>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                    <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs">4</span>
                    Vincula Canales & Monitorea
                  </div>
                  <p className="text-xs text-zinc-400">
                    Registra el bot de Telegram o Webhook y monitorea la toma de decisiones en vivo desde la consola de eventos.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Evidence Layer */}
          {activeTab === 'evidence' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl text-amber-300 text-xs">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p>
                  <strong>Guardrails Anti-Alucinación:</strong> Para garantizar la precisión legal y comercial, Hermes solo responde utilizando afirmaciones que hayan sido marcadas explícitamente como <strong>Verificado ✓</strong>.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-white text-sm">Campos requeridos al inyectar una Evidencia:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                    <span className="font-mono text-purple-400 block mb-1">Afirmación (Statement)</span>
                    <span className="text-zinc-400">El hecho exacto que el agente utilizará.</span>
                  </div>
                  <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                    <span className="font-mono text-purple-400 block mb-1">Clasificación</span>
                    <span className="text-zinc-400">General, Legal, Financial o Product.</span>
                  </div>
                  <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                    <span className="font-mono text-purple-400 block mb-1">Fuente & Referencia</span>
                    <span className="text-zinc-400">URL del Data Room, documento o número de página.</span>
                  </div>
                  <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                    <span className="font-mono text-purple-400 block mb-1">Respuesta Permitida</span>
                    <span className="text-zinc-400">Guión estructurado exacto para la IA.</span>
                  </div>
                  <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl md:col-span-2">
                    <span className="font-mono text-purple-400 block mb-1">Restricciones</span>
                    <span className="text-zinc-400">Lo que el agente TIENE PROHIBIDO decir (ej. "No prometer un rendimiento garantizado").</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Journey Engine */}
          {activeTab === 'journey' && (
            <div className="space-y-6">
              <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl space-y-3">
                <h4 className="font-bold text-white text-sm">Hermes Journey Engine & Next Best Action (NBA)</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Hermes evalúa dinámicamente cada mensaje en función de la etapa (*Stage*) actual del prospecto en el embudo.
                </p>
                <div className="flex items-center gap-2 text-xs font-mono py-2 px-3 bg-black/40 rounded-xl overflow-x-auto text-purple-300">
                  <span>Bienvenida</span>
                  <ArrowRight className="w-3 h-3 text-zinc-500" />
                  <span>Calificación</span>
                  <ArrowRight className="w-3 h-3 text-zinc-500" />
                  <span>Manejo de Objeciones</span>
                  <ArrowRight className="w-3 h-3 text-zinc-500" />
                  <span>Agendamiento</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">Objetivos de Estado (Objective State)</h4>
                <p className="text-xs text-zinc-400">
                  El motor rastrea automáticamente los campos faltantes (<em className="text-amber-400">Missing Objectives</em>) como email o teléfono y le ordena a la IA cuál es el paso óptimo a seguir.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: LLM Engine */}
          {activeTab === 'llm' && (
            <div className="space-y-4">
              <h4 className="font-bold text-white text-sm">Modelos y Proveedores (BYOK)</h4>
              <p className="text-xs text-zinc-400">
                Puedes cambiar entre la infraestructura nativa de Pandoras o configurar tu propio servidor en la pestaña <strong className="text-white font-mono">Sett</strong>.
              </p>
              <div className="p-4 bg-black/40 border border-zinc-800 rounded-2xl font-mono text-xs text-zinc-300 space-y-2">
                <div>• Platform Default: GPT-4o / Claude 3.5 Sonnet</div>
                <div>• Custom Ollama Cloud: https://ollama.com/api (Modelo: llama3.1:latest)</div>
                <div>• Custom OpenAI: https://api.openai.com/v1 (Modelo: gpt-4o-mini)</div>
              </div>
            </div>
          )}

          {/* TAB 5: Channels */}
          {activeTab === 'channels' && (
            <div className="space-y-4">
              <h4 className="font-bold text-white text-sm">Conexión de Telegram y Webhooks</h4>
              <p className="text-xs text-zinc-400">
                Para vincular tu bot de Telegram, ingresa el token proporcionado por BotFather y configura el Webhook apuntando a la URL del tenant.
              </p>
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-purple-300 select-all">
                https://dash.pandoras.finance/api/v1/projects/[projectSlug]/bot/webhook
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-zinc-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)]"
          >
            Entendido, ir al Portal
          </button>
        </div>

      </div>
    </div>
  );
}
