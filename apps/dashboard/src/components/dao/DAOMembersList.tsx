"use client";

import { User, Shield, Calendar, Award } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import useSWR from "swr";

interface Member {
    id: number;
    wallet: string;
    votingPower: string;
    artifactsCount: number;
    joinedAt: string;
    lastActiveAt: string;
}

interface DAOMembersListProps {
    projectId: number;
    licenseContract?: any;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function DAOMembersList({ projectId }: DAOMembersListProps) {
    const { data: members, error, isLoading } = useSWR<Member[]>(
        projectId ? `/api/dao/members?projectId=${projectId}` : null,
        fetcher,
        { refreshInterval: 60000 }
    );

    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-zinc-800/50 rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-500" />
                    Directorio de Miembros
                </h3>
                <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs font-bold rounded-full border border-purple-500/20">
                    {members?.length || 0} Activos
                </span>
            </div>

            {members && members.length > 0 ? (
                <div className="grid gap-3">
                    {members.map((member, idx) => (
                        <div key={member.id} className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:bg-zinc-800/50 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center border border-zinc-700 group-hover:border-purple-500/50 transition-colors">
                                    <User className="w-5 h-5 text-zinc-400 group-hover:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-mono text-zinc-300 group-hover:text-white transition-colors">
                                        {member.wallet.slice(0, 6)}...{member.wallet.slice(-4)}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                            idx === 0 ? 'bg-orange-500/10 text-orange-400' : 'bg-zinc-800 text-zinc-500'
                                        }`}>
                                            {idx === 0 ? 'Top Holder' : 'Miembro'}
                                        </span>
                                        <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                                            <Award className="w-3 h-3" />
                                            {member.artifactsCount} Artefactos
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                                    Poder de Voto
                                </p>
                                <p className="text-sm text-purple-400 font-black font-mono">
                                    {Number(member.votingPower).toFixed(0)}
                                </p>
                            </div>
                        </div>
                    ))}
                    
                    {members.length >= 50 && (
                        <p className="text-center text-xs text-zinc-500 mt-4 italic">
                            Mostrando los primeros 50 miembros.
                        </p>
                    )}
                </div>
            ) : (
                <div className="text-center py-12 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl">
                    <Shield className="w-12 h-12 text-zinc-700 mx-auto mb-4 opacity-20" />
                    <p className="text-zinc-500 font-medium">No se encontraron miembros activos aún.</p>
                </div>
            )}
        </div>
    );
}

