import { useState, useRef } from 'react';
import type { NexusTmaSession } from '../lib/session-store';
import { clearSession } from '../lib/session-store';
import { 
  User, 
  ExternalLink, 
  LogOut, 
  Cpu,
  Globe,
  Camera,
  Loader2
} from 'lucide-react';

interface MoreViewProps {
  session: NexusTmaSession;
  hasCapability: (cap: string) => boolean;
}

export function MoreView({ session, hasCapability: _hasCapability }: MoreViewProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const triggerHaptic = (type: 'light' | 'medium' = 'light') => {
    try {
      // @ts-ignore
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(type);
    } catch {
      // ignore
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      triggerHaptic('medium');
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch('/api/profile/upload-avatar', {
        method: 'POST',
        headers: {
          'x-collaborator-id': String(session.collaboratorId)
        },
        credentials: 'include',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json() as { user?: { image?: string } };
        if (data.user?.image) {
          setAvatarUrl(data.user.image);
        }
        setUploadSuccess(true);
        triggerHaptic('light');
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        alert('Error al actualizar avatar en el servidor.');
      }
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      alert('Error de conexión al subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = () => {
    triggerHaptic('medium');
    clearSession();
    window.location.reload();
  };

  const handleOpenWeb = () => {
    triggerHaptic('light');
    // @ts-ignore
    const tg = window.Telegram?.WebApp;
    if (tg && (tg as any).openLink) {
      (tg as any).openLink('https://dash.pandoras.finance/nexus');
    } else {
      window.open('https://dash.pandoras.finance/nexus', '_blank');
    }
  };

  return (
    <div className="screen fade-in pb-24">
      <header className="nexus-top-bar">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
            <User className="w-4 h-4" />
          </div>
          <span className="font-bold text-base text-white">Configuración & Perfil</span>
        </div>
      </header>

      <div className="page-content flex flex-col gap-4">
        {/* Profile Card with Avatar Editor */}
        <div className="card flex items-center gap-4 border-violet-500/20 bg-gradient-to-r from-violet-950/20 to-transparent">
          <div className="relative">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative cursor-pointer group active:scale-95 transition-transform"
              style={{
                width: 60, height: 60, 
                borderRadius: '18px',
                border: '2px solid rgba(139, 92, 246, 0.4)',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #d97706 100%)',
                boxShadow: '0 4px 20px rgba(139, 92, 246, 0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {session.name ? session.name.charAt(0).toUpperCase() : 'U'}
                </span>
              )}

              {/* Upload overlay indicator */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </div>
            </div>

            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-violet-600 border border-white flex items-center justify-center text-white shadow-md active:scale-90"
              title="Cambiar foto de perfil"
            >
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
            </button>

            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/png,image/jpeg,image/webp" 
              className="hidden" 
              onChange={handleAvatarUpload}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-white truncate">{session.name}</h3>
            <p className="text-secondary text-xs">@{session.telegramUsername || 'Operador'}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="badge badge-amber text-[9px]">
                {session.role || 'CORE_OPERATOR'}
              </span>
              {uploadSuccess && (
                <span className="text-[10px] text-emerald-400 font-semibold animate-pulse">
                  ¡Avatar sincronizado!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Workspace Card */}
        <div>
          <h4 className="font-bold text-xs text-muted mb-2 tracking-wider uppercase">
            Workspace Canónico
          </h4>
          <div className="card p-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <span className="font-bold text-white text-sm block">{session.activeWorkspace}</span>
                <span className="text-[11px] text-secondary font-mono">Pandora&apos;s Sovereign Mesh</span>
              </div>
              <span className="badge badge-success text-[10px]">ACTIVO</span>
            </div>
            
            <div className="text-[11px] text-muted mb-2 mt-3 font-semibold uppercase tracking-wider">
              Módulos Habilitados
            </div>
            <div className="flex flex-wrap gap-1.5">
              {session.enabledVerticals && session.enabledVerticals.map(v => (
                <span key={v} className="badge badge-accent">
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

        {/* Node Status */}
        <div>
          <h4 className="font-bold text-xs text-muted mb-2 tracking-wider uppercase">
            Hermes Autonomous Runtime
          </h4>
          <div className="card p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Canal Hermes Activo</div>
                <div className="text-[10px] text-muted">Telegram TMA Plane · v2.0</div>
              </div>
            </div>
            <span className="live-pulse" />
          </div>
        </div>

        {/* Actions */}
        <div>
          <h4 className="font-bold text-xs text-muted mb-2 tracking-wider uppercase">
            Acciones
          </h4>
          <div className="flex flex-col gap-2">
            <button 
              className="card flex items-center justify-between p-3.5 border-white/10 active:scale-[0.99] cursor-pointer text-left w-full"
              onClick={handleOpenWeb}
            >
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-semibold text-white">Abrir Nexus Web Command Plane</span>
              </div>
              <ExternalLink className="w-4 h-4 text-muted" />
            </button>

            <button 
              className="card flex items-center justify-between p-3.5 border-rose-500/20 bg-rose-500/5 active:scale-[0.99] cursor-pointer text-left w-full"
              onClick={handleSignOut}
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-semibold text-rose-300">Cerrar Sesión</span>
              </div>
            </button>
          </div>
        </div>
        
        <div className="text-center mt-4">
          <span className="text-[11px] font-mono text-muted">Nexus TMA OS · Sovereign Build v2.0</span>
        </div>
      </div>
    </div>
  );
}
