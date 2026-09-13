'use client';

import React, { useState, useEffect } from 'react';
import { 
  Fingerprint, 
  Key, 
  Plus, 
  Trash2, 
  Shield, 
  Users, 
  CheckCircle2, 
  Wallet, 
  Send, 
  Phone, 
  Mail, 
  Search, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Award
} from 'lucide-react';
import { format } from 'date-fns';

export interface ApiKeyView {
  id: string;
  name: string;
  environment: string;
  keyFingerprint: string;
  createdAt: Date;
}

export interface TeamMemberView {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface IdentityItemView {
  id: string;
  name: string;
  leadType: string;
  leadStatus: string;
  identifiers: {
    wallet: string | null;
    telegramId: string | null;
    email: string | null;
    phone: string | null;
  };
  verification: {
    wallet: string;
    telegram: string;
    phone: string;
    email: string;
  };
  governance: {
    isMember: boolean;
    role: string;
    votingPower: number;
    tokensOwned: number;
  };
  createdAt: string | Date;
}

interface IdentityDashboardProps {
  apiKeys: ApiKeyView[];
  teamMembers: TeamMemberView[];
  organizationSlug: string;
  onGenerateKey?: (name: string, environment: string) => Promise<void>;
  onRevokeKey?: (id: string) => Promise<void>;
  onInviteMember?: (email: string, name: string) => Promise<void>;
}

export function IdentityDashboard({
  apiKeys,
  teamMembers,
  organizationSlug,
  onGenerateKey,
  onRevokeKey,
  onInviteMember,
}: IdentityDashboardProps) {
  const [activeTab, setActiveTab] = useState<'directory' | 'api-keys' | 'team'>('directory');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyEnv, setNewKeyEnv] = useState('staging');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  // Sovereign Directory State
  const [identities, setIdentities] = useState<IdentityItemView[]>([]);
  const [summary, setSummary] = useState({
    totalIdentities: 0,
    verifiedWallets: 0,
    verifiedTelegrams: 0,
    verifiedPhones: 0,
  });
  const [isLoadingIdentities, setIsLoadingIdentities] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadIdentities() {
      try {
        setIsLoadingIdentities(true);
        const res = await fetch(`/api/v1/hermes/tenants/${organizationSlug}/identities`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.success) {
          setIdentities(data.identities || []);
          setSummary(data.summary || {
            totalIdentities: 0,
            verifiedWallets: 0,
            verifiedTelegrams: 0,
            verifiedPhones: 0,
          });
        }
      } catch (err) {
        console.error('[IdentityDashboard] Error loading identities:', err);
      } finally {
        if (isMounted) setIsLoadingIdentities(false);
      }
    }

