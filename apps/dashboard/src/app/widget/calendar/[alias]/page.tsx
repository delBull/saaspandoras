import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { resolveUserByAlias, getAvailableSlots } from "@/actions/scheduling";
import { SchedulerForm, type MeetingType } from "@/components/scheduler/SchedulerForm";

export const metadata: Metadata = {
    title: "Agenda Soberana Widget | Pandora's Finance",
    description: "Incrustador de agenda soberana para landings, apps y MiniApps.",
};

export default async function CalendarWidgetPage({
    params,
    searchParams,
}: {
    params: Promise<{ alias: string }>;
    searchParams: Promise<{ type?: string }>;
}) {
    const { alias } = await params;
    const { type } = await searchParams;
    const { success, userId, name } = await resolveUserByAlias(alias);

    if (!success || !userId) return notFound();

    const validTypes: MeetingType[] = ['strategy', 'architecture', 'capital'];
    const meetingType = validTypes.includes(type as MeetingType) ? (type as MeetingType) : 'strategy';

    const { slots } = await getAvailableSlots(userId);
    const hasSlots = slots && slots.length > 0;

    return (
        <div className="bg-transparent text-white min-h-screen flex items-center justify-center p-2 sm:p-4">
            <div className="w-full max-w-lg">
                <div className="mb-4 text-center">
                    <h2 className="text-sm font-semibold tracking-wide text-zinc-300">
                        Agenda Soberana · <span className="text-[#D4A853]">{name}</span>
                    </h2>
                    <p className="text-[11px] text-zinc-500">Selecciona fecha y hora disponible</p>
                </div>
                {hasSlots ? (
                    <SchedulerForm userId={userId} meetingType={meetingType} />
                ) : (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-center">
                        <p className="text-zinc-400 text-sm">No hay horarios disponibles en este momento.</p>
                        <p className="text-zinc-500 text-xs mt-1">Por favor consulta más tarde o solicita un horario directo al anfitrión.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
