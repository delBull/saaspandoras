"use client";

import {
    HomeIcon,
    VoteIcon,
    CoinsIcon,
    UsersIcon,
    SettingsIcon,
    ShieldCheckIcon,
    HelpCircleIcon,
    MessageSquare
} from "lucide-react";

import { cn } from "@/lib/utils";
import Link from "next/link";

interface DAOSidebarProps {
    project: any;
    activeView: string;
    onViewChange: (view: string) => void;
    isOwner?: boolean;
    votingPower?: number;
    className?: string;
}

export function DAOSidebar({
    project,
    activeView,
    onViewChange,
    isOwner = false,
    votingPower = 0,
    className
}: DAOSidebarProps) {

    const navItems = [
        { id: 'overview', label: 'Resumen DAO', icon: HomeIcon },
        { id: 'proposals', label: 'Propuestas y Votación', icon: VoteIcon },
        { id: 'chat', label: 'Foro Global', icon: MessageSquare }, // New Chat Item
        { id: 'staking', label: 'Utilidad y Recompensas', icon: CoinsIcon },
        { id: 'members', label: 'Miembros', icon: UsersIcon },
        { id: 'info', label: 'Información y Ayuda', icon: HelpCircleIcon },
    ];

    return (
        <div className={cn("w-80 bg-zinc-900 border-l border-zinc-800 p-6 flex flex-col h-full sticky top-24", className)}>
            {/* Header */}
            <div className="mb-8">
                <h3 className="text-lime-400 font-bold uppercase tracking-wider text-xs mb-2">Protocolo DAO</h3>
                <h2 className="text-xl font-bold text-white leading-tight">{project.title}</h2>
                <div className="mt-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-green-900/30 border border-green-500/30 text-green-400 text-xs rounded-full flex items-center gap-1">
                        <ShieldCheckIcon className="w-3 h-3" /> Verificado
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-2 flex-1">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onViewChange(item.id)}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium",
                            activeView === item.id
                                ? "bg-lime-500/10 text-lime-400 border border-lime-500/20"
                                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                        )}
                    >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                    </button>
                ))}
            </nav>

            {/* User Stats */}
            <div className="mt-8 pt-8 border-t border-zinc-800">
                <h4 className="text-zinc-500 text-xs font-bold uppercase mb-4">Mis Estadísticas</h4>
                <div className="space-y-4 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50">
                    <div className="flex justify-between items-center">
                        <span className="text-zinc-400 text-sm">Poder de Voto</span>
                        <span className="text-white font-mono font-bold">{votingPower.toLocaleString()} VP</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-zinc-400 text-sm">Delegado</span>
                        <span className="text-zinc-500 font-mono">--</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-2">
                        <div className="bg-lime-500 h-full w-[0%]" />
                    </div>
                    <p className="text-[10px] text-zinc-500 text-center">Nivel de Participación: Básico</p>
                </div>
            </div>

            {/* Owner Actions */}
            {isOwner && (
                <div className="mt-6">
                    <button
                        onClick={() => onViewChange('manage')}
                        className={cn(
                            "w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors font-medium border border-zinc-700",
                            activeView === 'manage' && "bg-lime-900/20 border-lime-500/50 text-lime-400"
                        )}
                    >
                        <SettingsIcon className="w-4 h-4" />
                        Administrar DAO
                    </button>
                </div>
            )}
        </div>
    );
}
