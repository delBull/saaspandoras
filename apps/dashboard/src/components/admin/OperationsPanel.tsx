"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@saasfly/ui/input";
import { AlertTriangle, Power, RefreshCw, Activity, Database, Clock, TrendingUp } from "lucide-react";

interface OperationsStatus {
    webhooksEnabled: boolean;
    pendingEvents: number;
    failedEvents: number;
    recentFailures: number;
    lastProcessedAt: string | null;
    errorRate: number;
}

export function OperationsPanel() {
    const [status, setStatus] = useState<OperationsStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [confirmKillSwitch, setConfirmKillSwitch] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [replayEventId, setReplayEventId] = useState("");
    const [showReplayModal, setShowReplayModal] = useState(false);

    // Auto-refresh status every 10s
    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchStatus = async () => {
        try {
            const walletAddress = getWalletAddress();
            const res = await fetch("/api/admin/operations/status", {
                headers: {
                    ...(walletAddress && {
                        "x-thirdweb-address": walletAddress,
                        "x-wallet-address": walletAddress,
                    }),
                },
            });

            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            }
        } catch (error) {
            console.error("Failed to fetch operations status:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleKillSwitchToggle = async () => {
        if (confirmText !== "CONFIRM") {
            toast.error("Type CONFIRM to proceed");
            return;
        }

        try {
            const walletAddress = getWalletAddress();
            const res = await fetch("/api/admin/operations/kill-switch", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(walletAddress && {
                        "x-thirdweb-address": walletAddress,
                        "x-wallet-address": walletAddress,
                    }),
                },
                body: JSON.stringify({
                    enabled: !status?.webhooksEnabled,
                    confirmationToken: "CONFIRM",
                }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                toast.warning(data.warning, { duration: 8000 });
                fetchStatus();
            } else {
                toast.error(data.error || "Failed to toggle kill switch");
            }
        } catch (error) {
            toast.error("Error toggling kill switch");
        } finally {
            setConfirmKillSwitch(false);
            setConfirmText("");
        }
    };

    const handleReplayEvent = async () => {
        if (!replayEventId.trim()) {
            toast.error("Enter a valid Event ID");
            return;
        }

        try {
            const walletAddress = getWalletAddress();
            const res = await fetch(`/api/admin/webhooks/${replayEventId}/replay`, {
                method: "POST",
                headers: {
                    ...(walletAddress && {
                        "x-thirdweb-address": walletAddress,
                        "x-wallet-address": walletAddress,
                    }),
                },
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || "Event queued for replay");
                setReplayEventId("");
                setShowReplayModal(false);
                fetchStatus();
            } else {
                toast.error(data.error || "Failed to replay event");
            }
        } catch (error) {
            toast.error("Error replaying event");
        }
    };

    const getWalletAddress = (): string | null => {
        if (typeof window === "undefined") return null;
        try {
            const sessionData = localStorage.getItem("wallet-session");
            if (sessionData) {
                const parsed = JSON.parse(sessionData);
                return parsed.address?.toLowerCase() || null;
            }
        } catch (e) {
            console.warn("Error getting wallet address:", e);
        }
        return null;
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-32 bg-zinc-800 rounded-lg" />
                <div className="h-64 bg-zinc-800 rounded-lg" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Activity className="w-6 h-6 text-red-400" />
                        Operations Control
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                        Emergency controls and system health monitoring
                    </p>
                </div>
                <Button
                    onClick={fetchStatus}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </Button>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Worker Status</span>
                        <Power className={`w-4 h-4 ${status?.webhooksEnabled ? 'text-green-400' : 'text-red-400'}`} />
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {status?.webhooksEnabled ? 'Active' : 'Paused'}
                    </div>
                </div>

                <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">DLQ Size</span>
                        <Database className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {status?.failedEvents || 0}
                    </div>
                </div>

                <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Error Rate (1h)</span>
                        <TrendingUp className="w-4 h-4 text-orange-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {status?.errorRate.toFixed(1)}%
                    </div>
                </div>

                <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Pending Events</span>
                        <Clock className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {status?.pendingEvents || 0}
                    </div>
                </div>
            </div>

            {/* DANGER ZONE */}
            <div className="bg-red-950/20 border-2 border-red-900/50 rounded-lg p-6">
                <div className="flex items-start gap-3 mb-6">
                    <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                    <div>
                        <h4 className="text-xl font-bold text-red-400 mb-1">⚠️ DANGER ZONE</h4>
                        <p className="text-sm text-red-300/70">
                            These actions affect production infrastructure. Use with extreme caution.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Kill Switch */}
                    <div className="bg-zinc-900/50 border border-red-900/30 rounded-lg p-5">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h5 className="font-semibold text-white mb-1 flex items-center gap-2">
                                    <Power className="w-4 h-4" />
                                    Webhook Kill Switch
                                </h5>
                                <p className="text-sm text-gray-400">
                                    {status?.webhooksEnabled
                                        ? "Pause all webhook processing. Events will remain pending."
                                        : "Resume webhook processing."}
                                </p>
                            </div>
                            {!confirmKillSwitch && (
                                <Button
                                    onClick={() => setConfirmKillSwitch(true)}
                                    variant="destructive"
                                    size="sm"
                                >
                                    {status?.webhooksEnabled ? 'Pause Webhooks' : 'Resume Webhooks'}
                                </Button>
                            )}
                        </div>

                        {confirmKillSwitch && (
                            <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-4 space-y-3">
                                <p className="text-sm text-yellow-400 font-semibold">
                                    ⚠️ Type "CONFIRM" to proceed:
                                </p>
                                <Input
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder="Type CONFIRM"
                                    className="bg-zinc-900 border-red-900/50"
                                    onKeyDown={(e) => e.key === "Enter" && handleKillSwitchToggle()}
                                />
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleKillSwitchToggle}
                                        variant="destructive"
                                        size="sm"
                                        disabled={confirmText !== "CONFIRM"}
                                    >
                                        Confirm
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setConfirmKillSwitch(false);
                                            setConfirmText("");
                                        }}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Manual Replay */}
                    <div className="bg-zinc-900/50 border border-red-900/30 rounded-lg p-5">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h5 className="font-semibold text-white mb-1 flex items-center gap-2">
                                    <RefreshCw className="w-4 h-4" />
                                    Manual Event Replay
                                </h5>
                                <p className="text-sm text-gray-400">
                                    Retry a specific failed webhook event. Use only for idempotent events.
                                </p>
                            </div>
                            {!showReplayModal && (
                                <Button
                                    onClick={() => setShowReplayModal(true)}
                                    variant="outline"
                                    size="sm"
                                    className="border-orange-900/50 text-orange-400 hover:bg-orange-950/30"
                                >
                                    Replay Event
                                </Button>
                            )}
                        </div>

                        {showReplayModal && (
                            <div className="bg-orange-950/20 border border-orange-900/50 rounded-lg p-4 space-y-3">
                                <p className="text-sm text-yellow-400">
                                    ⚠️ Only replay events that are idempotent (can be safely re-executed).
                                </p>
                                <Input
                                    value={replayEventId}
                                    onChange={(e) => setReplayEventId(e.target.value)}
                                    placeholder="Event ID (UUID)"
                                    className="bg-zinc-900 border-orange-900/50"
                                    onKeyDown={(e) => e.key === "Enter" && handleReplayEvent()}
                                />
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleReplayEvent}
                                        size="sm"
                                        className="bg-orange-600 hover:bg-orange-700"
                                    >
                                        Replay
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setShowReplayModal(false);
                                            setReplayEventId("");
                                        }}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
