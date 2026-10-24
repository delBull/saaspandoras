'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  Users, 
  X, 
  Send, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Briefcase, 
  PlusCircle, 
  ExternalLink,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export type PresenceStatus = 'ONLINE' | 'OFFLINE' | 'DO_NOT_DISTURB' | 'IN_MEETING';
export type PreferredChannel = 'NEXUS_CHAT' | 'TELEGRAM' | 'WHATSAPP' | 'EMAIL';

export interface CollaboratorPresence {
  id: number;
  collaboratorId?: number;
  name: string;
  email: string;
  role: string;
  status: PresenceStatus;
  context?: string;
  preferredChannel: PreferredChannel;
  whatsappPhone?: string | null;
  telegramUsername?: string | null;
  image?: string | null;
}

interface RawPresenceItem {
  id: number;
  collaboratorId?: number;
  name?: string;
  email?: string;
  role?: string;
  status?: PresenceStatus;
  context?: string;
  preferredChannel?: PreferredChannel;
  whatsappPhone?: string | null;
  telegramUsername?: string | null;
  image?: string | null;
}

interface DealRoomItem {
  id: string | number;
  publicId?: string;
  title?: string;
  myRole?: string;
  status?: string;
}

export function PresenceDock({ hidden = false }: { hidden?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [presenceList, setPresenceList] = useState<CollaboratorPresence[]>([]);
  const [selectedCollaborator, setSelectedCollaborator] = useState<CollaboratorPresence | null>(null);

  // Quick task creation state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Collaborator deals state
  const [deals, setDeals] = useState<DealRoomItem[]>([]);
  const [isLoadingDeals, setIsLoadingDeals] = useState(false);

  // Modal active tab: 'CHAT' | 'OVERVIEW'
  const [modalTab, setModalTab] = useState<'CHAT' | 'OVERVIEW'>('CHAT');

  // Internal Chat State
  interface ChatMessage {
    id: string;
    senderEmail: string;
    senderName: string;
    receiverEmail: string;
    content: string;
    createdAt: string;
  }
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [myEmail, setMyEmail] = useState<string>('');
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  const rosterRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Poll / fetch internal direct chat messages when collaborator is selected
  useEffect(() => {
    if (!selectedCollaborator?.email) {
      setChatMessages([]);
      return;
    }

    let isMounted = true;
    setIsLoadingChat(true);

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/nexus/chat?targetEmail=${encodeURIComponent(selectedCollaborator.email)}`);
        if (res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            ok?: boolean;
            messages?: ChatMessage[];
            myEmail?: string;
          };
          if (isMounted) {
            if (data.myEmail) setMyEmail(data.myEmail);
            if (Array.isArray(data.messages)) {
              setChatMessages(data.messages);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load direct messages', err);
      } finally {
        if (isMounted) setIsLoadingChat(false);
      }
    };

    void fetchMessages();

    // Auto-refresh messages every 6 seconds while the modal is open
    const chatInterval = setInterval(() => {
      void fetchMessages();
    }, 6000);

    return () => {
      isMounted = false;
      clearInterval(chatInterval);
    };
  }, [selectedCollaborator]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (modalTab === 'CHAT' && chatMessages.length > 0) {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, modalTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedCollaborator || isSendingMessage) return;

    const textToSend = chatInput.trim();
    setIsSendingMessage(true);

    try {
      const res = await fetch('/api/nexus/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverEmail: selectedCollaborator.email,
          receiverName: selectedCollaborator.name,
          content: textToSend,
        }),
      });

      if (res.ok) {
        setChatInput('');
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: ChatMessage };
        if (data.message) {
          setChatMessages((prev) => [...prev, data.message!]);
        }
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string; reason?: string };
        toast.error(err.error ?? 'Error al enviar mensaje');
      }
    } catch {
      toast.error('Error de conexión al enviar mensaje');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Heartbeat & presence polling
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
          const data = (await res.json().catch(() => ({}))) as { presence?: RawPresenceItem[] };
          if (mounted && Array.isArray(data.presence)) {
            setPresenceList(data.presence.map((p: RawPresenceItem) => ({
              id: p.id,
              collaboratorId: p.collaboratorId,
              name: p.name ?? p.email?.split('@')[0] ?? 'Unknown',
              email: p.email ?? '',
              role: p.role ?? 'COLLABORATOR',
              status: p.status ?? 'ONLINE',
              context: p.context,
              preferredChannel: p.preferredChannel ?? 'NEXUS_CHAT',
              whatsappPhone: p.whatsappPhone ?? null,
              telegramUsername: p.telegramUsername ?? null,
              image: p.image ?? null,
            })));
          }
        }
      } catch (err) {
        console.error('Failed to fetch presence', err);
      }
    };

    const tick = async () => {
      await sendHeartbeat();
      await fetchPresence();
    };

    void tick();
    const interval = setInterval(() => {
      void tick();
    }, 30000);

    const onAvatarUpdated = () => {
      void fetchPresence();
    };
    window.addEventListener('nexus-avatar-updated', onAvatarUpdated);

    const onUnload = () => {
      const payload = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'OFFLINE' }),
        keepalive: true,
      };
      try {
        void fetch('/api/nexus/presence', payload);
      } catch (_err) { /* best-effort */ }
    };
    window.addEventListener('beforeunload', onUnload);

    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener('nexus-avatar-updated', onAvatarUpdated);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, []);

  // Keyboard navigation: Close roster or modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedCollaborator) {
          setSelectedCollaborator(null);
        } else if (isOpen) {
          setIsOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedCollaborator]);

  // Click outside listener to dismiss Roster
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && rosterRef.current && !rosterRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Fetch deals when a collaborator is selected
  useEffect(() => {
    if (!selectedCollaborator?.email) {
      setDeals([]);
      return;
    }

    let isMounted = true;
    setIsLoadingDeals(true);

    fetch(`/api/nexus/collaborators/deals?email=${encodeURIComponent(selectedCollaborator.email)}`)
      .then(res => res.json())
      .then((data: unknown) => {
        const responseData = data as { ok?: boolean; rooms?: DealRoomItem[] } | null;
        if (isMounted && responseData?.ok && Array.isArray(responseData.rooms)) {
          setDeals(responseData.rooms);
        } else if (isMounted) {
          setDeals([]);
        }
      })
      .catch(() => {
        if (isMounted) setDeals([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingDeals(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCollaborator]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !selectedCollaborator) return;

    setIsSubmittingTask(true);
    try {
      const res = await fetch('/api/nexus/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: taskTitle.trim(),
          priority: taskPriority,
          assigneeCollaboratorId: selectedCollaborator.collaboratorId ?? selectedCollaborator.id,
          details: `Asignado directamente desde Nexus Presence Roster a ${selectedCollaborator.name}`,
        }),
      });

      if (res.ok) {
        toast.success(`Tarea asignada a ${selectedCollaborator.name}`);
        setTaskTitle('');
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(`Error: ${err.error ?? 'No se pudo crear la tarea'}`);
      }
    } catch {
      toast.error('Error de conexión al asignar tarea');
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const getStatusColor = (status: PresenceStatus) => {
    switch (status) {
      case 'ONLINE': return 'bg-emerald-500';
      case 'DO_NOT_DISTURB': return 'bg-rose-500';
      case 'IN_MEETING': return 'bg-amber-500';
      default: return 'bg-zinc-500';
    }
  };

  const getStatusText = (status: PresenceStatus) => {
    switch (status) {
      case 'ONLINE': return 'Disponible';
      case 'DO_NOT_DISTURB': return 'No molestar';
      case 'IN_MEETING': return 'En llamada';
      default: return 'Desconectado';
    }
  };

  const online = presenceList.filter(p => p.status === 'ONLINE' || p.status === 'IN_MEETING');
  const dnd = presenceList.filter(p => p.status === 'DO_NOT_DISTURB');
  const offline = presenceList.filter(p => p.status === 'OFFLINE');

  const handleSelectCollaborator = (collab: CollaboratorPresence) => {
    setIsOpen(false);
    setSelectedCollaborator(collab);
  };

  const renderAvatar = (p: CollaboratorPresence, sizeClass = "w-8 h-8 text-xs") => {
    if (p.image) {
      return (
        <div className={`relative ${sizeClass} rounded-full overflow-hidden bg-zinc-800 border border-white/10 shrink-0`}>
          <Image
            src={p.image}
            alt={p.name}
            fill
            sizes="48px"
            className="object-cover"
          />
        </div>
      );
    }
    return (
      <div className={`relative ${sizeClass} rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/10 flex items-center justify-center text-white/90 font-bold shrink-0`}>
        {p.name.charAt(0).toUpperCase()}
      </div>
    );
  };

  const renderPresenceItem = (p: CollaboratorPresence) => (
    <button
      type="button"
      key={p.id} 
      onClick={() => handleSelectCollaborator(p)}
      className="w-full text-left group flex items-center gap-3 p-2 hover:bg-white/10 rounded-xl transition-all cursor-pointer border border-transparent hover:border-white/10 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
    >
      <div className="relative shrink-0">
        {renderAvatar(p, "w-8 h-8 text-xs")}
        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#121218] ${getStatusColor(p.status)}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white truncate group-hover:text-amber-400 transition-colors">{p.name}</p>
        <p className="text-[11px] text-white/50 truncate">
          {p.context ? p.context : getStatusText(p.status)}
        </p>
      </div>
      <div className="text-[10px] font-mono px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-white/60">
        {p.preferredChannel === 'TELEGRAM' ? 'TG' : p.preferredChannel === 'WHATSAPP' ? 'WA' : 'NX'}
      </div>
    </button>
  );

  return (
    <>
      {/* ── COLLABORATOR ACTION & DIRECT COMMUNICATION MODAL ── */}
      <AnimatePresence>
        {selectedCollaborator && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-[#0F0F15] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-white/10 flex items-start justify-between bg-black/40">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    {renderAvatar(selectedCollaborator, "w-14 h-14 text-lg")}
                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#0F0F15] ${getStatusColor(selectedCollaborator.status)}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{selectedCollaborator.name}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 uppercase">
                        {selectedCollaborator.role}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 font-mono mt-0.5">{selectedCollaborator.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(selectedCollaborator.status)}`} />
                      <span className="text-xs text-zinc-300">
                        {selectedCollaborator.context ?? getStatusText(selectedCollaborator.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedCollaborator(null)}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  title="Cerrar (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Tabs Header */}
              <div className="flex border-b border-white/10 bg-black/20 px-5 pt-3 gap-6">
                <button
                  type="button"
                  onClick={() => setModalTab('CHAT')}
                  className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                    modalTab === 'CHAT'
                      ? 'border-amber-400 text-amber-400'
                      : 'border-transparent text-white/50 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat Interno</span>
                  {chatMessages.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 font-mono">
                      {chatMessages.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setModalTab('OVERVIEW')}
                  className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                    modalTab === 'OVERVIEW'
                      ? 'border-amber-400 text-amber-400'
                      : 'border-transparent text-white/50 hover:text-white'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Canales &amp; Tareas</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto custom-scrollbar flex-1 flex flex-col min-h-[380px] max-h-[460px]">
                {modalTab === 'CHAT' ? (
                  /* ── INTERNAL DIRECT CHAT TAB ── */
                  <div className="flex flex-col flex-1 h-full justify-between">
                    {/* Chat Messages Thread */}
                    <div className="flex-1 space-y-3 overflow-y-auto pr-1 mb-4 custom-scrollbar max-h-[300px]">
                      {isLoadingChat && chatMessages.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-white/40 text-xs gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                          <span>Conectando con el canal interno...</span>
                        </div>
                      ) : chatMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-center p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2.5">
                            <MessageSquare className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-semibold text-white">Canal directo activo con {selectedCollaborator.name}</p>
                          <p className="text-[11px] text-white/40 max-w-xs mt-1">
                            Envía un mensaje rápido, confirmación o actualización de operaciones sin salir de la plataforma.
                          </p>
                        </div>
                      ) : (
                        chatMessages.map((msg) => {
                          const isMe = msg.senderEmail.toLowerCase() === myEmail.toLowerCase();
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                            >
                              <div className="flex items-center gap-1.5 mb-1 px-1">
                                <span className="text-[10px] font-medium text-white/40">
                                  {isMe ? 'Tú' : msg.senderName}
                                </span>
                                <span className="text-[9px] text-white/30 font-mono">
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div
                                className={`px-3.5 py-2 rounded-2xl text-xs max-w-[85%] break-words ${
                                  isMe
                                    ? 'bg-amber-500 text-black font-medium rounded-tr-xs shadow-md'
                                    : 'bg-white/10 text-white border border-white/10 rounded-tl-xs'
                                }`}
                              >
                                {msg.content}
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={chatMessagesEndRef} />
                    </div>

                    {/* Chat Quick Input Form */}
                    <form onSubmit={(e) => void handleSendMessage(e)} className="pt-2 border-t border-white/10">
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder={`Escribe un mensaje directo a ${selectedCollaborator.name}...`}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50 transition-colors"
                        />
                        <button
                          type="submit"
                          disabled={isSendingMessage || !chatInput.trim()}
                          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                          title="Enviar mensaje rápido"
                        >
                          {isSendingMessage ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>Enviar</span>
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  /* ── EXTERNAL CHANNELS & TASKS TAB ── */
                  <div className="space-y-6">
                    {/* 1. Direct Contact Channels */}
                    <div>
                      <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-white/60 mb-2.5 flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-sky-400" />
                        Canales Externos
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {/* Telegram */}
                        {selectedCollaborator.telegramUsername ? (
                          <a
                            href={`https://t.me/${selectedCollaborator.telegramUsername.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 text-xs font-semibold transition-all hover:scale-[1.02]"
                          >
                            <Send className="w-4 h-4" />
                            <span>Telegram</span>
                          </a>
                        ) : (
                          <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5 text-white/30 text-xs cursor-not-allowed">
                            <Send className="w-4 h-4" />
                            <span>Sin Telegram</span>
                          </div>
                        )}

                        {/* WhatsApp */}
                        {selectedCollaborator.whatsappPhone ? (
                          <a
                            href={`https://wa.me/${selectedCollaborator.whatsappPhone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold transition-all hover:scale-[1.02]"
                          >
                            <Phone className="w-4 h-4" />
                            <span>WhatsApp</span>
                          </a>
                        ) : (
                          <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5 text-white/30 text-xs cursor-not-allowed">
                            <Phone className="w-4 h-4" />
                            <span>Sin WhatsApp</span>
                          </div>
                        )}

                        {/* Email */}
                        <a
                          href={`mailto:${selectedCollaborator.email}?subject=Nexus%20Follow-up`}
                          className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold transition-all hover:scale-[1.02]"
                        >
                          <Mail className="w-4 h-4" />
                          <span>Email</span>
                        </a>
                      </div>
                    </div>

                    {/* 2. Quick Task Assignment */}
                    <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                      <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-white/60 mb-2 flex items-center gap-1.5">
                        <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                        Asignar Tarea Operativa
                      </h4>
                      <form onSubmit={(e) => void handleCreateTask(e)} className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                            placeholder={`Ej: Revisar contrato o llamar a cliente...`}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50 transition-colors"
                          />
                          <select
                            value={taskPriority}
                            onChange={(e) => setTaskPriority(e.target.value as 'NORMAL' | 'HIGH' | 'URGENT')}
                            className="bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white/80 focus:outline-none focus:border-amber-400/50"
                          >
                            <option value="NORMAL">Normal</option>
                            <option value="HIGH">Alta</option>
                            <option value="URGENT">Urgente</option>
                          </select>
                          <button
                            type="submit"
                            disabled={isSubmittingTask || !taskTitle.trim()}
                            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                          >
                            {isSubmittingTask ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            <span>Asignar</span>
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* 3. Associated Deals & Rooms */}
                    <div>
                      <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-white/60 mb-2.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                          Deal Rooms &amp; Contratos Vinculados
                        </span>
                        <span className="text-[10px] text-white/40">{deals.length} salas</span>
                      </h4>

                      {isLoadingDeals ? (
                        <div className="p-4 text-center text-xs text-white/40 flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                          <span>Consultando Deal Rooms...</span>
                        </div>
                      ) : deals.length === 0 ? (
                        <div className="p-4 text-center text-xs text-white/40 bg-white/[0.02] border border-white/5 rounded-xl">
                          No hay salas de negociación activas vinculadas a este colaborador.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                          {deals.map((room) => (
                            <a
                              key={room.id}
                              href={`/nexus/rooms/${room.publicId ?? String(room.id)}`}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 transition-all group"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                                  {room.title ?? `Deal Room #${room.id}`}
                                </p>
                                <p className="text-[10px] text-white/40 truncate">
                                  Rol: {room.myRole} • Estado: {room.status}
                                </p>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-white/30 group-hover:text-white transition-colors shrink-0 ml-2" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MINIMAL PRESENCE DOCK & EXPANDABLE ROSTER ── */}
      <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 transition-opacity duration-300 ${hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        
        {/* Roster Popup */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={rosterRef}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-14 left-1/2 -translate-x-1/2 mb-2 w-80 bg-[#101018]/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl"
            >
              <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-xs font-bold text-white tracking-wide uppercase font-mono">Nexus Roster</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-emerald-400 font-mono font-medium">{online.length} en línea</span>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                    title="Cerrar (Esc)"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-2.5 max-h-80 overflow-y-auto space-y-3 custom-scrollbar">
                {online.length > 0 && (
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-emerald-400/90 px-2 mb-1 tracking-wider font-mono">
                      Activos ({online.length})
                    </h4>
                    <div className="space-y-1">
                      {online.map(renderPresenceItem)}
                    </div>
                  </div>
                )}

                {dnd.length > 0 && (
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-rose-400/90 px-2 mb-1 tracking-wider font-mono">
                      No Molestar ({dnd.length})
                    </h4>
                    <div className="space-y-1">
                      {dnd.map(renderPresenceItem)}
                    </div>
                  </div>
                )}

                {offline.length > 0 && (
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-zinc-500 px-2 mb-1 tracking-wider font-mono">
                      Desconectados ({offline.length})
                    </h4>
                    <div className="space-y-1">
                      {offline.map(renderPresenceItem)}
                    </div>
                  </div>
                )}

                {presenceList.length === 0 && (
                  <div className="p-6 text-center text-xs text-white/40 font-mono">
                    No hay colaboradores registrados.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Minimal Trigger Capsule / Dock Bar */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2.5 px-3.5 py-2 bg-[#12121A]/90 hover:bg-[#1A1A24] border border-white/10 hover:border-amber-500/40 rounded-full shadow-2xl shadow-black/80 backdrop-blur-2xl transition-all duration-300 hover:scale-105 cursor-pointer ${isOpen ? 'ring-2 ring-amber-500/40 border-amber-500/50' : ''}`}
          title="Abrir Nexus Roster de Colaboradores"
        >
          {/* Subtle 3 dots / menu bars indicator */}
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
          </div>

          <div className="w-px h-3.5 bg-white/10 mx-0.5" />

          {/* Mini Avatars preview in dock */}
          <div className="flex items-center -space-x-1.5">
            {online.slice(0, 3).map((p) => (
              <div key={p.id} className="relative ring-2 ring-[#12121A] rounded-full">
                {renderAvatar(p, "w-5 h-5 text-[9px]")}
              </div>
            ))}
            {online.length === 0 && (
              <Users className="w-4 h-4 text-white/50" />
            )}
          </div>

          {/* Online status text */}
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-white/80 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{online.length > 0 ? `${online.length} en línea` : 'Roster'}</span>
          </div>
        </button>
      </div>
    </>
  );
}
