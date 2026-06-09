'use client';

import { useActionState, useEffect, useState } from 'react';
import { registerForEvent } from './actions';
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"] });

export function EventRegistrationForm({ eventId, projectId, eventDate, eventLocation }: { eventId: number, projectId: number, eventDate: string, eventLocation: string }) {
    const [state, formAction, isPending] = useActionState(registerForEvent, null);
    const [isSuccess, setIsSuccess] = useState(false);

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
                    disabled={isPending}
                    className="w-full p-[20px] bg-[#D4A853] text-[#050505] font-bold uppercase tracking-[2px] mt-[20px] transition-all hover:bg-white hover:scale-[1.02] disabled:opacity-50"
                >
                    {isPending ? 'Enviando...' : 'Confirmar Asistencia'}
                </button>
            </form>
        </div>
    );
}
