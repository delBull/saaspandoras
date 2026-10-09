import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Loader2, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface Fact {
  id: string;
  dimension: string;
  key: string;
  content: any;
  status: string;
  createdAt: string;
}

const KnowledgeVault: React.FC = () => {
  const [facts, setFacts] = useState<Fact[]>([]);
  const [status, setStatus] = useState<'LOADING' | 'AVAILABLE' | 'UNAVAILABLE' | 'ERROR'>('LOADING');
  const [processing, setProcessing] = useState<string | null>(null);

  const loadFacts = async () => {
    setStatus('LOADING');
    try {
      const res = await api.get('/knowledge/pending');
      setFacts(res.data.items);
      setStatus('AVAILABLE');
    } catch (err) {
      console.error(err);
      setStatus('ERROR');
    }
  };

  useEffect(() => {
    loadFacts();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessing(id);
    try {
      await api.post(`/knowledge/${action}`, { knowledgeId: id });
      setFacts(prev => prev.filter(f => f.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || `Error: ${action}`);
    } finally {
      setProcessing(null);
    }
  };

  if (status === 'LOADING') return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-white/20" size={24} /></div>;

  if (status === 'ERROR') {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-rose-500/20 rounded-2xl bg-rose-500/5">
        <p className="text-sm font-medium text-rose-400 mb-4">Failed to load knowledge vault</p>
        <button onClick={loadFacts} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-all">Retry</button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-sm font-black uppercase text-zinc-400 tracking-widest">Pending Review</h2>
        <span className="text-xs bg-zinc-800 px-2 py-1 rounded-md">{facts.length} items</span>
      </div>

      {facts.length === 0 ? (
        <div className="py-12 text-center text-zinc-600 text-sm font-medium border border-dashed border-white/10 rounded-2xl">
          No pending knowledge facts.
        </div>
      ) : (
        facts.map(fact => (
          <div key={fact.id} className="p-5 rounded-2xl bg-zinc-900/50 border border-white/5 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded-sm">{fact.dimension}</span>
                <h3 className="text-sm font-black mt-2">{fact.key}</h3>
              </div>
              <span className="text-[10px] text-zinc-500">{new Date(fact.createdAt).toLocaleDateString()}</span>
            </div>
            
            <div className="text-xs text-zinc-400 bg-black/40 p-3 rounded-lg overflow-x-auto border border-white/5">
              <pre>{JSON.stringify(fact.content, null, 2)}</pre>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => handleAction(fact.id, 'reject')}
                disabled={processing !== null}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs uppercase tracking-wider border border-white/10 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 transition-all disabled:opacity-50"
              >
                <X size={14} /> Reject
              </button>
              <button 
                onClick={() => handleAction(fact.id, 'approve')}
                disabled={processing !== null}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-wider bg-white text-black hover:bg-emerald-400 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                {processing === fact.id ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                Approve
              </button>
            </div>
          </div>
        ))
      )}
    </motion.div>
  );
};

export default KnowledgeVault;
