'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import { Network, CircleDollarSign, ShieldCheck, UserCheck } from 'lucide-react';

export function BusinessContextPanel() {
  const params = useParams();
  const slug = (params?.organizationSlug as string) || '';

  const isSnarai = slug.toLowerCase().includes('snarai') || slug === '9079ecf5-2162-4078-bddf-66b607e2d32f';

  const snaraiEntities = [
    { name: "S'Narai Token (SNR)", type: "Asset", icon: <CircleDollarSign className="w-5 h-5" />, desc: "Primary utility token on Sepolia" },
    { name: "Fast Lane Phase", type: "Sales Stage", icon: <Network className="w-5 h-5" />, desc: "Active presale investment tier" },
    { name: "DAO Governance", type: "Protocol", icon: <ShieldCheck className="w-5 h-5" />, desc: "Decentralized voting mechanism" },
    { name: "Whitelist / KYC", type: "Process", icon: <UserCheck className="w-5 h-5" />, desc: "Mandatory investor verification" }
  ];

  return (
    <div className="flex flex-col border border-white/5 bg-white/[0.01] rounded-2xl p-6">
      <div className="mb-6">
        <h2 className="text-xl text-white/90 font-medium tracking-tight flex items-center gap-2">
          BUSINESS CONTEXT
          {isSnarai && <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">MAPPED</span>}
        </h2>
        <p className="text-white/50 text-sm mt-1">The business model Hermes understands.</p>
      </div>
      
      {isSnarai ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {snaraiEntities.map((ent, i) => (
            <div key={i} className="flex items-start gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-colors">
              <div className="p-2 rounded-lg bg-black/40 text-emerald-400 border border-white/5 shrink-0">
                {ent.icon}
              </div>
              <div>
                <div className="text-white/90 font-medium text-sm">{ent.name}</div>
                <div className="text-xs text-white/40 mt-1">{ent.desc}</div>
                <div className="text-[10px] uppercase tracking-wider font-mono text-emerald-500/70 mt-2">{ent.type}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
          <div className="text-white/40 mb-2 font-mono text-sm uppercase tracking-widest">Hermes is mapping your organization</div>
          <h3 className="text-lg text-white/70 mb-2">Not mapped yet</h3>
          <p className="text-white/40 max-w-sm text-sm">
            Teach Hermes more about your business to build your operational context. Entities like products, people, and markets will appear here automatically.
          </p>
        </div>
      )}
    </div>
  );
}
