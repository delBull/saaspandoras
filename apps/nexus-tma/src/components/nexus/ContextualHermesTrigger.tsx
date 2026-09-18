import React, { useState } from 'react';
import { nexusPost } from '../../lib/api-client';

interface ContextualHermesTriggerProps {
  attentionItemId: string;
  sessionToken: string;
  onOpened: () => void;
}

export const ContextualHermesTrigger: React.FC<ContextualHermesTriggerProps> = ({ attentionItemId, sessionToken, onOpened }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrigger = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. We just send the ID. The server must resolve identity, scope and capability.
      // 2. The server will initialize a Contextual Hermes session tied to this ID.
      // NOTE: This endpoint is an example of what would trigger the Telegram/TMA chat overlay.
      await nexusPost('/api/v1/nexus/hermes/contextual/init', { attentionItemId }, sessionToken);
      
      onOpened();
    } catch (err: any) {
      console.error('Failed to trigger Contextual Hermes', err);
      setError(err.message || 'No se pudo iniciar Hermes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
      <button 
        onClick={handleTrigger}
        disabled={loading}
        className="w-full bg-indigo-900 text-indigo-100 py-3 rounded-lg flex items-center justify-center font-bold text-sm tracking-wide disabled:opacity-50"
        style={{
          boxShadow: '0 4px 12px rgba(49, 46, 129, 0.3)',
          transition: 'all 0.2s ease',
        }}
      >
        {loading ? 'Inicializando...' : '✦ Consultar a Hermes'}
      </button>
      <p className="text-[10px] text-center text-indigo-300 mt-2">
        Hermes analizará el contexto de esta solicitud de forma segura.
      </p>
    </div>
  );
};
