
import { useState } from 'react';
import useSWR from 'swr';
import { format } from 'date-fns';
import {
    CalendarDaysIcon,
    PlusIcon,
    LinkIcon,
    ChatBubbleLeftRightIcon,
    MegaphoneIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Loader2 } from 'lucide-react';

interface GovernanceEvent {
    id: number;
    title: string;
    description: string;
    startDate: string;
    type: 'on_chain_proposal' | 'off_chain_signal' | 'meeting' | 'update';
    status: 'scheduled' | 'active' | 'completed' | 'cancelled';
    externalLink?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());


export function GovernanceCalendar({ projectId, readOnly = false }: { projectId: number, readOnly?: boolean }) {
    const { data: fetchedEvents, error, mutate, isLoading } = useSWR<GovernanceEvent[]>(
        projectId ? `/api/governance-events?projectId=${projectId}` : null,
        fetcher
    );

    // Use fetched events
    const events = fetchedEvents;

    const [isCreating, setIsCreating] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: '',
        type: 'on_chain_proposal',
        externalLink: ''
    });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/governance-events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    ...formData,
                    status: 'scheduled' // Default
                })
            });
            if (res.ok) {
                mutate(); // Refresh list
                setIsCreating(false);
                setFormData({ title: '', description: '', startDate: '', type: 'on_chain_proposal', externalLink: '' });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-white">Governance Calendar</h3>
                    <p className="text-gray-400 text-sm">Schedule and announce important DAO events.</p>
                </div>
                {!readOnly && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-lime-500 hover:bg-lime-400 text-black font-bold rounded-lg transition-colors"
                    >
                        <PlusIcon className="w-5 h-5" />
                        New Event
                    </button>
                )}
            </div>

            {/* Creation Form */}
            {isCreating && (
                <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-xl animate-in fade-in slide-in-from-top-4">
                    <h4 className="font-bold text-white mb-4">Create New Event</h4>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Title</label>
                                <input
                                    required
                                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-lime-500 outline-none"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Q3 Budget Vote"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Type</label>
                                <select
                                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-lime-500 outline-none"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="on_chain_proposal">On-Chain Proposal</option>
                                    <option value="off_chain_signal">Off-Chain Signal</option>
                                    <option value="meeting">Meeting / AMA</option>
                                    <option value="update">Update Announcement</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Start Date</label>
                            <input
                                required
                                type="datetime-local"
                                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-lime-500 outline-none"
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-gray-400 mb-1">External Link (Optional)</label>
                            <div className="flex bg-black border border-zinc-800 rounded-lg overflow-hidden focus-within:border-lime-500">
                                <div className="p-2 bg-zinc-900 border-r border-zinc-800">
                                    <LinkIcon className="w-5 h-5 text-gray-500" />
                                </div>
                                <input
                                    className="w-full bg-transparent px-4 py-2 text-white outline-none"
                                    value={formData.externalLink}
                                    onChange={e => setFormData({ ...formData, externalLink: e.target.value })}
                                    placeholder="https://"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2 bg-lime-500 text-black font-bold rounded-lg hover:bg-lime-400 disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="animate-spin w-5 h-5" /> : 'Create Event'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="space-y-3">
                {isLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-lime-500" /></div>
                ) : events && events.length > 0 ? (
                    events.map((event) => (
                        <div key={event.id} className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors">
                            <div className="p-3 bg-zinc-800 rounded-lg">
                                {getIcon(event.type)}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-medium">{event.title}</h4>
                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                    <span>{format(new Date(event.startDate), 'MMM d, yyyy @ HH:mm')}</span>
                                    {event.externalLink && (
                                        <a href={event.externalLink} target="_blank" className="hover:text-lime-400 flex items-center gap-1">
                                            <LinkIcon className="w-3 h-3" /> Link
                                        </a>
                                    )}
                                </div>
                            </div>
                            <div className="px-3 py-1 bg-zinc-800 rounded-full text-xs font-medium text-gray-300 capitalize border border-zinc-700">
                                {event.status}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center p-8 border border-dashed border-zinc-800 rounded-xl text-gray-500">
                        No events scheduled yet.
                    </div>
                )}
            </div>
        </div>
    );
}
