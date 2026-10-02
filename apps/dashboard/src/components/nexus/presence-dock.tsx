'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type PresenceStatus = 'ONLINE' | 'OFFLINE' | 'DO_NOT_DISTURB' | 'IN_MEETING';
export type PreferredChannel = 'NEXUS_CHAT' | 'TELEGRAM' | 'WHATSAPP' | 'EMAIL';

export interface CollaboratorPresence {
  id: number;
  name: string;
  role: string;
  status: PresenceStatus;
  context?: string;
  preferredChannel: PreferredChannel;
}

export function PresenceDock({ hidden = false }: { hidden?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [presenceList, setPresenceList] = useState<CollaboratorPresence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const sendHeartbeat = async () => {
      try {
        await fetch('/api/nexus/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ONLINE' }),
        });
      } catch (err) {
        console.warn('Presence heartbeat failed', err);
      }
    };

    const fetchPresence = async () => {
      try {
        const res = await fetch('/api/nexus/presence');
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.presence) {
            setPresenceList(data.presence.map((p: any) => ({
              id: p.id,
              name: p.name || p.email?.split('@')[0] || 'Unknown',
              role: p.role,
              status: p.status,
              context: p.context,
              preferredChannel: p.preferredChannel
            })));
          }
        }
      } catch (err) {
        console.error('Failed to fetch presence', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    // Register presence on this device, then sync the roster.
    const tick = async () => {
      await sendHeartbeat();
      await fetchPresence();
    };

    tick();
    // Poll and refresh heartbeat every 30 seconds
    const interval = setInterval(tick, 30000);

    const onUnload = () => {
      // Best-effort offline on tab/window close
      const payload = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'OFFLINE' }),
        keepalive: true,
      };
      try {
        fetch('/api/nexus/presence', payload);
      } catch (_err) { /* best-effort */ }
    };
    window.addEventListener('beforeunload', onUnload);

    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, []);

  const getStatusColor = (status: PresenceStatus) => {
    switch (status) {
      case 'ONLINE': return 'bg-green-500';
      case 'DO_NOT_DISTURB': return 'bg-red-500';
      case 'IN_MEETING': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  // Derived categorized groups
  const online = presenceList.filter(p => p.status === 'ONLINE' || p.status === 'IN_MEETING');
  const dnd = presenceList.filter(p => p.status === 'DO_NOT_DISTURB');
  const offline = presenceList.filter(p => p.status === 'OFFLINE');

  const renderPresenceItem = (p: CollaboratorPresence) => (
    <div key={p.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-white/70 font-medium text-xs">
          {p.name.charAt(0)}
        </div>
        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${getStatusColor(p.status)}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{p.name}</p>
        <p className="text-xs text-white/50 truncate">
          {p.context ? p.context : (p.status === 'ONLINE' ? 'Disponible' : p.status === 'IN_MEETING' ? 'En llamada' : 'Ocupado')}
        </p>
      </div>
      <div className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded text-white/70">
        {p.preferredChannel === 'TELEGRAM' ? 'TG' : 'NX'}
      </div>
    </div>
  );

  const MAX_VISIBLE = 5;
  const visiblePresence = presenceList.slice(0, MAX_VISIBLE);
  const overflowCount = Math.max(0, presenceList.length - MAX_VISIBLE);

  if (!isLoading && presenceList.length === 0) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 transition-opacity duration-300 ${hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 mb-2 w-72 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
          >
            <div className="p-3 border-b border-white/10 flex items-center justify-between bg-black/20">
              <h3 className="text-sm font-semibold text-white">Nexus Roster</h3>
              <span className="text-xs text-white/50">{online.length} en línea</span>
            </div>
            <div className="p-2 max-h-72 overflow-y-auto space-y-3 custom-scrollbar">
              
              {online.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-green-500/80 px-2 mb-1 tracking-wider">Activos</h4>
                  {online.map(renderPresenceItem)}
                </div>
              )}

              {dnd.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-red-500/80 px-2 mb-1 tracking-wider">No Molestar</h4>
                  {dnd.map(renderPresenceItem)}
                </div>
              )}

              {offline.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-gray-500/80 px-2 mb-1 tracking-wider">Desconectados</h4>
                  {offline.map(renderPresenceItem)}
                </div>
              )}

              {presenceList.length === 0 && (
                <div className="p-4 text-center text-xs text-white/50">No hay colaboradores registrados.</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 p-2 bg-[#1A1A24]/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50">
        
        {visiblePresence.map(p => (
          <div key={p.id} className="relative group flex items-center justify-center">
            <div 
              className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-white/10 flex items-center justify-center text-white/70 font-medium text-sm transition-all duration-300 hover:scale-110 hover:-translate-y-2 cursor-pointer hover:bg-zinc-700 hover:border-white/20"
              onClick={() => setIsOpen(!isOpen)}
            >
              {p.name.charAt(0).toUpperCase()}
            </div>
            
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-[2px] border-[#1A1A24] ${getStatusColor(p.status)}`} />
            
            {/* Tooltip */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex flex-col items-center">
              <div className="bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap border border-white/10 flex flex-col items-center">
                <span className="font-semibold">{p.name}</span>
                <span className="text-white/60">{p.context || (p.status === 'ONLINE' ? 'Disponible' : p.status)}</span>
              </div>
              <div className="w-2 h-2 bg-black/90 border-r border-b border-white/10 rotate-45 -mt-1.5" />
            </div>
          </div>
        ))}

        {overflowCount > 0 && (
          <div 
            onClick={() => setIsOpen(!isOpen)}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 font-medium text-xs transition-all duration-300 hover:scale-110 hover:-translate-y-2 cursor-pointer hover:bg-white/10 hover:text-white"
          >
            +{overflowCount}
          </div>
        )}

        {presenceList.length === 0 && isLoading && (
          <div className="px-4 py-2 text-xs text-white/50 font-mono flex items-center justify-center">
            Scanning presence...
          </div>
        )}
      </div>
    </div>
  );
}
