import React from 'react';
import { 
  AlertCircle, 
  FileText, 
  Building2, 
  Flame, 
  Calendar, 
  Rocket, 
  Zap, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface AttentionItemCardProps {
  item: any;
  onClick: (item: any) => void;
}

export const AttentionItemCard: React.FC<AttentionItemCardProps> = ({ item, onClick }) => {
  const isCritical = item.severity === 'CRITICAL';
  const isHigh = item.severity === 'HIGH';

  const getSeverityGlow = () => {
    if (isCritical) return 'border-rose-500/40 bg-rose-500/5 shadow-[0_0_20px_rgba(244,63,94,0.12)]';
    if (isHigh) return 'border-amber-500/40 bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.12)]';
    return 'border-white/10 bg-[#12121c]/80';
  };

  const getSeverityBadge = () => {
    if (isCritical) {
      return (
        <span className="badge badge-danger">
          <ShieldAlert className="w-2.5 h-2.5" /> CRÍTICO
        </span>
      );
    }
    if (isHigh) {
      return (
        <span className="badge badge-amber">
          <AlertCircle className="w-2.5 h-2.5" /> PRIORIDAD
        </span>
      );
    }
    return (
      <span className="badge badge-accent">
        OPERACIÓN
      </span>
    );
  };

  const renderIcon = (type: string) => {
    const iconClass = "w-5 h-5";
    switch (type) {
      case 'KYC': return <FileText className={`${iconClass} text-violet-400`} />;
      case 'DEPOSIT': return <Building2 className={`${iconClass} text-emerald-400`} />;
      case 'ESCALATION': return <Flame className={`${iconClass} text-rose-400`} />;
      case 'MEETING': return <Calendar className={`${iconClass} text-sky-400`} />;
      case 'CAMPAIGN': return <Rocket className={`${iconClass} text-amber-400`} />;
      default: return <Zap className={`${iconClass} text-violet-400`} />;
    }
  };

  return (
    <div 
      onClick={() => onClick(item)}
      className={`card cursor-pointer border transition-all duration-200 active:scale-[0.985] ${getSeverityGlow()}`}
      style={{ padding: '14px 16px', marginBottom: '12px' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div style={{
            width: 38,
            height: 38,
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {renderIcon(item.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {getSeverityBadge()}
              <span className="text-[10px] font-mono text-muted tracking-tight">
                {item.id ? `#${String(item.id).slice(0, 8)}` : ''}
              </span>
            </div>
            <h4 className="font-bold text-sm text-white tracking-tight line-clamp-1">
              {item.title}
            </h4>
            <p className="text-xs text-secondary mt-0.5 line-clamp-2 leading-relaxed">
              {item.reason}
            </p>
          </div>
        </div>

        <div className="flex items-center self-center pl-2 text-muted">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/5">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400/80" />
          <span className="text-[10px] font-medium text-secondary">
            {item.recommendedAction?.label ?? 'Revisar acción'}
          </span>
        </div>
        <span className="text-[10px] font-mono text-muted">
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Hoy'}
        </span>
      </div>
    </div>
  );
};
