'use client';

import React, { useState } from 'react';
import { Fingerprint, Key, Plus, Trash2, Shield, Eye, EyeOff, Users, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export interface ApiKeyView {
  id: string;
  name: string;
  environment: string;
  keyFingerprint: string;
  createdAt: Date;
}

interface IdentityDashboardProps {
  apiKeys: ApiKeyView[];
  organizationSlug: string;
  onGenerateKey?: (name: string, environment: string) => Promise<void>;
  onRevokeKey?: (id: string) => Promise<void>;
}

export function IdentityDashboard({ apiKeys, organizationSlug, onGenerateKey, onRevokeKey }: IdentityDashboardProps) {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyEnv, setNewKeyEnv] = useState('staging');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!newKeyName || !onGenerateKey) return;
    setIsGenerating(true);
    try {
      await onGenerateKey(newKeyName, newKeyEnv);
      setShowKeyModal(false);
      setNewKeyName('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-10">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Fingerprint className="w-8 h-8 text-indigo-400" />
          Identity & Access
        </h1>
        <p className="text-white/50 mt-2 max-w-2xl text-sm leading-relaxed">
          Manage API keys for external integrations (like your website's Hermes widget) and control team member access to this tenant.
        </p>
      </div>

      {/* API Keys Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-emerald-400" />
              Integration API Keys
            </h2>
            <p className="text-xs text-white/40 mt-1">Keys used to authenticate requests from your domains.</p>
          </div>
          <button 
            onClick={() => setShowKeyModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
          >
            <Plus size={16} />
            Generate New Key
          </button>
        </div>

        <div className="bg-[#0C0C12] border border-white/[0.06] rounded-2xl overflow-hidden">
          {apiKeys.length === 0 ? (
            <div className="p-12 text-center text-white/30">
              <Key className="w-10 h-10 mx-auto mb-4 opacity-20" />
              <p>No API keys generated yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {apiKeys.map(apiKey => (
                <div key={apiKey.id} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                      <Shield className="w-5 h-5 text-emerald-400/70" />
                    </div>
                    <div>
                      <div className="font-medium text-white flex items-center gap-2">
                        {apiKey.name}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                          {apiKey.environment}
                        </span>
                      </div>
                      <div className="text-xs text-white/40 font-mono mt-1">
                        pk_{apiKey.environment}_{apiKey.keyFingerprint}...
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-xs text-white/30 text-right">
                      Created<br/>
                      {format(new Date(apiKey.createdAt), 'MMM d, yyyy')}
                    </div>
                    <button 
                      onClick={() => onRevokeKey && onRevokeKey(apiKey.id)}
                      className="p-2 text-white/20 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                      title="Revoke Key"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Team Members Section (Mocked for now) */}
      <section className="space-y-6 pt-6 border-t border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Team Access
            </h2>
            <p className="text-xs text-white/40 mt-1">Users authorized to access the {organizationSlug} portal.</p>
            <div className="text-[10px] uppercase font-bold text-amber-400 mt-2 tracking-wider bg-amber-500/10 px-2 py-1 rounded inline-block">
              Visual Mock / Pending Backend
            </div>
          </div>
          <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl border border-white/10 text-sm font-medium transition-all">
            <Plus size={16} />
            Invite Member
          </button>
        </div>

        <div className="bg-[#0C0C12] border border-white/[0.06] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg">
                M
              </div>
              <div>
                <div className="font-medium text-white">Marco (You)</div>
                <div className="text-xs text-white/40 mt-0.5">marco@snarai.com</div>
              </div>
            </div>
            <div className="text-xs font-mono px-2 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              OWNER
            </div>
          </div>
          
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-white/50 border border-white/10">
                S
              </div>
              <div>
                <div className="font-medium text-white">System Operator</div>
                <div className="text-xs text-white/40 mt-0.5">ops@snarai.com</div>
              </div>
            </div>
            <div className="text-xs font-mono px-2 py-1 rounded-lg bg-white/5 text-white/50 border border-white/10">
              OPERATOR
            </div>
          </div>
        </div>
      </section>

      {/* Generate Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Generate API Key</h3>
            <p className="text-sm text-white/50 mb-6">Create a new key to authenticate requests from your application.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5">Key Name</label>
                <input 
                  type="text" 
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production Widget"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5">Environment</label>
                <select 
                  value={newKeyEnv}
                  onChange={e => setNewKeyEnv(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="staging">Staging (Testing)</option>
                  <option value="production">Production (Live)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8">
              <button 
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleGenerate}
                disabled={!newKeyName || isGenerating}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {isGenerating ? 'Generating...' : 'Generate Key'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
