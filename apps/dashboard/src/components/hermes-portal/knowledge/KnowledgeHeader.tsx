import React from 'react';
import { Plus } from 'lucide-react';

export function KnowledgeHeader({ organizationName, onTeachClick }: { organizationName: string; onTeachClick: () => void }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-white/5">
      <div className="space-y-2">
        <h1 className="text-3xl font-light text-white tracking-tight">KNOW</h1>
        <p className="text-white/80 max-w-xl text-xl font-light">
          Hermes Knowledge Intelligence
        </p>
        <p className="text-white/50 max-w-xl text-md">
          Teach Hermes how {organizationName} works.
        </p>
      </div>
      
      <button 
        onClick={onTeachClick}
        className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-medium transition-all duration-300 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Plus className="w-4 h-4" />
        <span>Teach Hermes</span>
      </button>
    </div>
  );
}
