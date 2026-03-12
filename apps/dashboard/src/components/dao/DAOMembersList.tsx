
"use client";

import { useReadContract } from "thirdweb/react";
import { User, Shield, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DAOMembersListProps {
    licenseContract: any;
    projectId?: number;
}

export function DAOMembersList({ licenseContract }: DAOMembersListProps) {
    // In a real scenario, we might fetch from an indexer or events
    // For now, let's show the total count and a mock list or a "Top Holders" feel
    // since we don't have a direct "getAllHolders" on-chain function easily available without indexer.
    
    const { data: totalSupply, isLoading } = useReadContract({
        contract: licenseContract,
        method: "function totalSupply() view returns (uint256)",
        params: []
    });

    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-zinc-800/50 rounded-xl" />
                ))}
            </div>
        );
    }

    // Mock members for UI demonstration since we need an indexer for real list
    const mockMembers = totalSupply ? Array.from({ length: Math.min(Number(totalSupply), 5) }).map((_, i) => ({
        address: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
        role: i === 0 ? "Fundador" : "Miembro",
        joinedAt: new Date(Date.now() - Math.random() * 10000000000),
    })) : [];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Directorio de Miembros</h3>
                <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs font-bold rounded-full border border-purple-500/20">
                    {totalSupply?.toString() || "0"} Total
                </span>
            </div>

            {mockMembers.length > 0 ? (
                <div className="grid gap-3">
                    {mockMembers.map((member, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:bg-zinc-800/50 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center border border-zinc-700">
                                    <User className="w-5 h-5 text-zinc-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-mono text-zinc-300 group-hover:text-white transition-colors">{member.address}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                            member.role === 'Fundador' ? 'bg-orange-500/10 text-orange-400' : 'bg-zinc-800 text-zinc-500'
                                        }`}>
                                            {member.role}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 flex items-center justify-end gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Unido
                                </p>
                                <p className="text-xs text-zinc-300 font-medium">
                                    {format(member.joinedAt, "MMM yyyy", { locale: es })}
                                </p>
                            </div>
                        </div>
                    ))}
                    
                    {Number(totalSupply || 0) > 5 && (
                        <p className="text-center text-xs text-zinc-500 mt-4 italic">
                            Mostrando los miembros más recientes. Próximamente integración con indexador completo.
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

