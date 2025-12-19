
"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addHours, setHours, setMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { getAvailableSlots, createAdminBooking } from "@/actions/scheduling";
import { Loader2, Plus, Calendar as CalendarIcon, Settings, Copy, ExternalLink, Video, Phone, User as UserIcon, Clock } from "lucide-react";
import { toast } from "sonner";

// UI Components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function CalendarManager({ userId }: { userId: string }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [slots, setSlots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Manage State
    const [showManage, setShowManage] = useState(false);

    // Create Event State
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: "Reunión Estratégica",
        leadName: "",
        leadEmail: "",
        description: "",
        date: new Date(),
        time: "10:00",
        duration: 30,
        type: 'video' as 'video' | 'phone' | 'person'
    });

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Environment-aware public link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    // Logic for public alias: In V1 we use 'pandoras' as the default alias for the main calendar if userId matches admin
    // For now we show the direct userId link to be safe, or 'pandoras' if the user prefers that alias.
    // Let's allow copying both or defaulting to 'pandoras' for cleanliness if it's the main admin.
    const publicLink = `${appUrl}/schedule/pandoras`; // Defaulting to the brand alias for V1 

    useEffect(() => {
        loadSlots();
    }, [userId, currentDate]);

    async function loadSlots() {
        const res = await getAvailableSlots(userId);
        if (res.slots) setSlots(res.slots as any[]);
        setLoading(false);
    }

    function openCreateModal(day: Date) {
        setNewEvent({
            ...newEvent,
            date: day,
            time: "10:00",
            leadName: "",
            leadEmail: ""
        });
        setCreateModalOpen(true);
    }

    async function handleCreateEvent() {
        if (!newEvent.leadName || !newEvent.leadEmail || !newEvent.title) {
            toast.error("Completa los campos obligatorios");
            return;
        }

        setCreating(true);
        try {
            // Parse Date + Time
            // Parse Date + Time
            const parts = newEvent.time.split(':').map(Number);
            const hours = parts[0] ?? 0;
            const minutes = parts[1] ?? 0;
            const startDateTime = setMinutes(setHours(newEvent.date, hours), minutes);

            const res = await createAdminBooking(userId, {
                title: newEvent.title,
                leadName: newEvent.leadName,
                leadEmail: newEvent.leadEmail,
                description: newEvent.description,
                startTime: startDateTime,
                durationMinutes: newEvent.duration,
                meetingType: newEvent.type
            });

            if (res.success) {
                toast.success("Evento creado y notificado");
                setCreateModalOpen(false);
                loadSlots();
            } else {
                toast.error("Error al crear evento");
            }
        } catch (e) {
            console.error(e);
            toast.error("Error inesperado");
        } finally {
            setCreating(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        🗓️ Agenda Soberana
                        <Badge variant="outline" className="text-lime-400 border-lime-400/30 bg-lime-400/10">Admin Mode</Badge>
                    </h2>
                    <p className="text-zinc-500 text-sm">Gestiona tus eventos y disponibilidad directamente.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowManage(!showManage)}
                        className={`gap-2 ${showManage ? 'bg-zinc-800 border-zinc-700' : ''}`}
                    >
                        <Settings className="w-4 h-4" />
                        {showManage ? 'Ocultar Config' : 'Configuración'}
                    </Button>
                    <div className="flex items-center bg-zinc-800 rounded-md p-1 border border-zinc-700">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentDate(d => addHours(d, -24 * 30))}>←</Button>
                        <span className="px-3 text-sm font-medium min-w-[120px] text-center capitalize">
                            {format(currentDate, "MMMM yyyy", { locale: es })}
                        </span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentDate(d => addHours(d, 24 * 30))}>→</Button>
                    </div>
                </div>
            </div>

            {/* Manage Section (Collapsible) */}
            {showManage && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">🔗 Enlaces Públicos</CardTitle>
                            <CardDescription>Links para compartir tu agenda.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-zinc-400">Public Link (Alias: pandoras)</Label>
                                <div className="flex gap-2">
                                    <Input value={publicLink} readOnly className="bg-zinc-950 font-mono text-xs" />
                                    <Button size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(publicLink); toast.success("Link copiado"); }}>
                                        <Copy className="w-3 h-3" />
                                    </Button>
                                    <Button size="icon" variant="outline" onClick={() => window.open(publicLink, '_blank')}>
                                        <ExternalLink className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-zinc-400">Embed Code (Iframe)</Label>
                                <div className="relative">
                                    <textarea
                                        className="w-full h-20 bg-zinc-950 border border-zinc-800 rounded-md p-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-lime-500"
                                        readOnly
                                        value={`<iframe src="${publicLink}?embed=true" width="100%" height="700px" frameborder="0"></iframe>`}
                                    />
                                    <Button
                                        size="sm"
                                        className="absolute top-2 right-2 h-6 px-2 text-xs"
                                        onClick={() => {
                                            navigator.clipboard.writeText(`<iframe src="${publicLink}?embed=true" width="100%" height="700px" frameborder="0"></iframe>`);
                                            toast.success("Código copiado");
                                        }}
                                    >
                                        Copy
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">⚙️ Disponibilidad General</CardTitle>
                            <CardDescription>Configura tus reglas básicas.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-4 text-sm text-zinc-400 text-center py-8">
                                <Clock className="w-8 h-8 mx-auto opacity-50" />
                                <p>Configuración avanzada próximamente.</p>
                                <p className="text-xs">Por ahora, usa "Crear Evento" para bloquear espacios manualmente.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Calendar Grid */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="grid grid-cols-7 gap-px bg-zinc-800 border border-zinc-800 rounded-lg overflow-hidden">
                    {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(d => (
                        <div key={d} className="bg-zinc-900 p-2 text-center text-zinc-500 text-xs font-bold uppercase tracking-wider">
                            {d}
                        </div>
                    ))}

                    {calendarDays.map(day => {
                        const daySlots = slots.filter(s => isSameDay(new Date(s.startTime), day));
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isToday = isSameDay(day, new Date());

                        return (
                            <div
                                key={day.toISOString()}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        openCreateModal(day);
                                    }
                                }}
                                onClick={() => openCreateModal(day)}
                                className={`min-h-[120px] bg-zinc-900 p-2 relative group hover:bg-zinc-800/50 transition-colors cursor-pointer text-left ${!isCurrentMonth ? 'opacity-40 bg-zinc-950' : ''}`}
                            >
                                <span className={`text-sm font-medium block mb-2 ${isToday ? 'text-lime-400' : 'text-zinc-400'}`}>
                                    {format(day, 'd')}
                                </span>

                                <div className="space-y-1">
                                    {daySlots.map(s => (
                                        <div key={s.id} className={`text-[10px] px-1.5 py-0.5 rounded border truncate ${s.isBooked ? 'bg-indigo-900/30 border-indigo-500/30 text-indigo-300' : 'bg-lime-900/20 border-lime-500/30 text-lime-400'}`}>
                                            {format(new Date(s.startTime), "HH:mm")} • {s.isBooked ? 'Booked' : 'Free'}
                                        </div>
                                    ))}
                                </div>

                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="h-6 w-6 rounded-full bg-lime-500 text-black flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-lime-500/20">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-4 text-xs text-zinc-500 flex items-center gap-4">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500/50"></div> Ocupado</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-lime-500/50"></div> Disponible</span>
                    <span className="ml-auto">Haz click en cualquier día para agendar.</span>
                </div>
            </div>

            {/* Create Event Modal */}
            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Nuevo Evento</DialogTitle>
                        <DialogDescription>
                            Agenda una reunión manualmente. Se enviarán notificaciones.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Título del Evento</Label>
                            <Input
                                id="title"
                                value={newEvent.title}
                                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                className="bg-zinc-950 border-zinc-800 focus:ring-lime-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Fecha</Label>
                                <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-zinc-300">
                                    {format(newEvent.date, "PPP", { locale: es })}
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="time">Hora</Label>
                                <Input
                                    id="time"
                                    type="time"
                                    value={newEvent.time}
                                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                                    className="bg-zinc-950 border-zinc-800 focus:ring-lime-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="duration">Duración (min)</Label>
                                <select
                                    className="flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lime-500"
                                    value={newEvent.duration}
                                    onChange={(e) => setNewEvent({ ...newEvent, duration: Number(e.target.value) })}
                                >
                                    <option value={15}>15 min</option>
                                    <option value={30}>30 min</option>
                                    <option value={45}>45 min</option>
                                    <option value={60}>60 min</option>
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="type">Tipo</Label>
                                <select
                                    className="flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lime-500"
                                    value={newEvent.type}
                                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as any })}
                                >
                                    <option value="video">📹 Video Call</option>
                                    <option value="phone">📞 Teléfono</option>
                                    <option value="person">👥 Presencial</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="leadName">Nombre Invitado</Label>
                            <Input
                                id="leadName"
                                placeholder="Ej. Juan Pérez"
                                value={newEvent.leadName}
                                onChange={(e) => setNewEvent({ ...newEvent, leadName: e.target.value })}
                                className="bg-zinc-950 border-zinc-800 focus:ring-lime-500"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="leadEmail">Email Invitado</Label>
                            <Input
                                id="leadEmail"
                                type="email"
                                placeholder="juan@ejemplo.com"
                                value={newEvent.leadEmail}
                                onChange={(e) => setNewEvent({ ...newEvent, leadEmail: e.target.value })}
                                className="bg-zinc-950 border-zinc-800 focus:ring-lime-500"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateEvent} disabled={creating} className="bg-lime-500 hover:bg-lime-600 text-black font-medium">
                            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Agendar Evento
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
