'use client';

import React, { useState } from 'react';
import { Shield, ShieldAlert, SlidersHorizontal, Lock, CheckCircle2, AlertTriangle, Save, AlertCircle } from 'lucide-react';

export interface PolicyView {
  id: string;
  key: string;
  content: string;
  status: string;
  updatedAt: Date;
}

interface PoliciesDashboardProps {
  policies: PolicyView[];
  organizationSlug: string;
  onSavePolicy?: (key: string, content: string) => Promise<void>;
}

export function PoliciesDashboard({ policies, organizationSlug, onSavePolicy }: PoliciesDashboardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const getPolicyContent = (key: string, defaultValue: string) => {
    const policy = policies.find(p => p.key === key);
    return policy?.content || defaultValue;
  };

  const isSnarai = organizationSlug === 'snarai';

  const [toneOfVoice, setToneOfVoice] = useState(getPolicyContent('tone_of_voice', isSnarai ? "Be extremely polite, formal, and professional. Always refer to the user with respect. Do not use slang or overly casual language." : "Be professional, concise, and helpful. Maintain a neutral and objective tone."));
  const [bannedTopics, setBannedTopics] = useState(getPolicyContent('banned_topics', isSnarai ? "Do not discuss token price speculation, guarantee ROI, or mention other crypto projects. Do not give financial advice." : "Do not discuss politics, religion, or explicit content. Do not offer financial or legal advice."));
  const [escalationRules, setEscalationRules] = useState(getPolicyContent('escalation_rules', isSnarai ? "Escalate to human if the user asks for specific financial advice, expresses frustration, or requests to buy tokens via OTC." : "Escalate to human if user asks for specific financial advice or gets angry."));
  const [safetyLevel, setSafetyLevel] = useState(getPolicyContent('safety_level', 'STRICT'));

  const handleSaveAll = async () => {
    if (!onSavePolicy) return;
    setIsSaving(true);
    setSuccessMessage('');
    try {
      await onSavePolicy('tone_of_voice', toneOfVoice);
      await onSavePolicy('banned_topics', bannedTopics);
      await onSavePolicy('escalation_rules', escalationRules);
      await onSavePolicy('safety_level', safetyLevel);
      
      setSuccessMessage('Policies synchronized with Cognitive Engine.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-rose-400" />
            Cognitive Policies
          </h1>
          <p className="text-white/50 mt-2 max-w-2xl text-sm leading-relaxed">
            Define boundaries, safety guardrails, and behavioral rules for Hermes. These policies are injected directly into the agent's core memory context.
          </p>
        </div>
        <button 
          onClick={handleSaveAll}
          disabled={isSaving}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-medium transition-all shrink-0 shadow-lg shadow-rose-900/20"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={18} />
          )}
          {isSaving ? 'Syncing...' : 'Deploy Policies'}
        </button>
      </div>

      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Rules & Guardrails */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tone of Voice */}
          <section className="bg-[#0C0C12] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-lg font-medium text-white flex items-center gap-2 mb-1">
              <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
              Tone of Voice
            </h2>
            <p className="text-xs text-white/40 mb-4">Instructions on how Hermes should express itself.</p>
            <textarea 
              value={toneOfVoice}
              onChange={(e) => setToneOfVoice(e.target.value)}
              rows={3}
              placeholder="e.g., Be extremely polite and formal..."
              className="w-full bg-[#12121A] border border-white/10 rounded-xl p-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-rose-500/50 transition-colors"
            />
          </section>

          {/* Banned Topics */}
          <section className="bg-[#0C0C12] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-lg font-medium text-white flex items-center gap-2 mb-1">
              <Lock className="w-5 h-5 text-rose-400" />
              Banned Topics (Negative Constraints)
            </h2>
            <p className="text-xs text-white/40 mb-4">Subjects Hermes must outright refuse to discuss.</p>
            <textarea 
              value={bannedTopics}
              onChange={(e) => setBannedTopics(e.target.value)}
              rows={3}
              placeholder="e.g., Do not discuss pricing, do not mention competitors..."
              className="w-full bg-[#12121A] border border-white/10 rounded-xl p-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-rose-500/50 transition-colors"
            />
          </section>

          {/* Escalation Rules */}
          <section className="bg-[#0C0C12] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-lg font-medium text-white flex items-center gap-2 mb-1">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Human Escalation Rules
            </h2>
            <p className="text-xs text-white/40 mb-4">When should Hermes trigger a hand-off to a human operator?</p>
            <textarea 
              value={escalationRules}
              onChange={(e) => setEscalationRules(e.target.value)}
              rows={3}
              placeholder="e.g., Escalate immediately if the user is frustrated..."
              className="w-full bg-[#12121A] border border-white/10 rounded-xl p-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-rose-500/50 transition-colors"
            />
          </section>
        </div>

        {/* Right Column: Settings & Safety */}
        <div className="space-y-6">
          <section className="bg-[#0C0C12] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-lg font-medium text-white flex items-center gap-2 mb-1">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
              Safety Level
            </h2>
            <p className="text-xs text-white/40 mb-6">Global guardrail strictness applied to the model.</p>
            
            <div className="space-y-3">
              <label className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer border transition-colors ${safetyLevel === 'STRICT' ? 'bg-rose-500/10 border-rose-500/30' : 'bg-transparent border-white/[0.06] hover:border-white/20'}`}>
                <input 
                  type="radio" 
                  name="safety" 
                  value="STRICT"
                  checked={safetyLevel === 'STRICT'}
                  onChange={(e) => setSafetyLevel(e.target.value)}
                  className="mt-0.5 accent-rose-500"
                />
                <div>
                  <div className="text-sm font-medium text-white">Strict (Recommended)</div>
                  <div className="text-xs text-white/40 mt-1">Maximum protection against prompt injection and off-topic queries.</div>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer border transition-colors ${safetyLevel === 'BALANCED' ? 'bg-rose-500/10 border-rose-500/30' : 'bg-transparent border-white/[0.06] hover:border-white/20'}`}>
                <input 
                  type="radio" 
                  name="safety" 
                  value="BALANCED"
                  checked={safetyLevel === 'BALANCED'}
                  onChange={(e) => setSafetyLevel(e.target.value)}
                  className="mt-0.5 accent-rose-500"
                />
                <div>
                  <div className="text-sm font-medium text-white">Balanced</div>
                  <div className="text-xs text-white/40 mt-1">Allows casual chatter but blocks overt policy violations.</div>
                </div>
              </label>
            </div>
          </section>

          <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5 flex gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-200/70 leading-relaxed">
              <strong>Warning:</strong> Changes to Cognitive Policies take effect immediately across all active sessions. Existing conversations will adopt the new behavior on the next interaction.
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
