import React from 'react';

export function BusinessContextPanel() {
  return (
    <div className="flex flex-col border border-white/5 bg-white/[0.01] rounded-2xl p-6">
      <div className="mb-6">
        <h2 className="text-xl text-white/90 font-medium tracking-tight">BUSINESS CONTEXT</h2>
        <p className="text-white/50 text-sm mt-1">The business model Hermes understands.</p>
      </div>
      
      <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
        <div className="text-white/40 mb-2 font-mono text-sm uppercase tracking-widest">Hermes is mapping your organization</div>
        <h3 className="text-lg text-white/70 mb-2">Not mapped yet</h3>
        <p className="text-white/40 max-w-sm text-sm">
          Teach Hermes more about your business to build your operational context. Entities like products, people, and markets will appear here automatically.
        </p>
      </div>
    </div>
  );
}
