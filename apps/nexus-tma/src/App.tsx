import { useState } from 'react';
import './index.css';
import { useNexusAuth } from './lib/use-nexus-auth';
import { CommandCenter } from './views/CommandCenter';
import { TasksView } from './views/TasksView';
import { MoreView } from './views/MoreView';
import { 
  Zap, 
  CheckSquare, 
  Menu, 
  ShieldAlert, 
  RotateCw, 
  Link2,
  Lock
} from 'lucide-react';

function LoadingScreen() {
  return (
    <div className="screen items-center justify-center p-6" style={{ height: '100vh' }}>
      <div className="card text-center p-8 max-w-xs w-full flex flex-col items-center border-violet-500/20">
        <div style={{
          width: 54, height: 54, margin: '0 auto 16px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(245, 158, 11, 0.25) 100%)',
          borderRadius: '18px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26,
          boxShadow: '0 8px 24px rgba(139, 92, 246, 0.25)'
        }}>
          ⚡
        </div>
        <div className="spinner mb-3" />
        <h3 className="text-base font-bold text-white mb-1">Nexus TMA</h3>
        <p className="text-secondary text-xs">
          Verificando credenciales de operador...
        </p>
      </div>
    </div>
  );
}

interface ErrorScreenProps {
  message: string;
  code: string | null;
  onRetry: () => void;
}

function ErrorScreen({ message, code, onRetry }: ErrorScreenProps) {
  const isNotLinked = code === 'TELEGRAM_NOT_LINKED';
  const isInactive = code === 'COLLABORATOR_INACTIVE' || code === 'COLLABORATOR_EXPIRED';

  return (
    <div className="screen items-center justify-center p-6 fade-in" style={{ height: '100vh' }}>
      <div className="card max-w-sm w-full text-center p-8 border-rose-500/20">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 mx-auto flex items-center justify-center text-rose-400 mb-4">
          {isNotLinked ? <Link2 className="w-7 h-7" /> : isInactive ? <Lock className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7" />}
        </div>
        
        <h2 className="text-lg font-bold text-white mb-1.5">
          {isNotLinked ? 'Cuenta no vinculada' :
           isInactive ? 'Acceso restringido' :
           'Error de autenticación'}
        </h2>
        
        <p className="text-secondary text-xs mb-4 leading-relaxed">
          {message}
        </p>

        {code && (
          <div className="text-[10px] font-mono text-muted py-1 px-2.5 rounded-lg bg-white/5 inline-block mb-5">
            código: {code}
          </div>
        )}

        {!isInactive && (
          <button className="btn btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold" onClick={onRetry}>
            <RotateCw className="w-4 h-4" />
            <span>Reintentar Conexión</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const auth = useNexusAuth();
  const [currentTab, setCurrentTab] = useState<'INBOX' | 'TASKS' | 'MORE'>('INBOX');

  const triggerHaptic = (type: 'light' | 'medium' = 'light') => {
    try {
      // @ts-ignore
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(type);
    } catch {
      // ignore
    }
  };

  if (auth.isLoading) {
    return <LoadingScreen />;
  }

  if (!auth.isAuthenticated || auth.error) {
    return (
      <ErrorScreen
        message={auth.error ?? 'No se pudo autenticar.'}
        code={auth.errorCode}
        onRetry={auth.retry}
      />
    );
  }

  return (
    <div className="app-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {currentTab === 'INBOX' && <CommandCenter session={auth.session!} hasCapability={auth.hasCapability} />}
        {currentTab === 'TASKS' && <TasksView session={auth.session!} />}
        {currentTab === 'MORE' && <MoreView session={auth.session!} hasCapability={auth.hasCapability} />}
      </main>

      {/* Floating Bottom Navigation Bar */}
      <nav className="floating-bottom-nav">
        <button 
          onClick={() => {
            triggerHaptic('light');
            setCurrentTab('INBOX');
          }} 
          className={`nav-item ${currentTab === 'INBOX' ? 'active' : ''}`}
        >
          <div className="nav-icon-container">
            <Zap className="w-4 h-4" />
          </div>
          <span>Inbox</span>
        </button>

        <button 
          onClick={() => {
            triggerHaptic('light');
            setCurrentTab('TASKS');
          }} 
          className={`nav-item ${currentTab === 'TASKS' ? 'active' : ''}`}
        >
          <div className="nav-icon-container">
            <CheckSquare className="w-4 h-4" />
          </div>
          <span>Tasks</span>
        </button>

        <button 
          onClick={() => {
            triggerHaptic('light');
            setCurrentTab('MORE');
          }} 
          className={`nav-item ${currentTab === 'MORE' ? 'active' : ''}`}
        >
          <div className="nav-icon-container">
            <Menu className="w-4 h-4" />
          </div>
          <span>Perfil</span>
        </button>
      </nav>
    </div>
  );
}
