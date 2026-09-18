import React, { useState } from 'react';
import { nexusPost } from '../../lib/api-client';
import { ContextualHermesTrigger } from './ContextualHermesTrigger';

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  item: any; // AttentionItem
  sessionToken: string;
  onSuccess: () => void;
}

export const ActionSheet: React.FC<ActionSheetProps> = ({ isOpen, onClose, item, sessionToken, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const handleAction = async () => {
    setLoading(true);
    setError(null);
    try {
      if (item.type === 'KYC') {
        await nexusPost(`/api/v1/nexus/kyc/${item.resourceId}/approve`, {}, sessionToken);
      } else if (item.type === 'DEPOSIT') {
        await nexusPost(`/api/v1/nexus/finance/deposits/${item.resourceId}/approve`, {}, sessionToken);
      } else {
        // Fallback generic or other endpoint
        console.warn('Unhandled action type', item.type);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Action Failed:', err);
      setError(err.message || 'No se pudo completar la acción');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div 
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6 flex flex-col gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] transition-transform transform translate-y-0"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-2" />
        
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{item.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{item.reason}</p>
          </div>
          <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${
            item.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : 
            item.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {item.severity}
          </span>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs border border-red-100 mt-2">
            {error}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3">
          <button 
            onClick={handleAction}
            disabled={loading}
            className="w-full bg-zinc-900 text-white py-3.5 rounded-xl font-bold text-sm tracking-wider uppercase active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Procesando...' : (item.recommendedAction?.label || 'Aprobar')}
          </button>
          
          <button 
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-sm active:bg-gray-200 transition-all"
          >
            Cancelar
          </button>
        </div>

        <ContextualHermesTrigger 
          attentionItemId={item.id} 
          sessionToken={sessionToken} 
          onOpened={() => console.log('Hermes triggered')} 
        />
      </div>
    </>
  );
};
