import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Globe, MessageCircle, Building2, ShieldAlert, ArrowLeft } from 'lucide-react';
import type { KnowledgeSourceView } from '@/lib/pandoras/core/domains/control-plane/view-models';

interface TeachPayload {
  type: KnowledgeSourceView['type'];
  title: string;
  content: string;
}

export function TeachHermesDialog({ onClose, onSelect }: { onClose: () => void, onSelect: (payload: TeachPayload) => void }) {
  const [selectedType, setSelectedType] = useState<KnowledgeSourceView['type'] | null>(null);

  const options = [
    { type: 'DOCUMENT', icon: <FileText />, title: 'Document', desc: 'Upload a file (Simulated text for now)' },
    { type: 'URL', icon: <Globe />, title: 'Website / URL', desc: 'Learn from a source' },
    { type: 'FAQ', icon: <MessageCircle />, title: 'FAQ', desc: 'Teach Q&A directly' },
    { type: 'BUSINESS_INFO', icon: <Building2 />, title: 'Business Knowledge', desc: 'Describe your business' },
    { type: 'BUSINESS_RULE', icon: <ShieldAlert />, title: 'Business Rule', desc: 'Teach an operation' }
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <AnimatePresence mode="wait">
          {!selectedType ? (
            <motion.div
              key="selection"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="p-6 border-b border-white/5">
                <h2 className="text-2xl font-light text-white mb-2">Teach Hermes</h2>
                <p className="text-white/60">What would you like Hermes to learn?</p>
              </div>
              
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {options.map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => setSelectedType(opt.type as any)}
                    className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 transition-all text-left group"
                  >
                    <div className="p-3 rounded-lg bg-white/5 text-white/60 group-hover:text-white/90 shrink-0 transition-colors">
                      {React.cloneElement(opt.icon as React.ReactElement, { className: "w-6 h-6" })}
                    </div>
                    <div>
                      <div className="text-white/90 font-medium mb-1">{opt.title}</div>
                      <div className="text-sm text-white/50">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="p-4 border-t border-white/5 bg-white/[0.01] flex justify-end">
                <button 
                  onClick={onClose}
                  className="px-4 py-2 text-white/60 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <TeachForm 
                type={selectedType} 
                onBack={() => setSelectedType(null)} 
                onSubmit={onSelect}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function TeachForm({ type, onBack, onSubmit }: { type: KnowledgeSourceView['type'], onBack: () => void, onSubmit: (payload: TeachPayload) => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const getFormTitle = () => {
    switch (type) {
      case 'DOCUMENT': return 'Upload Document';
      case 'URL': return 'Learn from URL';
      case 'FAQ': return 'Teach FAQ';
      case 'BUSINESS_INFO': return 'Business Knowledge';
      case 'BUSINESS_RULE': return 'Business Rule';
      default: return 'Teach Hermes';
    }
  };

  const getPlaceholder = () => {
    switch (type) {
      case 'FAQ': return 'Q: What is the minimum investment?\nA: The minimum investment is $10,000...';
      case 'BUSINESS_INFO': return 'ELD specializes in residential real estate development in Riviera Nayarit...';
      case 'BUSINESS_RULE': return 'If a customer asks for a refund after 30 days, escalate to support...';
      default: return 'Paste content here...';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && content.trim()) {
      onSubmit({ type, title, content });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="p-6 border-b border-white/5 flex items-center gap-4">
        <button 
          type="button"
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg text-white/40 hover:text-white/90 hover:bg-white/5 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-medium text-white">{getFormTitle()}</h2>
        </div>
      </div>
      
      <div className="p-6 flex flex-col gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70">Title</label>
          <input 
            type="text" 
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            placeholder="E.g. Company Overview"
          />
        </div>

        <div className="space-y-2 flex-grow">
          <label className="text-sm font-medium text-white/70">Content</label>
          <textarea 
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-48 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none font-mono text-sm leading-relaxed"
            placeholder={getPlaceholder()}
          />
        </div>
      </div>
      
      <div className="p-4 border-t border-white/5 bg-white/[0.01] flex justify-end gap-3 mt-auto">
        <button 
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-white/60 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button 
          type="submit"
          disabled={!title.trim() || !content.trim()}
          className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 text-zinc-900 rounded-lg font-medium transition-colors"
        >
          Teach Hermes
        </button>
      </div>
    </form>
  );
}
