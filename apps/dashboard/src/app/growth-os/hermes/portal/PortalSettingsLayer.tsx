'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { getHermesConfig, saveHermesConfig } from '../settings/actions';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

export function PortalSettingsLayer({ tenantId }: { tenantId: string | number }) {
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [slug, setSlug] = useState('snarai'); // HARDCODED FOR DEMO

  // Custom LLM Provider State
  const [providerType, setProviderType] = useState<'platform' | 'custom_ollama' | 'openai' | 'groq'>('platform');
  const [customBaseUrl, setCustomBaseUrl] = useState('https://ollama.com/api');
  const [customApiKey, setCustomApiKey] = useState('');
  const [customModel, setCustomModel] = useState('gpt-oss:20b');

  useEffect(() => {
    getHermesConfig('snarai').then((config) => {
      if (config && config.customLLM) {
        setProviderType(config.customLLM.providerType || 'platform');
        setCustomBaseUrl(config.customLLM.baseUrl || '');
        setCustomApiKey(config.customLLM.apiKey || '');
        setCustomModel(config.customLLM.model || '');
      }
    }).catch(console.error);
  }, [tenantId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveHermesConfig(slug, { 
        customLLM: {
          providerType,
          baseUrl: customBaseUrl,
          apiKey: customApiKey,
          model: customModel
        }
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    }
    setIsSaving(false);
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 p-6 overflow-y-auto">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <AdjustmentsHorizontalIcon className="w-6 h-6 text-purple-400" />
            Workspace Settings
          </h2>
          <p className="text-sm text-zinc-400 mt-1">Configuración global del entorno operativo</p>
        </div>
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm font-semibold transition-all"
        >
          {isSaving ? 'Guardando...' : savedSuccess ? 'Guardado ✅' : 'Save Changes'}
        </Button>
      </div>
      
      <div className="space-y-6">
        <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl">
          <label className="block text-xs font-mono uppercase text-zinc-400 mb-3">Motor y Autonomía</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              onClick={() => setProviderType('platform')}
              className={`p-4 border rounded-2xl cursor-pointer transition-all ${
                providerType === 'platform' ? 'border-purple-500/50 bg-purple-500/10' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
              }`}
            >
              <span className="text-sm font-medium text-white block">🌐 Infraestructura Pandoras (Default)</span>
              <span className="text-xs text-zinc-400 font-light block mt-1">Usa nuestra nube optimizada con cuotas y límites incluidos.</span>
            </div>

            <div 
              onClick={() => setProviderType('custom_ollama')}
              className={`p-4 border rounded-2xl cursor-pointer transition-all ${
                providerType === 'custom_ollama' ? 'border-purple-500/50 bg-purple-500/10' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
              }`}
            >
              <span className="text-sm font-medium text-white block">🦙 Tu Propia IA (Bring Your Own Key)</span>
              <span className="text-xs text-zinc-400 font-light block mt-1">Conecta tu propia URL de Ollama Cloud, OpenAI o Groq de forma privada.</span>
            </div>
          </div>
        </div>

        {providerType === 'custom_ollama' && (
          <div className="p-6 bg-black/40 border border-zinc-800 rounded-2xl space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Base URL</label>
              <input 
                type="text"
                value={customBaseUrl}
                onChange={e => setCustomBaseUrl(e.target.value)}
                placeholder="https://ollama.com/api o https://api.openai.com/v1"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500/50 font-mono"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Tu API Key Privada</label>
                <input 
                  type="password"
                  value={customApiKey}
                  onChange={e => setCustomApiKey(e.target.value)}
                  placeholder="sk-... o tu token"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500/50 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Modelo a Ejecutar</label>
                <input 
                  type="text"
                  value={customModel}
                  onChange={e => setCustomModel(e.target.value)}
                  placeholder="gpt-oss:20b, llama3.1:latest, gpt-4o-mini"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500/50 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="font-bold text-zinc-200">Agent Autonomy Level</h3>
              <p className="text-sm text-zinc-400 mt-1">Determina cuánta libertad tiene el agente para tomar decisiones sin validación humana.</p>
            </div>
            <select className="bg-black/50 border border-white/10 text-sm text-zinc-200 px-4 py-2 rounded-xl outline-none focus:border-purple-500/50">
              <option>Level 1 (Human-in-the-loop)</option>
              <option>Level 2 (Co-pilot)</option>
              <option>Level 3 (Autonomous)</option>
            </select>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="font-bold text-zinc-200">Model Selection</h3>
              <p className="text-sm text-zinc-400 mt-1">LLM utilizado para razonamiento de alto nivel por defecto.</p>
            </div>
            <select className="bg-black/50 border border-white/10 text-sm text-zinc-200 px-4 py-2 rounded-xl outline-none focus:border-purple-500/50">
              <option>GPT-4o (Reasoning)</option>
              <option>Claude 3.5 Sonnet (Fast)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
