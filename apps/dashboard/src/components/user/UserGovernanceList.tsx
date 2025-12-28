
import useSWR from 'swr';
import { format } from 'date-fns';
import {
    CalendarDaysIcon,
    LinkIcon,
    ChatBubbleLeftRightIcon,
    MegaphoneIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

interface GovernanceEvent {
    id: number;
    title: string;
    description: string;
    startDate: string;
    type: 'on_chain_proposal' | 'off_chain_signal' | 'meeting' | 'update';
    status: 'scheduled' | 'active' | 'completed' | 'cancelled';
    externalLink?: string;
    projectId: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function UserGovernanceList({ projectIds }: { projectIds: number[] }) {
    const { data: events, error, isLoading } = useSWR<GovernanceEvent[]>(
        projectIds.length > 0 ? `/api/governance-events?projectIds=${projectIds.join(',')}` : null,
        fetcher
    );

    const getIcon = (type: string) => {
        switch (type) {
            case 'on_chain_proposal': return <CheckCircleIcon className="w-5 h-5 text-purple-400" />;
            case 'off_chain_signal': return <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-400" />;
            case 'meeting': return <CalendarDaysIcon className="w-5 h-5 text-green-400" />;
            case 'update': return <MegaphoneIcon className="w-5 h-5 text-yellow-400" />;
            default: return <CalendarDaysIcon className="w-5 h-5" />;
        }
    };

    if (isLoading) return <div className="text-gray-500 text-sm animate-pulse">Checking for events...</div>;
    if (!events || events.length === 0) return null; // Hide if no events

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <CalendarDaysIcon className="w-5 h-5 text-lime-400" />
                <h3 className="text-lg font-bold text-white">Próximos Eventos de Gobernanza</h3>
            </div>

            <div className="grid gap-3">
                {events.map((event) => (
                    <div key={event.id} className="flex items-start gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-lime-500/30 transition-colors">
                        <div className="p-2 bg-zinc-800 rounded-lg mt-1">
                            {getIcon(event.type)}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h4 className="text-white font-medium">{event.title}</h4>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border border-zinc-700 capitalize ${event.status === 'active' ? 'bg-green-900/30 text-green-400 border-green-500/30' : 'bg-zinc-800 text-gray-500'
                                    }`}>
                                    {event.status}
                                </span>
                            </div>
                            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{event.description}</p>

                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                                <span className="flex items-center gap-1">
                                    <CalendarDaysIcon className="w-3 h-3" />
                                    {format(new Date(event.startDate), 'MMM d, HH:mm')}
                                </span>
                                {event.externalLink && (
                                    <a
                                        href={event.externalLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="hover:text-lime-400 flex items-center gap-1 transition-colors"
                                        onClick={() => {
                                            // Track click as interest/vote intent
                                            fetch('/api/gamification/track-event', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    eventType: 'proposal_vote',
                                                    metadata: {
                                                        proposalId: event.id,
                                                        title: event.title,
                                                        projectId: event.projectId
                                                    }
                                                })
                                            }).catch(console.error);
                                        }}
                                    >
                                        <LinkIcon className="w-3 h-3" /> Info/Votar
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
