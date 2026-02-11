"use client";

import { useRealGamification } from "@/hooks/useRealGamification";
import { useActiveAccount } from "thirdweb/react";

export function GamificationDebugger() {
    const account = useActiveAccount();
    const gamification = useRealGamification(account?.address);

    if (process.env.NODE_ENV !== "development") return null;

    return (
        <div className="fixed bottom-4 left-4 p-4 bg-black/90 border border-green-500 rounded-lg z-50 text-xs font-mono max-w-sm overflow-auto max-h-[300px] shadow-xl">
            <h3 className="text-green-400 font-bold mb-2">Gamification Debugger</h3>
            <div className="space-y-1">
                <div>User: {account?.address?.slice(0, 6)}...</div>
                <div>Loading: {gamification.isLoading ? "YES" : "NO"}</div>
                <div>Points: {gamification.totalPoints}</div>
                <div>Level: {gamification.currentLevel} ({gamification.levelProgress}%)</div>
                <div>Achievements: {gamification.achievements.length}</div>
                <div>Leaderboard: {gamification.leaderboard.length} entries</div>
                {gamification.leaderboard.slice(0, 3).map((entry, i) => {
                    const e = entry as any;
                    return (
                        <div key={i} className="pl-2 text-[10px] text-gray-400">
                            {i + 1}. {e.username || e.walletAddress?.slice(0, 6)} ({e.totalPoints || e.points} pts)
                        </div>
                    );
                })}
                <button
                    onClick={() => gamification.refreshData()}
                    className="mt-2 px-2 py-1 bg-green-900/50 hover:bg-green-800 border border-green-700 rounded text-green-300 w-full"
                >
                    Force Refresh
                </button>
                <button
                    onClick={() => gamification.trackNewEvent("daily_login")}
                    className="mt-1 px-2 py-1 bg-blue-900/50 hover:bg-blue-800 border border-blue-700 rounded text-blue-300 w-full"
                >
                    Test Event: Login (+10)
                </button>
            </div>
        </div>
    );
}
