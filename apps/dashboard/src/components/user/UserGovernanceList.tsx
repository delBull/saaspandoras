import useSWR, { mutate } from 'swr';
import { format } from 'date-fns';
import {
    CalendarDaysIcon,
    LinkIcon,
    ChatBubbleLeftRightIcon,
    MegaphoneIcon,
    CheckCircleIcon,
    HandThumbUpIcon,
    HandThumbDownIcon
} from '@heroicons/react/24/outline';
import { useActiveAccount } from "thirdweb/react";
import { toast } from "sonner";

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
    const account = useActiveAccount();
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
                    <GovernanceEventCard key={event.id} event={event} account={account} />
                ))}
            </div>
        </div>
    );
}

function GovernanceEventCard({ event, account }: { event: GovernanceEvent, account: any }) {
    // Determine if votable (active off-chain signal)
    const isVotable = event.type === 'off_chain_signal' && event.status === 'active';

    // Check if showing vote UI
    // Fetch current votes
    const { data: voteData, mutate: refreshVotes } = useSWR(
        isVotable ? `/api/governance-votes?proposalId=${event.id}&voterAddress=${account?.address || ''}` : null,
        fetcher
    );

    const handleVote = async (support: number) => {
        if (!account) return toast.error("Conecta tu wallet para votar");

        const toastId = toast.loading("Firmando voto...");
        try {
            // Sign Message (Gasless)
            const message = `Vote for Proposal #${event.id}\nSupport: ${support}\nVoter: ${account.address}`;
            const signature = await account.signMessage({ message });

            // Submit to API
            const res = await fetch('/api/governance-votes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    proposalId: event.id,
                    voterAddress: account.address,
                    support,
                    signature
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to submit vote");
            }

            toast.success("Voto registrado (Gratis)!", { id: toastId });
            refreshVotes();
        } catch (e: any) {
            console.error(e);
            toast.error("Error votando: " + e.message, { id: toastId });
        }
    };

    // Calculate percentages
    const votes = voteData?.votes || { for: 0, against: 0 };
    const total = votes.for + votes.against;
    const forPct = total > 0 ? (votes.for / total) * 100 : 0;

    // Mapping icons for rendering
    const getIcon = (type: string) => {
        switch (type) {
            case 'on_chain_proposal': return <CheckCircleIcon className="w-5 h-5 text-purple-400" />;
            case 'off_chain_signal': return <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-400" />;
            case 'meeting': return <CalendarDaysIcon className="w-5 h-5 text-green-400" />;
            case 'update': return <MegaphoneIcon className="w-5 h-5 text-yellow-400" />;
            default: return <CalendarDaysIcon className="w-5 h-5" />;
        }
    };

    return (
        <div className="flex flex-col gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-lime-500/30 transition-colors">
            <div className="flex items-start gap-4">
                <div className="p-2 bg-zinc-800 rounded-lg mt-1">
                    {getIcon(event.type)}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <h4 className="text-white font-medium">{event.title}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border border-zinc-700 capitalize ${event.status === 'active' ? 'bg-green-900/30 text-green-400 border-green-500/30' : 'bg-zinc-800 text-gray-500'}`}>
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
                            <a href={event.externalLink} target="_blank" rel="noreferrer" className="hover:text-lime-400 flex items-center gap-1 transition-colors">
                                <LinkIcon className="w-3 h-3" /> Info Externa
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Voting Section (Only if Off-Chain & Active) */}
            {isVotable && (
                <div className="pl-[52px] pt-2 border-t border-zinc-800/50">
                    {/* Results Bar */}
                    <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                        <span>Yes: {votes.for}</span>
                        <span>No: {votes.against}</span>
                    </div>
                    <div className="bg-zinc-800 h-1.5 rounded-full overflow-hidden w-full mb-3">
                        <div className="bg-green-500 h-full" style={{ width: `${forPct}%` }} />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleVote(1)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all ${voteData?.userVote === 1 ? 'bg-green-900/60 text-green-400 border border-green-500/50' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'}`}
                        >
                            <HandThumbUpIcon className="w-3 h-3" /> A Favor
                        </button>
                        <button
                            onClick={() => handleVote(0)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all ${voteData?.userVote === 0 ? 'bg-red-900/60 text-red-400 border border-red-500/50' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'}`}
                        >
                            <HandThumbDownIcon className="w-3 h-3" /> En Contra
                        </button>
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-2 text-center">
                        * Vote signing is gasless (free).
                    </p>
                </div>
            )}
        </div>
    );
}
