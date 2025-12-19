
"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { getAvailableSlots, createSlots } from "@/actions/scheduling"; // We need a variant for ADMIN (get ALL slots, not just available)
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { addHours, setHours, setMinutes } from "date-fns";

export function CalendarManager({ userId }: { userId: string }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [slots, setSlots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    useEffect(() => {
        loadSlots();
    }, [userId, currentDate]);

    async function loadSlots() {
        const res = await getAvailableSlots(userId);
        if (res.slots) setSlots(res.slots as any[]);
        setLoading(false);
    }

    async function handleAddSlot(day: Date) {
        // Quick Logic: Add slot at 10:00 AM if none, otherwise add 1 hour after last slot
        setCreating(true);
        const daySlots = slots.filter(s => isSameDay(new Date(s.startTime), day));

        let startTime = setMinutes(setHours(day, 10), 0); // Default 10:00 AM
        if (daySlots.length > 0) {
            // Find latest slot
            const times = daySlots.map(s => new Date(s.startTime).getTime());
            const maxTime = Math.max(...times);
            startTime = addHours(new Date(maxTime), 1); // 1 hour after
        }

        const endTime = setMinutes(addHours(startTime, 0), 30); // 30 mins duration

        const res = await createSlots(userId, [{ start: startTime, end: endTime }]);

        if (res.success) {
            toast.success("Slot añadido");
            loadSlots();
        } else {
            toast.error("Error al crear slot");
        }
        setCreating(false);
    }

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">🗓️ Agenda Soberana</h2>
                <div className="flex gap-2">
                    <button className="px-3 py-1 bg-zinc-800 rounded text-sm hover:bg-zinc-700">←</button>
                    <span className="text-white font-medium capitalize">
                        {format(currentDate, "MMMM yyyy", { locale: es })}
                    </span>
                    <button className="px-3 py-1 bg-zinc-800 rounded text-sm hover:bg-zinc-700">→</button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-4">
                {["L", "M", "M", "J", "V", "S", "D"].map(d => (
                    <div key={d} className="text-center text-zinc-500 text-sm font-bold">{d}</div>
                ))}

                {calendarDays.map(day => {
                    const daySlots = slots.filter(s => isSameDay(new Date(s.startTime), day));
                    return (
                        <div key={day.toISOString()} className="min-h-[100px] border border-zinc-800 rounded p-2 bg-zinc-950/50 hover:bg-zinc-900 transition-colors group relative cursor-pointer">
                            <span className={`text-sm ${isSameMonth(day, monthStart) ? 'text-zinc-300' : 'text-zinc-600'}`}>
                                {format(day, 'd')}
                            </span>

                            <div className="mt-2 space-y-1">
                                {daySlots.map(s => (
                                    <div key={s.id} className={`text-xs p-1 rounded ${s.isBooked ? 'bg-red-900/50 text-red-200' : 'bg-lime-900/20 text-lime-400'}`}>
                                        {format(new Date(s.startTime), "HH:mm")}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddSlot(day);
                                }}
                                disabled={creating}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 bg-zinc-800 rounded-full text-lime-400 hover:bg-lime-500 hover:text-black transition-all disabled:opacity-50"
                            >
                                <Plus size={12} />
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-800">
                <div className="flex justify-between items-center bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                    <div>
                        <p className="text-zinc-400 text-sm font-medium">📋 Embed Code (Iframe)</p>
                        <p className="text-zinc-600 text-xs">Copia esto en tu sitio web</p>
                    </div>
                    <button
                        onClick={() => {
                            const code = `<iframe src="https://dash.pandoras.finance/schedule/${userId}?embed=true" width="100%" height="700px" frameborder="0"></iframe>`;
                            navigator.clipboard.writeText(code);
                            toast.success("Código copiado");
                        }}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded border border-zinc-700 transition-colors"
                    >
                        Copiar Código
                    </button>
                </div>
            </div>

            <div className="mt-4 text-center text-zinc-500 text-sm">
                * Click en "+" en cada día para añadir bloques de 30 min.
            </div>
        </div>
    );
}
