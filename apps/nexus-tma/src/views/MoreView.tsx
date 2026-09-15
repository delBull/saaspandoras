import type { NexusTmaSession } from '../lib/session-store';
import { clearSession } from '../lib/session-store';

interface MoreViewProps {
  session: NexusTmaSession;
  hasCapability: (cap: string) => boolean;
}

export function MoreView({ session }: MoreViewProps) {
  
  const handleSignOut = () => {
    clearSession();
    window.location.reload();
  };

  const handleOpenWeb = () => {
    // @ts-ignore
    const tg = window.Telegram?.WebApp;
    if (tg && (tg as any).openLink) {
      (tg as any).openLink('https://dash.pandoras.finance/dashboard');
    } else {
      window.open('https://dash.pandoras.finance/dashboard', '_blank');
    }
  };

  return (
    <div className="screen fade-in">
      <header className="nexus-header">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 16 }}>☰</span>
          <span className="font-semibold text-lg">Más Opciones</span>
        </div>
      </header>

      <div className="page-content flex-col gap-4">
        {/* Profile Card */}
        <div className="card flex items-center gap-4">
          <div style={{
            width: 48, height: 48, 
            background: 'var(--color-accent-dim)', 
            color: 'var(--color-accent)', 
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 'bold'
          }}>
            {session.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{session.name}</h3>
            <p className="text-secondary text-sm">@{session.telegramUsername || 'User'}</p>
          </div>
        </div>

        {/* Workspace & Verticals */}
        <div>
          <h4 className="font-bold text-xs text-secondary mb-2 tracking-wider">WORKSPACE ACTIVO</h4>
          <div className="card">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium">{session.activeWorkspace}</span>
              <span className="badge badge-accent">Owner</span>
            </div>
            
            <div className="text-xs text-secondary mb-2 mt-4">MÓDULOS HABILITADOS</div>
            <div className="flex flex-wrap gap-2">
              {session.enabledVerticals && session.enabledVerticals.map(v => (
                <span key={v} className="badge" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}>
                  {v === 'HERMES' && '🧠 '}
                  {v === 'GROWTH' && '🚀 '}
                  {v === 'RWA' && '🏦 '}
                  {v === 'ACADEMY' && '🎓 '}
                  {v}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div>
          <h4 className="font-bold text-xs text-secondary mb-2 tracking-wider">ACCIONES</h4>
          <div className="flex-col gap-2">
            <button className="btn btn-ghost w-full" style={{ justifyContent: 'flex-start' }} onClick={handleOpenWeb}>
              <span>🌐</span> Abrir Nexus Web Completo
            </button>
            <button className="btn btn-ghost w-full" style={{ justifyContent: 'flex-start', color: 'var(--color-danger)' }} onClick={handleSignOut}>
              <span>🚪</span> Cerrar Sesión
            </button>
          </div>
        </div>
        
        <div className="text-center mt-6">
          <span className="text-xs text-muted">Nexus OS TMA v1.0.0</span>
        </div>
      </div>
    </div>
  );
}
