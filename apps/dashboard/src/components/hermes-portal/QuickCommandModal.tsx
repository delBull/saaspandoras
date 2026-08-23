'use client';

/**
 * QuickCommandModal — Hermes OS Executive Command Palette (⌘K)
 * 
 * Global command palette for instant navigation, quick tests,
 * and system actions across the Hermes Operating Console.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  Fingerprint,
  BookOpen,
  Plug,
  MessageSquare,
  Activity,
  Shield,
  GitBranch,
  Settings,
  Boxes,
  Send,
  MessageCircle,
  Sparkles,
  LogOut,
  X,
  ExternalLink,
} from 'lucide-react';

interface QuickCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationSlug: string;
  organizationName: string;
}

interface CommandItem {
  id: string;
  title: string;
  category: 'Navegación' | 'Acciones Rápidas' | 'Conexiones' | 'Sistema';
  icon: any;
  shortcut?: string;
  action: () => void;
  badge?: string;
}

export function QuickCommandModal({
  isOpen,
  onClose,
  organizationSlug,
  organizationName,
}: QuickCommandModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const commands: CommandItem[] = [
    // ── NAVEGACIÓN ──
    {
      id: 'nav-overview',
      title: 'Ir a Overview & Hermes Intelligence',
      category: 'Navegación',
      icon: LayoutDashboard,
      shortcut: 'G O',
      action: () => router.push(`/portal/${organizationSlug}`),
    },
    {
      id: 'nav-knowledge',
      title: 'Ir a Bóveda de Conocimiento (KNOW)',
      category: 'Navegación',
      icon: BookOpen,
      shortcut: 'G K',
      action: () => router.push(`/portal/${organizationSlug}/knowledge`),
      badge: '21 Hechos',
    },
    {
      id: 'nav-channels',
      title: 'Ir a Canales & Escalación Humana',
      category: 'Navegación',
      icon: Plug,
      shortcut: 'G C',
      action: () => router.push(`/portal/${organizationSlug}/channels`),
    },
    {
      id: 'nav-journeys',
      title: 'Ir a Journeys & Embudos de Prospección',
      category: 'Navegación',
      icon: GitBranch,
      shortcut: 'G J',
      action: () => router.push(`/portal/${organizationSlug}/journeys`),
    },
    {
      id: 'nav-conversations',
      title: 'Ir a Conversaciones en Vivo',
      category: 'Navegación',
      icon: MessageSquare,
      shortcut: 'G M',
      action: () => router.push(`/portal/${organizationSlug}/conversations`),
    },
    {
      id: 'nav-identity',
      title: 'Ir a Identidad y Tono del Asesor',
      category: 'Navegación',
      icon: Fingerprint,
      action: () => router.push(`/portal/${organizationSlug}/identity`),
    },
    {
      id: 'nav-policies',
      title: 'Ir a Políticas Institucionales',
      category: 'Navegación',
      icon: Shield,
      action: () => router.push(`/portal/${organizationSlug}/policies`),
    },
    {
      id: 'nav-activity',
      title: 'Ir a Registro de Actividad y Logs',
      category: 'Navegación',
      icon: Activity,
      action: () => router.push(`/portal/${organizationSlug}/activity`),
    },
    {
      id: 'nav-addons',
      title: 'Ir a Catálogo de Add-Ons',
      category: 'Navegación',
      icon: Boxes,
      action: () => router.push(`/portal/${organizationSlug}/addons`),
    },
    {
      id: 'nav-settings',
      title: 'Ir a Ajustes del Sistema',
      category: 'Navegación',
      icon: Settings,
      shortcut: 'G S',
      action: () => router.push(`/portal/${organizationSlug}/settings`),
    },

    // ── ACCIONES RÁPIDAS & TESTS ──
    {
      id: 'action-test-telegram',
      title: 'Probar Conexión Telegram Bot (@snaraiassit_bot)',
      category: 'Conexiones',
      icon: Send,
      action: () => router.push(`/portal/${organizationSlug}/channels`),
      badge: 'Telegram',
    },
    {
      id: 'action-test-whatsapp',
      title: 'Probar Conexión WhatsApp Business Cloud',
      category: 'Conexiones',
      icon: MessageCircle,
      action: () => router.push(`/portal/${organizationSlug}/channels`),
      badge: 'WABA',
    },
    {
      id: 'action-open-telegram-bot',
      title: 'Abrir Bot Oficial de S\'Narai en Telegram',
      category: 'Acciones Rápidas',
      icon: ExternalLink,
      action: () => window.open('https://t.me/snaraiassit_bot', '_blank'),
      badge: 'Externo',
    },
    {
      id: 'action-open-portal',
      title: 'Abrir Mi Portal S\'Narai (Experiencia Inversionista)',
      category: 'Acciones Rápidas',
      icon: Sparkles,
      action: () => window.open('https://snarai.com/portal', '_blank'),
      badge: 'Web3',
    },

    // ── SISTEMA ──
    {
      id: 'sys-signout',
      title: 'Cerrar Sesión de Operador',
      category: 'Sistema',
      icon: LogOut,
      shortcut: '⇧ ⌥ Q',
      action: () => {
        document.cookie = 'pandoras_portal_session=; Max-Age=0; path=/';
        window.location.href = '/portal/login';
      },
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    const term = query.toLowerCase().trim();
    if (!term) return true;
    return (
      cmd.title.toLowerCase().includes(term) ||
      cmd.category.toLowerCase().includes(term) ||
      (cmd.badge && cmd.badge.toLowerCase().includes(term))
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredCommands[selectedIndex];
      if (selected) {
        selected.action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-[#101018] border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-150 text-white font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08] bg-[#0A0A10]">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Escribe un comando o busca una sección (ej. marketing, channels, journeys)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-neutral-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-neutral-500 hover:text-white p-1 rounded-md"
            >
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:inline-block bg-white/[0.06] border border-white/[0.1] px-2 py-0.5 rounded text-[10px] text-neutral-400 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 text-xs">
              No se encontraron comandos que coincidan con &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-indigo-600/30 text-white border border-indigo-500/40 shadow-sm'
                      : 'text-neutral-300 hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-indigo-500 text-white' : 'bg-white/[0.05] text-neutral-400'}`}>
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate flex items-center gap-2">
                        <span>{cmd.title}</span>
                        {cmd.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono font-normal">
                            {cmd.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        {cmd.category}
                      </div>
                    </div>
                  </div>

                  {cmd.shortcut && (
                    <kbd className="hidden sm:inline-block text-[10px] text-neutral-400 font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/[0.08]">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-[#09090E] border-t border-white/[0.06] flex items-center justify-between text-[11px] text-neutral-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navegar</span>
            <span>↵ Seleccionar</span>
            <span>ESC Cerrar</span>
          </div>
          <div className="font-mono text-[10px] text-indigo-400/80">
            {organizationName} • Hermes OS
          </div>
        </div>
      </div>
    </div>
  );
}
