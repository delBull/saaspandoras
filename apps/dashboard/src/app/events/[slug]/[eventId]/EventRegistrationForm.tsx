'use client';

import { useActionState, useEffect, useState } from 'react';
import { registerForEvent } from './actions';
import { Playfair_Display } from "next/font/google";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isBefore, startOfDay, addMonths, subMonths, addHours, addDays, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"] });

export function EventRegistrationForm({ eventId, projectId, eventDate, eventLocation, isCalendar, config }: { eventId: number, projectId: number, eventDate: string, eventLocation: string, isCalendar?: boolean, config?: any }) {
    const [state, formAction, isPending] = useActionState(registerForEvent, null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('');
    const meetingType = config?.meetingType || 'PHYSICAL';
    const [meetingPreference, setMeetingPreference] = useState(meetingType === 'CHOICE' ? '' : meetingType);
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

    const today = startOfDay(new Date());
    const minAdvanceHours = config?.minAdvanceHours ?? 24;
    const maxDaysInFuture = config?.maxDaysInFuture ?? 14;
    const maxAllowedDate = addDays(today, maxDaysInFuture);

    const daysInMonth = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });

    // Extraemos la logica de getAvailableSlots
    const getAvailableSlots = (dateStr: string) => {
        const fallbackAvailability = {
            monday: { enabled: true, start: "09:00", end: "17:00" },
            tuesday: { enabled: true, start: "09:00", end: "17:00" },
            wednesday: { enabled: true, start: "09:00", end: "17:00" },
            thursday: { enabled: true, start: "09:00", end: "17:00" },
            friday: { enabled: true, start: "09:00", end: "17:00" },
            saturday: { enabled: false },
            sunday: { enabled: false },
        };
        const availability = config?.availability || fallbackAvailability;

        if (!dateStr || !availability) return [];
        // Parse date carefully to avoid timezone shift
        const [year, month, day] = dateStr.split('-');
        const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
        
        const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
        const dayKey = daysMap[dateObj.getDay()];
        if (!dayKey) return [];
        const dayConfig = availability[dayKey];
        
        if (!dayConfig || !dayConfig.enabled) return [];

        const slots = [];
        const duration = config.durationMinutes || 30;
        const buffer = config.bufferMinutes || 0;
        const interval = duration + buffer;

        const [startHour, startMin] = (dayConfig.start || "09:00").split(':').map(Number);
        const [endHour, endMin] = (dayConfig.end || "17:00").split(':').map(Number);

        let current = startHour * 60 + startMin;
        const end = endHour * 60 + endMin;

        const now = new Date();
        const minAllowedTime = addHours(now, minAdvanceHours);

        // Validamos que el slot de duración (sin contar el buffer posterior) quepa en la hora de fin
        while (current + duration <= end) {
            const h = Math.floor(current / 60).toString().padStart(2, '0');
            const m = (current % 60).toString().padStart(2, '0');
            
            const slotTimeStr = `${dateStr}T${h}:${m}:00`;
            const slotDate = new Date(slotTimeStr);

            // Solo agrega el slot si es posterior al tiempo mínimo permitido
            if (!isBefore(slotDate, minAllowedTime)) {
                slots.push(`${h}:${m}`);
            }
            
            // El siguiente bloque inicia sumando la duración + el espacio entre citas
            current += interval;
        }
        return slots;
    };

    const availableSlots = selectedDate ? getAvailableSlots(selectedDate) : [];

    useEffect(() => {
        if (state?.success) {
            setIsSuccess(true);
        }
    }, [state]);

    if (isSuccess) {
        return (
            <div className="text-center p-5 md:p-10 animate-[fadeInUp_0.6s_ease_backwards]">
                <h3 className={`text-[1.8rem] mb-[30px] ${playfair.className}`}>Solicitud <span className="text-[#D4A853]">recibida</span></h3>
                <p className="text-[#888888] leading-[1.8] mb-[30px]">
                    Tu registro ha sido exitoso.
                    <br /><br />
                    A continuación los detalles de tu acceso:
                </p>
                <div className="border-t border-b border-[#D4A853]/30 py-[25px] my-[30px]">
                    <div className={`text-[1.4rem] text-[#D4A853] ${playfair.className}`}>
                        {selectedDate && selectedTime 
                            ? new Date(`${selectedDate}T${selectedTime}`).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Mexico_City' })
                            : eventDate}
                    </div>
                    <div className="text-[0.9rem] text-[#888888] mt-[5px]">{eventLocation}</div>
                </div>
                <p className="text-[0.9rem]">Te esperamos puntualmente. Revisa tu correo para más detalles.</p>
            </div>
        );
    }

    return (
        <div id="formSection" className="animate-[fadeInUp_0.6s_ease_backwards]">
            <div className="text-center mb-[25px]">
                <h2 className={`text-[1.8rem] tracking-[1px] ${playfair.className}`}>Confirma tu <span className="text-[#D4A853]">Asistencia</span></h2>
            </div>

            <form action={formAction} className="space-y-[20px]">
                <input type="hidden" name="eventId" value={eventId} />
                <input type="hidden" name="projectId" value={projectId} />
                {isCalendar && (
                    <>
                        <input type="hidden" name="selectedDateTime" value={selectedDate && selectedTime ? `${selectedDate}T${selectedTime}` : ''} />
                        <input type="hidden" name="meetingPreference" value={meetingPreference} />
                    </>
                )}
                
                {isCalendar && (
                    <div className="mb-[15px]">
                            {/* Legend Message */}
                            <div className="mb-4 bg-[#D4A853]/10 border border-[#D4A853]/20 rounded-lg p-3 flex items-start gap-3">
                                <Clock className="w-5 h-5 text-[#D4A853] flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[#D4A853] text-xs font-bold uppercase tracking-wider mb-1">Campaña de tiempo limitado</p>
                                    <p className="text-[#888888] text-[0.7rem] leading-relaxed">Este briefing tiene una duración limitada de {maxDaysInFuture} días. Las sesiones se pueden agendar con {minAdvanceHours} horas de anticipación.</p>
                                </div>
                            </div>

                            <div className="mb-[15px]">
                                <label className="block text-[0.65rem] uppercase tracking-[2px] text-[#D4A853] font-bold mb-2">Selecciona una Fecha *</label>
                                <div className="relative">
                                    <select
                                        value={selectedDate}
                                        onChange={(e) => {
                                            setSelectedDate(e.target.value);
                                            setSelectedTime('');
                                        }}
                                        className="w-full p-[12px_15px] text-sm bg-[#1a1a1a] border border-[#444444] text-white rounded focus:outline-none focus:border-[#D4A853] transition-all appearance-none"
                                    >
                                        <option value="" disabled className="text-gray-500">Elige un día disponible...</option>
                                        {eachDayOfInterval({ start: today, end: maxAllowedDate })
                                            .filter(day => getAvailableSlots(format(day, 'yyyy-MM-dd')).length > 0)
                                            .map(day => {
                                                const dateStr = format(day, 'yyyy-MM-dd');
                                                const label = format(day, "EEEE d 'de' MMMM", { locale: es });
                                                const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);
                                                return <option key={dateStr} value={dateStr} className="text-black">{capitalizedLabel}</option>;
                                            })}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#888888] text-xs">
                                        ▼
                                    </div>
                                </div>
                            </div>

                        {selectedDate && (
                            <div className="mb-[15px] animate-[fadeIn_0.3s_ease]">
                                <label className="block text-[0.65rem] uppercase tracking-[2px] text-[#D4A853] mb-[8px] font-bold">Horario Disponible *</label>
                                {availableSlots.length > 0 ? (
                                    <div className="relative">
                                        <select
                                            value={selectedTime}
                                            onChange={(e) => setSelectedTime(e.target.value)}
                                            className="w-full p-[12px_15px] text-sm bg-[#1a1a1a] border border-[#444444] text-white rounded focus:outline-none focus:border-[#D4A853] transition-all appearance-none"
                                        >
                                            <option value="" disabled className="text-gray-500">Selecciona la hora...</option>
                                            {availableSlots.map(time => (
                                                <option key={time} value={time} className="text-black">
                                                    {time} hrs
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#888888] text-xs">
                                            ▼
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-[15px] bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs text-center">
                                        No hay horarios disponibles para la fecha seleccionada.
                                    </div>
                                )}
                            </div>
                        )}
                        <p className="text-xs text-zinc-500 mt-2 mb-4">Duración aproximada: {config?.durationMinutes || 45} minutos.</p>
                        
                        {meetingType === 'CHOICE' && (
                            <div className="mb-[15px] mt-[15px] animate-[fadeIn_0.3s_ease]">
                                <label className="block text-[0.65rem] uppercase tracking-[2px] text-[#D4A853] mb-[8px] font-bold">Modalidad de la Reunión *</label>
                                <div className="relative">
                                    <select
                                        value={meetingPreference}
                                        onChange={(e) => setMeetingPreference(e.target.value)}
                                        className="w-full p-[12px_15px] text-sm bg-[#1a1a1a] border border-[#444444] text-white rounded focus:outline-none focus:border-[#D4A853] transition-all appearance-none"
                                        required
                                    >
                                        <option value="" disabled className="text-gray-500">Elige modalidad...</option>
                                        <option value="PHYSICAL" className="text-black">Física ({eventLocation || 'Presencial'})</option>
                                        <option value="VIRTUAL" className="text-black">Virtual (Se enviará enlace Google Meet)</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#888888] text-xs">
                                        ▼
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                <div>
                    <label className="block text-[0.65rem] uppercase tracking-[2px] text-[#888888] mb-[5px]">Nombre Completo</label>
                    <input 
                        type="text" 
                        name="nombre" 
                        required 
                        placeholder="Ej. Alejandro Torres"
                        className="w-full p-[10px_0] text-sm bg-transparent border-b border-[#444444] text-white focus:outline-none focus:border-[#D4A853] transition-all"
                    />
                </div>

                <div>
                    <label className="block text-[0.65rem] uppercase tracking-[2px] text-[#888888] mb-[5px]">Correo Electrónico</label>
                    <input 
                        type="email" 
                        name="email" 
                        required 
                        placeholder="email@ejemplo.com"
                        className="w-full p-[10px_0] text-sm bg-transparent border-b border-[#444444] text-white focus:outline-none focus:border-[#D4A853] transition-all"
                    />
                </div>

                <div>
                    <label className="block text-[0.65rem] uppercase tracking-[2px] text-[#888888] mb-[5px]">Telefono (WhatsApp)</label>
                    <input 
                        type="tel" 
                        name="telefono" 
                        placeholder="+52 123 456 7890"
                        className="w-full p-[10px_0] text-sm bg-transparent border-b border-[#444444] text-white focus:outline-none focus:border-[#D4A853] transition-all"
                    />
                </div>

                <div>
                    <label className="block text-[0.65rem] uppercase tracking-[2px] text-[#888888] mb-[5px]">Perfil</label>
                    <select 
                        name="perfil" 
                        required
                        className="w-full p-[10px_0] text-sm bg-transparent border-b border-[#444444] text-white focus:outline-none focus:border-[#D4A853] transition-all appearance-none"
                    >
                        <option value="" className="text-black">Selecciona un perfil...</option>
                        <option value="inversor" className="text-black">Inversor / Accionista</option>
                        <option value="agente" className="text-black">Agente / Broker</option>
                        <option value="cliente" className="text-black">Cliente</option>
                    </select>
                </div>

                {state?.error && (
                    <div className="text-red-400 text-sm">{state.error}</div>
                )}

                <button 
                    type="submit" 
                    disabled={isPending || !!validationError || (isCalendar && (!selectedDate || !selectedTime || !meetingPreference))}
                    className="w-full py-[12px] px-[30px] bg-[#D4A853] text-[#111111] font-bold text-sm tracking-[2px] uppercase rounded cursor-pointer transition-all hover:bg-white hover:shadow-[0_0_20px_rgba(212,168,83,0.4)] disabled:opacity-50 disabled:cursor-not-allowed mt-[15px]"
                >
                    {isPending ? 'Enviando...' : (isCalendar ? 'Agendar Reunión' : 'Confirmar Asistencia')}
                </button>
            </form>
        </div>
    );
}
