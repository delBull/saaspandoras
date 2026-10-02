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

export function PresenceDock() {
  const [isOpen, setIsOpen] = useState(false);
  const [presenceList, setPresenceList] = useState<CollaboratorPresence[]>([]);

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

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-80 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Nexus Team</h3>
              <span className="text-xs text-white/50">{online.length} en línea</span>
            </div>
            <div className="p-2 max-h-96 overflow-y-auto space-y-4">
              
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
                <div className="p-4 text-center text-sm text-white/50">No hay colaboradores registrados.</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}
