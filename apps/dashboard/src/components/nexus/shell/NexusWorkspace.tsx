"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ExternalLink, X } from "lucide-react";
import Link from "next/link";
import { SECTIONS, NexusSection, NexusLink } from "./types";
import type { NexusAuthContext } from "@/lib/nexus/nexus-rbac";

interface NexusWorkspaceProps {
  auth: NexusAuthContext;
  sidebarOpen: boolean;
}

export function NexusWorkspace({ auth, sidebarOpen }: NexusWorkspaceProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const hasCap = (cap?: string | string[]) => {
    if (!cap) return true;
    const perms = (auth.permissions ?? {}) as unknown as Record<string, boolean | undefined>;
    return (Array.isArray(cap) ? cap : [cap]).some((c) => Boolean(perms[c]));
  };

  const visibleSections = SECTIONS.filter((s) => hasCap(s.cap));
  const sectionLinks = (sec: NexusSection) =>
    sec.links.filter((l) => {
      if (l.superAdminOnly && auth.role !== "SUPER_ADMIN") return false;
      return hasCap(l.cap);
    });

  return (
    <main className={`flex-1 relative z-10 transition-all duration-500 p-4 md:p-6 lg:p-8 overflow-y-auto ${sidebarOpen ? "pl-12 md:pl-96" : "pl-12 md:pl-16"}`}>
      <div className="h-full w-full flex flex-col">
        <AnimatePresence>
          {!activeSection && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 auto-rows-[minmax(180px,1fr)] gap-4 md:gap-5 pb-10"
            >
              {visibleSections.map((sec, i) => {
                const linksForRole = sectionLinks(sec);
                return (
                <motion.div
                  layoutId={`card-${sec.id}`}
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  data-magnifier-target="true"
                  className={`group relative overflow-hidden rounded-3xl border ${sec.border} bg-[#0A0A0E]/90 backdrop-blur-md p-6 md:p-7 flex flex-col justify-between h-full cursor-pointer transition-all hover:scale-[1.015] hover:shadow-2xl hover:shadow-black/70 hover:border-white/25`}
                >
                  <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gradient-to-br ${sec.color} opacity-25 blur-[90px] pointer-events-none transition-opacity duration-500 group-hover:opacity-40`} />
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-14 h-1.5 rounded-full bg-white/10 group-hover:bg-white/30 transition-colors" />
                  <span className={`absolute top-4 right-5 font-mono text-xs tracking-widest ${sec.text} opacity-70`}>
                    0{i + 1}
                  </span>
                  <div className="relative pt-3 flex items-start justify-between">
                    <div className={`p-3.5 rounded-2xl ${sec.bgAccent} ring-1 ring-white/5`}>
                      <sec.icon className={`w-7 h-7 ${sec.text}`} />
                    </div>
                    <ChevronRight className={`w-5 h-5 ${sec.text} opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0`} />
                  </div>
                  <div className="relative mt-auto pt-6 space-y-2">
                    <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">{sec.title}</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{sec.description}</p>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium mt-2 rounded-full px-3 py-1 bg-white/5 border border-white/10 text-zinc-300 group-hover:text-white group-hover:border-white/20 transition-colors">
                      {linksForRole.length} módulos <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeSection && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveSection(null)}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeSection && (
            <motion.div 
              key={`drawer-${activeSection}`}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              className="fixed inset-y-0 right-0 z-50 w-full sm:w-[620px] lg:w-[720px] bg-[#07070A]/95 backdrop-blur-2xl border-l border-white/[0.08] overflow-y-auto custom-scrollbar"
            >
              {visibleSections.filter(s => s.id === activeSection).map(sec => (
                <div key={sec.id} className="relative min-h-full flex flex-col">
                  <div className={`absolute inset-0 bg-gradient-to-br ${sec.color} opacity-40 pointer-events-none`} />

                  <div className="relative z-10 p-8 md:p-10 lg:p-12 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-zinc-400">
                        Command Center <span className={`mx-2 ${sec.text}`}>/</span> {sec.title.toUpperCase()}
                      </span>
                      <button 
                        onClick={() => setActiveSection(null)}
                        className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <motion.div
                      layoutId={`card-${sec.id}`}
                      className={`relative overflow-hidden rounded-3xl border ${sec.border} bg-gradient-to-br ${sec.color} p-6 md:p-7`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl ${sec.bgAccent} ring-1 ring-white/5`}>
                          <sec.icon className={`w-9 h-9 ${sec.text}`} />
                        </div>
                        <div>
                          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">{sec.title}</h2>
                          <p className="text-zinc-300/90 mt-1 text-sm md:text-base leading-relaxed">{sec.description}</p>
                        </div>
                      </div>
                    </motion.div>

                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {sectionLinks(sec).map((link: NexusLink, idx: number) => {
                        const isExternal = link.external || link.href.startsWith("http");
                        const LinkEl = isExternal ? "a" : Link;
                        const linkProps = isExternal 
                          ? { href: link.href, target: "_blank", rel: "noopener noreferrer" }
                          : { href: link.href };
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + (idx * 0.05) }}
                          >
                            <LinkEl 
                              {...linkProps}
                              className="group flex flex-col gap-2 p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-white/15 transition-all h-full"
                            >
                              <div className="flex items-start justify-between">
                                <span className={`text-base font-semibold text-white group-hover:${sec.text} transition-colors line-clamp-1`}>
                                  {link.label}
                                </span>
                                {isExternal ? (
                                  <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 shrink-0" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 shrink-0" />
                                )}
                              </div>
                              {link.note && (
                                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                                  {link.note}
                                </p>
                              )}
                            </LinkEl>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
