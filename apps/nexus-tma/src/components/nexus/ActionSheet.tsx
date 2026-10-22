import React, { useState } from 'react';
import { nexusPost } from '../../lib/api-client';
import { ContextualHermesTrigger } from './ContextualHermesTrigger';
import { 
  X, 
  AlertTriangle, 
  ShieldCheck, 
  Zap, 
  Loader2,
  ArrowRight
} from 'lucide-react';

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  item: any; // AttentionItem
  onSuccess: () => void;
}

export const ActionSheet: React.FC<ActionSheetProps> = ({ isOpen, onClose, item, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'medium') => {
    try {
      // @ts-ignore
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(type);
    } catch {
      // ignore
    }
  };

  const handleAction = async () => {
    triggerHaptic('medium');
    setLoading(true);
    setError(null);
    try {
      if (item.type === 'KYC') {
        await nexusPost(`/api/v1/nexus/kyc/${item.resourceId}/approve`, {});
      } else if (item.type === 'DEPOSIT') {
        await nexusPost(`/api/v1/nexus/finance/deposits/${item.resourceId}/approve`, {});
      } else if (item.recommendedAction?.action === 'ACTIVATE_TRIAL') {
        await nexusPost('/api/v1/hermes/trial/activate', {
          organizationSlug: item.payload?.organizationSlug || item.id,
        });
      } else if (item.id && (String(item.id).startsWith('act_') || String(item.id).length > 20)) {
        await nexusPost('/api/v1/tma/nexus/actions/execute', {
          actionToken: item.id,
          action: item.recommendedAction?.action || 'APPROVE',
        });
      } else {
        console.info('Generic item handled:', item.type);
      }
      try {
        // @ts-ignore
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
      } catch {
        // ignore
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Action Failed:', err);
      try {
        // @ts-ignore
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error');
      } catch {
        // ignore
      }
      setError(err.message || 'No se pudo completar la acción');
    } finally {
      setLoading(false);
    }
  };

  const isCritical = item.severity === 'CRITICAL';

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      
      {/* Glass Bottom Sheet */}
      <div 
        className="relative z-50 w-full bg-[#10101a] border-t border-white/10 rounded-t-[28px] p-6 pb-8 flex flex-col gap-5 shadow-[0_-16px_50px_rgba(0,0,0,0.85)] max-h-[88vh] overflow-y-auto"
        style={{ paddingBottom: 'calc(24px + var(--safe-bottom))' }}
      >
        {/* Handle */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto" />
        
        {/* Header */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`badge ${isCritical ? 'badge-danger' : item.severity === 'HIGH' ? 'badge-amber' : 'badge-accent'}`}>
                {item.severity}
              </span>
              <span className="text-[11px] font-mono text-muted">
                {item.type} · #{String(item.id).slice(0, 8)}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {item.title}
            </h2>
            <p className="text-xs text-secondary mt-1.5 leading-relaxed">
              {item.reason}
            </p>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-secondary active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notarized Execution Info Banner */}
        <div className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-violet-400 flex-shrink-0" />
          <div className="text-xs text-secondary leading-normal">
            Esta orden se ejecutará y notarizará en el <strong>Sovereign Command Plane</strong> con tu firma de operador.
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-2.5 mt-2">
          <button 
            onClick={handleAction}
            disabled={loading}
            className="w-full btn btn-primary flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold tracking-wide active:scale-[0.98] transition-all disabled:opacity-50"
            style={{ fontSize: '14px' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Ejecutando en Hermes Core...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-violet-200" />
                <span>{item.recommendedAction?.label || 'Aprobar y Ejecutar'}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
          
          <button 
            onClick={onClose}
            className="w-full btn btn-ghost py-3.5 rounded-xl text-xs font-semibold text-secondary active:scale-[0.98]"
          >
            Posponer para más tarde
          </button>
        </div>

        {/* Contextual Hermes Assistance */}
        <div className="pt-2 border-t border-white/5">
          <ContextualHermesTrigger 
            attentionItemId={item.id} 
            onOpened={() => console.log('[TMA] Hermes assistance requested')} 
          />
        </div>
      </div>
    </div>
  );
};
