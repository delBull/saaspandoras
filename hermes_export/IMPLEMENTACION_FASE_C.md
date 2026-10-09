# Resumen de Implementación: Fase C (Nexus TMA)

Se construyó el **Interactive Transaction Plane** (Nexus TMA) en `apps/hermes-tma`, conectándose de forma segura a los BFF de `dashboard/api/v1/hermes/tma/*`.

## Archivos Involucrados

### `package.json`
```json
{
  "name": "@saaspandoras/hermes-tma",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "oxlint",
    "preview": "vite preview"
  },
  "dependencies": {
    "@twa-dev/sdk": "^8.0.2",
    "axios": "^1.20.0",
    "framer-motion": "^14.0.0",
    "lucide-react": "^1.54.0",
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "zustand": "^5.0.15"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.3.3",
    "@types/node": "^24.13.3",
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.7",
    "@vitejs/plugin-react": "^6.1.1",
    "autoprefixer": "^10.6.1",
    "oxlint": "^1.81.0",
    "postcss": "^8.5.29",
    "tailwindcss": "^4.3.3",
    "typescript": "~6.0.2",
    "vite": "^8.3.0"
  }
}
```

### `tailwind.config.js`
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

### `postcss.config.js`
```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
}
```

### `src/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
  }
}

body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

/* Utilities for TMA app feeling */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

### `src/App.tsx`
```tsx
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
```

### `src/lib/api.ts`
```ts
import axios from 'axios';
import WebApp from '@twa-dev/sdk';

const isDev = import.meta.env.DEV;
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const API_URL = `${BASE_URL.replace(/\/+$/, '')}/api/v1/hermes/tma`;

export const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para inyectar token de sesión autorizado (NO initData crudo para las queries)
api.interceptors.request.use((config) => {
  const token = useSessionStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Importado de forma tardía para evitar ciclos
import { useSessionStore } from '../store/useSessionStore';

export const authenticateTMA = async (targetWorkspace?: string) => {
  let initData = WebApp.initData;

  // Mock en desarrollo únicamente
  if (!initData && isDev) {
    if (import.meta.env.VITE_MOCK_AUTH === 'true') {
      console.warn("⚠️ Usando MOCK_AUTH para desarrollo. Esto fallará en producción.");
      // NOTA: El servidor no valida mocks sintéticos en auth real sin una flag.
      // Para probar el flujo dev sin Telegram, el servidor de dashboard debe tener auth deshabilitado
      // o debemos proporcionar un initData válido exportado del bot.
    } else {
      throw new Error("InitData no encontrado. Abre la aplicación desde Telegram.");
    }
  }

  try {
    const res = await axios.post(`${API_URL}/auth`, {
      initData,
      targetWorkspace,
    });
    
    if (res.data.success) {
      useSessionStore.getState().setSession(res.data.token, res.data.session, res.data.authorizedTenants);
      return res.data;
    }
    throw new Error(res.data.error || "Fallo de autenticación");
  } catch (err: any) {
    console.error("[API] Error de Auth:", err.response?.data || err.message);
    throw err;
  }
};
```

### `src/store/useSessionStore.ts`
```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TenantInfo {
  organizationId: string;
  slug: string;
  title: string;
  role: string;
  isOwner: boolean;
}

export interface HermesSession {
  userId: string;
  telegramUserId: string;
  organizationId: string;
  role: string;
  capabilities: string[];
  expiresAt: number;
}

interface SessionState {
  token: string | null;
  session: HermesSession | null;
  authorizedTenants: TenantInfo[];
  isAuthenticated: boolean;
  
  setSession: (token: string, session: HermesSession, tenants: TenantInfo[]) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      session: null,
      authorizedTenants: [],
      isAuthenticated: false,

      setSession: (token, session, tenants) => set({
        token,
        session,
        authorizedTenants: tenants,
        isAuthenticated: true,
      }),

      clearSession: () => set({
        token: null,
        session: null,
        authorizedTenants: [],
        isAuthenticated: false,
      }),
    }),
    {
      name: 'hermes-tma-session',
      partialize: (state) => ({ token: state.token }), // Solo persistir el token
    }
  )
);
```

### `src/views/Overview.tsx`
```tsx
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/overview')
      .then(res => setMetrics(res.data.metrics))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-white/20" size={24} /></div>;
  }

  if (!metrics) return null;

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
```

### `src/views/KnowledgeVault.tsx`
```tsx
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
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const loadFacts = async () => {
    try {
      const res = await api.get('/knowledge/pending');
      setFacts(res.data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-white/20" size={24} /></div>;

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
```

