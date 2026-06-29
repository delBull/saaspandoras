import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { resolveUserByAlias, getAvailableSlots, seedDefaultSlots } from "@/actions/scheduling";
import { SchedulerForm, type MeetingType } from "@/components/scheduler/SchedulerForm";

export const metadata: Metadata = {
    title: "Agendar Llamada | Pandora's Finance",
    description: "Agenda una sesión soberana.",
};

export default async function SchedulePage({
    params,
    searchParams,
}: {
    params: Promise<{ username: string }>;
    searchParams: Promise<{ type?: string; widget?: string }>;
}) {

    const { username } = await params;
    const { type, widget } = await searchParams;
    const { success, userId, name } = await resolveUserByAlias(username);

    const validTypes: MeetingType[] = ['strategy', 'architecture', 'capital'];
    const meetingType = validTypes.includes(type as MeetingType) ? (type as MeetingType) : 'strategy';

    if (!success || !userId) return notFound();

    const isWidget = widget === 'true';
    const { slots } = await getAvailableSlots(userId);
    const hasSlots = slots && slots.length > 0;

    if (isWidget) {
        return (
            <div className="bg-black text-white min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-lg">
                    {hasSlots ? (
                        <SchedulerForm userId={userId} meetingType={meetingType} />
                    ) : (
                        <NoSlotsMessage userId={userId} />
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header Bar */}
            <div className="border-b border-[#D4A853]/10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">
                            Agenda <span className="text-[#D4A853]">Soberana</span>
                        </h1>
                        <p className="text-xs text-zinc-500">Sesión con {name}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500">
                        <span className="w-2 h-2 rounded-full bg-[#D4A853]" />
                        Privado & Encriptado
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-6 py-12">
                <div className="grid lg:grid-cols-5 gap-8">
                    {/* Left: Info */}
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">
                                Conversemos
                            </h2>
                            <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                                Agenda una sesión privada con el equipo. Sin compromiso, sin presión.
                                Solo una conversación para conocer tu visión y explorar cómo podemos colaborar.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-xl">
                                <div className="w-10 h-10 rounded-lg bg-[#D4A853]/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-lg">🕒</span>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-white">
                                        {meetingType === 'architecture' ? '20 minutos' : '30 minutos'}
                                    </div>
                                    <div className="text-xs text-zinc-500">Duración de la sesión</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-xl">
                                <div className="w-10 h-10 rounded-lg bg-[#D4A853]/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-lg">📹</span>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-white">Google Meet / Zoom</div>
                                    <div className="text-xs text-zinc-500">Recibirás el enlace al confirmar</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-xl">
                                <div className="w-10 h-10 rounded-lg bg-[#D4A853]/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-lg">🛡️</span>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-white">Sesión Privada</div>
                                    <div className="text-xs text-zinc-500">Conversación 1-a-1 confidencial</div>
                                </div>
                            </div>
                        </div>

                        <blockquote className="border-l-2 border-[#D4A853]/30 pl-4 text-sm text-zinc-500 italic">
                            "No vendemos propiedades. Construimos acceso."
                        </blockquote>
                    </div>

                    {/* Right: Form */}
                    <div className="lg:col-span-3">
                        <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-2xl p-6 lg:p-8">
                            {hasSlots ? (
                                <SchedulerForm userId={userId} meetingType={meetingType} />
                            ) : (
                                <NoSlotsMessage userId={userId} />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[#D4A853]/10 mt-12">
                <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-zinc-600">
                    <span>Pandora's Finance</span>
                    <span>No vendemos propiedades. Construimos acceso.</span>
                </div>
            </div>
        </div>
    );
}

function NoSlotsMessage({ userId }: { userId: string }) {
    return (
        <div className="text-center py-12 space-y-4">
            <div className="text-4xl">📅</div>
            <h3 className="text-lg font-bold text-zinc-300">No hay horarios disponibles</h3>
            <p className="text-sm text-zinc-500 max-w-xs mx-auto">
                Este enlace está configurado pero los horarios aún no se han generado.
            </p>
            <form action={async () => {
                'use server';
                await seedDefaultSlots(userId);
            }}>
                <button
                    type="submit"
                    className="px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all duration-300"
                    style={{ backgroundColor: '#D4A853', color: '#000' }}
                >
                    Generar Horarios Disponibles
                </button>
            </form>
        </div>
    );
}
