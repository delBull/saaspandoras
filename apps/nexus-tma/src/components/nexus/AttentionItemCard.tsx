import React from 'react';

interface AttentionItemCardProps {
  item: any;
  onClick: (item: any) => void;
}

export const AttentionItemCard: React.FC<AttentionItemCardProps> = ({ item, onClick }) => {
  const getSeverityStyles = (severity: string) => {
    switch(severity) {
      case 'CRITICAL': return 'bg-red-50 border-red-200 text-red-900 border-l-4 border-l-red-500';
      case 'HIGH': return 'bg-orange-50 border-orange-200 text-orange-900 border-l-4 border-l-orange-500';
      case 'NORMAL': return 'bg-blue-50 border-blue-200 text-blue-900 border-l-4 border-l-blue-500';
      default: return 'bg-zinc-50 border-zinc-200 text-zinc-900 border-l-4 border-l-zinc-500';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'KYC': return '📄';
      case 'DEPOSIT': return '🏦';
      case 'ESCALATION': return '🔥';
      case 'MEETING': return '📅';
      case 'CAMPAIGN': return '🚀';
      default: return '⚡';
    }
  };

  return (
    <div 
      onClick={() => onClick(item)}
      className={`rounded-xl p-4 border shadow-sm cursor-pointer active:scale-[0.98] transition-transform ${getSeverityStyles(item.severity)}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex gap-3">
          <div className="text-2xl mt-0.5">{getIcon(item.type)}</div>
          <div>
            <h4 className="font-bold text-sm leading-tight">{item.title}</h4>
            <p className="text-xs mt-1 opacity-80">{item.reason}</p>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-black/5">
        <span className="text-[10px] font-mono opacity-60">ID: {item.id.slice(0, 8)}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};
