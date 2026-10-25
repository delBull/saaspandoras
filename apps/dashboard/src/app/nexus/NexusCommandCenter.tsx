"use client";

import React, { useState, useEffect } from "react";
import { BrainCircuit, Compass, Boxes, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { NexusAuthContext } from "@saasfly/shared";
import { HermesFloatingGuide } from "@/components/guides/HermesFloatingGuide";
import type { EcosystemStation, EcosystemTourRole } from "@/lib/guides/ecosystem-guides.data";
import TasksPanel from "@/components/nexus/TasksPanel";
import { OperationsHubModal, type Tab } from "@/components/nexus/OperationsHubModal";
import type { NexusBroadcastItem } from "@/components/nexus/NexusCentralNotificationModal";
import { NexusCentralNotificationModal } from "@/components/nexus/NexusCentralNotificationModal";
import NexusSettingsPage from "./settings/SettingsClient";
import type { TaskItem } from "@/components/nexus/taskTypes";
import { INITIAL_TASKS } from "@/components/nexus/taskTypes";
import { useActiveWallet, useDisconnect } from "thirdweb/react";

import { NexusShell } from "@/components/nexus/shell/NexusShell";
import { UnifiedIndexModal } from "@/components/nexus/UnifiedIndexModal";
import { NexusCommandPalette } from "@/components/nexus/shell/NexusCommandPalette";
import { NexusHeader } from "@/components/nexus/shell/NexusHeader";
import { NexusWorkspace } from "@/components/nexus/shell/NexusWorkspace";
import { NexusContextBar } from "@/components/nexus/shell/NexusContextBar";
import { NexusSidebar } from "@/components/nexus/shell/NexusSidebar";
import { PresenceDock } from "@/components/nexus/presence-dock";
import { HermesAmbientDrawer } from "@/components/hermes-portal/HermesAmbientDrawer";

interface NexusCommandCenterProps {
  auth: NexusAuthContext;
  initialTour?: string;
  initialRole?: string;
  iframeToken?: string;
  token?: string;
}

export function NexusCommandCenter({ auth, initialTour, initialRole: _initialRole, iframeToken: _iframeToken, token }: NexusCommandCenterProps) {
  const activeThirdwebWallet = useActiveWallet();
  const { disconnect: disconnectWallet } = useDisconnect();

  const { role } = auth;
  const isFirstVisitParam = initialTour === "ecosystem" || initialTour === "onboarding";
  const [isTourOpen, setIsTourOpen] = useState(isFirstVisitParam);
  const [showGuideSidebar, setShowGuideSidebar] = useState<boolean | null>(null);
  const [showWelcomePanel, setShowWelcomePanel] = useState(false);
  const [isOpsModalOpen, setIsOpsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHermesAmbientOpen, setIsHermesAmbientOpen] = useState(false);
  const [isUnifiedIndexOpen, setIsUnifiedIndexOpen] = useState(false);
  const sidebarOpen = showGuideSidebar === true;
  const [opsActiveTab, setOpsActiveTab] = useState<Tab>('WORK_ENGINE');

  useEffect(() => {
    try {
      const urlToken = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("token") : null;
      const effectiveToken = urlToken ?? token;
      if (effectiveToken) {
        localStorage.setItem("pandoras_nexus_token", effectiveToken);
        document.cookie = `pandoras_nexus_token=${encodeURIComponent(effectiveToken)}; path=/; max-age=2592000; SameSite=Lax`;
      } else {
        const stored = typeof window !== "undefined" ? localStorage.getItem("pandoras_nexus_token") : null;
        if (stored && !document.cookie.includes("pandoras_nexus_token=")) {
          document.cookie = `pandoras_nexus_token=${encodeURIComponent(stored)}; path=/; max-age=2592000; SameSite=Lax`;
        }
      }
    } catch (e) {
      console.warn("[Nexus] Failed to sync token storage/cookie:", e);
    }
  }, [token]);

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    if (typeof window === "undefined") return INITIAL_TASKS;
    try {
      const stored = localStorage.getItem("pandoras_ip_tasks_30d");
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as TaskItem[];
      }
    } catch {
      // ignore parse error
    }
    return INITIAL_TASKS;
  });

  const handleToggleTask = async (taskId: string) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const nextCompleted = !targetTask.completed;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: nextCompleted } : t))
    );

    try {
      const storedToken = typeof window !== 'undefined' ? (localStorage.getItem('pandoras_nexus_token') ?? localStorage.getItem('nexus_token')) : null;
      await fetch('/api/nexus/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(storedToken ? { 'x-nexus-token': storedToken } : {}),
        },
        body: JSON.stringify({
          kind: 'task-done',
          taskId,
          status: nextCompleted ? 'DONE' : 'OPEN',
        }),
      });
    } catch (err) {
      console.warn('[Nexus] Failed to persist task toggle:', err);
    }
  };

  // Sync server tasks from db (nexus_tasks table) to keep Web and TMA unified
  useEffect(() => {
    async function syncTasksFromServer() {
      try {
        const storedToken = typeof window !== 'undefined' ? (localStorage.getItem('pandoras_nexus_token') ?? localStorage.getItem('nexus_token')) : null;
        const res = await fetch('/api/nexus/tasks', {
          headers: storedToken ? { 'x-nexus-token': storedToken } : {},
          credentials: 'include',
        });
        if (res.ok) {
          const data = (await res.json()) as { tasks?: { id: string; title: string; priority?: string; status?: string; dueDate?: string; description?: string; assigneeName?: string; assigneeEmail?: string }[] };
          if (Array.isArray(data.tasks) && data.tasks.length > 0) {
            const serverTasks: TaskItem[] = data.tasks.map((t) => ({
              id: t.id,
              week: 'Semana 1',
              title: t.title,
              category: 'Operaciones',
              priority: (t.priority === 'CRITICAL' || t.priority === 'HIGH') ? 'HIGH' : t.priority === 'LOW' ? 'LOW' : 'MEDIUM',
              tipo: 'Operación',
              completed: t.status === 'DONE',
              dueDate: t.dueDate ? (new Date(t.dueDate).toISOString().split('T')[0] ?? '2026-10-30') : '2026-10-30',
              detail: t.description ?? 'Tarea sincronizada desde Nexus Core.',
              assignee: t.assigneeName ?? t.assigneeEmail ?? undefined,
            }));
            setTasks(prev => {
              // Merge preserving unique IDs
              const existingIds = new Set(serverTasks.map(st => st.id));
              const localOnly = prev.filter(p => !existingIds.has(p.id));
              return [...serverTasks, ...localOnly];
            });
          }
        }
      } catch (err) {
        console.warn('[Nexus] Failed to sync tasks from server:', err);
      }
    }
    void syncTasksFromServer();

    const handleRefresh = () => { void syncTasksFromServer(); };
    window.addEventListener('nexus-tasks-updated', handleRefresh);
    return () => window.removeEventListener('nexus-tasks-updated', handleRefresh);
  }, [auth?.canonicalOrgId]);
  
  useEffect(() => {
    try {
      localStorage.setItem("pandoras_ip_tasks_30d", JSON.stringify(tasks));
    } catch {
      // ignore storage error
    }
  }, [tasks]);

  const [broadcasts, setBroadcasts] = useState<NexusBroadcastItem[]>([]);
  const [unreadBroadcasts, setUnreadBroadcasts] = useState<NexusBroadcastItem[]>([]);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);

  useEffect(() => {
    async function fetchBroadcasts() {
      try {
        const storedToken = typeof window !== 'undefined' ? (localStorage.getItem('pandoras_nexus_token') ?? localStorage.getItem('nexus_token')) : null;
        const res = await fetch('/api/nexus/broadcasts', {
          headers: storedToken ? { 'x-nexus-token': storedToken } : {},
          credentials: 'include',
        });
        const data = (await res.json()) as { success?: boolean; broadcasts?: NexusBroadcastItem[] };
        if (data.success && Array.isArray(data.broadcasts)) {
          setBroadcasts(data.broadcasts);
          let dismissed: string[] = [];
          try {
            const stored = localStorage.getItem('nexus_dismissed_broadcasts');
            if (stored && stored !== 'undefined') dismissed = JSON.parse(stored) as string[];
          } catch {
            // ignore
          }
          
          try {
            const cookieMatch = document.cookie.match(/(?:^|; )nexus_dismissed_broadcasts=([^;]*)/);
            if (cookieMatch?.[1]) {
              const cookieDismissed = JSON.parse(decodeURIComponent(cookieMatch[1])) as unknown;
              if (Array.isArray(cookieDismissed)) {
                (cookieDismissed as string[]).forEach((id: string) => { if (!dismissed.includes(id)) dismissed.push(id); });
              }
            }
          } catch {
            // ignore
          }
          
          if (!Array.isArray(dismissed)) dismissed = [];
          
          if (dismissed.length > 50) {
            dismissed = dismissed.slice(-50);
          }
          
          const unread = data.broadcasts.filter((b: NexusBroadcastItem) => !dismissed.includes(String(b.id)));
          setUnreadBroadcasts(unread);
          if (unread.length > 0) {
            setIsBroadcastModalOpen(true);
          } else {
            setIsBroadcastModalOpen(false);
          }
        }
      } catch (err) {
        console.error('[Nexus] Failed to fetch broadcasts:', err);
      }
    }
    void fetchBroadcasts();
  }, [auth?.email, auth?.wallet, role]);

  const handleDismissBroadcast = (broadcastId: string) => {
    try {
      const idStr = String(broadcastId);
      let dismissed: string[] = [];
      try {
        const stored = localStorage.getItem('nexus_dismissed_broadcasts');
        if (stored && stored !== 'undefined') dismissed = JSON.parse(stored) as string[];
      } catch {
        // ignore
      }
      try {
        const cookieMatch = document.cookie.match(/(?:^|; )nexus_dismissed_broadcasts=([^;]*)/);
        if (cookieMatch?.[1]) {
          const cookieDismissed = JSON.parse(decodeURIComponent(cookieMatch[1])) as unknown;
          if (Array.isArray(cookieDismissed)) {
            (cookieDismissed as string[]).forEach((id: string) => { if (!dismissed.includes(String(id))) dismissed.push(String(id)); });
          }
        }
      } catch {
        // ignore
      }
      if (!Array.isArray(dismissed)) dismissed = [];
      
      if (!dismissed.includes(idStr)) {
        dismissed.push(idStr);
        if (dismissed.length > 50) {
          dismissed = dismissed.slice(-50);
        }
        try { localStorage.setItem('nexus_dismissed_broadcasts', JSON.stringify(dismissed)); } catch { /* ignore */ }
        try {
          const domain = window.location.hostname.includes('pandoras.finance') ? 'domain=.pandoras.finance;' : '';
          document.cookie = `nexus_dismissed_broadcasts=${encodeURIComponent(JSON.stringify(dismissed))}; path=/; max-age=31536000; ${domain} SameSite=Lax`;
        } catch { /* ignore */ }
      }
      setUnreadBroadcasts(prev => {
        const next = prev.filter(b => String(b.id) !== idStr);
        if (next.length === 0) {
          setIsBroadcastModalOpen(false);
        }
        return next;
      });
    } catch (err) {
      console.warn('[Nexus] Failed to save dismissed state:', err);
    }
  };

  const validRoles: EcosystemTourRole[] = ["SUPER_ADMIN", "ADMIN", "MARKETING", "VIEWER"];
  const tourRole: EcosystemTourRole = validRoles.includes(role as EcosystemTourRole)
    ? (role as EcosystemTourRole)
    : "VIEWER";

  const [customStations, setCustomStations] = useState<EcosystemStation[] | undefined>();
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pandoras_guides_customizer_v1");
      if (stored) {
        setCustomStations(JSON.parse(stored) as EcosystemStation[]);
      }
    } catch (error) {
      console.warn("Failed to parse custom stations", error);
    }
    
    const actorIdentity = (auth.email ?? auth.wallet ?? 'operator').toLowerCase().trim();
    const welcomeKey = `pandoras_welcome_v2_${actorIdentity}`;
    
    const isFirstVisit = (() => {
      try {
        if (typeof window === "undefined") return false;
        const stored = localStorage.getItem(welcomeKey);
        const cookieMatch = document.cookie.includes(`${welcomeKey}=true`);
        if (stored === "true" || cookieMatch) return false;
        return true;
      } catch {
        return false;
      }
    })();

    if (isFirstVisit) {
      try {
        localStorage.setItem(welcomeKey, "true");
        const domain = window.location.hostname.includes('pandoras.finance') ? 'domain=.pandoras.finance;' : '';
        document.cookie = `${welcomeKey}=true; path=/; max-age=31536000; ${domain} SameSite=Lax`;
      } catch {
        // noop
      }
    }
    setShowWelcomePanel(isFirstVisit);
    setShowGuideSidebar(isFirstVisit || isFirstVisitParam);

    return undefined;
  }, [auth.email, auth.wallet, isFirstVisitParam]);

  const _getRoleBadge = () => {
    switch (role) {
      case "SUPER_ADMIN":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold tracking-wide shadow-lg shadow-amber-500/10">
            👑 SUPER ADMIN
          </span>
        );
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold tracking-wide">
            🛡️ ADMIN
          </span>
        );
      case "MARKETING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-[10px] font-mono font-bold tracking-wide">
            ⚙️ OPERADOR
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold tracking-wide">
            👥 VIEWER
          </span>
        );
    }
  };

  const _handleLogout = async () => {
    try {
      localStorage.removeItem('pandoras_nexus_token');
      document.cookie = 'pandoras_nexus_token=; path=/; max-age=0; SameSite=Lax';
      document.cookie = 'wallet-address=; path=/; max-age=0;';
      document.cookie = 'thirdweb:wallet-address=; path=/; max-age=0;';
      localStorage.setItem('wallet-logged-out', 'true');
      if (activeThirdwebWallet) {
        disconnectWallet(activeThirdwebWallet);
      }
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  return (
    <NexusShell>
      <NexusCommandPalette auth={auth} onOpenSettings={() => setIsSettingsOpen(true)} onOpenHermes={(_initialQuery) => {
        // TODO: Handle passing initial query to Hermes Ambient Drawer if needed later.
        setIsHermesAmbientOpen(true);
      }} />
      
      <div className="flex flex-1 w-full overflow-hidden relative">
        <NexusSidebar 
          auth={auth} 
          onAction={(action) => {
            if (action === 'hermes') {
              setIsHermesAmbientOpen(true);
            } else if (action === 'UNIFIED_INDEX') {
              setIsUnifiedIndexOpen(true);
            } else if (action === 'SETTINGS') {
              setIsSettingsOpen(true);
            } else {
              setOpsActiveTab(action as Tab);
              setIsOpsModalOpen(true);
            }
          }} 
        />
        
        <div className="flex-1 flex flex-col min-w-0 bg-[#0A0A0E]">
          <NexusHeader role={role} setIsOpsModalOpen={setIsOpsModalOpen} onOpenHermes={() => setIsHermesAmbientOpen(true)} />

          <div className="flex-1 flex overflow-hidden min-h-0 relative">
            {!isUnifiedIndexOpen ? (
              <NexusWorkspace 
                auth={auth} 
                sidebarOpen={sidebarOpen} 
                tasks={tasks}
                onToggleTask={handleToggleTask}
                onAction={(action) => {
                  if (action === 'hermes') {
                    setIsHermesAmbientOpen(true);
                  } else if (action === 'SETTINGS') {
                    setIsSettingsOpen(true);
                  } else {
                    setOpsActiveTab(action as Tab);
                    setIsOpsModalOpen(true);
                  }
                }}
              />
            ) : (
              <UnifiedIndexModal 
                auth={auth} 
                onClose={() => setIsUnifiedIndexOpen(false)} 
              />
            )}

            <TasksPanel tasks={tasks} setTasks={setTasks} role={role ?? undefined} />


        <AnimatePresence>
          {showWelcomePanel && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-[#08080A]/95 backdrop-blur-xl flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-lg bg-[#0e0e16] border border-amber-500/20 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />
                
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
                      <BrainCircuit className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-semibold">
                        Operaciones Autónomas
                      </span>
                      <h3 className="text-2xl font-bold text-white tracking-tight leading-tight">
                        Hola {auth.name ? auth.name.split(' ')[0] : 'Operador'}
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      Bienvenido al <strong>Sovereign Command Plane</strong> de Pandora&apos;s OS. Soy Hermes, tu asistente operativo. Te he preparado el entorno.
                    </p>
                    
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pasos Recomendados:</h4>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                          <div className="mt-0.5"><Compass className="w-4 h-4 text-emerald-400" /></div>
                          <span className="text-sm text-zinc-300">Abre el <strong className="text-white">Interactive Onboarding</strong> en el panel izquierdo para tu tour inicial.</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="mt-0.5"><Boxes className="w-4 h-4 text-blue-400" /></div>
                          <span className="text-sm text-zinc-300">Explora las tarjetas de control (Core Protocol, Deal Rooms, etc.) en el centro.</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="mt-0.5"><Activity className="w-4 h-4 text-amber-400" /></div>
                          <span className="text-sm text-zinc-300">Háblame directamente en la <strong className="text-white">Terminal Hermes</strong> (Cognitive Agents) para cualquier duda.</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const actorIdentity = (auth.email ?? auth.wallet ?? 'operator').toLowerCase().trim();
                      const welcomeKey = `pandoras_welcome_v2_${actorIdentity}`;
                      try {
                        localStorage.setItem(welcomeKey, 'true');
                        const domain = window.location.hostname.includes('pandoras.finance') ? 'domain=.pandoras.finance;' : '';
                        document.cookie = `${welcomeKey}=true; path=/; max-age=31536000; ${domain} SameSite=Lax`;
                      } catch {
                        // ignore
                      }
                      setShowWelcomePanel(false);
                      if (!isTourOpen) setIsTourOpen(true);
                    }}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm py-3 px-4 rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    Entendido, iniciar operaciones
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
          </div>
        </div>
      </div>

      <NexusContextBar auth={auth} />
      <PresenceDock hidden={isOpsModalOpen || isSettingsOpen || isHermesAmbientOpen || isUnifiedIndexOpen} />

      <HermesFloatingGuide
        role={tourRole}
        operatorContext={auth.name && auth.email ? { name: auth.name, email: auth.email, role: tourRole } : null}
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        customStations={customStations}
      />

      <OperationsHubModal
        isOpen={isOpsModalOpen}
        onClose={() => setIsOpsModalOpen(false)}
        tasks={tasks}
        setTasks={setTasks}
        userName={auth.name ?? undefined}
        userEmail={auth.email ?? undefined}
        userRole={role ?? undefined}
        permissions={(auth.permissions ?? {}) as unknown as Record<string, boolean>}
        activeTab={opsActiveTab}
        onTabChange={(tab) => setOpsActiveTab(tab)}
      />

      <NexusCentralNotificationModal
        broadcasts={isBroadcastModalOpen && unreadBroadcasts.length > 0 ? unreadBroadcasts : broadcasts}
        isOpen={isBroadcastModalOpen}
        onClose={() => {
          unreadBroadcasts.forEach(b => handleDismissBroadcast(String(b.id)));
          setIsBroadcastModalOpen(false);
        }}
        onDismiss={handleDismissBroadcast}
      />

      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed inset-0 z-[110] bg-[#08080A] overflow-y-auto custom-scrollbar"
          >
            <NexusSettingsPage 
              isUserAdmin={role === "SUPER_ADMIN"} 
              userRole={role ?? undefined}
              operatorContext={auth.name && auth.email ? { 
                name: auth.name, 
                email: auth.email, 
                role: role ?? 'VIEWER', 
                permissions: (auth.permissions ?? {}) as unknown as Record<string, boolean | undefined>
              } : null}
              onClose={() => setIsSettingsOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <HermesAmbientDrawer 
        isOpen={isHermesAmbientOpen}
        onClose={() => setIsHermesAmbientOpen(false)}
        organizationSlug="pandoras-core"
        organizationName="Pandoras Growth OS"
      />
    </NexusShell>
  );
}
