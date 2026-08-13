"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Plus, FileText, Globe, MessageCircle, Building2, ShieldAlert } from 'lucide-react';
import type { KnowledgeOverviewView } from '@/lib/pandoras/core/domains/control-plane/application/queries/get-knowledge-overview';
import type { KnowledgeSourceView } from '@/lib/pandoras/core/domains/control-plane/view-models';

interface KnowledgeDashboardProps {
  overview: KnowledgeOverviewView;
  onAddKnowledge?: (type: KnowledgeSourceView['type']) => void;
  onViewSource?: (sourceId: string) => void;
}

export function KnowledgeDashboard({ overview, onAddKnowledge, onViewSource }: KnowledgeDashboardProps) {
  const [showTeachModal, setShowTeachModal] = useState(false);

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-white/5">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-emerald-400/80 mb-2">
            <Brain className="w-5 h-5" />
            <span className="text-sm font-mono uppercase tracking-widest">Cognitive Core</span>
          </div>
          <h1 className="text-3xl font-light text-white tracking-tight">Teach Hermes</h1>
          <p className="text-white/60 max-w-xl text-lg">
            Give Hermes the knowledge it needs to understand and operate your business. 
            Information added here will be processed and indexed for retrieval.
          </p>
        </div>
        
        <button 
          onClick={() => setShowTeachModal(true)}
          className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-medium transition-all duration-300 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Plus className="w-4 h-4" />
          <span>Teach Hermes</span>
        </button>
      </div>

      {/* Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard 
          label="Total Sources" 
          value={overview.totalSources} 
        />
        <MetricCard 
          label="Ready" 
          value={overview.readySources} 
          indicator="bg-emerald-500"
        />
        <MetricCard 
          label="Processing" 
          value={overview.processingSources} 
          indicator="bg-amber-500"
        />
        <MetricCard 
          label="Failed" 
          value={overview.failedSources} 
          indicator="bg-rose-500"
        />
      </div>

      {/* Sources Grid */}
      <div className="mt-8">
        <h2 className="text-xl text-white/90 font-medium mb-6">Knowledge Sources</h2>
        
        {overview.sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-white/5 rounded-2xl bg-white/[0.02]">
            <Brain className="w-12 h-12 text-white/20 mb-4" />
            <h3 className="text-xl text-white/80 mb-2">Hermes is ready to learn</h3>
            <p className="text-white/50 max-w-md mb-6">
              Your business knowledge is what allows Hermes to understand your customers, products, and operation.
            </p>
            <button 
              onClick={() => setShowTeachModal(true)}
              className="px-6 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg transition-colors"
            >
              Start Teaching
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {overview.sources.map(source => (
              <SourceCard key={source.id} source={source} onClick={() => onViewSource?.(source.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Teach Modal placeholder */}
      <AnimatePresence>
        {showTeachModal && (
          <TeachHermesModal 
            onClose={() => setShowTeachModal(false)} 
            onSelect={(type) => {
              setShowTeachModal(false);
              onAddKnowledge?.(type);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MetricCard({ label, value, indicator }: { label: string, value: number, indicator?: string }) {
  return (
    <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-between">
      <span className="text-white/60">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-2xl font-light text-white">{value}</span>
        {indicator && <div className={`w-2 h-2 rounded-full ${indicator} shadow-[0_0_8px_currentColor]`} />}
      </div>
    </div>
  );
}

function SourceCard({ source, onClick }: { source: KnowledgeSourceView, onClick: () => void }) {
  const getIcon = () => {
    switch(source.type) {
      case 'DOCUMENT': return <FileText className="w-5 h-5" />;
      case 'URL': return <Globe className="w-5 h-5" />;
      case 'FAQ': return <MessageCircle className="w-5 h-5" />;
      case 'BUSINESS_INFO': return <Building2 className="w-5 h-5" />;
      case 'BUSINESS_RULE': return <ShieldAlert className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getStatusDisplay = () => {
    switch (source.status) {
      case 'READY':
        return (
          <div className="flex items-center gap-2 text-emerald-400/90 text-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            READY
          </div>
        );
      case 'PROCESSING':
      case 'CREATED':
        return (
          <div className="flex items-center gap-2 text-amber-400/90 text-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            PROCESSING
          </div>
        );
      case 'FAILED':
        return (
          <div className="flex items-center gap-2 text-rose-400/90 text-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            ATTENTION REQUIRED
          </div>
        );
    }
  };

  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex flex-col text-left p-6 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/20 transition-all duration-300"
    >
      <div className="flex items-start justify-between w-full mb-4">
        <div className="p-2.5 rounded-xl bg-white/5 text-white/80">
          {getIcon()}
        </div>
        {getStatusDisplay()}
      </div>
      
      <h3 className="text-lg font-medium text-white/90 mb-1 line-clamp-1">{source.title}</h3>
      <div className="text-sm text-white/50 mb-4">{source.type.replace('_', ' ')}</div>

      <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between w-full text-xs text-white/40">
        <span>Updated {source.lastUpdated ? new Date(source.lastUpdated).toLocaleDateString() : 'Just now'}</span>
        {source.status === 'FAILED' && source.canRetry && (
          <span className="text-rose-400/80 hover:text-rose-400 transition-colors">Retry Processing</span>
        )}
      </div>
    </motion.button>
  );
}

function TeachHermesModal({ onClose, onSelect }: { onClose: () => void, onSelect: (type: KnowledgeSourceView['type']) => void }) {
  const options = [
    { type: 'DOCUMENT', icon: <FileText />, title: 'Document', desc: 'Upload a PDF, DOCX, etc.' },
    { type: 'URL', icon: <Globe />, title: 'Website', desc: 'Learn from a URL' },
    { type: 'FAQ', icon: <MessageCircle />, title: 'FAQ', desc: 'Teach common questions and answers' },
    { type: 'BUSINESS_INFO', icon: <Building2 />, title: 'Business', desc: 'Tell Hermes about your company' },
    { type: 'BUSINESS_RULE', icon: <ShieldAlert />, title: 'Rules', desc: 'Define how Hermes should operate' }
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
        className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-white/5">
          <h2 className="text-2xl font-light text-white mb-2">What would you like Hermes to know?</h2>
          <p className="text-white/60">Select the type of knowledge you want to provide.</p>
        </div>
        
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {options.map(opt => (
            <button
              key={opt.type}
              onClick={() => onSelect(opt.type)}
              className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 transition-all text-left"
            >
              <div className="p-3 rounded-lg bg-white/5 text-white/80 shrink-0">
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
    </div>
  );
}
