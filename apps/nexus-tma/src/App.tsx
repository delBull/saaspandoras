/**
 * ⚡ Nexus TMA — App Shell
 * src/App.tsx
 *
 * Root application shell.
 * Manages the auth gate and routing to the main Command Center view.
 */

import './index.css';
import { useNexusAuth } from './lib/use-nexus-auth';
import { CommandCenter } from './views/CommandCenter';

// ─── Loading Screen ──────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="screen items-center" style={{ justifyContent: 'center', gap: 'var(--space-4)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, margin: '0 auto var(--space-4)',
          background: 'var(--color-accent-dim)',
          borderRadius: 'var(--radius-xl)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
        }}>
          ⚡
        </div>
        <div className="spinner" style={{ margin: '0 auto' }} />
        <p className="text-secondary text-sm" style={{ marginTop: 'var(--space-3)' }}>
          Verificando identidad…
        </p>
      </div>
    </div>
  );
}

// ─── Error Screen ─────────────────────────────────────────────────────────────

interface ErrorScreenProps {
  message: string;
  code: string | null;
  onRetry: () => void;
}

function ErrorScreen({ message, code, onRetry }: ErrorScreenProps) {
  const isNotLinked = code === 'TELEGRAM_NOT_LINKED';
  const isInactive = code === 'COLLABORATOR_INACTIVE' || code === 'COLLABORATOR_EXPIRED';

  return (
    <div className="screen items-center fade-in"
      style={{ justifyContent: 'center', padding: 'var(--space-6)' }}>
      <div className="card" style={{ maxWidth: 320, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 'var(--space-4)' }}>
          {isNotLinked ? '🔗' : isInactive ? '🚫' : '⚠️'}
        </div>
        <h2 className="text-xl" style={{ marginBottom: 'var(--space-2)' }}>
          {isNotLinked ? 'Cuenta no vinculada' :
           isInactive ? 'Acceso restringido' :
           'Error de autenticación'}
        </h2>
        <p className="text-secondary text-sm" style={{ marginBottom: 'var(--space-5)' }}>
          {message}
        </p>
        {code && (
          <p className="text-muted font-mono" style={{ fontSize: 10, marginBottom: 'var(--space-4)' }}>
            código: {code}
          </p>
        )}
        {!isInactive && (
          <button className="btn btn-primary w-full" onClick={onRetry}>
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  const auth = useNexusAuth();

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

  return <CommandCenter session={auth.session!} hasCapability={auth.hasCapability} />;
}
