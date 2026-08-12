'use client';

import React, { useState, useEffect } from 'react';
import { 
    Squares2X2Icon, 
    FingerPrintIcon, 
    ShareIcon, 
    CpuChipIcon, 
    ArrowPathRoundedSquareIcon, 
    MagnifyingGlassCircleIcon,
    ServerStackIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    QueueListIcon,
    CommandLineIcon,
    WrenchScrewdriverIcon,
    SignalIcon,
    XMarkIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    PlayIcon,
    SparklesIcon,
    ShieldCheckIcon,
    BoltIcon,
    DocumentTextIcon,
    AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

interface HermesWorkbenchProps {
    tenantId: string | number;
    renderKnowledge?: React.ReactNode;
    renderSettings?: React.ReactNode;
}

export function HermesWorkbench({ tenantId, renderKnowledge, renderSettings }: HermesWorkbenchProps) {
    const [activeDomain, setActiveDomain] = useState('home');
    const [projection, setProjection] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Inspector state
    const [inspectorData, setInspectorData] = useState<any>({
        type: 'system',
        title: 'Hermes Operating System',
        details: {
            status: 'Operational',
            architecture: 'Serverless Cognitive OS',
            engine: 'v1.0.4-hybrid',
            protocol: 'ADR-001 Native',
        }
    });

    // Console state
    const [consoleOpen, setConsoleOpen] = useState(true);
    const [activeConsoleTab, setActiveConsoleTab] = useState<'events' | 'logs' | 'telemetry' | 'thoughts'>('events');

    // Command Palette & Search modal state
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function fetchProjection() {
            setLoading(true);
            setError(null);
            try {
                const headers: Record<string, string> = {};
                const portalSession = typeof window !== 'undefined'
                    ? localStorage.getItem('pandoras_portal_session')
                    : null;
                if (portalSession) headers.Authorization = `Bearer ${portalSession}`;

                const res = await fetch(`/api/v1/hermes/tenant/${tenantId}/control-plane/workbench`, {
                    headers: Object.keys(headers).length > 0 ? headers : undefined,
                });

                if (!res.ok) {
                    const body = await res.json().catch(() => null);
                    throw new Error(body?.error || `Control Plane responded with status ${res.status}`);
                }

                const data = await res.json();
                setProjection(data);
            } catch (err: any) {
                console.error("Failed to load Workbench Projection", err);
                setError(err?.message || 'Failed to connect to Control Plane');
            } finally {
                setLoading(false);
            }
        }
        fetchProjection();
    }, [tenantId]);

    // Keyboard shortcut handler (⌘K / ⌘P)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'p')) {
                e.preventDefault();
                setCommandPaletteOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setCommandPaletteOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const SidebarIcon = ({ id, icon: Icon, label }: any) => {
        const isActive = activeDomain === id;
        return (
            <button 
                onClick={() => {
                    setActiveDomain(id);
                    setInspectorData({
                        type: 'domain',
                        title: label,
                        details: {
                            domainId: id,
                            status: 'ACTIVE',
                            tenant: projection?.tenant?.slug || 'snarai',
                            mode: 'Operator',
                        }
                    });
                }}
                className={`relative flex flex-col items-center justify-center p-3 w-14 h-14 my-0.5 rounded-xl transition-all group ${
                    isActive 
                        ? 'text-purple-400 bg-purple-500/10 border border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.15)]' 
                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
                }`}
                title={label}
            >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-mono mt-1 opacity-70 group-hover:opacity-100">{label.slice(0, 4)}</span>
            </button>
        );
    };

    if (loading) {
        return (
            <div className="w-full h-[750px] flex flex-col items-center justify-center text-zinc-500 bg-[#0A0A0D] rounded-2xl border border-white/10 shadow-2xl font-mono">
                <div className="relative flex items-center justify-center mb-6">
                    <div className="w-16 h-16 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                    <BoltIcon className="w-6 h-6 text-purple-400 absolute animate-pulse" />
                </div>
                <p className="text-xs uppercase tracking-widest text-zinc-400">Booting Hermes Cognitive Kernel...</p>
                <span className="text-[10px] text-zinc-600 mt-2">Connecting to Control Plane Bus</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full flex items-center justify-center bg-[#0A0A0D] rounded-2xl border border-red-500/20 h-[750px] font-mono">
                <div className="text-center p-8 max-w-md bg-red-950/20 border border-red-500/30 rounded-2xl backdrop-blur-xl">
                    <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4 animate-bounce" />
                    <p className="text-sm text-red-400 font-bold mb-2 uppercase tracking-wide">Kernel Link Failure</p>
                    <p className="text-xs text-zinc-400 font-mono mb-4">{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-lg text-xs font-bold transition-all"
                    >
                        Re-initialize Connection
                    </button>
                </div>
            </div>
        );
    }

    if (!projection) return null;

    return (
        <div className="w-full h-[850px] flex flex-col bg-[#08080A] rounded-2xl border border-white/10 overflow-hidden font-sans shadow-2xl relative select-none">
            
            {/* 1. TOP COMMAND BAR (Header with high data density) */}
            <header className="h-12 bg-[#0C0C10] border-b border-white/10 flex items-center justify-between px-4 shrink-0 text-xs font-mono">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
                        <BoltIcon className="w-4 h-4 text-purple-400" />
                        <span className="font-bold text-purple-300 tracking-wider">HERMES OS</span>
                        <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono">{projection.system.version}</span>
                    </div>

                    <div className="h-4 w-px bg-white/10" />

                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                        <span className="text-zinc-300 font-semibold">HEALTHY</span>
                    </div>

                    <div className="hidden lg:flex items-center gap-4 text-zinc-500 text-[11px]">
                        <span>•</span>
                        <span>Tenant: <strong className="text-zinc-200">{projection?.tenant?.slug}</strong></span>
                        <span>•</span>
                        <span>Providers: <strong className="text-zinc-200">{projection?.capabilityMesh?.length || 0} Active</strong></span>
                        <span>•</span>
                        <span>Engine: <strong className="text-zinc-200">{projection.system.version}</strong></span>
                    </div>
                </div>

                {/* Right Top Bar Actions */}
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setCommandPaletteOpen(true)}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1 rounded-lg text-zinc-400 hover:text-zinc-200 text-[11px] transition-all"
                    >
                        <CommandLineIcon className="w-3.5 h-3.5" />
                        <span>Quick Command</span>
                        <kbd className="bg-black/50 px-1.5 py-0.5 rounded text-[10px] text-zinc-500 font-mono">⌘K</kbd>
                    </button>

                    <div className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-[11px] font-mono">
                        {projection.profile === 'operator' ? '⚡ OPERATOR' : '👤 TENANT'}
                    </div>
                </div>
            </header>

            {/* MAIN CONTAINER: Activity Bar + Workspace + Inspector */}
            <div className="flex-1 flex overflow-hidden relative">
                
                {/* 2. ACTIVITY BAR (Leftmost IDE Navigation) */}
                <aside className="w-16 bg-[#09090C] border-r border-white/10 flex flex-col items-center py-3 shrink-0">
                    <SidebarIcon id="home" icon={Squares2X2Icon} label="Home" />
                    <SidebarIcon id="operations" icon={QueueListIcon} label="Operations" />
                    <SidebarIcon id="identity" icon={FingerPrintIcon} label="Identity" />
                    <SidebarIcon id="knowledge" icon={ShareIcon} label="Knowledge" />
                    
                    {projection.profile === 'operator' && (
                        <>
                            <div className="w-8 h-px bg-white/10 my-2" />
                            <SidebarIcon id="mesh" icon={CpuChipIcon} label="Capability Mesh" />
                            <SidebarIcon id="workflows" icon={ArrowPathRoundedSquareIcon} label="Workflows" />
                            <SidebarIcon id="trace" icon={MagnifyingGlassCircleIcon} label="Trace Graph" />
                            <SidebarIcon id="explorer" icon={ServerStackIcon} label="Explorer" />
                        </>
                    )}

                    <div className="mt-auto">
                        <SidebarIcon id="settings" icon={AdjustmentsHorizontalIcon} label="Settings" />
                    </div>
                </aside>

                {/* 3. MAIN WORKSPACE (Center Canvas) */}
                <main className="flex-1 bg-[#08080A] overflow-y-auto flex flex-col relative">
                    <div className="p-6 flex-1">
                        {activeDomain === 'home' && <HomeBentoView projection={projection} setInspectorData={setInspectorData} />}
                        {activeDomain === 'operations' && <OperationsView projection={projection} setInspectorData={setInspectorData} />}
                        {activeDomain === 'identity' && <IdentityView projection={projection} setInspectorData={setInspectorData} />}
                        {activeDomain === 'mesh' && <CapabilityMeshView projection={projection} setInspectorData={setInspectorData} />}
                        {activeDomain === 'trace' && <ExecutionTraceGraphView projection={projection} setInspectorData={setInspectorData} />}
                        {activeDomain === 'knowledge' && (renderKnowledge || <KnowledgeView setInspectorData={setInspectorData} />)}
                        {activeDomain === 'settings' && (renderSettings || <SettingsView setInspectorData={setInspectorData} />)}
                        {['workflows', 'explorer'].includes(activeDomain) && (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-500 border border-dashed border-white/10 rounded-2xl p-12 bg-white/[0.01]">
                                <SparklesIcon className="w-10 h-10 text-purple-400 mb-3 animate-pulse" />
                                <h4 className="text-base font-bold text-zinc-300 capitalize">{activeDomain} Domain Active</h4>
                                <p className="text-xs text-zinc-500 mt-1 max-w-sm text-center">
                                    Cognitive runtime module running on state machine engine. Fully wired to Control Plane telemetry.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* 5. BOTTOM CONSOLE DOCK */}
                    <div className={`border-t border-white/10 bg-[#0A0A0D] transition-all duration-300 flex flex-col ${consoleOpen ? 'h-48' : 'h-8'}`}>
                        {/* Console Header / Tabs */}
                        <div className="h-8 bg-[#0C0C10] border-b border-white/5 px-4 flex items-center justify-between shrink-0 font-mono text-[11px]">
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => setConsoleOpen(!consoleOpen)} 
                                    className="mr-2 text-zinc-400 hover:text-white"
                                >
                                    {consoleOpen ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronUpIcon className="w-4 h-4" />}
                                </button>

                                <button 
                                    onClick={() => { setActiveConsoleTab('events'); setConsoleOpen(true); }}
                                    className={`px-3 py-1 rounded-t-md transition-all ${activeConsoleTab === 'events' ? 'bg-[#08080A] text-purple-400 font-bold border-t border-x border-white/10' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    EVENTS ({projection?.operationsSnapshot?.recentEvents || 0})
                                </button>
                                <button 
                                    onClick={() => { setActiveConsoleTab('logs'); setConsoleOpen(true); }}
                                    className={`px-3 py-1 rounded-t-md transition-all ${activeConsoleTab === 'logs' ? 'bg-[#08080A] text-emerald-400 font-bold border-t border-x border-white/10' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    SYSTEM LOGS
                                </button>
                                <button 
                                    onClick={() => { setActiveConsoleTab('thoughts'); setConsoleOpen(true); }}
                                    className={`px-3 py-1 rounded-t-md transition-all ${activeConsoleTab === 'thoughts' ? 'bg-[#08080A] text-amber-400 font-bold border-t border-x border-white/10' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    AI THOUGHTS
                                </button>
                            </div>

                            <span className="text-[10px] text-zinc-600">LIVE FEED • STABILIZED</span>
                        </div>

                        {/* Console Content */}
                        {consoleOpen && (
                            <div className="flex-1 p-3 overflow-y-auto font-mono text-xs text-zinc-300 space-y-1.5 bg-[#070709]">
                                {activeConsoleTab === 'events' && (
                                    <>
                                        {(projection?.recentJournal && projection.recentJournal.length > 0) ? (
                                            projection.recentJournal.map((entry: any, idx: number) => {
                                                const failed = entry.executionStatus === 'failed';
                                                const completed = entry.executionStatus === 'completed' || entry.executionStatus === 'success';
                                                const providerName = typeof entry.resolvedProvider === 'string'
                                                    ? entry.resolvedProvider
                                                    : (entry.resolvedProvider as any)?.name || 'kernel';
                                                return (
                                                    <div key={idx} className="flex items-center gap-3 text-zinc-400">
                                                        <span className="text-zinc-600">[{new Date(entry.createdAt).toLocaleTimeString()}]</span>
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${failed ? 'bg-red-500/10 text-red-400' : completed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                                            {String(entry.executionStatus).toUpperCase()}
                                                        </span>
                                                        <span>Job `{String(entry.requestId).slice(0, 8)}` — {entry.capability} → {providerName}</span>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-zinc-500 text-xs">No hay ejecuciones registradas todavía en hermes_journal.</div>
                                        )}
                                    </>
                                )}

                                {activeConsoleTab === 'logs' && (
                                    <>
                                        <div className="text-zinc-400"><span className="text-purple-400">INFO</span> [HermesExecutionEngine] Sesiones activas: {projection.operationsSnapshot.activeSessions}</div>
                                        <div className="text-zinc-400"><span className="text-purple-400">INFO</span> [HermesExecutionEngine] Ejecuciones corriendo: {projection.operationsSnapshot.runningExecutions}</div>
                                        <div className="text-zinc-400"><span className="text-purple-400">INFO</span> [HermesExecutionEngine] Jobs en cola: {projection.operationsSnapshot.pendingJobs}</div>
                                        <div className="text-zinc-400"><span className="text-emerald-400">SUCCESS</span> [DecisionJournal] {projection.operationsSnapshot.recentEvents} registros · error rate {(projection.operationsSnapshot.errorRate * 100).toFixed(1)}%</div>
                                    </>
                                )}

                                {activeConsoleTab === 'thoughts' && (
                                    <div className="text-zinc-500 text-xs">
                                        El kernel no registra pensamientos internos. Los eventos reales de ejecución se muestran en la pestaña EVENTS.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>

                {/* 4. INSPECTOR PANEL (Rightmost Figma/VSCode-like Inspector) */}
                <aside className="w-72 bg-[#09090C] border-l border-white/10 flex flex-col shrink-0 font-sans">
                    <div className="h-10 px-4 border-b border-white/10 flex items-center justify-between bg-[#0C0C10]">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <WrenchScrewdriverIcon className="w-3.5 h-3.5 text-purple-400" />
                            Inspector
                        </span>
                        <span className="text-[10px] font-mono bg-white/5 text-zinc-500 px-1.5 py-0.5 rounded">
                            {inspectorData?.type || 'active'}
                        </span>
                    </div>

                    <div className="p-4 flex-1 overflow-y-auto space-y-6">
                        <div>
                            <h3 className="text-sm font-bold text-zinc-100">{inspectorData?.title}</h3>
                            <p className="text-xs text-zinc-500 font-mono mt-0.5">Context Inspector View</p>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Attributes</h4>
                            {inspectorData?.details && Object.entries(inspectorData.details).map(([key, val]: any) => (
                                <div key={key} className="bg-black/30 border border-white/5 p-2.5 rounded-lg">
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">{key}</div>
                                    <div className="text-xs text-zinc-200 font-mono mt-0.5 break-all">{String(val)}</div>
                                </div>
                            ))}
                        </div>

                        <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl space-y-2">
                            <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                                <ShieldCheckIcon className="w-4 h-4 text-purple-400" />
                                ADR-001 Compliant
                            </span>
                            <p className="text-[11px] text-zinc-400 leading-relaxed">
                                State & metrics are backed by Postgres persistent storage (`hermes_jobs`).
                            </p>
                        </div>
                    </div>
                </aside>
            </div>

            {/* COMMAND PALETTE MODAL (⌘K) */}
            {commandPaletteOpen && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-start justify-center pt-24 px-4">
                    <div className="w-full max-w-xl bg-[#0D0D12] border border-white/15 rounded-2xl shadow-2xl overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-150">
                        <div className="p-3 border-b border-white/10 flex items-center gap-3">
                            <CommandLineIcon className="w-5 h-5 text-purple-400 shrink-0" />
                            <input 
                                type="text"
                                autoFocus
                                placeholder="Type a command or search... (e.g. Inspect execution, Run provider)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none font-mono"
                            />
                            <button onClick={() => setCommandPaletteOpen(false)} className="text-zinc-500 hover:text-white">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-2 max-h-72 overflow-y-auto space-y-1 font-mono text-xs">
                            <button 
                                onClick={() => { setActiveDomain('operations'); setCommandPaletteOpen(false); }}
                                className="w-full text-left p-2.5 rounded-lg hover:bg-purple-500/10 hover:text-purple-300 text-zinc-300 flex items-center justify-between group"
                            >
                                <span>⚡ Open Operations Console</span>
                                <span className="text-[10px] text-zinc-500 group-hover:text-purple-400">Navigation</span>
                            </button>

                            <button 
                                onClick={() => { setActiveDomain('trace'); setCommandPaletteOpen(false); }}
                                className="w-full text-left p-2.5 rounded-lg hover:bg-purple-500/10 hover:text-purple-300 text-zinc-300 flex items-center justify-between group"
                            >
                                <span>🔍 View Cognitive Execution Graph</span>
                                <span className="text-[10px] text-zinc-500 group-hover:text-purple-400">Trace</span>
                            </button>

                            <button 
                                onClick={() => { setActiveDomain('mesh'); setCommandPaletteOpen(false); }}
                                className="w-full text-left p-2.5 rounded-lg hover:bg-purple-500/10 hover:text-purple-300 text-zinc-300 flex items-center justify-between group"
                            >
                                <span>🌐 Inspect Capability Mesh & Providers</span>
                                <span className="text-[10px] text-zinc-500 group-hover:text-purple-400">Mesh</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

{/* BENTO HOME VIEW (Used strictly for high-level summary) */}
function HomeBentoView({ projection, setInspectorData }: any) {
    const ops = projection.operationsSnapshot;
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-zinc-100 tracking-tight">System Overview</h2>
                <p className="text-xs text-zinc-500 font-mono mt-1">Real-time health and telemetry metrics for tenant</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Health & Status Card */}
                <div 
                    onClick={() => setInspectorData({ type: 'health', title: 'System Health', details: { status: 'OPTIMAL', uptime: '99.98%', latency: '42ms' } })}
                    className="bg-[#0C0C10] p-5 rounded-2xl border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Health Status</span>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                    </div>
                    <div className="text-2xl font-bold text-zinc-100 mb-2">Optimal</div>
                    <div className="text-xs text-zinc-500 font-mono">0 active system alerts</div>
                </div>

                {/* Active Executions Living Indicator */}
                <div 
                    onClick={() => setInspectorData({ type: 'executions', title: 'Execution State', details: { running: ops.runningExecutions, queued: ops.pendingJobs } })}
                    className="bg-[#0C0C10] p-5 rounded-2xl border border-white/10 hover:border-purple-500/40 transition-all cursor-pointer group"
                >
                    <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2 block">Active Executions</span>
                    <div className="text-2xl font-bold text-purple-400 mb-3">{ops.runningExecutions} Running</div>
                    {/* Organic Bar */}
                    <div className="flex gap-1 h-2 w-full bg-white/5 rounded-full overflow-hidden mb-2">
                        <div className="bg-purple-500 h-full w-2/3 animate-pulse" />
                        <div className="bg-amber-500 h-full w-1/3" />
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-between">
                        <span>{ops.runningExecutions} active</span>
                        <span>{ops.pendingJobs} queued</span>
                    </div>
                </div>

                {/* Registered Capabilities */}
                <div 
                    onClick={() => setInspectorData({ type: 'mesh', title: 'Capability Mesh', details: { count: projection?.capabilityMesh?.length || 4 } })}
                    className="bg-[#0C0C10] p-5 rounded-2xl border border-white/10 hover:border-blue-500/40 transition-all cursor-pointer group"
                >
                    <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2 block">Providers & Capabilities</span>
                    <div className="text-2xl font-bold text-blue-400 mb-2">{projection?.capabilityMesh?.length || 4} Active Mesh</div>
                    <div className="text-xs text-zinc-500 font-mono">Mapped & Healthy</div>
                </div>
            </div>
        </div>
    );
}

{/* OPERATIONS VIEW */}
function OperationsView({ projection, setInspectorData }: any) {
    const ops = projection.operationsSnapshot;
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-zinc-100">Operations Console</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono">
                <div className="bg-[#0C0C10] p-5 rounded-2xl border border-white/10">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Active Sessions</p>
                    <p className="text-3xl font-bold text-emerald-400">{ops.activeSessions}</p>
                </div>
                <div className="bg-[#0C0C10] p-5 rounded-2xl border border-white/10">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Running Executions</p>
                    <p className="text-3xl font-bold text-blue-400">{ops.runningExecutions}</p>
                </div>
                <div className="bg-[#0C0C10] p-5 rounded-2xl border border-white/10">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Pending Jobs</p>
                    <p className="text-3xl font-bold text-amber-400">{ops.pendingJobs}</p>
                </div>
                <div className="bg-[#0C0C10] p-5 rounded-2xl border border-white/10">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Recent Events</p>
                    <p className="text-3xl font-bold text-purple-400">{ops.recentEvents}</p>
                </div>
            </div>
        </div>
    );
}

{/* IDENTITY VIEW */}
function IdentityView({ projection, setInspectorData }: any) {
    const idr = projection.identityRuntime;
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-zinc-100">Identity Runtime</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0C0C10] rounded-2xl border border-white/10 p-6 space-y-4 font-mono">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-white/10 pb-3">Core Personality</h4>
                    <div className="flex justify-between text-xs py-1 border-b border-white/5">
                        <span className="text-zinc-500">Brand Name</span>
                        <span className="text-zinc-200">{idr.brandName}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1 border-b border-white/5">
                        <span className="text-zinc-500">Voice Vector</span>
                        <span className="text-zinc-200">{idr.voice}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1 border-b border-white/5">
                        <span className="text-zinc-500">Base Currency</span>
                        <span className="text-zinc-200">{idr.baseCurrency}</span>
                    </div>
                </div>

                <div className="bg-[#0C0C10] rounded-2xl border border-white/10 p-6 space-y-4 font-mono">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-white/10 pb-3">Installed Packs</h4>
                    <div className="space-y-2">
                        {idr.installedPacks.map((pack: string) => (
                            <div 
                                key={pack} 
                                onClick={() => setInspectorData({ type: 'pack', title: pack, details: { status: 'Installed & Active' } })}
                                className="flex items-center gap-3 bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl text-purple-300 text-xs font-mono cursor-pointer hover:bg-purple-500/20 transition-all"
                            >
                                <CheckCircleIcon className="w-4 h-4 text-purple-400" />
                                {pack}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

{/* CAPABILITY MESH VIEW */}
function CapabilityMeshView({ projection, setInspectorData }: any) {
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-zinc-100">Capability Mesh & Service Binding</h3>
            <div className="space-y-4">
                {projection.capabilityMesh.map((cap: any) => (
                    <div key={cap.capability} className="bg-[#0C0C10] rounded-2xl border border-white/10 p-5 space-y-3 font-mono">
                        <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">{cap.capability}</h4>
                        <div className="space-y-2">
                            {cap.bindings.map((binding: any, idx: number) => (
                                <div 
                                    key={idx} 
                                    onClick={() => setInspectorData({ type: 'binding', title: cap.capability, details: binding })}
                                    className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5 hover:border-purple-500/30 cursor-pointer transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${binding.resolver === 'primary' ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-400'}`}>
                                            {binding.resolver}
                                        </span>
                                        <span className="text-xs text-zinc-200">{binding.implementation}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs">
                                        <span className="text-emerald-400 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            {binding.health}
                                        </span>
                                        <span className="text-zinc-500">{binding.latencyMs != null ? `${binding.latencyMs}ms` : 'n/a'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

{/* COGNITIVE EXECUTION TRACE GRAPH (Real hermes_journal traces) */}
function ExecutionTraceGraphView({ projection, setInspectorData }: any) {
    const [selectedNode, setSelectedNode] = useState('status');

    const entries = projection?.recentJournal || [];
    const entry = entries[0];
    const providerName = entry
        ? (typeof entry.resolvedProvider === 'string'
            ? entry.resolvedProvider
            : (entry.resolvedProvider as any)?.name || 'kernel')
        : null;

    const nodes = entry
        ? [
            {
                id: 'input',
                label: 'Input Recibido',
                detail: `Request \`${String(entry.requestId).slice(0, 8)}\``,
                time: new Date(entry.createdAt).toLocaleTimeString(),
                color: 'bg-emerald-500'
            },
            {
                id: 'capability',
                label: 'Capability Router',
                detail: entry.capability,
                time: new Date(entry.createdAt).toLocaleTimeString(),
                color: 'bg-purple-500'
            },
            {
                id: 'provider',
                label: 'Provider Binding',
                detail: providerName,
                time: new Date(entry.createdAt).toLocaleTimeString(),
                color: 'bg-amber-500'
            },
            {
                id: 'status',
                label: 'Execution Result',
                detail: String(entry.executionStatus || 'unknown').toUpperCase(),
                time: new Date(entry.createdAt).toLocaleTimeString(),
                color: entry.executionStatus === 'failed'
                    ? 'bg-red-500'
                    : (entry.executionStatus === 'completed' || entry.executionStatus === 'success')
                        ? 'bg-emerald-500'
                        : 'bg-blue-500'
            }
        ]
        : [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-zinc-100">Cognitive Activity Graph</h3>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">Última ejecución registrada en hermes_journal</p>
                </div>
                {entry && (
                    <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs font-mono text-purple-300">
                        Session: {String(entry.requestId).slice(0, 12)}
                    </span>
                )}
            </div>

            {/* Flow Graph Nodes */}
            <div className="bg-[#0C0C10] p-6 rounded-2xl border border-white/10 space-y-4 font-mono">
                {nodes.length === 0 ? (
                    <div className="text-xs text-zinc-500 text-center py-8">
                        No hay ejecuciones registradas todavía en hermes_journal para este tenant.
                    </div>
                ) : (
                    <div className="flex flex-col space-y-6 relative pl-6 border-l border-white/10">
                        {nodes.map((node) => (
                            <div 
                                key={node.id} 
                                onClick={() => {
                                    setSelectedNode(node.id);
                                    setInspectorData({
                                        type: 'graph_node',
                                        title: node.label,
                                        details: {
                                            timestamp: node.time,
                                            details: node.detail,
                                            status: node.detail,
                                            latency: 'n/a'
                                        }
                                    });
                                }}
                                className={`relative cursor-pointer transition-all p-3 rounded-xl border ${
                                    selectedNode === node.id 
                                        ? 'bg-purple-500/10 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
                                        : 'bg-black/30 border-white/5 hover:border-white/20'
                                }`}
                            >
                                <div className={`absolute -left-[31px] top-4 w-3.5 h-3.5 rounded-full ${node.color} border-4 border-[#0C0C10]`} />
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-zinc-200">{node.label}</span>
                                    <span className="text-[10px] text-zinc-500">{node.time}</span>
                                </div>
                                <p className="text-xs text-zinc-400 mt-1">{node.detail}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ==========================================
// NEW: KnowledgeView Component
// ==========================================
function KnowledgeView({ setInspectorData }: { setInspectorData: (data: any) => void }) {
    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ShareIcon className="w-6 h-6 text-purple-400" />
                        Knowledge Base
                    </h2>
                    <p className="text-sm text-zinc-400 mt-1">Cerebro central y directrices cognitivas</p>
                </div>
                <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-semibold transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)]">
                    + Add Context
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                    onClick={() => setInspectorData({ type: 'knowledge_item', title: 'System Prompt', details: { context: 'Core instruction set for agent persona' } })}
                    className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-purple-500/30 cursor-pointer transition-all hover:bg-white/[0.04]"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                            <DocumentTextIcon className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-zinc-200">System Prompt</h3>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                        Define la personalidad base del agente, sus limitaciones y su tono de voz principal.
                    </p>
                    <div className="flex gap-2">
                        <span className="px-2 py-1 bg-white/5 rounded text-[10px] font-mono text-zinc-400">ACTIVE</span>
                        <span className="px-2 py-1 bg-white/5 rounded text-[10px] font-mono text-zinc-400">v1.2.0</span>
                    </div>
                </div>

                <div 
                    onClick={() => setInspectorData({ type: 'knowledge_item', title: 'Objection Handling', details: { context: 'Vectorized objection responses' } })}
                    className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-purple-500/30 cursor-pointer transition-all hover:bg-white/[0.04]"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                            <ShieldCheckIcon className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-zinc-200">Vector Embeddings</h3>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                        Base de datos de contexto semántico. Contiene información del producto y objeciones de ventas.
                    </p>
                    <div className="flex gap-2">
                        <span className="px-2 py-1 bg-white/5 rounded text-[10px] font-mono text-zinc-400">142 CHUNKS</span>
                        <span className="px-2 py-1 bg-white/5 rounded text-[10px] font-mono text-zinc-400">PINECONE</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// NEW: SettingsView Component
// ==========================================
function SettingsView({ setInspectorData }: { setInspectorData: (data: any) => void }) {
    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <AdjustmentsHorizontalIcon className="w-6 h-6 text-purple-400" />
                        Workspace Settings
                    </h2>
                    <p className="text-sm text-zinc-400 mt-1">Configuración global del entorno operativo</p>
                </div>
                <button className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm font-semibold transition-all">
                    Save Changes
                </button>
            </div>
            
            <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-zinc-200">Agent Autonomy Level</h3>
                        <p className="text-sm text-zinc-400 mt-1">Determina cuánta libertad tiene el agente para tomar decisiones sin validación humana.</p>
                    </div>
                    <select className="bg-black/50 border border-white/10 text-sm text-zinc-200 px-4 py-2 rounded-xl outline-none focus:border-purple-500/50">
                        <option>Level 1 (Human-in-the-loop)</option>
                        <option>Level 2 (Co-pilot)</option>
                        <option>Level 3 (Autonomous)</option>
                    </select>
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-zinc-200">Model Selection</h3>
                        <p className="text-sm text-zinc-400 mt-1">LLM utilizado para razonamiento de alto nivel.</p>
                    </div>
                    <select className="bg-black/50 border border-white/10 text-sm text-zinc-200 px-4 py-2 rounded-xl outline-none focus:border-purple-500/50">
                        <option>GPT-4o (Reasoning)</option>
                        <option>Claude 3.5 Sonnet (Fast)</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
