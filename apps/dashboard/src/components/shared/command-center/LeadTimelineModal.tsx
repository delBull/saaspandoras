import React, { useState } from 'react';
import { XMarkIcon, CheckCircleIcon, PlayIcon, ChatBubbleLeftEllipsisIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { completeMeetingOutcome } from '@/actions/meeting-outcome';

interface LeadTimelineModalProps {
    lead: any;
    onClose: () => void;
}

export function LeadTimelineModal({ lead, onClose }: LeadTimelineModalProps) {
    const [view, setView] = useState<'timeline' | 'end_meeting' | 'ai_result'>('timeline');
    
    // Form state
    const [meetingScore, setMeetingScore] = useState<'Excelente' | 'Buena' | 'Regular' | 'Mala' | null>(null);
    const [meetingNotes, setMeetingNotes] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Mock timeline
    const timeline = [
        { date: 'Hoy', event: 'Reunión presencial de 45 mins.', type: 'meeting' },
        { date: 'Ayer', event: 'Whitepaper enviado por correo.', type: 'action' },
        { date: 'Hace 3 días', event: 'Lead registrado vía orgánico.', type: 'creation' },
    ];

    const handleGenerate = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
            setView('ai_result');
        }, 2000);
    };

    const getSummary = () => {
        const scoreMap: Record<string, string> = {
            Excelente: 'muy positiva. El lead mostró gran interés y alineación con la visión.',
            Buena: 'positiva. El lead está interesado pero con reservas razonables.',
            Regular: 'mixta. El lead mostró interés inicial pero expresó dudas significativas.',
            Mala: 'difícil. El lead no se mostró convencido y hay objeciones fuertes que resolver.',
        };
        return `Reunión catalogada como ${meetingScore}. La sesión fue ${scoreMap[meetingScore || 'Buena']}${meetingNotes ? ` Durante la conversación, el lead planteó: "${meetingNotes}"` : ''}. Se sugiere un follow-up rápido enfocado en resolver las objeciones específicas mencionadas.`;
    };

    const getWhatsAppDraft = (): string => {
        const name = lead.name?.split(' ')[0] || lead.name || 'allá';
        const scoreTemplates: Record<string, string> = {
            Excelente: `"Hola ${name}, increíble charla hoy. Me queda claro que hay mucho potencial juntos. Te comparto los siguientes pasos que hablamos para que los revisemos en los próximos días. ¡En marcha!"`,
            Buena: `"Hola ${name}, muy buena plática hoy. Me quedé dándole vuelta a tu visión y creo que tenemos un camino muy sólido. Te comparto el resumen de lo que hablamos."`,
            Regular: `"Hola ${name}, gracias por tu tiempo hoy. Entiendo tus dudas y preparé un documento corto que aborda justo los puntos que mencionaste. Te lo comparto para que lo revises."`,
            Mala: `"Hola ${name}, gracias por la conversación de hoy. Aprecio tu honestidad. Quedo atento a cualquier duda que surja y a tu ritmo para los siguientes pasos."`,
        };
        return scoreTemplates[meetingScore || 'Buena']!;
    };

    const getNextSteps = () => {
        const base = [
            { text: 'Registrar outcome en el pipeline del CRM', done: false },
        ];
        const byScore: Record<string, { text: string; done: boolean }[]> = {
            Excelente: [
                { text: 'Enviar acuerdo de confidencialidad (NDA)', done: false },
                { text: 'Agendar siguiente reunión con el equipo legal', done: false },
                { text: 'Mover a fase Due Diligence', done: false },
            ],
            Buena: [
                { text: 'Enviar whitepaper y proyecciones actualizadas', done: false },
                { text: 'Agendar follow-up en 48h', done: false },
                { text: 'Mover a fase Interesado', done: false },
            ],
            Regular: [
                { text: 'Enviar documento de objeciones resueltas', done: false },
                { text: 'Agendar follow-up en 1 semana', done: false },
                { text: 'Mantener en fase de seguimiento', done: false },
            ],
            Mala: [
                { text: 'Enviar agradecimiento y quedar abiertos', done: false },
                { text: 'Archivar lead si no hay respuesta en 30 días', done: false },
            ],
        };
        return [...base, ...(byScore[meetingScore || 'Buena'] || [])];
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 flex justify-between items-start bg-zinc-900/50">
                    <div>
                        <h2 className="text-xl font-bold text-white">{lead.name}</h2>
                        <span className="inline-block mt-2 text-[10px] uppercase font-black px-2 py-1 rounded bg-zinc-800 text-zinc-400">
                            Fase: {lead.status}
                        </span>
                    </div>
                    <button onClick={onClose} className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-y-auto">
                    {view === 'timeline' && (
                        <div className="space-y-8">
                            <div className="relative border-l border-zinc-800 ml-3 space-y-6">
                                {timeline.map((item, idx) => (
                                    <div key={idx} className="relative pl-6">
                                        <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-zinc-700 ring-4 ring-zinc-950"></div>
                                        <p className="text-xs font-bold text-zinc-500 mb-1">{item.date}</p>
                                        <div className="bg-zinc-900 border border-zinc-800/50 p-3 rounded-lg text-sm text-zinc-300">
                                            {item.event}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button 
                                onClick={() => setView('end_meeting')}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-black font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex justify-center items-center gap-2"
                            >
                                <PlayIcon className="w-4 h-4" />
                                Finalizar Reunión
                            </button>
                        </div>
                    )}

                    {view === 'end_meeting' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div>
                                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                    <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-emerald-400" />
                                    ¿Cómo salió la reunión?
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Excelente', 'Buena', 'Regular', 'Mala'].map(score => (
                                        <button 
                                            key={score}
                                            onClick={() => setMeetingScore(score as any)}
                                            className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                                                meetingScore === score 
                                                ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' 
                                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                                            }`}
                                        >
                                            {score}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-white mb-3">¿Qué preguntó? ¿Hubo objeciones?</h3>
                                <textarea 
                                    value={meetingNotes}
                                    onChange={e => setMeetingNotes(e.target.value)}
                                    placeholder="Ej. Le preocupó la liquidez a corto plazo. Preguntó por el equipo legal..."
                                    className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 focus:border-emerald-500 outline-none resize-none h-32"
                                />
                            </div>

                            <button 
                                onClick={handleGenerate}
                                disabled={!meetingScore || isGenerating}
                                className="w-full py-4 bg-zinc-100 hover:bg-white disabled:opacity-50 text-black font-black uppercase tracking-widest text-xs rounded-xl transition-all flex justify-center items-center gap-2"
                            >
                                {isGenerating ? 'Analizando Contexto...' : (
                                    <>
                                        <SparklesIcon className="w-4 h-4" />
                                        Generar Resumen e Insights
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {view === 'ai_result' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-4">
                                <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-2">Resumen Automatico</h4>
                                <p className="text-sm text-zinc-300">{getSummary()}</p>
                            </div>

                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Borrador de Seguimiento (WhatsApp)</h4>
                                <p className="text-sm text-zinc-300 italic">{getWhatsAppDraft()}</p>
                                <button 
                                    onClick={() => { navigator.clipboard.writeText(getWhatsAppDraft().replace(/"/g, '')); }}
                                    className="mt-3 text-xs font-bold text-emerald-400 hover:text-emerald-300"
                                >
                                    Copiar al portapapeles
                                </button>
                            </div>

                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Proximos Pasos Sugeridos</h4>
                                <ul className="text-sm text-zinc-300 space-y-2">
                                    {getNextSteps().map((step, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <CheckCircleIcon className={`w-4 h-4 ${step.done ? 'text-emerald-500' : 'text-zinc-600'}`} />
                                            {step.text}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button 
                                onClick={async () => {
                                    if (meetingScore) {
                                        await completeMeetingOutcome(lead.id, meetingScore, meetingNotes);
                                    }
                                    setView('timeline');
                                    setMeetingScore(null);
                                    setMeetingNotes('');
                                }}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-black font-black uppercase tracking-widest text-xs rounded-xl transition-all"
                            >
                                Guardar y Cerrar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
