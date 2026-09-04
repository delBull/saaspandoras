'use client';

import React, { useState } from 'react';
import { Plus, Key, Eye, Copy, CheckCircle2, Trash2 } from 'lucide-react';
import { generateKeyAction, revokeKeyAction } from './actions';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';

export function DevelopersClient({ initialKeys, organizationSlug }: { initialKeys: any[], organizationSlug: string }) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{ rawSecret: string, name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsGenerating(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const environment = formData.get('environment') as 'production' | 'staging';
    
    try {
      const res: any = await generateKeyAction(organizationSlug, name, environment);
      if (res.success) {
        setNewKeyData({ rawSecret: res.rawSecret, name: res.client.name });
        router.refresh();
      } else {
        alert(res.error || "Failed to generate key");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this API key? Applications using it will immediately lose access.")) return;
    
    const res = await revokeKeyAction(organizationSlug, id);
    if (res.success) {
      router.refresh();
    }
  };

  const copyToClipboard = () => {
    if (newKeyData) {
      navigator.clipboard.writeText(newKeyData.rawSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* LEFT COL: Key List */}
      <div className="md:col-span-2 space-y-4">
        {initialKeys.length === 0 ? (
          <div className="p-8 text-center border border-white/5 bg-white/[0.02] rounded-2xl flex flex-col items-center">
             <Key className="w-10 h-10 text-zinc-600 mb-4" />
             <p className="text-zinc-400 text-sm">No API keys found. Generate one to integrate your applications.</p>
          </div>
        ) : (
          initialKeys.map(k => (
            <GlassCard key={k.id} className="p-4 flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${k.isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                  <Key size={18} />
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm flex items-center gap-2">
                    {k.name}
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${k.environment === 'production' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {k.environment}
                    </span>
                  </h3>
                  <div className="text-xs text-zinc-500 font-mono mt-1">
                    {k.keyFingerprint} • Created {new Date(k.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              {k.isActive && (
                <button 
                  onClick={() => handleRevoke(k.id)}
                  className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Revoke Key"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </GlassCard>
          ))
        )}
      </div>

      {/* RIGHT COL: Generate Form */}
      <div>
        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Generate New Key</h2>
          
          {newKeyData ? (
             <div className="space-y-4">
               <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                 <p className="text-emerald-400 text-xs font-medium flex items-center gap-2 mb-2">
                   <Eye size={14} /> Secret generated successfully
                 </p>
                 <p className="text-zinc-400 text-xs mb-3">Copy your API key now. You won't be able to see it again!</p>
                 
                 <div className="flex items-center gap-2">
                    <input 
                      readOnly 
                      value={newKeyData.rawSecret} 
                      className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white flex-1"
                    />
                    <button onClick={copyToClipboard} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                      {copied ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
                    </button>
                 </div>
               </div>
               
               <button 
                 onClick={() => setNewKeyData(null)}
                 className="w-full py-2.5 rounded-xl border border-white/10 text-white text-sm hover:bg-white/5 transition-colors"
               >
                 Done
               </button>
             </div>
          ) : (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Key Name</label>
                <input 
                  name="name" 
                  required 
                  placeholder="e.g. Mobile App Backend"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>
              
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Environment</label>
                <select 
                  name="environment" 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="staging">Staging (Test)</option>
                  <option value="production">Production (Live)</option>
                </select>
              </div>

              <button 
                disabled={isGenerating}
                type="submit" 
                className="w-full flex items-center justify-center gap-2 bg-white text-black font-medium text-sm py-2.5 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : (
                  <>
                    <Plus size={16} /> Create API Key
                  </>
                )}
              </button>
            </form>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
