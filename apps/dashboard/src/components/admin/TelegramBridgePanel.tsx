"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@saasfly/ui/input";
import {
    Activity, AlertTriangle, BarChart3, Bell, BookOpen, CheckCircle,
    ChevronDown, ChevronRight, Coins, ExternalLink, MessageCircle, Play, Power,
    RefreshCw, Shield, Skull, TrendingUp, Wallet, XCircle, Zap, Info, User, Search, HelpCircle, FileText
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface GoldenSignals {
    events: { accepted_5m: number; accepted_1h: number; accepted_24h: number; total: number };
    pbox: { earned_24h_approx: number; pendingClaims: number };
    webhooks: { successRate_24h: number; successRate_1h: number; failed_24h: number; pending: number };
}

interface BridgeStatus {
    flags: Record<string, boolean | number>;
    bindings: { total: number; newLast24h: number };
    goldenSignals: GoldenSignals;
    events: { total: number; lastHour: number; last24h: number; recent: any[] };
    pbox: { activeWallets: number; totalEarned: number; totalReserved: number; totalClaimed: number; available: number };
    webhooks: { successLast24h: number; failedLast24h: number; pending: number; successRate: number };
    conversion: { intents: number; completed: number; failed: number; rate: number };
    liveMetrics: { intents: number; completed: number; revenue: number; protocolsUnlocked: number };
}

interface EconomyParams {
    pointsPerPbox: number;
    conversionVersion: number;
    dailyCapPerWallet: number;
    defaultChainId: number;
}

interface AlertItem {
    alertId: string;
    status: 'active' | 'resolved';
    severity: 'critical' | 'warning' | 'info';
    title: string;
    emoji: string;
    suggestedAction: string | null;
    playbook: string | null;
    cooldownMinutes: number;
    lastTriggeredAt: string | null;
    lastResolvedAt: string | null;
    triggerCount: number;
    firstSeenAt: string | null;
    timesFired24h: number;
}

interface AlertsData {
    active: AlertItem[];
    resolved: AlertItem[];
    activeCount: number;
    total: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getWallet(): string | null {
    if (typeof window === "undefined") return null;
    try {
        const s = localStorage.getItem("wallet-session");
        return s ? JSON.parse(s)?.address?.toLowerCase() : null;
    } catch { return null; }
}

function authHdrs(): Record<string, string> {
    const w = getWallet();
    return w ? { "x-thirdweb-address": w, "x-wallet-address": w } : {};
}

// ── Stat Card ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = "blue", icon: Icon, trend }:
    { label: string; value: string | number; sub?: string; color?: string; icon: any; trend?: "up" | "down" | null }) {
    const cols: Record<string, string> = {
        green: "text-green-400", red: "text-red-400", yellow: "text-yellow-400",
        blue: "text-blue-400", purple: "text-purple-400", lime: "text-lime-400", orange: "text-orange-400",
    };
    return (
        <div className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl p-4 flex flex-col gap-1">
            <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{label}</span>
                <Icon className={`w-4 h-4 ${cols[color]}`} />
            </div>
            <div className={`text-2xl font-bold ${cols[color]}`}>{value}</div>
            {sub && <div className="text-[11px] text-gray-500">{sub}</div>}
            {trend && (
                <div className={`text-[10px] flex items-center gap-1 ${trend === "up" ? "text-lime-400" : "text-red-400"}`}>
                    <TrendingUp className={`w-3 h-3 ${trend === "down" ? "rotate-180" : ""}`} />
                    {trend === "up" ? "Healthy" : "Degraded"}
                </div>
            )}
        </div>
    );
}

// ── Golden Signals Strip ─────────────────────────────────────────────────

function GoldenStrip({ gs }: { gs: GoldenSignals }) {
    return (
        <div className="bg-zinc-900/60 border border-zinc-700/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <Activity className="w-3.5 h-3.5 text-lime-400" />
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Golden Signals</span>
            </div>
            <div className="grid grid-cols-3 gap-px bg-zinc-700/30 rounded-lg overflow-hidden">
                {/* Events */}
                <div className="bg-zinc-900 p-3 space-y-2">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Actions accepted</div>
                    <div className="space-y-1">
                        {[
                            { label: "5m", val: gs.events.accepted_5m },
                            { label: "1h", val: gs.events.accepted_1h },
                            { label: "24h", val: gs.events.accepted_24h },
                        ].map(({ label, val }) => (
                            <div key={label} className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-500 w-6">{label}</span>
                                <span className={`text-sm font-bold ${val > 0 ? "text-lime-400" : "text-gray-600"}`}>{val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* PBOX */}
                <div className="bg-zinc-900 p-3 space-y-2">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">PBOX economy</div>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-500">~24h</span>
                            <span className="text-sm font-bold text-purple-400">{gs?.pbox?.earned_24h_approx ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-500">Pending</span>
                            <span className={`text-sm font-bold ${(gs?.pbox?.pendingClaims ?? 0) > 0 ? "text-yellow-400" : "text-gray-600"}`}>
                                {gs?.pbox?.pendingClaims ?? 0}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Webhooks */}
                <div className="bg-zinc-900 p-3 space-y-2">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Webhook health</div>
                    <div className="space-y-1">
                        {[
                            { label: "1h", val: `${gs?.webhooks?.successRate_1h ?? 0}%` },
                            { label: "24h", val: `${gs?.webhooks?.successRate_24h ?? 0}%` },
                            { label: "fail", val: gs?.webhooks?.failed_24h ?? 0 },
                        ].map(({ label, val }) => (
                            <div key={label} className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-500 w-6">{label}</span>
                                <span className={`text-sm font-bold ${label === "fail"
                                    ? (val === 0 ? "text-gray-600" : "text-red-400")
                                    : (Number(String(val).replace('%', '')) > 95 ? "text-green-400" : "text-yellow-400")
                                    }`}>{val}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Flag Toggle ───────────────────────────────────────────────────────────

function FlagToggle({
    label, description, flagKey, enabled, requireConfirmBothWays,
    onToggle, loading,
}: {
    label: string; description: string; flagKey: string; enabled: boolean;
    requireConfirmBothWays?: boolean;
    onToggle: (f: string, e: boolean, token?: string) => void; loading: boolean;
}) {
    const [confirming, setConfirming] = useState(false);
    const [token, setToken] = useState("");

    const needsConfirm = (toEnable: boolean) =>
        (!toEnable) || (requireConfirmBothWays && toEnable);

    const handleClick = () => {
        const next = !enabled;
        if (needsConfirm(next)) setConfirming(true);
        else onToggle(flagKey, next);
    };

    return (
        <div className={`rounded-xl border p-5 transition-all ${enabled
            ? "bg-zinc-800/40 border-zinc-700"
            : "bg-red-950/10 border-red-900/30"}`}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        {enabled ? <CheckCircle className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                        <span className="font-semibold text-white text-sm">{label}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${enabled ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                            {enabled ? "ON" : "OFF"}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400">{description}</p>
                </div>
                {!confirming && (
                    <Button size="sm" disabled={loading} onClick={handleClick}
                        className={enabled
                            ? "bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-700/40"
                            : "bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-700/40"}>
                        {enabled ? "Disable" : "Enable"}
                    </Button>
                )}
            </div>

            {confirming && (
                <div className="mt-4 p-3 bg-red-950/30 border border-red-900/50 rounded-lg space-y-2">
                    <p className="text-xs text-yellow-400 font-semibold">
                        ⚠️ Type &quot;CONFIRM&quot; to {enabled ? "disable" : "enable"} {label}
                    </p>
                    <Input value={token} onChange={e => setToken(e.target.value)}
                        placeholder="CONFIRM" className="bg-zinc-900 border-red-900/50 text-sm"
                        onKeyDown={e => {
                            if (e.key === "Enter" && token === "CONFIRM") {
                                onToggle(flagKey, !enabled, token);
                                setConfirming(false); setToken("");
                            }
                        }} />
                    <div className="flex gap-2">
                        <Button size="sm" variant="destructive" disabled={token !== "CONFIRM"}
                            onClick={() => { onToggle(flagKey, !enabled, token); setConfirming(false); setToken(""); }}>
                            Confirm
                        </Button>
                        <Button size="sm" variant="outline"
                            onClick={() => { setConfirming(false); setToken(""); }}>
                            Cancel
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Executable Playbook ───────────────────────────────────────────────────

interface Playbook {
    id: string;
    severity: "red" | "yellow" | "blue";
    title: string;
    when: string;
    steps: string[];
    impact: string;
    action?: { label: string; flagKey: string; enabled: boolean; requiresConfirm: boolean };
}

function PlaybookCard({ playbook, onExecute, executing }:
    { playbook: Playbook; onExecute: (pb: Playbook, token?: string) => void; executing: string | null }) {
    const [expanded, setExpanded] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [token, setToken] = useState("");

    const colors = {
        red: "border-red-900/40 bg-red-950/10",
        yellow: "border-yellow-900/40 bg-yellow-950/10",
        blue: "border-blue-900/40 bg-blue-950/10",
    };

    return (
        <div className={`rounded-xl border overflow-hidden ${colors[playbook.severity]}`}>
            <button onClick={() => setExpanded(e => !e)}
                className="w-full flex items-center justify-between p-4 text-left">
                <span className="font-semibold text-white text-sm">{playbook.title}</span>
                {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
            </button>

            {expanded && (
                <div className="px-4 pb-5 space-y-4">
                    <div>
                        <p className="text-[11px] text-gray-400 font-semibold mb-1 uppercase tracking-wider">When to use</p>
                        <p className="text-xs text-gray-300">{playbook.when}</p>
                    </div>
                    <div>
                        <p className="text-[11px] text-gray-400 font-semibold mb-2 uppercase tracking-wider">Steps</p>
                        <ol className="space-y-1.5">
                            {playbook.steps.map((step, i) => (
                                <li key={i} className="flex gap-2.5 text-xs text-gray-300">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                        {i + 1}
                                    </span>
                                    {step}
                                </li>
                            ))}
                        </ol>
                    </div>
                    <div className="p-3 bg-zinc-900/60 rounded-lg">
                        <p className="text-[11px] text-gray-400 font-semibold mb-1 uppercase tracking-wider">Impact</p>
                        <p className="text-xs text-gray-300">{playbook.impact}</p>
                    </div>

                    {/* Executable Action */}
                    {playbook.action && (
                        <div className="border-t border-zinc-700/40 pt-3">
                            {!confirming ? (
                                <Button
                                    size="sm"
                                    disabled={executing === playbook.id}
                                    onClick={() => {
                                        if (playbook.action!.requiresConfirm) setConfirming(true);
                                        else onExecute(playbook);
                                    }}
                                    className="bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 border border-orange-700/40 gap-2"
                                >
                                    {executing === playbook.id
                                        ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        : <Play className="w-3.5 h-3.5" />}
                                    {executing === playbook.id ? "Executing..." : playbook.action.label}
                                </Button>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-xs text-yellow-400 font-semibold">
                                        ⚠️ Type &quot;CONFIRM&quot; to execute this playbook action
                                    </p>
                                    <div className="flex gap-2">
                                        <Input value={token} onChange={e => setToken(e.target.value)}
                                            placeholder="CONFIRM" className="bg-zinc-900 border-orange-900/50 text-sm w-40"
                                            onKeyDown={e => {
                                                if (e.key === "Enter" && token === "CONFIRM") {
                                                    onExecute(playbook, token);
                                                    setConfirming(false); setToken("");
                                                }
                                            }} />
                                        <Button size="sm" disabled={token !== "CONFIRM"}
                                            className="bg-orange-600 hover:bg-orange-700"
                                            onClick={() => { onExecute(playbook, token); setConfirming(false); setToken(""); }}>
                                            Execute
                                        </Button>
                                        <Button size="sm" variant="outline"
                                            onClick={() => { setConfirming(false); setToken(""); }}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Economy Preview ───────────────────────────────────────────────────────

function EconomyPreview({ draft, current, eventsLast24h }: {
    draft: EconomyParams; current: EconomyParams; eventsLast24h: number;
}) {
    const currentPbox = Math.floor(eventsLast24h / current.pointsPerPbox);
    const projectedPbox = Math.floor(eventsLast24h / draft.pointsPerPbox);
    const delta = projectedPbox - currentPbox;
    const pctChange = currentPbox > 0 ? Math.round((delta / currentPbox) * 100) : 0;
    const changed = JSON.stringify(draft) !== JSON.stringify(current);

    if (!changed) return null;

    return (
        <div className="p-4 bg-blue-950/20 border border-blue-900/30 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Impact Preview — based on last 24h</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-zinc-900/60 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-400 mb-1">Events/24h</div>
                    <div className="text-lg font-bold text-white">{eventsLast24h}</div>
                </div>
                <div className="bg-zinc-900/60 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-400 mb-1">Current PBOX/day</div>
                    <div className="text-lg font-bold text-white">{currentPbox}</div>
                </div>
                <div className={`rounded-lg p-3 text-center ${delta > 0 ? "bg-red-950/20 border border-red-900/30" : "bg-green-950/20 border border-green-900/30"}`}>
                    <div className="text-xs text-gray-400 mb-1">Projected PBOX/day</div>
                    <div className={`text-lg font-bold ${delta > 0 ? "text-red-400" : "text-green-400"}`}>
                        {projectedPbox}
                    </div>
                    {delta !== 0 && (
                        <div className={`text-[10px] font-bold ${delta > 0 ? "text-red-400" : "text-green-400"}`}>
                            {delta > 0 ? "+" : ""}{pctChange}%
                        </div>
                    )}
                </div>
            </div>
            {draft.conversionVersion === current.conversionVersion && draft.pointsPerPbox !== current.pointsPerPbox && (
                <div className="flex items-center gap-2 p-2 bg-yellow-950/20 border border-yellow-900/30 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                    <p className="text-[11px] text-yellow-400">
                        You changed pointsPerPbox but not conversionVersion.
                        Bump the version for historical auditability.
                    </p>
                </div>
            )}
        </div>
    );
}

// ── Operations Guide ──────────────────────────────────────────────────────

function OperationsGuide() {
    const sections = [
        {
            icon: "🔍",
            title: "Daily Operations (Normal Mode)",
            content: [
                "Check Status → all flags green",
                "Check Economy → correct version active",
                "Check Analytics → webhook success rate > 99%",
                "Check Balances → reserved ≈ expected pending claims",
            ],
            note: "If no alerts, don't touch anything.",
        },
        {
            icon: "⚡",
            title: "Architecture (Never Forget)",
            content: [
                "Telegram App = edge, untrusted client. It signals intent.",
                "Pandoras Core = authority. It evaluates and executes.",
                "Blockchain = settlement layer. Telegram never touches it.",
                "Admin Panel = control plane. This is where decisions are made.",
            ],
        },
        {
            icon: "🧯",
            title: "Incident Response (target: < 60s)",
            content: [
                "1. Disable Claims (stops monetary exposure)",
                "2. If abuse continues → Disable Gamification (stops all events)",
                "3. Activate Paranoia Mode (tightens all limits)",
                "4. Review Event Forensics (Analytics tab, last 10 actions)",
                "5. Issue fix / rollback",
            ],
            note: "Gamification never depends on webhooks — Core always works.",
        },
        {
            icon: "💰",
            title: "Safe Economy Adjustment",
            content: [
                "1. Go to Economy tab",
                "2. Change parameters (check Impact Preview first!)",
                "3. Always bump conversionVersion",
                "4. Save",
                "5. Monitor balances in Analytics",
            ],
            note: "Never change pointsPerPbox without bumping version.",
        },
        {
            icon: "🔐",
            title: "Secret Rotation Checklist",
            content: [
                "1. Generate: openssl rand -hex 32",
                "2. Disable Claims (prevents stale-secret claims)",
                "3. Update PBOX_CLAIM_SIGNING_SECRET in env",
                "4. Redeploy Core",
                "5. Re-enable Claims",
            ],
            note: "Old signatures expire automatically in 15 minutes.",
        },
        {
            icon: "🚫",
            title: "What Telegram CANNOT Do",
            content: [
                "Mutate protocol configuration",
                "Change economy or limits",
                "Emit PBOX directly",
                "Bypass rate-limits",
                "Force or forge claims",
            ],
            note: "If any of these seem possible → it's a bug.",
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-lime-500/10 border border-lime-500/20 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-lime-400" />
                </div>
                <div>
                    <h4 className="font-bold text-white text-sm">How to Operate the Telegram Bridge</h4>
                    <p className="text-xs text-gray-400">Internal operations guide for admins and on-call engineers</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sections.map(s => (
                    <div key={s.title} className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">{s.icon}</span>
                            <h5 className="font-semibold text-white text-xs">{s.title}</h5>
                        </div>
                        <ul className="space-y-1.5 mb-3">
                            {s.content.map((item, i) => (
                                <li key={i} className="flex gap-2 text-xs text-gray-300">
                                    <span className="text-gray-600 flex-shrink-0">→</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                        {s.note && (
                            <p className="text-[10px] text-gray-500 bg-zinc-900/60 rounded px-2 py-1 italic">
                                {s.note}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Telegram Users Manager ────────────────────────────────────────────────

function TelegramUsersManager() {
    const [search, setSearch] = useState("");
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [selected, setSelected] = useState<any>(null);
    const [updating, setUpdating] = useState(false);

    // Mutation DTO
    const [mutation, setMutation] = useState({
        addPoints: 0,
        subtractPoints: 0,
        role: "" as any,
        tags: [] as string[],
        isFrozen: false
    });

    const handleSearch = async () => {
        if (!search) return;
        setSearching(true);
        try {
            const res = await fetch(`/api/admin/telegram-bridge/users?q=${encodeURIComponent(search)}`, { headers: authHdrs() });
            if (res.ok) setResults(await res.json());
            else toast.error("Search failed");
        } catch { toast.error("Network error"); }
        finally { setSearching(false); }
    };

    const handleSelectUser = (user: any) => {
        setSelected(user);
        setMutation({
            addPoints: 0,
            subtractPoints: 0,
            role: user.role,
            tags: user.tags || [],
            isFrozen: user.isFrozen
        });
    };

    const handleUpdate = async () => {
        if (!selected) return;
        setUpdating(true);
        try {
            const res = await fetch(`/api/admin/telegram-bridge/users?telegramId=${selected.telegramId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHdrs() },
                body: JSON.stringify(mutation),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("User updated successfully");
                setSelected(data.user);
                // Refresh list if user is in results
                setResults(prev => prev.map(u => u.telegramId === selected.telegramId ? data.user : u));
            } else {
                toast.error(data.error || "Update failed");
            }
        } catch { toast.error("Network error"); }
        finally { setUpdating(false); }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Search & List */}
            <div className="lg:col-span-5 space-y-4">
                <div className="bg-zinc-900/40 border border-zinc-700/50 rounded-xl p-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                            <Input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleSearch()}
                                placeholder="ID o Username..."
                                className="pl-9 bg-zinc-950 border-zinc-800"
                            />
                        </div>
                        <Button size="sm" onClick={handleSearch} disabled={searching}>
                            {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Buscar"}
                        </Button>
                    </div>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-700/50 rounded-xl overflow-hidden min-h-[400px]">
                    <div className="p-3 border-b border-zinc-800 bg-zinc-800/20 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        Resultados ({results.length})
                    </div>
                    {results.length === 0 ? (
                        <div className="p-10 text-center text-gray-500 text-sm">
                            {searching ? "Buscando..." : "Usa el buscador para encontrar usuarios"}
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-800 max-h-[600px] overflow-y-auto">
                            {results.map(u => (
                                <button
                                    key={u.telegramId}
                                    onClick={() => handleSelectUser(u)}
                                    className={`w-full p-4 flex items-center justify-between hover:bg-zinc-800/40 transition-colors text-left ${selected?.telegramId === u.telegramId ? "bg-blue-500/10 border-r-2 border-blue-500" : ""}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-gray-400">
                                            {u.username?.[0]?.toUpperCase() || "?"}
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-white">@{u.username || "sin_user"}</div>
                                            <div className="text-[10px] text-gray-500 font-mono">{u.telegramId}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-bold text-lime-400">{u.points?.points || 0} PTS</div>
                                        {u.isFrozen && <span className="text-[9px] font-bold text-red-400 uppercase">Frozen</span>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Details & Actions */}
            <div className="lg:col-span-7">
                {!selected ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-xl p-10">
                        <User className="w-10 h-10 mb-4 opacity-20" />
                        <p className="text-sm text-center">Selecciona un usuario para gestionar sus roles, puntos y etiquetas.</p>
                    </div>
                ) : (
                    <div className="bg-zinc-900/40 border border-zinc-700/50 rounded-xl p-6 space-y-6 slide-in-bottom">
                        {/* Header Profile */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/5 flex items-center justify-center text-2xl font-bold text-blue-400">
                                    {selected.username?.[0]?.toUpperCase() || "?"}
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-white flex items-center gap-2">
                                        @{selected.username || "sin_user"}
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${selected.role === 'ADMIN' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-zinc-700 text-gray-300'}`}>
                                            {selected.role}
                                        </span>
                                    </h4>
                                    <p className="text-xs text-gray-500 font-mono mb-2">{selected.telegramId}</p>
                                    <div className="flex gap-2">
                                        {selected.tags?.map((t: string) => (
                                            <span key={t} className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase border border-blue-500/20">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-lime-400">{selected.points?.points || 0}</div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Puntos Edge</div>
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
                                <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Lifetime</div>
                                <div className="text-lg font-bold text-white">{selected.points?.lifetimeEarned || 0}</div>
                            </div>
                            <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
                                <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Referidos</div>
                                <div className="text-lg font-bold text-white">{selected._count?.referralsMade || 0}</div>
                            </div>
                            <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
                                <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Artefactos</div>
                                <div className="text-lg font-bold text-white">{selected._count?.artefacts || 0}</div>
                            </div>
                        </div>

                        {/* Actions Form */}
                        <div className="space-y-4 pt-4 border-t border-zinc-800">
                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Panel de Gestión</h5>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Points Delta */}
                                <div className="space-y-2">
                                    <label htmlFor="points-add" className="text-[11px] font-bold text-gray-500 uppercase">Modificar Puntos (Delta)</label>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 space-y-1">
                                            <span className="text-[9px] text-gray-600 font-bold uppercase">Sumar</span>
                                            <Input
                                                id="points-add"
                                                type="number"
                                                value={mutation.addPoints}
                                                onChange={e => setMutation({ ...mutation, addPoints: parseInt(e.target.value) || 0 })}
                                                className="bg-zinc-950 border-zinc-800 h-9"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <span className="text-[9px] text-gray-600 font-bold uppercase">Restar</span>
                                            <Input
                                                id="points-subtract"
                                                type="number"
                                                value={mutation.subtractPoints}
                                                onChange={e => setMutation({ ...mutation, subtractPoints: parseInt(e.target.value) || 0 })}
                                                className="bg-zinc-950 border-zinc-800 h-9"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Role Selection */}
                                <div className="space-y-2">
                                    <label htmlFor="user-role" className="text-[11px] font-bold text-gray-500 uppercase">Rol de Usuario</label>
                                    <select
                                        id="user-role"
                                        value={mutation.role}
                                        onChange={e => setMutation({ ...mutation, role: e.target.value as any })}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-md h-9 text-sm px-2 text-white"
                                    >
                                        <option value="USER">USER</option>
                                        <option value="MODERATOR">MODERATOR</option>
                                        <option value="ADMIN">ADMIN</option>
                                    </select>
                                </div>

                                {/* Tags Management */}
                                <div className="space-y-2 md:col-span-2">
                                    <label htmlFor="user-tags" className="text-[11px] font-bold text-gray-500 uppercase">Etiquetas (Separadas por Coma)</label>
                                    <Input
                                        id="user-tags"
                                        value={mutation.tags.join(", ")}
                                        onChange={e => setMutation({ ...mutation, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                                        placeholder="VIP, Partner, Ambassador..."
                                        className="bg-zinc-950 border-zinc-800"
                                    />
                                </div>

                                {/* Frozen Toggle */}
                                <div className="md:col-span-2 flex items-center justify-between p-3 bg-red-950/10 border border-red-900/20 rounded-lg">
                                    <div>
                                        <p className="text-xs font-bold text-red-400">Estado de Congelación (Frozen)</p>
                                        <p className="text-[10px] text-gray-500">Si está frozen, el usuario no podrá realizar mints ni sumar puntos.</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant={mutation.isFrozen ? "destructive" : "outline"}
                                        onClick={() => setMutation({ ...mutation, isFrozen: !mutation.isFrozen })}
                                        className="h-8"
                                    >
                                        {mutation.isFrozen ? "Frozen (On)" : "Normal (Off)"}
                                    </Button>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11"
                                onClick={handleUpdate}
                                disabled={updating}
                            >
                                {updating ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                                Guardar Cambios Administrativos
                            </Button>
                        </div>
                    </div>
                )
                }
            </div>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function TelegramBridgePanel() {
    const [tab, setTab] = useState<"status" | "economy" | "analytics" | "alerts" | "playbooks" | "guide" | "users">("status");
    const [status, setStatus] = useState<BridgeStatus | null>(null);
    const [economy, setEconomy] = useState<EconomyParams | null>(null);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);
    const [editingEconomy, setEditingEconomy] = useState(false);
    const [economyDraft, setEconomyDraft] = useState<EconomyParams | null>(null);
    const [executingPlaybook, setExecutingPlaybook] = useState<string | null>(null);
    const [alerts, setAlerts] = useState<AlertsData | null>(null);
    const [showManual, setShowManual] = useState(false);
    const [evaluating, setEvaluating] = useState(false);

    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/telegram-bridge/status", { headers: authHdrs() });
            if (res.ok) setStatus(await res.json());
        } catch (e) { console.error('[BridgePanel] fetchStatus', e); } finally { setLoading(false); }
    }, []);

    const fetchEconomy = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/telegram-bridge/economy", { headers: authHdrs() });
            if (res.ok) {
                const d = await res.json();
                setEconomy(d);
                setEconomyDraft(d);
            }
        } catch (e) { console.error('[BridgePanel] fetchEconomy', e); }
    }, []);

    const fetchAlerts = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/telegram-bridge/alerts", { headers: authHdrs() });
            if (res.ok) setAlerts(await res.json());
        } catch (e) { console.error('[BridgePanel] fetchAlerts', e); }
    }, []);

    useEffect(() => {
        fetchStatus();
        fetchEconomy();
        fetchAlerts();
        const intv = setInterval(fetchStatus, 15_000);
        const alertIntv = setInterval(fetchAlerts, 30_000);
        return () => { clearInterval(intv); clearInterval(alertIntv); };
    }, [fetchStatus, fetchEconomy, fetchAlerts]);

    const handleManualEvaluate = async () => {
        setEvaluating(true);
        try {
            const res = await fetch("/api/admin/telegram-bridge/alerts/evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHdrs() },
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(`Evaluation done — fired: ${data.fired?.length ?? 0}, resolved: ${data.resolved?.length ?? 0}`);
                await fetchAlerts();
            } else { toast.error(data.error || "Evaluation failed"); }
        } catch { toast.error("Network error"); }
        finally { setEvaluating(false); }
    };

    const handleToggle = async (flagKey: string, enabled: boolean, token?: string) => {
        setToggling(true);
        try {
            const res = await fetch("/api/admin/telegram-bridge/toggle", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHdrs() },
                body: JSON.stringify({ flag: flagKey, enabled, confirmationToken: token }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                if (data.warning) toast.warning(data.warning, { duration: 8000 });
                await fetchStatus();
            } else { toast.error(data.error || "Toggle failed"); }
        } catch { toast.error("Network error"); }
        finally { setToggling(false); }
    };

    const handleSaveEconomy = async () => {
        if (!economyDraft) return;
        setToggling(true);
        try {
            const res = await fetch("/api/admin/telegram-bridge/economy", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHdrs() },
                body: JSON.stringify(economyDraft),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Economy parameters saved");
                setEconomy(economyDraft);
                setEditingEconomy(false);
                await fetchStatus();
            } else { toast.error(data.error || "Save failed"); }
        } catch { toast.error("Network error"); }
        finally { setToggling(false); }
    };

    const handlePlaybookExecute = async (pb: Playbook, token?: string) => {
        if (!pb.action) return;
        setExecutingPlaybook(pb.id);
        try {
            const res = await fetch("/api/admin/telegram-bridge/toggle", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHdrs() },
                body: JSON.stringify({ flag: pb.action.flagKey, enabled: pb.action.enabled, confirmationToken: token }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(`✓ Playbook executed: ${data.message}`);
                if (data.warning) toast.warning(data.warning, { duration: 8000 });
                await fetchStatus();
            } else { toast.error(data.error || "Execution failed"); }
        } catch { toast.error("Network error"); }
        finally { setExecutingPlaybook(null); }
    };

    const tabs = [
        { id: "status", label: "Status & Control", icon: Shield },
        { id: "users", label: "Users & Roles", icon: User },
        { id: "economy", label: "Economy", icon: Coins },
        { id: "analytics", label: "Analytics", icon: BarChart3 },
        { id: "alerts", label: "Alerts", icon: Bell, badge: alerts?.activeCount },
        { id: "playbooks", label: "Playbooks", icon: AlertTriangle },
        { id: "guide", label: "Ops Guide", icon: BookOpen },
    ] as const;

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-zinc-800 rounded-xl" />)}
            </div>
        );
    }

    // Build playbooks with executable actions
    const playbooks: Playbook[] = [
        {
            id: "disable-gamification",
            severity: "red",
            title: "🔴 Disable Telegram Gamification",
            when: "Abuse detected, unexpected volume spike, bridge audit in progress",
            steps: [
                "Click EXECUTE below — or go to Status & Control",
                "All event recording stops immediately",
                "Monitor: events/min drops to 0 within 60s",
                "Telegram App receives 403 on all /record calls",
                "Re-enable when situation resolved (no CONFIRM required to turn on)",
            ],
            impact: "All event recording stops. No points or PBOX earned. Existing balances untouched.",
            action: { label: "EXECUTE: Disable Gamification", flagKey: "gamification", enabled: false, requiresConfirm: true },
        },
        {
            id: "disable-claims",
            severity: "red",
            title: "🔴 Disable PBOX Claims",
            when: "Chain instability, signing secret rotation, protocol audit",
            steps: [
                "Click EXECUTE below (requires CONFIRM)",
                "Existing reservations remain safe in reserved state",
                "Users get 403 on claim-request — Telegram shows 'temporarily unavailable'",
                "Re-enable when chain is stable",
            ],
            impact: "No new claim proofs issued. On-chain claims already submitted continue normally.",
            action: { label: "EXECUTE: Disable Claims", flagKey: "claims", enabled: false, requiresConfirm: true },
        },
        {
            id: "paranoia-mode",
            severity: "red",
            title: "🔴 Activate Paranoia Mode",
            when: "Suspected abuse, launch day, incident response, security audit",
            steps: [
                "Click EXECUTE (requires CONFIRM)",
                "Rate-limits tighten automatically",
                "Economy becomes read-only",
                "Forensic webhooks enabled",
                "Claims require extra delay",
                "Deactivate via Status tab when safe",
            ],
            impact: "Maximum protection posture. Some UX degradation expected. All operations still logged.",
            action: { label: "EXECUTE: Activate Paranoia Mode", flagKey: "paranoiaMode", enabled: true, requiresConfirm: true },
        },
        {
            id: "webhook-failure",
            severity: "yellow",
            title: "🟡 Webhook Delivery Failure",
            when: "Webhook success rate < 95%, DLQ growing, pending queue large",
            steps: [
                "Check Analytics → webhook pending count and failed count",
                "Gamification recording NOT affected — Core continues working normally",
                "Telegram App will show 'pending confirmation' to users (no balance corruption)",
                "Go to Operations Panel → use Manual Event Replay for critical events",
                "Root cause: verify TELEGRAM_WEBHOOK_URL and TELEGRAM_WEBHOOK_SECRET",
                "DLQ drains automatically via retry mechanism when target is back",
            ],
            impact: "No balance corruption. Users see delayed UI feedback. Zero data loss.",
        },
        {
            id: "secret-rotation",
            severity: "yellow",
            title: "🟡 Rotate PBOX Claim Signing Secret",
            when: "Secret potentially leaked, scheduled rotation, security audit",
            steps: [
                "Disable Claims (prevents claims with old secret during window)",
                "Generate new secret: openssl rand -hex 32",
                "Update PBOX_CLAIM_SIGNING_SECRET in environment",
                "Redeploy Core",
                "Re-enable Claims",
            ],
            impact: "15-minute claim-disabled window. Old signatures auto-expire. No balance effects.",
        },
        {
            id: "economy-adjustment",
            severity: "blue",
            title: "🔵 Adjust PBOX Economy",
            when: "Token supply adjustment, campaign multiplier, economy rebalancing",
            steps: [
                "Go to Economy tab",
                "Edit parameters — check Impact Preview before confirming",
                "Always bump conversionVersion when changing pointsPerPbox",
                "Click Save",
                "Monitor Analytics → balances reflect update on next events",
            ],
            impact: "Zero downtime. Old balances remain auditable via conversionVersion field.",
        },
    ];

    const bridgeFlags = status?.flags ?? {};

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Telegram Bridge Control</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Authority layer — Telegram obeys, we decide
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {bridgeFlags.paranoiaMode && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full">
                            <Skull className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                            <span className="text-[11px] font-bold text-red-400">PARANOIA MODE</span>
                        </div>
                    )}
                    <Button onClick={() => setShowManual(true)} variant="outline" size="sm" className="gap-2 border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                        <FileText className="w-3.5 h-3.5" />
                        Manual del Admin
                    </Button>
                    <Button onClick={() => { fetchStatus(); fetchEconomy(); }} variant="outline" size="sm" className="gap-2">
                        <RefreshCw className="w-3.5 h-3.5" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* ── Admin Manual Modal ────────────────────────────────────────── */}
            {showManual && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-zinc-900 border border-zinc-700/50 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden slide-in-bottom">
                        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Manual del Administrador: Sistema Standalone (Telegram First)</h2>
                                    <p className="text-xs text-gray-400">Guía operativa completa para la gestión y resolución de incidentes del Bridge.</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowManual(false)} className="text-gray-400 hover:text-white hover:bg-zinc-800 rounded-full h-8 w-8">
                                <XCircle className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-zinc-950/50">

                            {/* Section 1: Architecture */}
                            <section>
                                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
                                    <Shield className="w-4 h-4 text-purple-400" />
                                    1. Arquitectura Standalone (Telegram First)
                                </h3>
                                <div className="space-y-4 text-sm text-gray-300">
                                    <p>
                                        El sistema ahora prioriza a los usuarios que ingresan directamente desde Telegram
                                        (<strong className="text-white">Shadow Users</strong>). No es mandatorio que conecten una Wallet Web3 de inmediato.
                                    </p>
                                    <div className="bg-zinc-900 p-4 border border-zinc-800 rounded-lg space-y-2">
                                        <h4 className="font-semibold text-white">Estados del Usuario:</h4>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li><strong className="text-blue-400">Standalone:</strong> Usuario solo tiene cuenta de Telegram (id tipo <code>tg-1234...</code> en la DB del Core). Puede comprar acceso con tarjeta o crypto-bot, pero NO puede mintear NFTs ni cobrar tokens PBOX.</li>
                                            <li><strong className="text-yellow-400">Connected Wallet:</strong> Usuario Standalone que conectó su Metamask/Rabby en la MiniApp para firmar y cobrar PBOX localmente en el Bridge, pero NO vinculó su cuenta web central.</li>
                                            <li><strong className="text-green-400">Linked Identity:</strong> El usuario unificó su cuenta Standalone con su cuenta principal de Pandoras Web introduciendo el "Challenge Code" en el Dashboard. Mints automáticos habilitados.</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            {/* Section 2: Kill Switches & Status */}
                            <section>
                                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
                                    <Power className="w-4 h-4 text-red-500" />
                                    2. Kill Switches y Paranoia Mode
                                </h3>
                                <p className="text-sm text-gray-300 mb-3">
                                    En la pestaña "Status & Control" encontrarás interruptores críticos de emergencia. Todo cambio aquí es inmediato.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                    <div className="p-3 border border-red-900/30 bg-red-950/10 rounded-lg">
                                        <strong className="text-red-400 block mb-1">Paranoia Mode</strong>
                                        Actívalo bajo sospecha de ataque de bots o vulnerabilidad. Activa rate-limits severos, bloquea modificaciones a la economía y pausa entregas no críticas.
                                    </div>
                                    <div className="p-3 border border-yellow-900/30 bg-yellow-950/10 rounded-lg">
                                        <strong className="text-yellow-400 block mb-1">Telegram Gamification</strong>
                                        Apagadlo si alguien encuentra un exploit para farmear puntos falsos. Se detiene el sistema de XP pero el Bridge de pagos sigue operando.
                                    </div>
                                    <div className="p-3 border border-blue-900/30 bg-blue-950/10 rounded-lg">
                                        <strong className="text-blue-400 block mb-1">PBOX Claims</strong>
                                        Si la blockchain está caída, congestionada, o si rotaste el Secreto de Firma, apaga temporalmente para evitar que los usuarios pierdan gas en fallas.
                                    </div>
                                    <div className="p-3 border border-gray-700 bg-zinc-800/40 rounded-lg">
                                        <strong className="text-gray-300 block mb-1">Free Mint</strong>
                                        Deshabilita el minting promocional gratuito. Solo los pagos aprobados por webhook permitirán accesos.
                                    </div>
                                </div>
                            </section>

                            {/* Section 3: Economy & Gamification */}
                            <section>
                                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
                                    <Coins className="w-4 h-4 text-lime-400" />
                                    3. Gestión de la Economía ($PBOX)
                                </h3>
                                <div className="space-y-3 text-sm text-gray-300">
                                    <p>Desde la pestaña <strong>Economy</strong> puedes ajustar el multiplicador de recompensas.</p>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li><strong>Points per PBOX:</strong> Cuántos puntos de "XP" en Telegram equivalen a 1 PBOX desbloqueado. Si lo bajas, haces el token más abundante.</li>
                                        <li><strong className="text-yellow-400">¡CRÍTICO!:</strong> Si haces cambios a las métricas monetarias, <strong>DEBES</strong> incrementar el "Conversion Version". Si no lo haces, romperás los cálculos retrospectivos de los balances no reclamados.</li>
                                        <li>Antes de guardar, revisa el componente "Impact Preview" que te muestra cómo afectará tu cambio basándose en los datos analíticos formados las últimas 24 horas.</li>
                                    </ul>
                                </div>
                            </section>

                            {/* Section 4: User Roles & Tags */}
                            <section>
                                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
                                    <User className="w-4 h-4 text-blue-400" />
                                    4. Gestión de Usuarios y Roles
                                </h3>
                                <div className="space-y-3 text-sm text-gray-300">
                                    <p>Desde la pestaña <strong>Users & Roles</strong> puedes buscar perfiles mediante su Telegram ID o <code>@username</code>.</p>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li><strong>Sumar/Restar Puntos:</strong> Úsalo como compensación o penalización. Reflejará directamente en la XP del usuario.</li>
                                        <li><strong>Congelación (Freeze):</strong> Marca a un usuario como <code>Frozen</code> si detectas actividad sospechosa en su ID. Perderá inmediatamente la capacidad de comprar o mintear usando las APIs.</li>
                                        <li><strong>Etiquetas (Tags):</strong> Puedes asignar "Partner", "VIP" u otras de forma libre. Modifica el UI que el usuario ve dentro de Telegram.</li>
                                        <li><strong>Roles:</strong> Asigna "ADMIN" a tu equipo para saltar bloqueos o acceder a hooks de test.</li>
                                    </ul>
                                    <p className="p-3 bg-zinc-900 border border-zinc-800 border-l-2 border-l-blue-500 rounded text-xs mt-2 text-gray-400">
                                        Nota: Si la identidad Standalone ya se fusionó a una cuenta web (Linked), las prohibiciones de cuentas web también caerán en cascada gracias al middleware híbrido, pero congelarlo explícitamente desde aquí detiene su uso dentro de la MiniApp de forma rotunda.
                                    </p>
                                </div>
                            </section>

                            {/* Section 5: Webhooks & Discord */}
                            <section>
                                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
                                    <Bell className="w-4 h-4 text-orange-400" />
                                    5. Alertas (Discord) y Telemetría
                                </h3>
                                <div className="space-y-3 text-sm text-gray-300">
                                    <p>
                                        El Bridge es auto-reportante. Los incidentes críticos de firmas criptográficas o errores 500 se filtran a <strong className="text-white">#pandoras-alerts</strong> en Discord.
                                    </p>
                                    <p>
                                        Además, el panel consolida el estatus de las respuestas de "Thirdweb" y pagos. Si la "Webhook Success Rate" cae bruscamente de 99% a menos de 50%, no entres en pánico:
                                    </p>
                                    <ul className="list-disc pl-5 space-y-1 mt-2">
                                        <li><strong>Causa Común:</strong> Cambio en la ruta (URL param) dentro del Dashboard de Thirdweb, caída global de su Engine, o problemas de latencia en Neon DB.</li>
                                        <li><strong>Solución:</strong> Revisa el "Event Forensics" (últimas 10 acciones) en la pestaña Analytics. Los webhooks fallidos suelen quedar encapsulados y pueden ser re-emitidos sin pérdida de datos ya que funcionan con una llave criptográfica de Idempotencia por transacción.</li>
                                    </ul>
                                </div>
                            </section>

                            <div className="pt-6 border-t border-zinc-800 text-center">
                                <p className="text-xs text-gray-500 font-mono">
                                    Manual v2.0 - Pandoras Bridge Control Architecture <br />
                                    (Actualizado tras el Refactor Standalone)
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Quick Health Strip */}
            {status && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard label="Gamification" icon={Zap}
                        value={bridgeFlags.gamificationEnabled ? "ON" : "OFF"}
                        sub="Event recording gate"
                        color={bridgeFlags.gamificationEnabled ? "lime" : "red"} />
                    <StatCard label="Claims" icon={Coins}
                        value={bridgeFlags.claimsEnabled ? "ON" : "OFF"}
                        sub="PBOX claim flow"
                        color={bridgeFlags.claimsEnabled ? "lime" : "red"} />
                    <StatCard label="Webhook (24h)" icon={Activity}
                        value={`${status.goldenSignals.webhooks.successRate_24h}%`}
                        sub={`${status.goldenSignals.webhooks.failed_24h} failed`}
                        color={status.goldenSignals.webhooks.successRate_24h > 95 ? "green" : status.goldenSignals.webhooks.successRate_24h > 80 ? "yellow" : "red"}
                        trend={status.goldenSignals.webhooks.successRate_24h > 95 ? "up" : "down"} />
                    <StatCard label="Actions / 1h" icon={BarChart3}
                        value={status.goldenSignals.events.accepted_1h}
                        sub={`${status.goldenSignals.events.accepted_24h} in 24h`}
                        color="blue" />
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-zinc-800">
                <div className="flex gap-1 overflow-x-auto">
                    {tabs.map(({ id, label, icon: Icon, ...rest }) => (
                        <button key={id} onClick={() => setTab(id)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap relative ${tab === id
                                ? "border-blue-400 text-blue-400"
                                : "border-transparent text-gray-400 hover:text-white"}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                            {'badge' in rest && (rest as any).badge ? (
                                <span className="ml-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold bg-red-500 text-white flex items-center justify-center">
                                    {(rest as any).badge}
                                </span>
                            ) : null}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── TAB: Status & Kill Switches ─────────────────────────────── */}
            {tab === "status" && status && (
                <div className="space-y-6">
                    {/* Golden Signals */}
                    <GoldenStrip gs={status.goldenSignals} />

                    {/* LIVE FEED (Last 60m) */}
                    <div className="bg-blue-950/20 border border-blue-900/40 rounded-xl p-4 slide-in-bottom">
                        <div className="flex items-center gap-2 mb-3">
                            <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
                            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">Live Business Feed (60m)</span>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <StatCard label="Live Intents" icon={Zap} value={status.liveMetrics?.intents || 0} sub="Last hour" color="yellow" />
                            <StatCard label="Live Payments" icon={CheckCircle} value={status.liveMetrics?.completed || 0} sub="Last hour" color="lime" />
                            <StatCard label="Live Revenue" icon={Coins} value={`$${status.liveMetrics?.revenue || 0}`} sub="Last hour" color="green" />
                            <StatCard label="Protocols Unlocked" icon={Wallet} value={status.liveMetrics?.protocolsUnlocked || 0} sub="Last hour" color="purple" />
                        </div>
                    </div>

                    {/* Kill Switches */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-yellow-400" />
                            Feature Flags — Kill Switches
                        </h4>
                        <div className="space-y-3">
                            <FlagToggle label="Paranoia Mode" flagKey="paranoiaMode"
                                enabled={!!bridgeFlags.paranoiaMode} requireConfirmBothWays loading={toggling}
                                description="Maximum protection posture: tightened rate-limits, read-only economy, forensic webhooks. Requires CONFIRM to activate or deactivate."
                                onToggle={handleToggle} />
                            <FlagToggle label="Telegram Gamification" flagKey="gamification"
                                enabled={!!bridgeFlags.gamificationEnabled} loading={toggling}
                                description="Master gate. Disabling stops ALL event recording. Events won't be processed or scored."
                                onToggle={handleToggle} />
                            <FlagToggle label="PBOX Claims" flagKey="claims"
                                enabled={!!bridgeFlags.claimsEnabled} loading={toggling}
                                description="Controls /api/pbox/claim-request. Disable during chain instability or bridge audits."
                                onToggle={handleToggle} />
                            <FlagToggle label="Protocol Read-Only Access" flagKey="protocolReadonly"
                                enabled={!!bridgeFlags.protocolReadonly} loading={toggling}
                                description="Controls GET /api/telegram/protocol/:slug. Always safe to toggle."
                                onToggle={handleToggle} />
                            <FlagToggle label="Free Artifact Minting" flagKey="mintFreeArtifact"
                                enabled={!!bridgeFlags.mintFreeArtifact} loading={toggling}
                                description="Allows minting free artifacts via Telegram. Does not affect paid artifacts."
                                onToggle={handleToggle} />
                        </div>
                    </div>

                    {/* PBOX Summary */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-purple-400" />
                            PBOX Off-Chain Balances
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <StatCard label="Active Wallets" icon={Wallet} value={status.pbox.activeWallets} color="purple" />
                            <StatCard label="Total Earned" icon={Coins} value={status.pbox.totalEarned} sub="PBOX units" color="lime" />
                            <StatCard label="Reserved" icon={Activity} value={status.pbox.totalReserved} sub="Pending claims" color="yellow" />
                            <StatCard label="Claimed" icon={CheckCircle} value={status.pbox.totalClaimed} sub="On-chain settled" color="green" />
                        </div>
                    </div>

                    {/* Bindings */}
                    <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-5 flex items-center justify-between">
                        <div>
                            <div className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                                <MessageCircle className="w-4 h-4 text-blue-400" />
                                Wallet ↔ Telegram Bindings
                            </div>
                            <p className="text-xs text-gray-400">Total bound users.</p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-blue-400">{status.bindings.total}</div>
                            <div className="text-xs text-gray-400">+{status.bindings.newLast24h} today</div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB: Economy ────────────────────────────────────────────── */}
            {tab === "economy" && economy && economyDraft && (
                <div className="space-y-5">
                    {/* Paranoia read-only notice */}
                    {bridgeFlags.paranoiaMode && (
                        <div className="flex items-center gap-3 p-3 bg-red-950/20 border border-red-900/30 rounded-xl">
                            <Skull className="w-4 h-4 text-red-400 flex-shrink-0" />
                            <p className="text-xs text-red-400 font-semibold">
                                Economy is read-only in Paranoia Mode. Deactivate Paranoia Mode to make changes.
                            </p>
                        </div>
                    )}

                    <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h4 className="font-semibold text-white mb-1 flex items-center gap-2">
                                    <Coins className="w-4 h-4 text-lime-400" />
                                    PBOX Economy Parameters
                                </h4>
                                <p className="text-xs text-gray-400">
                                    V{economy.conversionVersion} — changes apply to new deltas only.
                                </p>
                            </div>
                            {!editingEconomy && !bridgeFlags.paranoiaMode ? (
                                <Button size="sm" variant="outline" onClick={() => setEditingEconomy(true)}>Edit</Button>
                            ) : editingEconomy ? (
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={handleSaveEconomy} disabled={toggling}
                                        className="bg-lime-600 hover:bg-lime-700 text-black font-bold">
                                        Save
                                    </Button>
                                    <Button size="sm" variant="outline"
                                        onClick={() => { setEditingEconomy(false); setEconomyDraft(economy); }}>
                                        Cancel
                                    </Button>
                                </div>
                            ) : null}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {[
                                { key: "pointsPerPbox", label: "Points per PBOX", description: "Points required to earn 1 PBOX unit", unit: "pts", min: 1 },
                                { key: "conversionVersion", label: "Conversion Version", description: "Bump when changing economy formula", unit: "v", min: 1 },
                                { key: "dailyCapPerWallet", label: "Daily Cap per Wallet", description: "Max PBOX/day per wallet (0 = unlimited)", unit: "PBOX", min: 0 },
                                { key: "defaultChainId", label: "Default Chain ID", description: "Chain for PBOX claim signing (anti-replay)", unit: "chain", min: 1 },
                            ].map(({ key, label, description, unit, min }) => (
                                <div key={key} className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{label}</label>
                                    <p className="text-[11px] text-gray-500">{description}</p>
                                    {editingEconomy ? (
                                        <div className="flex items-center gap-2">
                                            <Input type="number" min={min}
                                                value={(economyDraft as any)[key]}
                                                onChange={e => setEconomyDraft({ ...economyDraft, [key]: parseInt(e.target.value) })}
                                                className="bg-zinc-900 border-zinc-600 text-white w-28" />
                                            <span className="text-xs text-gray-400">{unit}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-lime-400 font-bold text-lg">
                                            {(economy as any)[key]}
                                            <span className="text-xs text-gray-400 font-normal">{unit}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Impact Preview */}
                        {editingEconomy && status && (
                            <div className="mt-5">
                                <EconomyPreview
                                    draft={economyDraft}
                                    current={economy}
                                    eventsLast24h={status.goldenSignals.events.accepted_24h}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── TAB: Analytics ──────────────────────────────────────────── */}
            {tab === "analytics" && status && (
                <div className="space-y-6">
                    {/* Golden signals expanded */}
                    <GoldenStrip gs={status.goldenSignals} />

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <StatCard label="Actions (total)" icon={Zap} value={status?.events?.total ?? 0} color="blue" />
                        <StatCard label="Actions (24h)" icon={Activity} value={status?.goldenSignals?.events?.accepted_24h ?? 0} color="lime" />
                        <StatCard label="Actions (5m)" icon={BarChart3} value={status?.goldenSignals?.events?.accepted_5m ?? 0} sub="live rate" color="purple" />
                        <StatCard label="Webhook Success (24h)" icon={CheckCircle}
                            value={`${status?.goldenSignals?.webhooks?.successRate_24h ?? 0}%`}
                            sub={`${status?.webhooks?.successLast24h ?? 0} sent`}
                            color={(status?.goldenSignals?.webhooks?.successRate_24h ?? 0) > 95 ? "green" : "yellow"} />
                        <StatCard label="Webhook Failed" icon={XCircle}
                            value={status?.goldenSignals?.webhooks?.failed_24h ?? 0}
                            sub="last 24h"
                            color={(status?.goldenSignals?.webhooks?.failed_24h ?? 0) === 0 ? "green" : "red"} />
                        <StatCard label="Webhook Pending" icon={RefreshCw}
                            value={status?.goldenSignals?.webhooks?.pending ?? 0}
                            sub="in queue"
                            color={(status?.goldenSignals?.webhooks?.pending ?? 0) === 0 ? "green" : "yellow"} />
                        <StatCard label="Pmt. Intents" icon={Wallet}
                            value={status?.conversion?.intents ?? 0}
                            sub="Total created"
                            color="blue" />
                        <StatCard label="Pmt. Completed" icon={CheckCircle}
                            value={status?.conversion?.completed ?? 0}
                            sub={`${status?.conversion?.rate ?? 0}% conversion`}
                            color="green" />
                        <StatCard label="Pmt. Failed" icon={XCircle}
                            value={status?.conversion?.failed ?? 0}
                            sub="Rejected/Refused"
                            color="red" />
                        <StatCard label="Execution Latency" icon={Zap}
                            value={`${(status as any)?.latency_p95_ms ?? 0}ms`}
                            sub="P95 last 5m"
                            color={((status as any)?.latency_p95_ms ?? 0) < 300 ? "green" : ((status as any)?.latency_p95_ms ?? 0) < 500 ? "yellow" : "red"} />
                    </div>

                    {/* Recent Events */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-3">
                            Event Forensics — Last 10 Action Executions
                        </h4>
                        {status.events.recent.length === 0 ? (
                            <div className="text-center text-gray-500 text-sm py-8">No executions yet</div>
                        ) : (
                            <div className="rounded-xl border border-zinc-700/60 overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-zinc-800/60 text-gray-400">
                                            <th className="px-4 py-2.5 text-left font-medium">Event ID</th>
                                            <th className="px-4 py-2.5 text-left font-medium">Action Type</th>
                                            <th className="px-4 py-2.5 text-left font-medium">Wallet</th>
                                            <th className="px-4 py-2.5 text-left font-medium">Executed At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {status.events.recent.map((e: any, i: number) => (
                                            <tr key={i} className="border-t border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                                                <td className="px-4 py-2 text-gray-300 font-mono">
                                                    {e.eventId?.slice(0, 12) ?? "—"}…
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className="bg-blue-400/10 text-blue-400 px-2 py-0.5 rounded-full">
                                                        {e.actionType ?? "—"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-gray-400 font-mono">
                                                    {e.userId?.slice(0, 8) ?? "—"}…
                                                </td>
                                                <td className="px-4 py-2 text-gray-500">
                                                    {e.executedAt ? new Date(e.executedAt).toLocaleString() : "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── TAB: Alerts ─────────────────────────────────────────────── */}
            {tab === "alerts" && (
                <div className="space-y-6">
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Bell className={`w-5 h-5 ${alerts?.activeCount ? "text-red-400 animate-pulse" : "text-gray-400"}`} />
                            <div>
                                <h4 className="font-semibold text-white text-sm">Alert Rules Engine</h4>
                                <p className="text-[11px] text-gray-400">
                                    Evaluates 8 rules every 30s · Fires to Discord #pandoras-alerts
                                </p>
                            </div>
                        </div>
                        <Button size="sm" disabled={evaluating} onClick={handleManualEvaluate}
                            className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-700/40 gap-2">
                            {evaluating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                            Run Evaluation
                        </Button>
                    </div>

                    {/* Active Alerts */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Active Alerts</h5>
                            {alerts?.activeCount ? (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                    {alerts.activeCount}
                                </span>
                            ) : (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-400">
                                    All clear
                                </span>
                            )}
                        </div>

                        {!alerts?.active?.length ? (
                            <div className="text-center py-10 bg-zinc-800/30 border border-zinc-700/40 rounded-xl">
                                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-400">No active alerts</p>
                                <p className="text-[11px] text-gray-500 mt-1">All rules evaluating normally</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {alerts.active.map(a => {
                                    const severityColors = {
                                        critical: "border-red-900/50 bg-red-950/20",
                                        warning: "border-yellow-900/50 bg-yellow-950/20",
                                        info: "border-blue-900/50 bg-blue-950/20",
                                    };
                                    const textColors = {
                                        critical: "text-red-400",
                                        warning: "text-yellow-400",
                                        info: "text-blue-400",
                                    };
                                    return (
                                        <div key={a.alertId}
                                            className={`rounded-xl border p-4 ${severityColors[a.severity]}`}>
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-base">{a.emoji}</span>
                                                        <span className={`text-sm font-bold ${textColors[a.severity]}`}>{a.title}</span>
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${textColors[a.severity]} bg-current/10 border border-current/20`}>
                                                            {a.severity.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    {a.suggestedAction && (
                                                        <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-amber-400">
                                                            <Zap className="w-3 h-3" />
                                                            SUGGESTED ACTION: {a.suggestedAction}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-500 mt-2">
                                                        <span>ID: <code className="text-gray-400 font-mono">{a.alertId}</code></span>
                                                        <span>Fired: <span className="text-gray-300 font-semibold">{a.triggerCount}×</span> total</span>
                                                        {a.timesFired24h > 0 && (
                                                            <span>Last 24h: <span className="text-gray-300 font-semibold">{a.timesFired24h}×</span></span>
                                                        )}
                                                        {a.firstSeenAt && (
                                                            <span>First seen: {new Date(a.firstSeenAt).toLocaleDateString()}</span>
                                                        )}
                                                        {a.lastTriggeredAt && (
                                                            <span className="text-blue-400">Last: {new Date(a.lastTriggeredAt).toLocaleTimeString()}</span>
                                                        )}
                                                        {a.cooldownMinutes > 0 && (
                                                            <span className="text-zinc-500">Cooldown: {a.cooldownMinutes}m</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {a.playbook && (
                                                    <button
                                                        onClick={() => setTab("playbooks")}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-700/60 hover:bg-zinc-600/60 text-white transition-colors whitespace-nowrap">
                                                        <ExternalLink className="w-3 h-3" />
                                                        Playbook
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Alert History */}
                    {alerts?.resolved && alerts.resolved.length > 0 && (
                        <div>
                            <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">Recent History</h5>
                            <div className="rounded-xl border border-zinc-700/60 overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-zinc-800/60 text-gray-400">
                                            <th className="px-4 py-2.5 text-left font-medium">Alert</th>
                                            <th className="px-4 py-2.5 text-left font-medium">Severity</th>
                                            <th className="px-4 py-2.5 text-left font-medium">Times Fired</th>
                                            <th className="px-4 py-2.5 text-left font-medium">Last Resolved</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {alerts.resolved.filter(a => a.triggerCount > 0).map(a => (
                                            <tr key={a.alertId}
                                                className="border-t border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                                                <td className="px-4 py-2">
                                                    <span className="text-gray-300">{a.emoji} {a.title}</span>
                                                    <div className="text-[10px] text-gray-500 font-mono">{a.alertId}</div>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className={`font-semibold ${a.severity === 'critical' ? 'text-red-400' : a.severity === 'warning' ? 'text-yellow-400' : 'text-blue-400'}`}>
                                                        {a.severity}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-gray-400">{a.triggerCount}</td>
                                                <td className="px-4 py-2 text-gray-500">
                                                    {a.lastResolvedAt ? new Date(a.lastResolvedAt).toLocaleString() : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Discord config notice */}
                    <div className="p-3 bg-zinc-900/50 border border-zinc-700/30 rounded-lg flex items-start gap-3">
                        <Bell className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div className="text-[11px] text-gray-500">
                            Notifications sent to <code className="text-gray-400">DISCORD_WEBHOOK_PANDORAS_ALERTS</code>.
                            Set this env var to activate. Alerts fire on new trigger and auto-resolve when condition clears.
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB: Playbooks ──────────────────────────────────────────── */}
            {tab === "playbooks" && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                        <Play className="w-3.5 h-3.5 text-orange-400" />
                        Playbooks with &quot;EXECUTE&quot; buttons call the API directly. No manual steps needed.
                    </div>
                    {playbooks.map(pb => (
                        <PlaybookCard key={pb.id} playbook={pb}
                            onExecute={handlePlaybookExecute}
                            executing={executingPlaybook} />
                    ))}
                </div>
            )}

            {/* ── TAB: Users & Roles ─────────────────────────────────────────── */}
            {tab === "users" && (
                <div className="space-y-6">
                    <TelegramUsersManager />
                </div>
            )}

            {/* ── TAB: Ops Guide ──────────────────────────────────────────── */}
            {tab === "guide" && <OperationsGuide />}
        </div>
    );
}
