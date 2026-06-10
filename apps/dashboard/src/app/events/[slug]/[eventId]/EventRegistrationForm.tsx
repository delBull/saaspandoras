'use client';

import { useActionState, useEffect, useState } from 'react';
import { registerForEvent } from './actions';
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"] });

export function EventRegistrationForm({ eventId, projectId, eventDate, eventLocation, isCalendar, config }: { eventId: number, projectId: number, eventDate: string, eventLocation: string, isCalendar?: boolean, config?: any }) {
    const [state, formAction, isPending] = useActionState(registerForEvent, null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

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
                    Gracias por tu interés en asistir.
                    <br /><br />
                    En los próximos días recibirás los detalles del evento privado de presentación.
                </p>
                <div className="border-t border-b border-[#D4A853]/30 py-[25px] my-[30px]">
                    <div className={`text-[1.4rem] text-[#D4A853] ${playfair.className}`}>{eventDate}</div>
                    <div className="text-[0.9rem] text-[#888888] mt-[5px]">{eventLocation}</div>
                </div>
                <p className="text-[0.9rem]">Mientras tanto, reserva la fecha.</p>
            </div>
        );
    }

    return (
        <div id="formSection" className="animate-[fadeInUp_0.6s_ease_backwards]">
            <div className="text-center mb-[40px]">
                <h2 className={`text-[2rem] tracking-[1px] ${playfair.className}`}>Confirma tu <span className="text-[#D4A853]">Asistencia</span></h2>
            </div>

            <form action={formAction} className="space-y-[25px]">
                <input type="hidden" name="eventId" value={eventId} />
                <input type="hidden" name="projectId" value={projectId} />
                
                {isCalendar && (
                    <div className="mb-[20px]">
                        <div className="mb-[15px] p-[15px] bg-[#1a1a1a] border border-[#333333] rounded">
                            <h4 className="text-[0.7rem] uppercase tracking-[2px] text-[#D4A853] mb-[10px] font-bold">Horarios Disponibles</h4>
                            {config?.availability ? (
                                <ul className="text-xs text-zinc-400 space-y-1">
                                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(dayKey => {
                                        const dayConfig = config.availability[dayKey];
                                        if (!dayConfig || !dayConfig.enabled) return null;
                                        
                                        const labels: Record<string, string> = {
                                            monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
                                            thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
                                        };
                                        return (
                                            <li key={dayKey} className="flex justify-between border-b border-[#333333]/50 pb-1">
                                                <span className="font-semibold text-white">{labels[dayKey]}</span>
                                                <span>{dayConfig.start} - {dayConfig.end}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className="text-xs text-zinc-500">Contactar para coordinar horario.</p>
                            )}
                        </div>

                        <label className="block text-[0.7rem] uppercase tracking-[2px] text-[#D4A853] mb-[10px] font-bold">Selecciona Fecha y Hora *</label>
                        <input 
                            type="datetime-local" 
                            name="selectedDateTime" 
                            required 
                            onChange={(e) => {
                                const val = e.target.value;
                                if (!val || !config?.availability) {
                                    setValidationError(null);
                                    return;
                                }
                                const dateObj = new Date(val);
                                const dayIndex = dateObj.getDay(); // 0 = sunday, 1 = monday
                                const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
                                const dayKey = daysMap[dayIndex];
                                
                                if (!dayKey) {
                                    setValidationError("Fecha inválida.");
                                    return;
                                }

                                const dayConfig = config.availability[dayKey];

                                if (!dayConfig || !dayConfig.enabled) {
                                    setValidationError("Ese día de la semana no está disponible para reuniones.");
                                    return;
                                }

                                const selectedHours = dateObj.getHours();
                                const selectedMins = dateObj.getMinutes();
                                const timeStr = `${selectedHours.toString().padStart(2, '0')}:${selectedMins.toString().padStart(2, '0')}`;
                                
                                if (timeStr < dayConfig.start || timeStr > dayConfig.end) {
                                    setValidationError(`El horario de atención es de ${dayConfig.start} a ${dayConfig.end}.`);
                                    return;
                                }

                                setValidationError(null);
                            }}
                            className="w-full p-[15px] bg-[#1a1a1a] border border-[#444444] rounded text-white focus:outline-none focus:border-[#D4A853] transition-all"
                        />
                        {validationError && (
                            <p className="text-red-400 text-xs mt-2 font-semibold">{validationError}</p>
                        )}
                        <p className="text-xs text-zinc-500 mt-2">Duración aproximada: {config?.durationMinutes || 45} minutos.</p>
                    </div>
                )}
                
                <div>
                    <label className="block text-[0.7rem] uppercase tracking-[2px] text-[#888888] mb-[10px]">Nombre Completo</label>
                    <input 
                        type="text" 
                        name="nombre" 
                        required 
                        placeholder="Ej. Marco Bullslab"
                        className="w-full p-[15px_0] bg-transparent border-b border-[#444444] text-white focus:outline-none focus:border-[#D4A853] transition-all"
                    />
                </div>

                <div>
                    <label className="block text-[0.7rem] uppercase tracking-[2px] text-[#888888] mb-[10px]">Correo Electrónico</label>
                    <input 
                        type="email" 
                        name="email" 
                        required 
                        placeholder="email@ejemplo.com"
                        className="w-full p-[15px_0] bg-transparent border-b border-[#444444] text-white focus:outline-none focus:border-[#D4A853] transition-all"
                    />
                </div>

                <div>
                    <label className="block text-[0.7rem] uppercase tracking-[2px] text-[#888888] mb-[10px]">Telefono (WhatsApp)</label>
                    <input 
                        type="tel" 
                        name="telefono" 
                        placeholder="+52 123 456 7890"
                        className="w-full p-[15px_0] bg-transparent border-b border-[#444444] text-white focus:outline-none focus:border-[#D4A853] transition-all"
                    />
                </div>

                <div>
                    <label className="block text-[0.7rem] uppercase tracking-[2px] text-[#888888] mb-[10px]">Perfil</label>
                    <select 
                        name="perfil" 
                        required
                        className="w-full p-[15px_0] bg-transparent border-b border-[#444444] text-white focus:outline-none focus:border-[#D4A853] transition-all appearance-none"
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
                    disabled={isPending || !!validationError}
                    className="w-full py-[15px] px-[30px] bg-[#D4A853] text-[#111111] font-bold tracking-[2px] uppercase rounded cursor-pointer transition-all hover:bg-white hover:shadow-[0_0_20px_rgba(212,168,83,0.4)] disabled:opacity-50 disabled:cursor-not-allowed mt-[20px]"
                >
                    {isPending ? 'Enviando...' : (isCalendar ? 'Agendar Reunión' : 'Confirmar Asistencia')}
                </button>
            </form>
        </div>
    );
}
