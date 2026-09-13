"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getAvailableSlots, bookSlot } from "@/actions/scheduling";
import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Clock,
  Shield,
  Video,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Calendar,
  X,
  Sparkles,
  User,
  Mail,
  Phone,
  MessageSquare,
  Lock,
} from "lucide-react";

export interface Slot {
  id: string;
  startTime: Date | string;
  endTime: Date | string;
  isBooked?: boolean;
}

export type MeetingType = "strategy" | "architecture" | "capital";

const MEETING_CONFIG: Record<MeetingType, { title: string; duration: number; description: string; tag: string }> = {
  strategy: {
    title: "Sesión de Estrategia",
    duration: 30,
    description: "Alineación ejecutiva, validación de oportunidades y visión estratégica.",
    tag: "30 min • 1-on-1",
  },
  architecture: {
    title: "Revisión de Arquitectura",
    duration: 20,
    description: "Evaluación técnica de infraestructura soberana y modelos de tokenización.",
    tag: "20 min • Técnico",
  },
  capital: {
    title: "Sincronización de Capital",
    duration: 30,
    description: "Análisis de sindicación patrimonial, gobernanza y colocación de capital.",
    tag: "30 min • Institucional",
  },
};

const GOLD = "#D4A853";

export function SchedulerForm({
  userId,
  meetingType = "strategy",
}: {
  userId: string;
  meetingType?: MeetingType;
}) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    preference: "email" as "email" | "whatsapp" | "both",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const config = MEETING_CONFIG[meetingType] || MEETING_CONFIG.strategy;

  useEffect(() => {
    loadSlots();
  }, [userId]);

  async function loadSlots() {
    setLoading(true);
    try {
      const res = await getAvailableSlots(userId);
      if (res.success && res.slots) {
        // Sort chronologically ascending
        const sorted = (res.slots as unknown as Slot[]).sort(
          (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
        setSlots(sorted);

        // Preselect the first day with available slots
        if (sorted.length > 0 && sorted[0]) {
          const firstDayKey = format(new Date(sorted[0].startTime), "yyyy-MM-dd");
          setSelectedDate(firstDayKey);
        }
      }
    } catch (err) {
      console.error("[SchedulerForm] Error loading slots:", err);
      toast.error("Error al cargar horarios disponibles.");
    } finally {
      setLoading(false);
    }
  }

  // Group slots by date string "YYYY-MM-DD"
  const slotsByDay = useMemo(() => {
    const map = new Map<string, { date: Date; slots: Slot[] }>();
    for (const slot of slots) {
      const dateObj = new Date(slot.startTime);
      const key = format(dateObj, "yyyy-MM-dd");
      if (!map.has(key)) {
        map.set(key, { date: dateObj, slots: [] });
      }
      map.get(key)!.slots.push(slot);
    }
    return Array.from(map.entries()).map(([key, data]) => ({
      key,
      date: data.date,
      slots: data.slots,
    }));
  }, [slots]);

  // Current slots for selected date
  const activeDaySlots = useMemo(() => {
    if (!selectedDate) return [];
    const group = slotsByDay.find((d) => d.key === selectedDate);
    return group ? group.slots : [];
  }, [slotsByDay, selectedDate]);

  function handleSelectSlot(slot: Slot) {
    setSelectedSlot(slot);
    setIsDrawerOpen(true);
  }

  function handleCloseDrawer() {
    setIsDrawerOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot) return;
    setSubmitting(true);
    try {
      const res = await bookSlot(selectedSlot.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        preference: formData.preference,
        notes: `[${config.title}] ${formData.notes || ""}`,
      });
      if (res.success) {
        setSuccess(true);
        setIsDrawerOpen(false);
        toast.success("Agenda confirmada exitosamente. Revisa tu correo.");
      } else {
        toast.error(res.error || "Error al confirmar la reservación.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error al procesar la solicitud.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: GOLD }} />
        <p className="text-xs tracking-wider uppercase text-zinc-500 font-mono">
          Consultando disponibilidad soberana...
        </p>
      </div>
    );
  }

  if (success && selectedSlot) {
    return (
      <div className="text-center py-12 px-4 space-y-6 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-[#D4A853]/15 border border-[#D4A853]/40 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(212,168,83,0.2)]">
          <CheckCircle2 className="w-8 h-8 text-[#D4A853]" />
        </div>
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#D4A853] bg-[#D4A853]/10 px-3 py-1 rounded-full border border-[#D4A853]/20">
            Sesión Notarizada & Agendada
          </span>
          <h3 className="text-2xl font-bold text-white mt-3">¡Reservación Confirmada!</h3>
          <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
            Hemos reservado tu espacio privado. Hemos enviado la invitación de calendario y el enlace de acceso seguro a <span className="text-zinc-200 font-medium">{formData.email}</span>.
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 text-left space-y-2.5">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="text-zinc-500">Sesión</span>
            <span className="font-semibold text-white">{config.title}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="text-zinc-500">Fecha</span>
            <span className="font-medium text-zinc-200 capitalize">
              {format(new Date(selectedSlot.startTime), "EEEE d 'de' MMMM, yyyy", { locale: es })}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="text-zinc-500">Horario</span>
            <span className="font-mono text-[#D4A853]">
              {format(new Date(selectedSlot.startTime), "HH:mm")} - {format(new Date(selectedSlot.endTime), "HH:mm")} GMT-6
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="text-zinc-500">Canal</span>
            <span className="text-zinc-200">Google Meet / Encriptado</span>
          </div>
        </div>

        <button
          onClick={() => {
            setSuccess(false);
            setSelectedSlot(null);
            loadSlots();
          }}
          className="text-xs text-zinc-400 hover:text-[#D4A853] transition-colors underline underline-offset-4"
        >
          Agendar otra sesión
        </button>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
          <Calendar className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-zinc-200">No hay horarios disponibles</h4>
        <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
          En este momento no hay espacios libres para este enlace. Por favor intenta más tarde o comunícate con el asesor.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 1. Header & Context */}
      <div className="mb-6 pb-4 border-b border-zinc-800/60">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <h3 className="text-lg font-bold text-white tracking-tight">{config.title}</h3>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#D4A853]/10 text-[#D4A853] border border-[#D4A853]/25">
            {config.tag}
          </span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">{config.description}</p>
        <div className="flex items-center gap-4 text-[11px] text-zinc-500 mt-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#D4A853]" /> {config.duration} minutos
          </span>
          <span className="flex items-center gap-1">
            <Video className="w-3.5 h-3.5 text-[#D4A853]" /> Google Meet
          </span>
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-[#D4A853]" /> Cifrado 1-a-1
          </span>
        </div>
      </div>

      {/* 2. Step 1: Calendly-Style Date Selector Strip */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#D4A853]" /> 1. Selecciona una Fecha
          </span>
          <span className="text-[11px] text-zinc-500 font-mono">
            {slotsByDay.length} días disponibles
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {slotsByDay.map(({ key, date, slots: daySlots }) => {
            const isSelected = selectedDate === key;
            const dayName = format(date, "EEE", { locale: es }).toUpperCase();
            const dayNum = format(date, "d");
            const monthName = format(date, "MMM", { locale: es }).toUpperCase();

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDate(key)}
                className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 text-center ${
                  isSelected
                    ? "bg-[#D4A853]/15 border-[#D4A853] text-white shadow-[0_0_15px_rgba(212,168,83,0.15)] ring-1 ring-[#D4A853]/40"
                    : "bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/80 hover:text-zinc-200"
                }`}
              >
                <span className="text-[10px] font-mono tracking-wider text-zinc-500 font-medium">
                  {dayName}
                </span>
                <span className={`text-xl font-bold my-0.5 ${isSelected ? "text-[#D4A853]" : "text-white"}`}>
                  {dayNum}
                </span>
                <span className="text-[10px] font-mono uppercase text-zinc-400">
                  {monthName}
                </span>
                <span className="mt-1.5 text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/40 border border-zinc-800/60 text-zinc-400">
                  {daySlots.length} {daySlots.length === 1 ? "horario" : "horarios"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Step 2: Time Slots Grid for Selected Day */}
      <div className="mt-6 pt-6 border-t border-zinc-800/60 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#D4A853]" /> 2. Horarios Disponibles
          </span>
          {selectedDate && (
            <span className="text-xs text-zinc-300 font-medium capitalize">
              {format(new Date(`${selectedDate}T12:00:00`), "EEEE d 'de' MMMM", { locale: es })}
            </span>
          )}
        </div>

        {activeDaySlots.length === 0 ? (
          <p className="text-xs text-zinc-500 py-6 text-center italic">
            Selecciona un día en el panel superior para ver sus horarios disponibles.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {activeDaySlots.map((slot) => {
              const timeFormatted = format(new Date(slot.startTime), "HH:mm");
              const isSlotActive = selectedSlot?.id === slot.id && isDrawerOpen;

              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => handleSelectSlot(slot)}
                  className={`group flex items-center justify-between px-3.5 py-3 rounded-xl border transition-all duration-200 ${
                    isSlotActive
                      ? "bg-[#D4A853] text-black border-[#D4A853] font-bold shadow-[0_0_15px_rgba(212,168,83,0.3)]"
                      : "bg-zinc-900/60 border-zinc-800/90 text-zinc-200 hover:border-[#D4A853]/60 hover:bg-zinc-800/80 hover:text-white"
                  }`}
                >
                  <span className="font-mono text-sm tracking-tight flex items-center gap-1.5">
                    <Clock className={`w-3.5 h-3.5 ${isSlotActive ? "text-black" : "text-[#D4A853] group-hover:scale-110 transition-transform"}`} />
                    {timeFormatted}
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isSlotActive ? "bg-black/20 text-black" : "bg-black/50 text-zinc-400 border border-zinc-800"
                  }`}>
                    {config.duration}m
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Step 3: Sovereign Booking Drawer (Slide-in Over Panel) */}
      <AnimatePresence>
        {isDrawerOpen && selectedSlot && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseDrawer}
              className="fixed inset-0 bg-black/75 backdrop-blur-md z-40"
            />

            {/* Slide-in Drawer */}
            <motion.div
              initial={{ x: "100%", opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-zinc-950/95 border-l border-[#D4A853]/20 z-50 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto shadow-[0_0_60px_rgba(0,0,0,0.8)]"
            >
              {/* Drawer Content */}
              <div className="space-y-6">
                {/* Header with Close */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#D4A853]/15 border border-[#D4A853]/30 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-[#D4A853]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight">Confirmar Sesión</h4>
                      <p className="text-[11px] text-zinc-400">Paso final para reservar tu espacio</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseDrawer}
                    className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Selected Slot Summary Card */}
                <div className="bg-zinc-900/60 border border-[#D4A853]/25 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-mono text-[11px]">TIPO DE REUNIÓN</span>
                    <span className="font-semibold text-[#D4A853]">{config.title}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-mono text-[11px]">FECHA & HORA</span>
                    <span className="font-medium text-white capitalize">
                      {format(new Date(selectedSlot.startTime), "EEEE d 'de' MMMM", { locale: es })} • {format(new Date(selectedSlot.startTime), "HH:mm")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-mono text-[11px]">DURACIÓN & CANAL</span>
                    <span className="text-zinc-300">
                      {config.duration} min • Google Meet (Encriptado)
                    </span>
                  </div>
                </div>

                {/* Booking Form */}
                <form onSubmit={handleSubmit} id="booking-form" className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <User className="w-3 h-3 text-[#D4A853]" /> Tu Nombre Completo *
                    </label>
                    <input
                      required
                      placeholder="Ej. Roberto González"
                      className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#D4A853] focus:ring-1 focus:ring-[#D4A853]/30 outline-none transition-all placeholder:text-zinc-600"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-[#D4A853]" /> Correo Electrónico *
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="tu@empresa.com"
                      className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#D4A853] focus:ring-1 focus:ring-[#D4A853]/30 outline-none transition-all placeholder:text-zinc-600"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#D4A853]" /> WhatsApp (Opcional, para recordatorios)
                    </label>
                    <input
                      placeholder="+52 123 456 7890"
                      className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#D4A853] focus:ring-1 focus:ring-[#D4A853]/30 outline-none transition-all placeholder:text-zinc-600"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                      Preferencia de Notificación
                    </label>
                    <select
                      className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#D4A853] outline-none transition-all"
                      value={formData.preference}
                      onChange={(e) => setFormData({ ...formData, preference: e.target.value as any })}
                    >
                      <option value="email">Notificar y enviar invitación por Email</option>
                      <option value="whatsapp">Notificar por WhatsApp y Email</option>
                      <option value="both">Ambos canales prioritarios</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-[#D4A853]" /> Notas o Tema de Interés (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Breve contexto de lo que te gustaría validar o explorar..."
                      className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white focus:border-[#D4A853] focus:ring-1 focus:ring-[#D4A853]/30 outline-none transition-all placeholder:text-zinc-600 resize-none"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </form>
              </div>

              {/* Drawer Footer Actions */}
              <div className="pt-6 border-t border-zinc-800/80 space-y-3">
                <button
                  form="booking-form"
                  disabled={submitting}
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_0_20px_rgba(212,168,83,0.25)] hover:shadow-[0_0_25px_rgba(212,168,83,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: GOLD,
                    color: "#000",
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Confirmando...</span>
                    </>
                  ) : (
                    <span>Confirmar Reservación Soberana</span>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 font-mono">
                  <Lock className="w-3 h-3 text-[#D4A853]" />
                  <span>Protegido bajo política de confidencialidad institucional</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
