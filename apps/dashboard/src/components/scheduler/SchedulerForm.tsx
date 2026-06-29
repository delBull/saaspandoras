"use client";

import { useState, useEffect } from "react";
import { getAvailableSlots, bookSlot } from "@/actions/scheduling";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Loader2, Clock, Shield, Video, ChevronLeft, CheckCircle } from "lucide-react";

interface Slot {
    id: string;
    startTime: Date;
    endTime: Date;
    isBooked: boolean;
}

export type MeetingType = 'strategy' | 'architecture' | 'capital';

const MEETING_CONFIG: Record<MeetingType, { title: string; duration: number; description: string }> = {
    'strategy': {
        title: "Sesión de Estrategia",
        duration: 30,
        description: "Validación de ejecución y cierre.",
    },
    'architecture': {
        title: "Revisión de Arquitectura",
        duration: 20,
        description: "Modelo técnico y viabilidad.",
    },
    'capital': {
        title: "Sincronización de Capital",
        duration: 30,
        description: "Evaluación de sociedad.",
    }
};

const GOLD = "#D4A853";

export function SchedulerForm({ userId, meetingType = 'strategy' }: { userId: string; meetingType?: MeetingType }) {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', preference: 'email' as const, notes: '' });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const config = MEETING_CONFIG[meetingType] || MEETING_CONFIG.strategy;

    useEffect(() => { loadSlots(); }, [userId]);

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
            email: formData.email,
            phone: formData.phone,
            preference: formData.preference,
            notes: `[${config.title}] ${formData.notes || ''}`
        });
        if (res.success) {
            setSuccess(true);
            toast.success("Agenda confirmada. Revisa tu correo.");
        } else {
            toast.error(res.error || "Error al agendar.");
        }
        setSubmitting(false);
    }

    if (success) {
        return (
            <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#D4A853]/20 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-[#D4A853]" />
                </div>
                <h3 className="text-xl font-bold text-white">Solicitud Enviada</h3>
                <p className="text-zinc-400 text-sm max-w-xs mx-auto">
                    Recibirás la confirmación por correo electrónico con los detalles de la sesión.
                </p>
            </div>
        );
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" style={{ color: GOLD }} /></div>;

    if (!selectedSlot) {
        return (
            <div className="space-y-4">
                <div className="mb-6 border-b border-[#D4A853]/10 pb-4">
                    <h3 className="text-xl font-bold text-white mb-1">{config.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-zinc-400">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" style={{ color: GOLD }} /> {config.duration} min</span>
                        <span className="flex items-center gap-1"><Video className="w-3 h-3" style={{ color: GOLD }} /> G-Meet</span>
                        <span className="flex items-center gap-1"><Shield className="w-3 h-3" style={{ color: GOLD }} /> Privado</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">{config.description}</p>
                </div>

                <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2">
                    {slots.length === 0 ? (
                        <p className="text-zinc-500 text-center py-4">No hay horarios disponibles.</p>
                    ) : (
                        slots.map(slot => (
                            <button
                                key={slot.id}
                                onClick={() => setSelectedSlot(slot)}
                                className="w-full text-left px-4 py-3 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-[#D4A853]/40 hover:bg-zinc-800/80 transition-all group"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-200 font-medium group-hover:text-[#D4A853] transition-colors">
                                        {format(new Date(slot.startTime), "EEEE d 'de' MMMM", { locale: es })}
                                    </span>
                                    <span className="text-zinc-400 text-sm bg-black/50 px-2 py-1 rounded border border-zinc-800">
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
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#D4A853]/10">
                <button type="button" onClick={() => setSelectedSlot(null)} className="flex items-center gap-1 text-zinc-400 hover:text-[#D4A853] text-sm transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Volver
                </button>
                <div className="text-right">
                    <span className="block font-bold text-sm text-white">{config.title}</span>
                    <span className="text-zinc-400 text-xs">
                        {format(new Date(selectedSlot.startTime), "EEEE d, HH:mm", { locale: es })}
                    </span>
                </div>
            </div>

            <div className="space-y-3">
                <input
                    required
                    placeholder="Tu Nombre"
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-[#D4A853]/50 outline-none transition-colors placeholder:text-zinc-600"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
                <input
                    required
                    type="email"
                    placeholder="Email"
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-[#D4A853]/50 outline-none transition-colors placeholder:text-zinc-600"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
                <input
                    placeholder="WhatsApp (Opcional)"
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-[#D4A853]/50 outline-none transition-colors placeholder:text-zinc-600"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
                <select
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-[#D4A853]/50 outline-none transition-colors"
                    value={formData.preference}
                    onChange={e => setFormData({ ...formData, preference: e.target.value as any })}
                >
                    <option value="email">Notificar por Email</option>
                    <option value="whatsapp">Notificar por WhatsApp</option>
                    <option value="both">Ambos</option>
                </select>
            </div>

            <button
                disabled={submitting}
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all duration-300 disabled:opacity-50"
                style={{
                    backgroundColor: GOLD,
                    color: '#000',
                }}
            >
                {submitting ? <Loader2 className="animate-spin mx-auto" /> : "Confirmar Agenda"}
            </button>
        </form>
    );
}
