import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { resolveUserByAlias } from "@/actions/scheduling";
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

    // Resolve Identity
    const { username } = await params;
    const { type, widget } = await searchParams;
    const { success, userId, name } = await resolveUserByAlias(username);

    // Validate Type
    const validTypes: MeetingType[] = ['strategy', 'architecture', 'capital'];
    const meetingType = validTypes.includes(type as MeetingType) ? (type as MeetingType) : 'strategy';

    if (!success || !userId) {
        return notFound();
    }

    const isWidget = widget === 'true';

    if (isWidget) {
        return (
            <div className="bg-black text-white min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-lg">
                    <SchedulerForm userId={userId} meetingType={meetingType} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800">
                {/* Left: Info */}
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                        Agenda Soberana
                    </h1>
                    <p className="mt-2 text-zinc-400">
                        Sesión con <span className="text-white font-medium">{name}</span>
                    </p>
                    <div className="mt-8 space-y-4">
                        <div className="flex items-center gap-3 text-sm text-zinc-300">
                            <span className="p-2 bg-zinc-800 rounded-lg">🕒</span>
                            <span>{meetingType === 'architecture' ? '20' : '30'} Minutos</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-zinc-300">
                            <span className="p-2 bg-zinc-800 rounded-lg">📹</span>
                            <span>Google Meet / Zoom</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-zinc-300">
                            <span className="p-2 bg-zinc-800 rounded-lg">🛡️</span>
                            <span>Sesión Privada & Encriptada</span>
                        </div>
                    </div>
                </div>

                {/* Right: Calendar */}
                <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-800/50">
                    <SchedulerForm userId={userId} meetingType={meetingType} />
                </div>
            </div>
        </div>
    );
}
