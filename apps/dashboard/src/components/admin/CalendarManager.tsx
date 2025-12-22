
"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addHours, setHours, setMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { getAvailableSlots, createAdminBooking, getAdminSlots } from "@/actions/scheduling";
import { getAdminAvailability, saveAvailability } from "@/actions/availability";
import type { AvailabilityConfig } from "@/actions/availability";
import { Loader2, Plus, Calendar as CalendarIcon, Settings, Copy, ExternalLink, Video, Phone, User as UserIcon, Clock, Check, Save } from "lucide-react";
import { toast } from "sonner";

// UI Components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

    // Availablity State
    const [savingConfig, setSavingConfig] = useState(false);
    const [config, setConfig] = useState<AvailabilityConfig>({
        monday: { enabled: true, start: "09:00", end: "17:00" },
        tuesday: { enabled: true, start: "09:00", end: "17:00" },
        wednesday: { enabled: true, start: "09:00", end: "17:00" },
        thursday: { enabled: true, start: "09:00", end: "17:00" },
        friday: { enabled: true, start: "09:00", end: "17:00" },
        saturday: { enabled: false, start: "10:00", end: "14:00" },
        sunday: { enabled: false, start: "10:00", end: "14:00" },
        timezone: "America/Mexico_City"
    });

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Environment-aware public link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    const publicLink = `${appUrl}/schedule/pandoras`;

    useEffect(() => {
        loadSlots();
    }, [userId, currentDate]);

    async function loadSlots() {
        // Load Slots (Admin View)
        const resStats = await getAdminSlots(userId);
        if (resStats.slots) setSlots(resStats.slots as any[]);

        // Load Availability Config
        const resConfig = await getAdminAvailability(userId);
        if (resConfig.success && resConfig.availability) {
            setConfig(resConfig.availability);
        }

        setLoading(false);
    }

    async function handleSaveConfig() {
        setSavingConfig(true);
        try {
            const res = await saveAvailability(userId, config);
            if (res.success) {
                toast.success(`Configuración guardada. ${res.generatedCount} slots generados.`);
                loadSlots(); // Reload slots to show new generation
            } else {
                toast.error("Error al guardar configuración");
            }
        } catch (e) {
            console.error(e);
            toast.error("Error de conexión");
        } finally {
            setSavingConfig(false);
        }
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
                    <Card className="bg-zinc-900 border-zinc-800 col-span-1 md:col-span-2">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">🔗 Enlaces Estratégicos</CardTitle>
                            <CardDescription>Usa el enlace correcto según la temperatura y perfil del lead.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-3">
                            {/* Strategy / Close (Red) */}
                            <div className="bg-zinc-950 p-3 rounded-lg border border-red-500/20">
                                <Label className="text-xs text-red-400 font-bold mb-2 block">🔴 Strategy / Close</Label>
                                <p className="text-[10px] text-zinc-500 mb-2">Para: Protocol / Founders (Capital Confirmado)</p>
                                <div className="flex gap-2">
                                    <Input value={`${appUrl}/schedule/protocol?type=strategy`} readOnly className="h-7 text-[10px] font-mono bg-zinc-900" />
                                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(`${appUrl}/schedule/protocol?type=strategy`); toast.success("Link Estrategia copiado"); }}>
                                        <Copy className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>

                            {/* Architecture (Blue) */}
                            <div className="bg-zinc-950 p-3 rounded-lg border border-blue-500/20">
                                <Label className="text-xs text-blue-400 font-bold mb-2 block">🔵 Architecture Review</Label>
                                <p className="text-[10px] text-zinc-500 mb-2">Para: Utility Leads (Técnicos/Claridad)</p>
                                <div className="flex gap-2">
                                    <Input value={`${appUrl}/schedule/protocol?type=architecture`} readOnly className="h-7 text-[10px] font-mono bg-zinc-900" />
                                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(`${appUrl}/schedule/protocol?type=architecture`); toast.success("Link Arquitectura copiado"); }}>
                                        <Copy className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>


                            {/* Capital (Yellow) */}
                            <div className="bg-zinc-950 p-3 rounded-lg border border-yellow-500/20">
                                <Label className="text-xs text-yellow-400 font-bold mb-2 block">🟡 Founder Capital</Label>
                                <p className="text-[10px] text-zinc-500 mb-2">Para: Founders Tier 3 (Capital + Timeline)</p>
                                <div className="flex gap-2">
                                    <Input value={`${appUrl}/schedule/protocol?type=capital`} readOnly className="h-7 text-[10px] font-mono bg-zinc-900" />
                                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(`${appUrl}/schedule/protocol?type=capital`); toast.success("Link Capital copiado"); }}>
                                        <Copy className="w-3 h-3" />
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
                        <CardContent className="space-y-4">
                            {/* ... existing days map ... */}
                            <div className="space-y-3">
                                {[
                                    { key: 'monday', label: 'Lunes' },
                                    { key: 'tuesday', label: 'Martes' },
                                    { key: 'wednesday', label: 'Miércoles' },
                                    { key: 'thursday', label: 'Jueves' },
                                    { key: 'friday', label: 'Viernes' },
                                    { key: 'saturday', label: 'Sábado' },
                                    { key: 'sunday', label: 'Domingo' }
                                ].map((day) => {
                                    const dayConfig = (config as any)[day.key];
                                    return (
                                        <div key={day.key} className="flex items-center justify-between p-2 rounded hover:bg-zinc-800/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={dayConfig.enabled}
                                                    onChange={(e) => setConfig({
                                                        ...config,
                                                        [day.key]: { ...dayConfig, enabled: e.target.checked }
                                                    })}
                                                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-lime-500 focus:ring-lime-500/20"
                                                />
                                                <Label className={`w-20 ${dayConfig.enabled ? 'text-white' : 'text-zinc-500'}`}>
                                                    {day.label}
                                                </Label>
                                            </div>

                                            {dayConfig.enabled ? (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="time"
                                                        value={dayConfig.start}
                                                        onChange={(e) => setConfig({
                                                            ...config,
                                                            [day.key]: { ...dayConfig, start: e.target.value }
                                                        })}
                                                        className="h-8 w-32 px-2 bg-zinc-950 border-zinc-800 text-xs"
                                                    />
                                                    <span className="text-zinc-500">-</span>
                                                    <Input
                                                        type="time"
                                                        value={dayConfig.end}
                                                        onChange={(e) => setConfig({
                                                            ...config,
                                                            [day.key]: { ...dayConfig, end: e.target.value }
                                                        })}
                                                        className="h-8 w-32 px-2 bg-zinc-950 border-zinc-800 text-xs"
                                                    />
                                                </div>
                                            ) : (
                                                <span className="text-xs text-zinc-600 block w-[200px] text-right italic">No disponible</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="pt-4 border-t border-zinc-800 flex justify-end">
                                <Button
                                    onClick={handleSaveConfig}
                                    disabled={savingConfig}
                                    className="bg-lime-500 hover:bg-lime-600 text-black font-medium gap-2"
                                >
                                    {savingConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Guardar y Generar Slots
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* NEW: Integrations Card */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">🔄 Sincronización Externa</CardTitle>
                            <CardDescription>Conecta tus calendarios de Google o Notion.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-zinc-400">Google Calendar (ICAL URL)</Label>
                                <Input
                                    placeholder="https://calendar.google.com/calendar/ical/..."
                                    value={config.googleCalendarUrl || ''}
                                    onChange={(e) => setConfig({ ...config, googleCalendarUrl: e.target.value })}
                                    className="bg-zinc-950 border-zinc-800 text-xs font-mono"
                                />
                                <p className="text-[10px] text-zinc-500">Pega la dirección privada en formato iCal para bloquear slots automáticamente.</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-zinc-400">Notion Calendar</Label>
                                <Input
                                    placeholder="https://..."
                                    value={config.notionCalendarUrl || ''}
                                    onChange={(e) => setConfig({ ...config, notionCalendarUrl: e.target.value })}
                                    className="bg-zinc-950 border-zinc-800 text-xs font-mono"
                                />
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button variant="outline" size="sm" onClick={handleSaveConfig} disabled={savingConfig}>
                                    Guardar Integraciones
                                </Button>
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
                                    {daySlots.map(s => {
                                        const booking = s.bookings?.[0]; // Assuming array or single relation mapped
                                        return (
                                            <TooltipProvider key={s.id}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className={`text-[10px] px-1.5 py-0.5 rounded border truncate flex items-center gap-1 ${s.isBooked ? 'bg-indigo-900/30 border-indigo-500/30 text-indigo-300' : 'bg-lime-900/20 border-lime-500/30 text-lime-400'}`}>
                                                            {format(new Date(s.startTime), "HH:mm")} •
                                                            {s.isBooked ? (
                                                                <span className="font-semibold text-white ml-1">{booking?.leadName || 'Ocupado'}</span>
                                                            ) : 'Libre'}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-zinc-950 border-zinc-800 text-zinc-300 text-xs">
                                                        {s.isBooked && booking ? (
                                                            <div className="space-y-1">
                                                                <p><strong className="text-white">{booking.leadName}</strong></p>
                                                                <p>{booking.leadEmail}</p>
                                                                {booking.notes && <p className="italic opacity-80 max-w-[200px]">{booking.notes}</p>}
                                                            </div>
                                                        ) : "Espacio disponible para agendar"}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        );
                                    })}
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
