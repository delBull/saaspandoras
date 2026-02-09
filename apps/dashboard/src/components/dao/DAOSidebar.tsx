"use client";

import {
    HomeIcon,
    VoteIcon,
    CoinsIcon,
    UsersIcon,
    SettingsIcon,
    ShieldCheckIcon,
    HelpCircleIcon,
    MessageSquare,
    ListTodo
} from "lucide-react";

import { cn } from "@/lib/utils";
import Link from "next/link";

interface DAOSidebarProps {
    project: any;
    activeView: string;
    onViewChange: (view: string) => void;
    isOwner?: boolean;
    votingPower?: number;
    tokenBalance?: number;
    className?: string;
}

export function DAOSidebar({
    project,
    activeView,
    onViewChange,
    isOwner = false,
    votingPower = 0,
    tokenBalance = 0,
    className
}: DAOSidebarProps) {

    // ... (navItems remian same)
    const navItems = [
        { id: 'overview', label: 'Resumen DAO', icon: HomeIcon },
        { id: 'proposals', label: 'Propuestas y Votación', icon: VoteIcon },
        { id: 'chat', label: 'Foro Global', icon: MessageSquare }, // New Chat Item
        { id: 'staking', label: 'Utilidad y Recompensas', icon: CoinsIcon },
        { id: 'members', label: 'Miembros', icon: UsersIcon },
        { id: 'info', label: 'Información y Ayuda', icon: HelpCircleIcon },
    ];

    const needsDelegation = tokenBalance > 0 && votingPower === 0;

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
                        <div className="text-right">
                            <span className={`font-mono font-bold ${needsDelegation ? 'text-yellow-400' : 'text-white'}`}>
                                {votingPower.toLocaleString()} VP
                            </span>
                        </div>
                    </div>

                    {needsDelegation && (
                        <div className="p-2 bg-yellow-900/20 border border-yellow-500/30 rounded text-xs text-yellow-200 mb-2">
                            Tienes {tokenBalance.toLocaleString()} tokens pero 0 VP.
                            <span className="block font-bold mt-1">¡Debes delegar para votar!</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                        <span className="text-zinc-400 text-sm">Balance Token</span>
                        <span className="text-white font-mono">{tokenBalance.toLocaleString()}</span>
                    </div>

                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-2">
                        <div className={`h-full w-[${Math.min((votingPower / 1000) * 100, 100)}%] bg-lime-500`} />
                    </div>
                    <p className="text-[10px] text-zinc-500 text-center">Nivel de Participación: {votingPower > 1000 ? 'Experto' : 'Básico'}</p>
                </div>
            </div>

            {/* Owner Actions */}
            {isOwner && (
                <div className="mt-6 space-y-2">
                    <p className="px-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Administración</p>

                    <button
                        onClick={() => onViewChange('activities_admin')}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl transition-colors text-sm font-medium border border-zinc-700",
                            activeView === 'activities_admin' && "bg-lime-900/20 border-lime-500/50 text-lime-400"
                        )}
                    >
                        <ListTodo className="w-4 h-4" />
                        Gestionar Misiones
                    </button>

                    <button
                        onClick={() => onViewChange('manage')}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl transition-colors text-sm font-medium border border-zinc-700",
                            activeView === 'manage' && "bg-lime-900/20 border-lime-500/50 text-lime-400"
                        )}
                    >
                        <SettingsIcon className="w-4 h-4" />
                        Configuración
                    </button>
                </div>
            )}
        </div>
    );
}
