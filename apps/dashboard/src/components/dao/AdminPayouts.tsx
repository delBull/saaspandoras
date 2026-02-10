
"use client";

import { useState, useEffect } from "react";
import { useActiveAccount, TransactionButton } from "thirdweb/react";
import { prepareTransaction, toWei, defineChain } from "thirdweb";
import { toast } from "sonner";
import { Loader2, RefreshCwIcon, CheckCircle2Icon, WalletIcon, ArrowRightIcon } from "lucide-react";
import { client } from "@/lib/thirdweb-client";

interface AdminPayoutsProps {
    projectId: number;
    project: any;
    safeChainId: number;
}

export function AdminPayouts({ projectId, project, safeChainId }: AdminPayoutsProps) {
    const account = useActiveAccount();
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchSubmissions = async () => {
        setIsLoading(true);
        try {
            // Fetch all submissions for project
            const res = await fetch(`/api/dao/submissions?projectId=${projectId}`);
            const data = await res.json();

            if (Array.isArray(data)) {
                // Filter for Approved but NOT Paid
                // 'proofData' === 'PAID' means paid.
                const unpaid = data.filter((s: any) =>
                    s.status === 'approved' && s.proofData !== 'PAID'
                );
                setSubmissions(unpaid);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar envíos");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, [projectId]);

    const handleSelectAll = () => {
        if (selectedIds.length === submissions.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(submissions.map(s => s.id));
        }
    };

    const toggleSelect = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleMarkPaid = async () => {
        if (selectedIds.length === 0) return;
        setIsProcessing(true);
        try {
            const res = await fetch('/api/dao/submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'payout',
                    submissionIds: selectedIds
                })
            });

            if (!res.ok) throw new Error("API Error");

            toast.success("Marcado como pagado en DB");
            fetchSubmissions();
            setSelectedIds([]);
        } catch (e) {
            toast.error("Error actualizando DB");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <WalletIcon className="w-5 h-5 text-yellow-500" /> Distribución de Recompensas
                </h3>
                <button
                    onClick={fetchSubmissions}
                    className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"
                >
                    <RefreshCwIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-8 text-zinc-500">Cargando pendientes...</div>
            ) : submissions.length === 0 ? (
                <div className="text-center py-8 bg-zinc-950/50 rounded-lg border border-zinc-800 border-dashed">
                    <CheckCircle2Icon className="w-8 h-8 text-green-500 mx-auto mb-2 opacity-50" />
                    <p className="text-zinc-500">Todos los pagos están al día.</p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-zinc-400">
                            <thead className="bg-zinc-950/50 uppercase text-xs font-bold text-zinc-500">
                                <tr>
                                    <th className="p-3 w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length === submissions.length && submissions.length > 0}
                                            onChange={handleSelectAll}
                                            className="rounded bg-zinc-800 border-zinc-700"
                                        />
                                    </th>
                                    <th className="p-3">Usuario (Wallet)</th>
                                    <th className="p-3">Actividad ID</th>
                                    <th className="p-3">Fecha Aprobación</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {submissions.map(sub => (
                                    <tr key={sub.id} className="hover:bg-zinc-800/30 transition-colors">
                                        <td className="p-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(sub.id)}
                                                onChange={() => toggleSelect(sub.id)}
                                                className="rounded bg-zinc-800 border-zinc-700"
                                            />
                                        </td>
                                        <td className="p-3 font-mono text-xs text-white">{sub.userWallet}</td>
                                        <td className="p-3 text-xs">#{sub.activityId}</td>
                                        <td className="p-3 text-xs">{new Date(sub.statusUpdatedAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 bg-zinc-950/50 border border-zinc-800 p-4 rounded-lg flex flex-col md:flex-row gap-6 justify-between items-center">
                        <div className="text-zinc-400 text-xs space-y-2">
                            <p className="font-bold text-white text-sm">Resumen de Pago (Manual Bridge)</p>
                            <div className="space-y-1">
                                <p>1. <span className="text-white">Calcula el total</span> a enviar según las actividades.</p>
                                <p>2. <span className="text-white">Envía los fondos</span> a las wallets listadas usando tu billetera.</p>
                                <p>3. <span className="text-white">Confirma abajo</span> para cerrar los tickets.</p>
                            </div>
                            <p className="text-yellow-500/80 mt-2 flex items-center gap-1">
                                <ArrowRightIcon className="w-3 h-3" />
                                Usuarios Seleccionados: <span className="font-bold text-white">{selectedIds.length}</span>
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleMarkPaid}
                                disabled={selectedIds.length === 0 || isProcessing}
                                className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 px-6 rounded-lg transition-all flex items-center gap-2"
                            >
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2Icon className="w-4 h-4" />}
                                {isProcessing ? "Procesando..." : "Confirmar Pago Realizado"}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
