'use client';

import { useAuth } from "@/components/auth/AuthProvider";
import { Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 🏷️ Access Badge Component
 * ============================================================================
 * Displays the user's benefits tier with high-fidelity micro-animations.
 * ============================================================================
 */
export function AccessBadge({ className }: { className?: string }) {
  const { user } = useAuth();

  if (!user?.benefitsTier) return null;

  const isGenesis = user.benefitsTier === 'genesis';

  return (
    <div className={cn(
      "inline-flex items-center space-x-2 px-3 py-1 rounded-full border transition-all duration-500",
      isGenesis 
        ? "bg-lime-500/5 border-lime-500/20 text-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.1)]" 
        : "bg-blue-500/5 border-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]",
      className
    )}>
      {isGenesis ? (
        <Zap className="w-3 h-3 animate-pulse" />
      ) : (
        <ShieldCheck className="w-3 h-3" />
      )}
      <span className="text-[9px] font-black tracking-[0.2em] uppercase">
        {isGenesis ? 'Genesis' : 'Standard'}
      </span>
    </div>
  );
}
