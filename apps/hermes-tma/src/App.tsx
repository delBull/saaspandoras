import { useEffect, useState } from 'react';
import { useSessionStore } from './store/useSessionStore';
import { authenticateTMA } from './lib/api';
import Overview from './views/Overview';
import KnowledgeVault from './views/KnowledgeVault';
import { ShieldAlert, Loader2 } from 'lucide-react';

function App() {
  const { isAuthenticated } = useSessionStore();
  const [isBooting, setIsBooting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'vault'>('overview');

  useEffect(() => {
    const boot = async () => {
      try {
        await authenticateTMA();
      } catch (err: any) {
        setError(err.message || 'Error de acceso a Hermes');
      } finally {
        setIsBooting(false);
      }
    };
    
    if (!isAuthenticated) {
      boot();
    } else {
      setIsBooting(false);
    }
  }, [isAuthenticated]);

  if (isBooting) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <Loader2 className="animate-spin text-cyan-500" size={32} />
      </div>
    );
  }

  if (error || !isAuthenticated) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-black p-6 text-center space-y-4">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-2 border border-red-500/20">
          <ShieldAlert className="text-red-500" size={32} />
        </div>
        <h1 className="text-xl font-black uppercase text-white tracking-widest">Acceso Denegado</h1>
        <p className="text-sm text-zinc-400 max-w-xs">{error || 'Tu identidad no está autorizada para acceder a esta bóveda.'}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-black text-white overflow-hidden relative">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-cyan-900/20 to-transparent pointer-events-none" />
      
      {/* Top Header */}
      <div className="px-6 py-4 flex flex-col pt-8 relative z-10 border-b border-white/5 bg-black/50 backdrop-blur-md">
        <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-500 font-black">Hermes Nexus</span>
        <h1 className="text-2xl font-black uppercase tracking-tighter mt-1">Tenant Console</h1>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 p-6 pb-24">
        {activeTab === 'overview' ? <Overview /> : <KnowledgeVault />}
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 w-full border-t border-white/10 bg-black/80 backdrop-blur-xl z-50 px-6 py-4 pb-8 flex gap-4 justify-around">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`flex-1 flex flex-col items-center gap-1 transition-all ${activeTab === 'overview' ? 'text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <span className="text-[10px] uppercase tracking-widest font-black">Métricas</span>
        </button>
        <button 
          onClick={() => setActiveTab('vault')}
          className={`flex-1 flex flex-col items-center gap-1 transition-all ${activeTab === 'vault' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <span className="text-[10px] uppercase tracking-widest font-black">Vault</span>
        </button>
      </div>
    </div>
  );
}

export default App;
