import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Globe, MessageCircle, Building2, ShieldAlert, ArrowLeft, Terminal, LayoutGrid, Send, Paperclip } from 'lucide-react';
import type { KnowledgeSourceView } from '@/lib/pandoras/core/domains/control-plane/view-models';

interface TeachPayload {
  type: KnowledgeSourceView['type'];
  title: string;
  content: string;
}

export function TeachHermesDialog({ onClose, onSelect }: { onClose: () => void, onSelect: (payload: TeachPayload) => void }) {
  const [mode, setMode] = useState<'SELECT_MODE' | 'STANDARD' | 'TERMINAL'>('SELECT_MODE');
  const [selectedType, setSelectedType] = useState<KnowledgeSourceView['type'] | null>(null);

  const standardOptions = [
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
        className="relative w-full max-w-2xl bg-[#0C0C12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <AnimatePresence mode="wait">
          {mode === 'SELECT_MODE' && (
            <motion.div
              key="select-mode"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-light text-white mb-2">Teach Hermes</h2>
                  <p className="text-white/60">Choose how you want to input knowledge.</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <Terminal className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setMode('TERMINAL')}
                  className="flex flex-col items-center justify-center gap-4 p-8 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-purple-500/30 transition-all text-center group"
                >
                  <div className="p-4 rounded-full bg-black/50 text-white/60 group-hover:text-purple-400 group-hover:bg-purple-500/10 border border-white/5 transition-colors">
                    <Terminal className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-white/90 font-medium mb-1">Nexus Terminal</div>
                    <div className="text-sm text-white/50 px-4">Interactive CLI interface to paste links, upload, and chat.</div>
                  </div>
                </button>

                <button
                  onClick={() => setMode('STANDARD')}
                  className="flex flex-col items-center justify-center gap-4 p-8 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all text-center group"
                >
                  <div className="p-4 rounded-full bg-black/50 text-white/60 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 border border-white/5 transition-colors">
                    <LayoutGrid className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-white/90 font-medium mb-1">Standard Interface</div>
                    <div className="text-sm text-white/50 px-4">Traditional forms to manually classify and teach.</div>
                  </div>
                </button>
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
          )}

          {mode === 'STANDARD' && !selectedType && (
            <motion.div
              key="standard-selection"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="p-6 border-b border-white/5 flex items-center gap-4">
                <button onClick={() => setMode('SELECT_MODE')} className="p-2 -ml-2 rounded-lg text-white/40 hover:text-white/90 hover:bg-white/5 transition-all">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-xl font-light text-white mb-1">Standard Input</h2>
                  <p className="text-sm text-white/60">Select the type of knowledge.</p>
                </div>
              </div>
              
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {standardOptions.map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => setSelectedType(opt.type as any)}
                    className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all text-left group"
                  >
                    <div className="p-3 rounded-lg bg-black/50 text-white/60 group-hover:text-emerald-400 border border-white/5 transition-colors shrink-0">
                      {React.cloneElement(opt.icon as React.ReactElement, { className: "w-5 h-5" })}
                    </div>
                    <div>
                      <div className="text-white/90 font-medium text-sm mb-1">{opt.title}</div>
                      <div className="text-xs text-white/50">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {mode === 'STANDARD' && selectedType && (
            <motion.div
              key="standard-form"
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

          {mode === 'TERMINAL' && (
             <motion.div
              key="terminal-mode"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col h-[600px] max-h-[80vh]"
            >
              <TeachTerminal onBack={() => setMode('SELECT_MODE')} onSubmit={onSelect} />
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
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50"
            placeholder="E.g. Company Overview"
          />
        </div>

        <div className="space-y-2 flex-grow">
          <label className="text-sm font-medium text-white/70">Content</label>
          {type === 'DOCUMENT' ? (
            <div className="w-full h-48 bg-black/50 border border-white/10 border-dashed rounded-xl flex flex-col items-center justify-center text-white/40 hover:bg-white/5 hover:border-emerald-500/50 transition-colors cursor-pointer">
               <FileText className="w-10 h-10 mb-2 opacity-50" />
               <span>Click to browse or drag file here</span>
               <span className="text-xs mt-2 opacity-50">(Simulated. Paste text below for now)</span>
               <textarea 
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-16 mt-4 bg-transparent border-t border-white/10 px-4 pt-2 text-white placeholder-white/30 focus:outline-none resize-none font-mono text-xs"
                  placeholder="Simulated text content..."
                  onClick={e => e.stopPropagation()}
                />
            </div>
          ) : (
            <textarea 
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-48 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 resize-none font-mono text-sm leading-relaxed"
              placeholder={getPlaceholder()}
            />
          )}
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
          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
        >
          Teach Hermes
        </button>
      </div>
    </form>
  );
}

function TeachTerminal({ onBack, onSubmit }: { onBack: () => void, onSubmit: (payload: TeachPayload) => void }) {
  const [messages, setMessages] = useState<{role: 'system' | 'user', text: string}[]>([
    { role: 'system', text: 'Hermes Nexus Terminal v1.0.4-hybrid' },
    { role: 'system', text: 'Upload files, paste URLs, or type knowledge directly. I will classify and ingest it automatically.' },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', text: input }]);
    const currentInput = input;
    setInput('');

    // Simulate terminal response and ingestion
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'system', text: `Analyzing input...` }]);
      
      setTimeout(() => {
        let type: KnowledgeSourceView['type'] = 'BUSINESS_INFO';
        if (currentInput.startsWith('http')) type = 'URL';
        else if (currentInput.includes('?')) type = 'FAQ';
        else if (currentInput.length > 200) type = 'DOCUMENT';

        onSubmit({
          type,
          title: `Terminal Input (${type}) - ${new Date().toLocaleTimeString()}`,
          content: currentInput
        });
      }, 1000);
    }, 500);
  };

  return (
    <div className="flex flex-col h-full bg-[#0C0C12]">
      <div className="p-4 border-b border-white/5 flex items-center gap-4 bg-black/20">
        <button 
          onClick={onBack}
          className="p-1.5 -ml-1 rounded-lg text-white/40 hover:text-white/90 hover:bg-white/5 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-mono text-white/90">nexus@hermes:~/knowledge</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 font-mono text-sm space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-3 ${
              msg.role === 'user' 
                ? 'bg-purple-600/20 text-purple-100 border border-purple-500/30' 
                : 'bg-white/5 text-emerald-300/90 border border-white/10'
            }`}>
              {msg.role === 'system' && <span className="text-emerald-500 mr-2">❯</span>}
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-white/5 bg-black/40">
        <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-xl p-2 focus-within:border-purple-500/50 transition-colors">
          <button className="p-2 text-white/40 hover:text-white/90 hover:bg-white/5 rounded-lg transition-colors">
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type knowledge, paste URL, or upload file..."
            className="flex-1 bg-transparent text-white placeholder-white/30 focus:outline-none text-sm font-mono"
            autoFocus
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 text-white hover:text-purple-400 disabled:opacity-50 disabled:hover:text-white transition-colors bg-white/5 rounded-lg"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
