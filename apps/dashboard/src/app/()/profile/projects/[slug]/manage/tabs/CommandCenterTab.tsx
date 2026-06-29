import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { 
    RocketLaunchIcon, 
    ChartBarIcon, 
    UserGroupIcon, 
    LightBulbIcon,
    CurrencyDollarIcon,
    CheckCircleIcon,
    PlayIcon,
    DocumentTextIcon,
    ArrowTrendingUpIcon,
    QuestionMarkCircleIcon,
    CalendarDaysIcon
} from '@heroicons/react/24/solid';
import { FounderCopilot } from '../components/FounderCopilot';
import { LeadTimelineModal } from '../components/LeadTimelineModal';
import { CommandCenterGuideModal } from '../components/CommandCenterGuideModal';
import { getCommandCenterStats, type CommandCenterStats } from '@/actions/command-center';
import { SchedulerForm } from '@/components/scheduler/SchedulerForm';

interface CommandCenterTabProps {
    project: any;
}

const MOCK_STATS: CommandCenterStats = {
    northStar: { totalLeads: 124, meetings: 38, participants: 3, committedCapital: 150000 },
    mission: { meetingsToday: 4, followUpsToday: 8, newLeadsToday: 6, whitepapersSent: 3, scheduledMeetings: 2, potentialCapital: 450000 },
    momentum30d: { meetings: 38, interested: 14, dueDiligence: 7, participations: 3 },
    pipeline: [
        { name: 'Nuevo', count: 12 },
        { name: 'Interesado', count: 8 },
        { name: 'Due Diligence', count: 2 },
        { name: 'Participación', count: 3 },
    ],
    leads: [
        { id: "1", name: "Luis Mendoza", status: "Reunión", date: "Hace 2 horas" },
        { id: "2", name: "Carlos Slim (Fake)", status: "Interesado", date: "Hace 4 horas" },
        { id: "3", name: "María Torres", status: "Committed", date: "Ayer" },
    ],
    activities: [
        { type: "meeting", description: "Reunión con Carlos (Regular)", isToday: true },
        { type: "whitepaper", description: "Whitepaper enviado a Luis", isToday: true },
        { type: "follow_up", description: "Follow-up enviado a Ana", isToday: true },
        { type: "new_lead", description: "Nuevo lead orgánico", isToday: false },
        { type: "survey", description: "Respondió encuesta Telegram", isToday: false },
    ],
    insights: [
        "¿Qué significa realmente el acceso?",
        "¿Cómo obtengo beneficios líquidos?",
        "¿Puedo vender mi participación luego?",
    ],
};

