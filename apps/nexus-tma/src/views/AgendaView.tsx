import React, { useEffect, useState } from 'react';
import { nexusGet, nexusPost } from '../lib/api-client';
import { Calendar, Clock, Video, XCircle, ArrowLeft, Loader2 } from 'lucide-react';

interface MeetingAction {
    canJoin: boolean;
    canStart: boolean;
    canCancel: boolean;
}

interface AgendaMeeting {
    id: string;
    title: string;
    startsAt: string;
    endsAt: string;
    status: string;
    hostName: string;
    actions: MeetingAction;
    joinUrl: string | null;
}

interface AgendaViewProps {
    session: any;
    onBack: () => void;
}

export const AgendaView: React.FC<AgendaViewProps> = ({ session, onBack }) => {
    const [meetings, setMeetings] = useState<AgendaMeeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const fetchAgenda = async () => {
        try {
            const res = await nexusGet<{ agenda: AgendaMeeting[] }>('/api/v1/tma/nexus/agenda', session.token);
            if (res.agenda) {
                setMeetings(res.agenda);
            }
        } catch (error) {
            console.error('Error fetching agenda:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchAgenda();
        const interval = setInterval(fetchAgenda, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleCancel = async (id: string) => {
        if (!window.confirm('¿Estás seguro de cancelar esta reunión?')) return;
        try {
            setCancellingId(id);
            await nexusPost(`/api/v1/tma/nexus/meetings/${id}/cancel`, {}, session.token);
            await fetchAgenda();
        } catch (error) {
            console.error('Error cancelling meeting', error);
            alert('Error al cancelar la reunión.');
        } finally {
            setCancellingId(null);
        }
    };

    const handleJoin = (url: string | null) => {
        if (url) {
            window.open(url, '_blank');
        }
    };

    if (loading && meetings.length === 0) {
        return (
            <div className="flex flex-col min-h-screen bg-white">
                <div className="px-6 py-6 border-b border-zinc-100 flex items-center gap-4">
                    <button onClick={onBack} className="w-10 h-10 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-900">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-black italic uppercase tracking-tighter text-zinc-900">Mi Agenda</h1>
                </div>
                <div className="flex-1 flex justify-center items-center">
                    <Loader2 className="animate-spin text-zinc-900" size={32} />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-zinc-50 pb-32 fade-in">
            <div className="px-6 py-6 bg-white border-b border-zinc-100 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack} 
                        className="w-10 h-10 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-900 active:scale-95 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black italic uppercase tracking-tighter text-zinc-900 leading-none">Mi Agenda</h1>
                        <p className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.2em] mt-1">Sovereign OS</p>
                    </div>
                </div>
            </div>

            <div className="px-6 py-8 space-y-6">
                {meetings.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] p-10 border border-zinc-100 text-center space-y-4 shadow-sm">
                        <div className="w-16 h-16 bg-zinc-50 rounded-full mx-auto flex items-center justify-center text-zinc-300">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 italic">Sin Eventos</h3>
                            <p className="text-[10px] font-medium text-zinc-400 mt-2">No tienes reuniones programadas próximamente.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {meetings.map((meeting) => (
                            <div key={meeting.id} className="bg-white rounded-[2rem] p-6 border border-zinc-100 shadow-sm space-y-4 relative overflow-hidden group">
                                {meeting.status === 'live' && (
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500 animate-pulse"></div>
                                )}
                                
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-black uppercase tracking-tighter text-zinc-900 italic">{meeting.title}</h3>
                                        <p className="text-[10px] font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-widest">
                                            <span className="w-4 h-4 rounded bg-zinc-100 flex items-center justify-center text-zinc-900">
                                                {meeting.hostName.charAt(0)}
                                            </span>
                                            Host: {meeting.hostName}
                                        </p>
                                    </div>
                                    <div className={`px-2 py-1 rounded-md border text-[8px] font-black uppercase tracking-widest italic flex items-center gap-1 ${
                                        meeting.status === 'live' ? 'bg-red-50 text-red-600 border-red-100' : 
                                        meeting.status === 'scheduled' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                        'bg-zinc-100 text-zinc-500 border-zinc-200'
                                    }`}>
                                        {meeting.status === 'live' && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>}
                                        {meeting.status}
                                    </div>
                                </div>

                                <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-100 flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-xl shadow-sm border border-zinc-100 text-cyan-600">
                                        <Clock size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[11px] font-black text-zinc-900 uppercase tracking-widest">
                                            {new Date(meeting.startsAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </p>
                                        <p className="text-[10px] font-bold text-zinc-500">
                                            {new Date(meeting.startsAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} - {new Date(meeting.endsAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>

                                {(meeting.actions.canJoin || meeting.actions.canCancel) && (
                                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 mt-4">
                                        {meeting.actions.canJoin && (
                                            <button 
                                                onClick={() => handleJoin(meeting.joinUrl)}
                                                className="flex-1 bg-zinc-900 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-zinc-900/20 active:scale-95 transition-all flex justify-center items-center gap-2"
                                            >
                                                <Video size={14} />
                                                {meeting.actions.canStart ? 'Iniciar Meeting' : 'Join Meeting'}
                                            </button>
                                        )}
                                        
                                        {meeting.actions.canCancel && (
                                            <button 
                                                onClick={() => handleCancel(meeting.id)}
                                                disabled={cancellingId === meeting.id}
                                                className={`py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex justify-center items-center gap-2 ${
                                                    meeting.actions.canJoin 
                                                        ? 'bg-zinc-100 text-zinc-500 hover:bg-red-50 hover:text-red-600' 
                                                        : 'flex-1 bg-zinc-100 text-zinc-600 border border-zinc-200'
                                                }`}
                                            >
                                                {cancellingId === meeting.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                                                Cancelar
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
