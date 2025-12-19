
"use client";

import { useState, useEffect } from "react";
import { getAvailableSlots, bookSlot } from "@/actions/scheduling";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Slot {
    id: string;
    startTime: Date;
    endTime: Date;
    isBooked: boolean;
}

export function SchedulerForm({ userId }: { userId: string }) {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', preference: 'email' as const, notes: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadSlots();
    }, [userId]);

    async function loadSlots() {
        setLoading(true);
        const res = await getAvailableSlots(userId);
        if (res.success && res.slots) {
            setSlots(res.slots as unknown as Slot[]);
        }
        setLoading(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedSlot) return;

        setSubmitting(true);
        const res = await bookSlot(selectedSlot.id, {
            name: formData.name,
            email: formData.email, // fix typo
            phone: formData.phone,
            preference: formData.preference,
            notes: formData.notes
        });

        if (res.success) {
            toast.success("Agenda confirmada. Revisa tu correo/WhatsApp.");
            setSelectedSlot(null);
            loadSlots(); // refresh
            // Redirect or show success state
        } else {
            toast.error(res.error || "Error al agendar.");
        }
        setSubmitting(false);
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-lime-500" /></div>;

    if (!selectedSlot) {
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-white mb-4">Selecciona un horario</h3>
                <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2">
                    {slots.length === 0 ? (
                        <p className="text-zinc-500 text-center py-4">No hay horarios disponibles.</p>
                    ) : (
                        slots.map(slot => (
                            <button
                                key={slot.id}
                                onClick={() => setSelectedSlot(slot)}
                                className="w-full text-left px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-lime-500/50 hover:bg-zinc-800 transition-all group"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-200 font-medium group-hover:text-lime-400">
                                        {format(new Date(slot.startTime), "EEEE d 'de' MMMM", { locale: es })}
                                    </span>
                                    <span className="text-zinc-400 text-sm bg-zinc-950 px-2 py-1 rounded">
                                        {format(new Date(slot.startTime), "HH:mm")}
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-6">
                <button type="button" onClick={() => setSelectedSlot(null)} className="text-zinc-400 hover:text-white text-sm">
                    ← Volver
                </button>
                <span className="text-lime-400 font-medium text-sm">
                    {format(new Date(selectedSlot.startTime), "EEEE d, HH:mm", { locale: es })}
                </span>
            </div>

            <div className="space-y-3">
                <input
                    required
                    placeholder="Tu Nombre"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-lime-500 outline-none"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
                <input
                    required
                    type="email"
                    placeholder="Email"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-lime-500 outline-none"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
                <input
                    placeholder="WhatsApp (Opcional)"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-lime-500 outline-none"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
                <select
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-lime-500 outline-none"
                    value={formData.preference}
                    onChange={e => setFormData({ ...formData, preference: e.target.value as any })}
                >
                    <option value="email">Notificar por Email</option>
                    <option value="whatsapp">Notificar por WhatsApp</option>
                    <option value="both">Ambos</option>
                </select>
            </div>

            <Button disabled={submitting} type="submit" className="w-full bg-lime-500 hover:bg-lime-400 text-black font-bold h-12">
                {submitting ? <Loader2 className="animate-spin" /> : "Confirmar Agenda"}
            </Button>
        </form>
    );
}
