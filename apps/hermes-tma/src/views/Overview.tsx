import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Loader2, Activity, Database, Shield, LayoutList } from 'lucide-react';
import { motion } from 'framer-motion';

interface Metrics {
  postgres: { online: boolean };
  facts: { verified: number; pending: number };
  journeys: { active: number };
  security: { events24h: number };
  ipfs: { status: string; provider: string };
}

const Overview: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [status, setStatus] = useState<'LOADING' | 'AVAILABLE' | 'UNAVAILABLE' | 'ERROR'>('LOADING');

  const loadMetrics = () => {
    setStatus('LOADING');
    api.get('/overview')
      .then(res => {
        setMetrics(res.data.metrics);
        setStatus('AVAILABLE');
      })
      .catch(err => {
        console.error(err);
        setStatus('ERROR');
      });
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  if (status === 'LOADING') {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-white/20" size={24} /></div>;
  }

  if (status === 'ERROR' || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-rose-500/20 rounded-2xl bg-rose-500/5">
        <p className="text-sm font-medium text-rose-400 mb-4">Error loading metrics</p>
        <button onClick={loadMetrics} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-all">Retry</button>
      </div>
    );
  }

  const cards = [
    { label: 'Pending Claims', value: metrics.facts.pending, icon: <LayoutList size={20} />, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Active Journeys', value: metrics.journeys.active, icon: <Activity size={20} />, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    { label: 'Verified Facts', value: metrics.facts.verified, icon: <Database size={20} />, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Security (24h)', value: metrics.security.events24h, icon: <Shield size={20} />, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      
      {/* IPFS Status Banner */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Sovereign Vault</h3>
          <p className="text-sm font-medium mt-1">{metrics.ipfs.provider}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${metrics.ipfs.status === 'DURABLE' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
          {metrics.ipfs.status}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-3">
            <div className={`w-10 h-10 rounded-xl ${c.bg} ${c.color} flex items-center justify-center`}>
              {c.icon}
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">{c.label}</p>
              <p className="text-2xl font-black">{c.value}</p>
            </div>
          </div>
        ))}
      </div>
      
    </motion.div>
  );
};

export default Overview;
