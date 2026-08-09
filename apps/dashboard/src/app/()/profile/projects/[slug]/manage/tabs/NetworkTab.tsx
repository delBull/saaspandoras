import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { UserIcon, ArrowPathIcon, CheckCircleIcon, ShieldCheckIcon, Cog6ToothIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useActiveAccount } from 'thirdweb/react';

export function NetworkTab({ project }: { project: any }) {
    const account = useActiveAccount();
    const [network, setNetwork] = useState<any[]>([]);
    const [rates, setRates] = useState<{ ambassadorCommissionRate: string; managerCommissionRate: string }>({
        ambassadorCommissionRate: project?.ambassadorCommissionRate || "4.00",
        managerCommissionRate: project?.managerCommissionRate || "3.00",
    });
    const [loading, setLoading] = useState(true);
    const [savingRates, setSavingRates] = useState(false);
    const [assigning, setAssigning] = useState<string | null>(null);

    const fetchData = async () => {
        if (!account?.address) return;
        try {
            setLoading(true);
            const res = await fetch(`/api/v1/projects/${project.id}/admin/network`, {
                headers: { 'x-wallet-address': account.address }
            });
            if (res.ok) {
                const data = await res.json();
                setNetwork(data.network || []);
                if (data.rates) {
                    setRates(data.rates);
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar la red de ventas");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [account?.address, project.id]);

    const handleSaveRates = async () => {
        if (!account?.address) return;
        try {
            setSavingRates(true);
            const res = await fetch(`/api/v1/projects/${project.id}/admin/network`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "x-wallet-address": account.address
                },
                body: JSON.stringify({
                    action: "update_rates",
                    ambassadorCommissionRate: rates.ambassadorCommissionRate,
                    managerCommissionRate: rates.managerCommissionRate,
                })
            });

            if (res.ok) {
                toast.success("Porcentajes de comisión actualizados correctamente");
                fetchData();
            } else {
                toast.error("Error al guardar comisiones");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error de conexión");
        } finally {
            setSavingRates(false);
        }
    };

    const handleAssignManager = async (ambassadorId: string, managerId: string) => {
        if (!account?.address) {
            toast.error("Conecta tu wallet como creador del proyecto.");
            return;
        }

        try {
            setAssigning(ambassadorId);

            // 🛡️ Free Off-Chain Wallet Signature Confirmation
            const message = `Pandoras Admin Action\nProject: ${project.id}\nAssign Manager: ${managerId || 'NONE'}\nAmbassador: ${ambassadorId}`;
            let signature = '';
            
            try {
                toast.loading("Firma en tu wallet para confirmar la asignación...", { id: "sign-toast" });
                signature = await account.signMessage({ message });
                toast.dismiss("sign-toast");
            } catch (sigErr) {
                toast.dismiss("sign-toast");
                toast.error("Firma cancelada. No se realizó ningún cambio.");
                setAssigning(null);
                return;
            }

            const res = await fetch(`/api/v1/projects/${project.id}/admin/network`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "x-wallet-address": account.address
                },
                body: JSON.stringify({
                    action: "assign_manager",
                    ambassadorId,
                    managerId: managerId || null,
                    signature,
                    message,
                    signerAddress: account.address
                })
            });

            if (res.ok) {
                toast.success("Manager asignado y firmado con éxito");
                fetchData();
            } else {
                const errData = await res.json();
                toast.error(errData.error || "Error al asignar manager");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error de conexión");
        } finally {
            setAssigning(null);
        }
    };

    if (loading) {
        return (
            <div className="py-20 flex justify-center items-center">
                <ArrowPathIcon className="w-8 h-8 text-zinc-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <UsersIcon className="w-6 h-6 text-amber-500" />
                        Red de Ventas & Gestores Patrimoniales (PSM)
                    </h3>
                    <p className="text-zinc-400 text-sm mt-1">
                        Gestiona las tasas de comisiones dinámicas del proyecto y la jerarquía de tus Partner Success Managers (PSM).
                    </p>
                </div>
                <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-mono">
                    {network.length} Embajadores Registrados
                </span>
            </div>

            {/* 1. Dynamic Commissions Config Section */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-zinc-800">
                    <Cog6ToothIcon className="w-5 h-5 text-zinc-400" />
                    <h4 className="text-lg font-bold text-white">Configuración de Comisiones del Proyecto</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-2">
                            Comisión Embajador Directo (% Ventas)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                value={rates.ambassadorCommissionRate}
                                onChange={(e) => setRates({ ...rates, ambassadorCommissionRate: e.target.value })}
                                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-amber-500 outline-none transition-colors"
                                placeholder="4.00"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-bold">%</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1">Porcentaje que recibe el gestor directo por cada compra referida.</p>
                    </div>

                    <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-2">
                            Comisión Manager PSM (% Ventas)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                value={rates.managerCommissionRate}
                                onChange={(e) => setRates({ ...rates, managerCommissionRate: e.target.value })}
                                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-amber-500 outline-none transition-colors"
                                placeholder="3.00"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-bold">%</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1">Porcentaje override que recibe el PSM si el embajador tiene un manager asignado.</p>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        onClick={handleSaveRates}
                        disabled={savingRates}
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50"
                    >
                        {savingRates ? "Guardando..." : "Guardar Porcentajes"}
                    </button>
                </div>
            </div>

            {/* 2. PSM Hierarchy & Manual Assignment Table */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <ShieldCheckIcon className="w-5 h-5 text-emerald-400" />
                        <h4 className="text-lg font-bold text-white">Asignación de PSMs (Con Firma de Wallet)</h4>
                    </div>
                    <span className="text-xs text-zinc-500">Requiere confirmación Web3 del creador</span>
                </div>

                {network.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
                        No hay embajadores registrados en este proyecto todavía.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-xs uppercase text-zinc-500 border-b border-zinc-800">
                                    <th className="pb-3 font-black tracking-wider">Embajador</th>
                                    <th className="pb-3 font-black tracking-wider">Rol</th>
                                    <th className="pb-3 font-black tracking-wider">Manager (PSM) Asignado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {network.map((amb) => (
                                    <tr key={amb.id} className="hover:bg-zinc-800/20 transition-colors">
                                        <td className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-zinc-800 rounded-lg">
                                                    <UserIcon className="w-4 h-4 text-zinc-400" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{amb.fullName}</p>
                                                    <p className="text-xs text-zinc-500 font-mono">{amb.referralCode} • {amb.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-lg border border-blue-500/20">
                                                {amb.role}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <select
                                                className="bg-black border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-500 disabled:opacity-50 w-full max-w-[240px] cursor-pointer"
                                                value={amb.managerId || ""}
                                                onChange={(e) => handleAssignManager(amb.id, e.target.value)}
                                                disabled={assigning === amb.id}
                                            >
                                                <option value="">Sin Manager (Directo)</option>
                                                {network
                                                    .filter(m => m.id !== amb.id && m.role === 'PSM')
                                                    .map(m => (
                                                        <option key={m.id} value={m.id}>
                                                            {m.fullName} ({m.referralCode})
                                                        </option>
                                                    ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
