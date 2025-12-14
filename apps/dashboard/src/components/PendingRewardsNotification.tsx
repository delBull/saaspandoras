"use client";

import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const PendingRewardsNotification = () => {
    const account = useActiveAccount();
    const address = account?.address;
    const [isVisible, setIsVisible] = useState(false);
    const [rewardCount, setRewardCount] = useState(0);

    // Mock checking for rewards - in production this would query the API or contract
    useEffect(() => {
        if (!address) return;

        // Simulate finding rewards occasionally for demo purposes
        // In real impl: fetch /api/gamification/pending-rewards or read contract
        const checkRewards = async () => {
            // For now, we disable automatic showing until the API endpoint is ready.
            // setIsVisible(true);
            // setRewardCount(1);

            // TODO: Implement actual fetch
            // const res = await fetch('/api/gamification/pending-rewards');
            // if (res.ok && (await res.json()).count > 0) setIsVisible(true);
        };

        // Delay check to not clutter startup
        const timer = setTimeout(checkRewards, 2000);
        return () => clearTimeout(timer);
    }, [address]);

    if (!isVisible || !address) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-500/20 backdrop-blur-sm"
                >
                    <div className="container mx-auto px-4 py-2 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-amber-500">
                            <Gift className="w-4 h-4 animate-bounce" />
                            <span className="font-medium">
                                ¡Tienes {rewardCount} recompensa{rewardCount !== 1 ? 's' : ''} pendiente{rewardCount !== 1 ? 's' : ''}!
                                <span className="hidden sm:inline text-muted-foreground ml-2 font-normal">
                                    Reclama tus tokens acumulados por participación.
                                </span>
                            </span>
                        </div>

                        <div className="flex items-center gap-4">
                            <Link href="/profile?tab=achievements">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs border-amber-500/50 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
                                >
                                    Ver Recompensas
                                </Button>
                            </Link>
                            <button
                                onClick={() => setIsVisible(false)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
