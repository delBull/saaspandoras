'use client';

import React, { useState } from 'react';
import { Shield, ShieldAlert, SlidersHorizontal, Lock, CheckCircle2, AlertTriangle, Save, AlertCircle, Maximize2, X } from 'lucide-react';

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
  const [editingPolicy, setEditingPolicy] = useState<{ key: string, title: string, value: string } | null>(null);

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

  const handleSaveModal = () => {
    if (!editingPolicy) return;
    if (editingPolicy.key === 'tone_of_voice') setToneOfVoice(editingPolicy.value);
    if (editingPolicy.key === 'banned_topics') setBannedTopics(editingPolicy.value);
    if (editingPolicy.key === 'escalation_rules') setEscalationRules(editingPolicy.value);
    setEditingPolicy(null);
  };

  const renderPolicyCard = (title: string, desc: string, icon: React.ReactNode, key: string, value: string) => (
    <section className="bg-[#0C0C12] border border-white/[0.06] rounded-2xl p-6 relative group hover:border-white/[0.12] transition-colors flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-medium text-white flex items-center gap-2 mb-1">
            {icon}
            {title}
          </h2>
          <p className="text-xs text-white/40">{desc}</p>
        </div>
        <button 
          onClick={() => setEditingPolicy({ key, title, value })}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/60 hover:text-white bg-white/[0.04] hover:bg-white/[0.1] rounded-xl transition-all border border-white/[0.06]"
        >
          <Maximize2 size={13} />
          <span>Editar</span>
        </button>
      </div>
      <div className="bg-[#12121A] border border-white/5 rounded-xl p-4 text-xs text-white/80 max-h-[180px] overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed">
        {value || <span className="text-white/20 italic">No policy defined...</span>}
      </div>
    </section>
  );

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
          
          {renderPolicyCard(
            "Tone of Voice",
            "Instructions on how Hermes should express itself.",
            <SlidersHorizontal className="w-5 h-5 text-indigo-400" />,
            "tone_of_voice",
            toneOfVoice
          )}

          {renderPolicyCard(
            "Banned Topics (Negative Constraints)",
            "Subjects Hermes must outright refuse to discuss.",
            <Lock className="w-5 h-5 text-rose-400" />,
            "banned_topics",
            bannedTopics
          )}

          {renderPolicyCard(
            "Human Escalation Rules",
            "When should Hermes trigger a hand-off to a human operator?",
            <AlertTriangle className="w-5 h-5 text-amber-400" />,
            "escalation_rules",
            escalationRules
          )}
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

      {/* Editing Modal */}
      {editingPolicy && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 lg:p-10">
          <div className="bg-[#12121A] border border-white/10 rounded-2xl w-full max-w-4xl flex flex-col shadow-2xl h-[80vh]">
            <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
              <h3 className="text-lg font-medium text-white">{editingPolicy.title}</h3>
              <button 
                onClick={() => setEditingPolicy(null)}
                className="text-white/40 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 flex-1 flex flex-col min-h-0">
              <textarea 
                value={editingPolicy.value}
                onChange={(e) => setEditingPolicy(prev => prev ? { ...prev, value: e.target.value } : null)}
                className="w-full h-full bg-[#0C0C12] border border-white/10 rounded-xl p-6 text-sm text-white placeholder-white/20 focus:outline-none focus:border-rose-500/50 transition-colors resize-none font-mono"
                placeholder="Enter policy details here..."
              />
            </div>
            <div className="p-6 border-t border-white/[0.06] flex justify-end gap-3 bg-[#0C0C12]/50 rounded-b-2xl">
              <button 
                onClick={() => setEditingPolicy(null)}
                className="px-5 py-2.5 rounded-xl font-medium text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveModal}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-rose-900/20"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