export function CommandCenterTab({ project }: CommandCenterTabProps) {
    const [selectedLead, setSelectedLead] = useState<any | null>(null);
    const [showGuide, setShowGuide] = useState(false);
    const [showSchedule, setShowSchedule] = useState(false);
    const [ownerUserId, setOwnerUserId] = useState<string | null>(null);
    const [stats, setStats] = useState<CommandCenterStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const hasSeenGuide = localStorage.getItem('snarai_cmd_guide_seen');
        if (!hasSeenGuide) {
            setShowGuide(true);
            localStorage.setItem('snarai_cmd_guide_seen', 'true');
        }
        // Resolve owner user ID from project wallet
        if (project.applicantWalletAddress) {
            fetch(`/api/v1/users/by-wallet?address=${project.applicantWalletAddress}`)
                .then(r => r.ok ? r.json() : null)
                .then(data => {
                    if (data?.id) setOwnerUserId(data.id);
                })
                .catch(() => {});
        }
    }, [project.applicantWalletAddress]);

    useEffect(() => {
        const projectId = Number(project.id);
        if (isNaN(projectId)) {
            setLoading(false);
            return;
        }
        getCommandCenterStats(projectId)
            .then((data) => setStats(data))
            .catch(() => setStats(null))
            .finally(() => setLoading(false));
    }, [project.id]);

    const data = stats ?? MOCK_STATS;

    return (
        <div className="space-y-6 relative pb-20">
            {/* NORTH STAR */}
            <div className="bg-gradient-to-r from-emerald-900/40 to-black rounded-xl border border-emerald-500/20 p-6 shadow-[0_0_30px_rgba(16,185,129,0.1)] relative">
                <button 
                    onClick={() => setShowGuide(true)}
                    className="absolute top-6 right-6 p-2 bg-black/50 hover:bg-emerald-900/50 border border-emerald-500/30 rounded-full text-emerald-400 transition-colors flex items-center gap-2 group"
                >
                    <QuestionMarkCircleIcon className="w-5 h-5" />
                    <span className="text-xs font-bold w-0 overflow-hidden group-hover:w-16 transition-all duration-300">Ver Guía</span>
                </button>
                <div className="flex items-center gap-3 mb-4">
                    <RocketLaunchIcon className="w-6 h-6 text-emerald-400" />
                    <div>
                        <h2 className="text-sm font-black text-emerald-400 tracking-widest uppercase">North Star</h2>
                        <h3 className="text-2xl font-bold text-white">Acceso Habilitado</h3>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-black/50 p-4 rounded-lg border border-emerald-500/10">
                        <p className="text-xs text-zinc-500 font-bold uppercase mb-1">Personas Impactadas</p>
                        <p className="text-2xl font-mono text-white">{data.northStar.totalLeads}</p>
                    </div>
                    <div className="bg-black/50 p-4 rounded-lg border border-emerald-500/10">
                        <p className="text-xs text-zinc-500 font-bold uppercase mb-1">Reuniones</p>
                        <p className="text-2xl font-mono text-white">{data.northStar.meetings}</p>
                    </div>
                    <div className="bg-black/50 p-4 rounded-lg border border-emerald-500/10">
                        <p className="text-xs text-zinc-500 font-bold uppercase mb-1">Participantes</p>
                        <p className="text-2xl font-mono text-emerald-400">{data.northStar.participants}</p>
                    </div>
                    <div className="bg-black/50 p-4 rounded-lg border border-emerald-500/10">
                        <p className="text-xs text-zinc-500 font-bold uppercase mb-1">Capital Comprometido</p>
                        <p className="text-2xl font-mono text-emerald-400">${data.northStar.committedCapital.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* MISSION */}
                <div className="md:col-span-2 bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                    <h3 className="text-xs font-black tracking-widest text-zinc-500 uppercase mb-6 flex items-center gap-2">
                        <PlayIcon className="w-4 h-4 text-white" />
                        Mission (Progreso Diario)
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800/50">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-sm text-zinc-400 font-medium">Reuniones</p>
                                <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300">{data.mission.meetingsToday} / 5</span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-1.5"><div className="bg-white h-1.5 rounded-full" style={{ width: `${Math.min((data.mission.meetingsToday / 5) * 100, 100)}%` }}></div></div>
                        </div>
                        <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800/50">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-sm text-zinc-400 font-medium">Seguimientos</p>
                                <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300">{data.mission.followUpsToday} / 10</span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-1.5"><div className="bg-white h-1.5 rounded-full" style={{ width: `${Math.min((data.mission.followUpsToday / 10) * 100, 100)}%` }}></div></div>
                        </div>
                        <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800/50">
                            <p className="text-sm text-zinc-400 font-medium mb-1">Nuevos Leads</p>
                            <p className="text-xl font-mono text-white">{data.mission.newLeadsToday}</p>
                        </div>
                        <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800/50">
                            <p className="text-sm text-zinc-400 font-medium mb-1">Whitepapers Enviados</p>
                            <p className="text-xl font-mono text-white">{data.mission.whitepapersSent}</p>
                        </div>
                        <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800/50">
                            <p className="text-sm text-zinc-400 font-medium mb-1">Reuniones Agendadas</p>
                            <p className="text-xl font-mono text-white">{data.mission.scheduledMeetings}</p>
                        </div>
                        <div className="p-4 bg-emerald-950/20 rounded-xl border border-emerald-900/30">
                            <p className="text-sm text-emerald-500 font-medium mb-1">Capital Potencial</p>
                            <p className="text-xl font-mono text-emerald-400">${data.mission.potentialCapital.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* MOMENTUM & INSIGHTS */}
                <div className="space-y-6">
                    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                        <h3 className="text-xs font-black tracking-widest text-zinc-500 uppercase mb-4 flex items-center gap-2">
                            <ArrowTrendingUpIcon className="w-4 h-4 text-blue-400" />
                            Momentum (30 Días)
                        </h3>
                        <ul className="space-y-3">
                            <li className="flex justify-between items-center text-sm"><span className="text-zinc-400">Reuniones</span><span className="font-mono text-white">{data.momentum30d.meetings}</span></li>
                            <li className="flex justify-between items-center text-sm"><span className="text-zinc-400">Interesados</span><span className="font-mono text-white">{data.momentum30d.interested}</span></li>
                            <li className="flex justify-between items-center text-sm"><span className="text-zinc-400">Due Diligence</span><span className="font-mono text-white">{data.momentum30d.dueDiligence}</span></li>
                            <li className="flex justify-between items-center text-sm"><span className="text-zinc-400 text-emerald-400">Participaciones</span><span className="font-mono text-emerald-400 font-bold">{data.momentum30d.participations}</span></li>
                        </ul>
                    </div>

                    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                        <h3 className="text-xs font-black tracking-widest text-zinc-500 uppercase mb-4 flex items-center gap-2">
                            <LightBulbIcon className="w-4 h-4 text-yellow-500" />
                            Insights (Semana)
                        </h3>
                        <p className="text-xs text-zinc-400 mb-3">Preguntas más repetidas:</p>
                        <ol className="list-decimal pl-4 space-y-2 text-sm text-zinc-300">
                            {data.insights.length > 0 ? data.insights.map((q, i) => (
                                <li key={i}>{q}</li>
                            )) : (
                                <li className="text-zinc-500">Sin datos aún. Las preguntas aparecerán aquí automáticamente.</li>
                            )}
                        </ol>
                    </div>
                </div>
            </div>

            {/* PIPELINE & CRM TIMELINE ENTRY */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <h3 className="text-xs font-black tracking-widest text-zinc-500 uppercase mb-6 flex items-center gap-2">
                    <UserGroupIcon className="w-4 h-4 text-white" />
                    Pipeline & Leads
                </h3>
                
                {/* Pipeline visual */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-2 mb-8 overflow-x-auto pb-4">
                    {data.pipeline.map((stage, idx) => (
                        <React.Fragment key={stage.name}>
                            <div className="flex flex-col items-center min-w-[100px]">
                                <span className="text-2xl font-mono font-bold text-white mb-1">{stage.count}</span>
                                <span className={`text-xs uppercase font-bold ${stage.name === 'Participación' ? 'text-emerald-400' : 'text-zinc-500'}`}>{stage.name}</span>
                            </div>
                            {idx < data.pipeline.length - 1 && (
                                <div className="hidden md:block w-8 h-px bg-zinc-700"></div>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Quick Leads List to open Timeline */}
                <div className="border-t border-zinc-800 pt-6">
                    <p className="text-xs text-zinc-500 uppercase font-black mb-4">Contactos Activos</p>
                    <div className="grid gap-3">
                        {data.leads.map(lead => (
                            <div 
                                key={lead.id}
                                onClick={() => setSelectedLead(lead)}
                                className="flex justify-between items-center p-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800/50 rounded-lg cursor-pointer transition-colors"
                            >
                                <div>
                                    <p className="text-sm font-bold text-white">{lead.name}</p>
                                    <p className="text-xs text-zinc-500">{lead.date}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] uppercase font-black px-2 py-1 rounded ${lead.status === 'converted' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                                        {lead.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {data.leads.length === 0 && (
                            <p className="text-sm text-zinc-500 text-center py-4">No hay contactos activos aún.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* PROGRESS LOG LINK */}
            <Link
                href={`/profile/projects/${project.slug}/progress-log`}
                className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-emerald-500/30 hover:bg-zinc-800 transition-all group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <DocumentTextIcon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">Progress Log</p>
                        <p className="text-xs text-zinc-500">Registro semanal de avances del proyecto</p>
                    </div>
                </div>
                <span className="text-xs text-zinc-600 group-hover:text-emerald-400 transition-colors">Ir →</span>
            </Link>

            {/* SCHEDULE BUTTON */}
            <button
                onClick={() => setShowSchedule(true)}
                className="flex items-center justify-between w-full p-4 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-lime-500/30 hover:bg-zinc-800 transition-all group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-lime-500/10 flex items-center justify-center">
                        <CalendarDaysIcon className="w-5 h-5 text-lime-400" />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-bold text-white group-hover:text-lime-400 transition-colors">Agenda una Conversacion</p>
                        <p className="text-xs text-zinc-500">Comparte disponibilidad con leads</p>
                    </div>
                </div>
                <span className="text-xs text-zinc-600 group-hover:text-lime-400 transition-colors">Abrir →</span>
            </button>

            {/* ACTIVITY LOG */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <h3 className="text-xs font-black tracking-widest text-zinc-500 uppercase mb-6 flex items-center gap-2">
                    <DocumentTextIcon className="w-4 h-4 text-white" />
                    Activity Log
                </h3>
                <div className="space-y-6">
                    {data.activities.some(a => a.isToday) && (
                        <div>
                            <p className="text-xs font-bold text-white mb-3">Hoy</p>
                            <ul className="space-y-2">
                                {data.activities.filter(a => a.isToday).map((a, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-zinc-400">
                                        <CheckCircleIcon className="w-4 h-4 text-emerald-500" /> {a.description}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {data.activities.some(a => !a.isToday) && (
                        <div>
                            <p className="text-xs font-bold text-zinc-500 mb-3">Ayer</p>
                            <ul className="space-y-2">
                                {data.activities.filter(a => !a.isToday).map((a, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-zinc-500">
                                        <CheckCircleIcon className="w-4 h-4 text-zinc-700" /> {a.description}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {data.activities.length === 0 && (
                        <p className="text-sm text-zinc-500 text-center py-4">Sin actividad reciente.</p>
                    )}
                </div>
            </div>

            {/* ABSOLUTE OVERLAYS */}
            <FounderCopilot />
            
            {selectedLead && (
                <LeadTimelineModal 
                    lead={selectedLead} 
                    onClose={() => setSelectedLead(null)} 
                />
            )}

            <AnimatePresence>
                {showGuide && (
                    <CommandCenterGuideModal onClose={() => setShowGuide(false)} />
                )}
            </AnimatePresence>

            {/* SCHEDULE MODAL */}
            <AnimatePresence>
                {showSchedule && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 p-0 md:p-8"
                        onClick={() => setShowSchedule(false)}
                    >
                        <motion.div
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-t-2xl md:rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowSchedule(false)}
                                className="absolute top-4 right-4 w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>

                            {ownerUserId ? (
                                <SchedulerForm userId={ownerUserId} meetingType="strategy" />
                            ) : (
                                <div className="text-center py-8 text-zinc-500">
                                    <p className="text-sm">Cargando disponibilidad...</p>
                                    <p className="text-xs text-zinc-600 mt-2">No se encontro un usuario propietario para este proyecto.</p>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
