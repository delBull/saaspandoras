'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, X, Settings, ArrowRight, BrainCircuit, Globe, BookOpen, ShieldCheck, Zap } from 'lucide-react';
import { SECTIONS, NexusSection, NexusLink } from './types';
import { useRouter } from 'next/navigation';
import type { NexusAuthContext } from '@/lib/nexus/nexus-rbac';

interface NexusCommandPaletteProps {
  auth: NexusAuthContext;
  onOpenSettings: () => void;
  onOpenHermes?: (initialQuery?: string) => void;
}

export function NexusCommandPalette({ auth, onOpenSettings, onOpenHermes }: NexusCommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const hasCap = (cap?: string | string[]) => {
    if (!cap) return true;
    const perms = (auth.permissions ?? {}) as unknown as Record<string, boolean | undefined>;
    return (Array.isArray(cap) ? cap : [cap]).some((c) => Boolean(perms[c]));
  };

  const filteredSections = SECTIONS.map(section => ({
    ...section,
    links: section.links.filter(link => 
      (link.label.toLowerCase().includes(query.toLowerCase()) || 
       (link.note && link.note.toLowerCase().includes(query.toLowerCase()))) && 
      hasCap(link.cap) &&
      (!link.superAdminOnly || auth.role === 'SUPER_ADMIN')
    )
  })).filter(section => section.links.length > 0 && hasCap(section.cap));

  // Determine Intents based on Query
  const isHermesIntent = query.length > 2 && !filteredSections.some(s => s.links.some(l => l.label.toLowerCase() === query.toLowerCase()));
  const q = query.toLowerCase();
  
  const showUnderstand = isHermesIntent && (q.includes('what') || q.includes('qué') || q.includes('explain') || q.includes('explica') || q.includes('summarize') || q.includes('resumen'));
  const showPrepare = isHermesIntent && (q.includes('prepare') || q.includes('prepara') || q.includes('draft') || q.includes('redacta') || q.includes('create') || q.includes('crea'));
  const showExecute = isHermesIntent && (q.includes('approve') || q.includes('aprueba') || q.includes('run') || q.includes('ejecuta') || q.includes('send') || q.includes('envía'));
  const showSearch = isHermesIntent && !showUnderstand && !showPrepare && !showExecute;

  const handleSelect = (href: string, external?: boolean) => {
    setIsOpen(false);
    if (external) {
      window.open(href, '_blank');
    } else {
      router.push(href);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-[101] bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
          >
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <Search className="w-5 h-5 text-white/50" />
              <input
                type="text"
                autoFocus
                placeholder="Busca comandos, vistas, operaciones... (Ej: deals, treasury)"
                className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder:text-white/30"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="flex items-center gap-2 text-xs text-white/30 font-medium bg-white/5 px-2 py-1 rounded">
                <Command className="w-3 h-3" />
                <span>K</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Special Commands */}
              {query === '' || 'settings'.includes(query.toLowerCase()) || 'logout'.includes(query.toLowerCase()) || 'salir'.includes(query.toLowerCase()) ? (
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-white/40 mb-2">Sistema</h4>
                  
                  {/* Settings */}
                  {(query === '' || 'settings'.includes(query.toLowerCase()) || 'config'.includes(query.toLowerCase())) && (
                    <div
                      onClick={() => { setIsOpen(false); onOpenSettings(); }}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/10"
                    >
                      <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-white/70">
                        <Settings className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Configuración (Settings)</p>
                        <p className="text-xs text-white/50">Gestionar perfiles, roles y preferencias integradas.</p>
                      </div>
                    </div>
                  )}

                  {/* Logout */}
                  {(query === '' || 'logout'.includes(query.toLowerCase()) || 'salir'.includes(query.toLowerCase())) && (
                    <div
                      onClick={() => {
                        setIsOpen(false);
                        localStorage.removeItem("pandoras_nexus_token");
                        document.cookie = "pandoras_nexus_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
                        window.location.href = '/';
                      }}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/10"
                    >
                      <div className="w-10 h-10 rounded-lg bg-red-900/20 border border-red-500/20 flex items-center justify-center text-red-500">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-500">Cerrar Sesión</p>
                        <p className="text-xs text-red-500/50">Salir de Nexus Command Center.</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Hermes Intents (Understand, Prepare, Execute, Search) */}
              {query && isHermesIntent && (
                <div className="space-y-4 mb-4">
                  
                  {showUnderstand && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase font-bold tracking-widest text-indigo-400/60 mb-2 flex items-center gap-1.5"><BrainCircuit className="w-3 h-3" /> Understand</h4>
                      <div 
                        onClick={() => { setIsOpen(false); onOpenHermes?.(query); }}
                        className="flex items-center justify-between p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 cursor-pointer hover:bg-indigo-500/20 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <BrainCircuit className="w-5 h-5 text-indigo-400" />
                          <div>
                            <p className="text-sm font-medium text-indigo-300">Pedir a Hermes que explique o resuma: "{query}"</p>
                            <p className="text-xs text-indigo-400/60">Abrirá el panel cognitivo de Hermes.</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-indigo-400/50" />
                      </div>
                    </div>
                  )}

                  {showPrepare && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase font-bold tracking-widest text-amber-400/60 mb-2 flex items-center gap-1.5"><BookOpen className="w-3 h-3" /> Prepare</h4>
                      <div 
                        onClick={() => { setIsOpen(false); onOpenHermes?.(query); }}
                        className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 cursor-pointer hover:bg-amber-500/20 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-5 h-5 text-amber-400" />
                          <div>
                            <p className="text-sm font-medium text-amber-300">Preparar propuesta para: "{query}"</p>
                            <p className="text-xs text-amber-400/60">Genera un draft en Deal Room o Tareas.</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-amber-400/50" />
                      </div>
                    </div>
                  )}

                  {showExecute && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase font-bold tracking-widest text-red-400/60 mb-2 flex items-center gap-1.5"><Zap className="w-3 h-3" /> Execute</h4>
                      <div 
                        onClick={() => { setIsOpen(false); onOpenHermes?.(query); }}
                        className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20 cursor-pointer hover:bg-red-500/20 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="w-5 h-5 text-red-400" />
                          <div>
                            <p className="text-sm font-medium text-red-300">Solicitar ejecución: "{query}"</p>
                            <p className="text-xs text-red-400/60">Requerirá validación de Governance y Políticas.</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-red-400/50" />
                      </div>
                    </div>
                  )}

                  {showSearch && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase font-bold tracking-widest text-emerald-400/60 mb-2 flex items-center gap-1.5"><Search className="w-3 h-3" /> Search</h4>
                      <div 
                        onClick={() => { setIsOpen(false); onOpenHermes?.(query); }}
                        className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-emerald-400" />
                          <div>
                            <p className="text-sm font-medium text-emerald-300">Buscar globalmente: "{query}"</p>
                            <p className="text-xs text-emerald-400/60">Busca en deals, orgs, tasks y documentos.</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-emerald-400/50" />
                      </div>
                    </div>
                  )}
                  
                </div>
              )}

              {/* Navigation Sections */}
              {!isHermesIntent && filteredSections.length > 0 && (
                <h4 className="text-[10px] uppercase font-bold tracking-widest text-white/30 mb-2 flex items-center gap-1.5"><Globe className="w-3 h-3" /> Navigate</h4>
              )}
              {!isHermesIntent && filteredSections.map(section => (
                <div key={section.id} className="space-y-2">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-white/40 mb-2 mt-4">{section.title}</h4>
                  {section.links.map((link, idx) => {
                    const Icon = section.icon;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleSelect(link.href, link.external)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/10"
                      >
                         <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${section.bgAccent} ${section.border} ${section.text}`}>
                           <Icon className="w-5 h-5" />
                         </div>
                         <div className="flex-1">
                           <p className="text-sm font-medium text-white flex items-center gap-2">
                             {link.label}
                             {link.external && <span className="text-[10px] bg-white/10 text-white/60 px-1.5 py-0.5 rounded">Externo</span>}
                           </p>
                           {link.note && <p className="text-xs text-white/50">{link.note}</p>}
                         </div>
                      </div>
                    )
                  })}
                </div>
              ))}

              {filteredSections.length === 0 && !('settings'.includes(query.toLowerCase())) && (
                <div className="py-12 text-center text-white/50 text-sm">
                  No se encontraron comandos o careces de permisos para tu búsqueda.
                </div>
              )}
            </div>
            
            <div className="p-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-white/40">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-sans">↑</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-sans">↓</kbd> Navegar
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-sans">↵</kbd> Seleccionar
                </span>
              </div>
              <span>Pandoras Nexus Shell</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