    loadIdentities();
    return () => { isMounted = false; };
  }, [organizationSlug]);

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

  const handleInvite = async () => {
    if (!onInviteMember) return;
    setIsInviting(true);
    try {
      await onInviteMember(inviteEmail, inviteName);
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteName('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsInviting(false);
    }
  };

  const filteredIdentities = identities.filter(item => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.identifiers.wallet && item.identifiers.wallet.toLowerCase().includes(q)) ||
      (item.identifiers.telegramId && item.identifiers.telegramId.toLowerCase().includes(q)) ||
      (item.identifiers.email && item.identifiers.email.toLowerCase().includes(q)) ||
      (item.identifiers.phone && item.identifiers.phone.includes(q))
    );
  });

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Fingerprint className="w-8 h-8 text-indigo-400" />
            Sovereign Identity & Access
          </h1>
          <p className="text-white/50 mt-1 max-w-2xl text-sm leading-relaxed">
            Directorio canónico de identidades omnicanal, permisos de gobernanza y control de credenciales para {organizationSlug}.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'directory'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Users size={14} />
            Directorio Soberano
          </button>
          <button
            onClick={() => setActiveTab('api-keys')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'api-keys'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Key size={14} />
            API Keys
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'team'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Shield size={14} />
            Equipo
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: SOVEREIGN DIRECTORY (Omnichannel Identity Graph)            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#0C0C12] border border-white/[0.06] p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50 font-medium">Identidades Canónicas</span>
                <Fingerprint className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-2">
                {isLoadingIdentities ? '...' : summary.totalIdentities}
              </div>
              <span className="text-[10px] text-white/40">Actores enlazados a {organizationSlug}</span>
            </div>

            <div className="bg-[#0C0C12] border border-white/[0.06] p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50 font-medium">Wallets Verificadas</span>
                <Wallet className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 mt-2">
                {isLoadingIdentities ? '...' : summary.verifiedWallets}
              </div>
              <span className="text-[10px] text-emerald-500/60 font-mono">EIP-712 Cryptographic</span>
            </div>

            <div className="bg-[#0C0C12] border border-white/[0.06] p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50 font-medium">Telegrams Vinculados</span>
                <Send className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-bold text-sky-400 mt-2">
                {isLoadingIdentities ? '...' : summary.verifiedTelegrams}
              </div>
              <span className="text-[10px] text-sky-500/60 font-mono">Telegram Auth Hash</span>
            </div>

            <div className="bg-[#0C0C12] border border-white/[0.06] p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50 font-medium">Teléfonos / SMS</span>
                <Phone className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400 mt-2">
                {isLoadingIdentities ? '...' : summary.verifiedPhones}
              </div>
              <span className="text-[10px] text-amber-500/60 font-mono">OTP Verificado</span>
            </div>
          </div>

          {/* Search Bar & Status */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre, wallet (0x...), telegram o teléfono..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#0C0C12] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div className="text-xs text-white/40 font-mono">
              Mostrando {filteredIdentities.length} de {identities.length}
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#0C0C12] border border-white/[0.06] rounded-2xl overflow-hidden">
            {isLoadingIdentities ? (
              <div className="p-12 text-center text-white/40 text-sm">
                Cargando directorio soberano...
              </div>
            ) : filteredIdentities.length === 0 ? (
              <div className="p-12 text-center text-white/30">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No se encontraron identidades con los criterios de búsqueda.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {filteredIdentities.map(item => (
                  <div key={item.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                    
                    {/* User Info */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 text-sm shrink-0">
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white flex items-center gap-2 text-sm">
                          {item.name}
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {item.governance.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-white/40 mt-0.5 flex items-center gap-2">
                          <span>{item.leadType}</span>
                          <span>•</span>
                          <span>{format(new Date(item.createdAt), 'dd MMM yyyy')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Channels & Verification Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      {item.identifiers.wallet && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                          <Wallet size={12} />
                          <span>{item.identifiers.wallet.slice(0, 6)}...{item.identifiers.wallet.slice(-4)}</span>
                          <span className="text-[9px] bg-emerald-500/20 px-1 rounded uppercase font-sans">
                            {item.verification.wallet}
                          </span>
                        </div>
                      )}

                      {item.identifiers.telegramId && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-mono">
                          <Send size={12} />
                          <span>tg:{item.identifiers.telegramId}</span>
                          <span className="text-[9px] bg-sky-500/20 px-1 rounded uppercase font-sans">
                            {item.verification.telegram}
                          </span>
                        </div>
                      )}

                      {item.identifiers.phone && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono">
                          <Phone size={12} />
                          <span>{item.identifiers.phone}</span>
                        </div>
                      )}

                      {item.identifiers.email && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs">
                          <Mail size={12} />
                          <span>{item.identifiers.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Governance Metrics */}
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="text-xs font-bold text-white flex items-center justify-end gap-1">
                          <Award size={13} className="text-indigo-400" />
                          <span>{item.governance.votingPower} VP</span>
                        </div>
                        <div className="text-[10px] text-white/40">
                          {item.governance.tokensOwned} tokens
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: INTEGRATION API KEYS                                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'api-keys' && (
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

          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-sm text-emerald-200">
              <p className="font-medium">¿Para qué sirven estas llaves?</p>
              <p className="text-emerald-300/80 mt-1">Utiliza estas Integration API Keys en el backend de tu proyecto (por ejemplo, en el widget de S'Narai o en Telegram Mini App) para autenticar las peticiones que hagas hacia los endpoints públicos de Hermes y Pandoras.</p>
            </div>
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
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: TEAM ACCESS                                                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'team' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                Team Access
              </h2>
              <p className="text-xs text-white/40 mt-1">Usuarios autorizados a gestionar la organización {organizationSlug}.</p>
            </div>
            <button 
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl border border-white/10 text-sm font-medium transition-all"
            >
              <Plus size={16} />
              Invite Member
            </button>
          </div>

          <div className="bg-[#0C0C12] border border-white/[0.06] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
            {teamMembers.length === 0 ? (
               <div className="p-8 text-center text-white/30">
                 No members found.
               </div>
            ) : (
              teamMembers.map(member => (
                <div key={member.id} className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg uppercase">
                      {member.name.charAt(0) || member.email.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-white">{member.name}</div>
                      <div className="text-xs text-white/40 mt-0.5">{member.email}</div>
                    </div>
                  </div>
                  <div className="text-xs font-mono px-2 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    {member.role.toUpperCase()}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* Modals */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Generate Integration Key</h3>
            <p className="text-sm text-white/50 mb-6">Create a public key to identify and authenticate your web client or Telegram Mini App.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5">Key Name</label>
                <input 
                  type="text" 
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  placeholder="e.g. Production Web Widget"
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
                  <option value="staging">Staging / Development</option>
                  <option value="production">Production</option>
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

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Invite Team Member</h3>
            <p className="text-sm text-white/50 mb-6">Send an invitation link via email to add a new member to this tenant.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8">
              <button 
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleInvite}
                disabled={!inviteEmail || isInviting}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {isInviting ? 'Sending Invite...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
