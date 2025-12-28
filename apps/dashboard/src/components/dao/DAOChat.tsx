'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useActiveAccount } from "thirdweb/react";
import { MessageSquare, Plus, ArrowLeft, Send, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface DAOChatProps {
    project: any;
    isOwner?: boolean;
}

export function DAOChat({ project, isOwner = false }: DAOChatProps) {
    const account = useActiveAccount();
    const [view, setView] = useState<'list' | 'thread' | 'create'>('list');
    const [threads, setThreads] = useState<any[]>([]);
    const [selectedThread, setSelectedThread] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Create Thread Form
    const [newThreadTitle, setNewThreadTitle] = useState('');
    const [newThreadContent, setNewThreadContent] = useState(''); // Initial post
    const [isOfficial, setIsOfficial] = useState(false);

    // Fetch Threads
    useEffect(() => {
        if (!project?.id) return;
        fetchThreads();
    }, [project?.id]);

    const fetchThreads = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/dao/threads?projectId=${project.id}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setThreads(data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error cargando discusiones");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateThread = async () => {
        if (!account) return toast.error("Conecta tu wallet");
        if (!newThreadTitle.trim() || !newThreadContent.trim()) return toast.error("Completa los campos");

        try {
            // 1. Create Thread
            const resThread = await fetch('/api/dao/threads', {
                method: 'POST',
                body: JSON.stringify({
                    projectId: project.id,
                    authorAddress: account.address,
                    title: newThreadTitle,
                    category: 'general',
                    isOfficial: isOwner && isOfficial
                })
            });
            const thread = await resThread.json();
            if (thread.error) throw new Error(thread.error);

            // 2. Create Initial Post
            await fetch('/api/dao/posts', {
                method: 'POST',
                body: JSON.stringify({
                    threadId: thread.id,
                    authorAddress: account.address,
                    content: newThreadContent
                })
            });

            toast.success("Discusión creada");
            setView('list');
            setNewThreadTitle('');
            setNewThreadContent('');
            fetchThreads();
        } catch (error) {
            console.error(error);
            toast.error("Error creando discusión");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-lime-400" />
                    Foro de Gobernanza
                </h2>
                {view === 'list' && (
                    <button
                        onClick={() => setView('create')}
                        className="bg-lime-500 hover:bg-lime-400 text-black px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva Discusión
                    </button>
                )}
            </div>

            {view === 'list' && (
                <div className="space-y-3">
                    {threads.length === 0 && !isLoading && (
                        <div className="text-center py-10 text-zinc-500 bg-zinc-900/50 rounded-xl border border-zinc-800">
                            No hay discusiones aún. Sé el primero en iniciar una.
                        </div>
                    )}
                    {threads.map(thread => (
                        <button
                            key={thread.id}
                            onClick={() => { setSelectedThread(thread); setView('thread'); }}
                            className="w-full text-left bg-zinc-900 border border-zinc-800 p-4 rounded-xl hover:border-lime-500/30 transition-colors cursor-pointer group"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-white font-medium group-hover:text-lime-400 transition-colors flex items-center gap-2">
                                        {thread.isOfficial && <span className="bg-yellow-500/20 text-yellow-400 text-[10px] px-1.5 py-0.5 rounded border border-yellow-500/30 uppercase font-bold">Oficial</span>}
                                        {thread.title}
                                    </h3>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                                        <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">{thread.category}</span>
                                        <span>por {thread.authorAddress.slice(0, 6)}...</span>
                                        <span>{formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true, locale: es })}</span>
                                    </div>
                                </div>
                                <div className="text-zinc-600">
                                    <ArrowLeft className="w-5 h-5 rotate-180" />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {view === 'create' && (
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
                    <button onClick={() => setView('list')} className="text-sm text-zinc-500 hover:text-white mb-2 flex items-center gap-1">
                        <ArrowLeft className="w-4 h-4" /> Cancelar
                    </button>
                    <input
                        type="text"
                        placeholder="Título de la discusión"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-lime-500 outline-none"
                        value={newThreadTitle}
                        onChange={e => setNewThreadTitle(e.target.value)}
                    />
                    <textarea
                        rows={6}
                        placeholder="Escribe tu mensaje..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-lime-500 outline-none resize-none"
                        value={newThreadContent}
                        onChange={e => setNewThreadContent(e.target.value)}
                    />
                    <div className="flex justify-between items-center">
                        {isOwner && (
                            <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isOfficial}
                                    onChange={e => setIsOfficial(e.target.checked)}
                                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-lime-500 focus:ring-lime-500/20"
                                />
                                Marcar como Oficial
                            </label>
                        )}
                        {!isOwner && <div />}
                        <button
                            onClick={handleCreateThread}
                            className="bg-lime-500 hover:bg-lime-400 text-black px-6 py-2 rounded-lg font-medium"
                        >
                            Publicar
                        </button>
                    </div>
                </div>
            )}

            {view === 'thread' && selectedThread && (
                <ThreadDetail
                    thread={selectedThread}
                    onBack={() => { setView('list'); setSelectedThread(null); fetchThreads(); }} // Refresh on back
                />
            )}
        </div>
    );
}

function ThreadDetail({ thread, onBack }: { thread: any, onBack: () => void }) {
    const account = useActiveAccount();
    const [posts, setPosts] = useState<any[]>([]);
    const [replyContent, setReplyContent] = useState('');

    useEffect(() => {
        fetchPosts();
    }, [thread.id]);

    const fetchPosts = async () => {
        const res = await fetch(`/api/dao/posts?threadId=${thread.id}`);
        const data = await res.json();
        setPosts(data);
    };

    const handleReply = async () => {
        if (!account) return toast.error("Conecta tu wallet");
        if (!replyContent.trim()) return;

        try {
            await fetch('/api/dao/posts', {
                method: 'POST',
                body: JSON.stringify({
                    threadId: thread.id,
                    authorAddress: account.address,
                    content: replyContent
                })
            });
            setReplyContent('');
            fetchPosts();
            toast.success("Respuesta enviada");
        } catch (error) {
            toast.error("Error enviando respuesta");
        }
    };

    return (
        <div className="space-y-6">
            <button onClick={onBack} className="text-sm text-zinc-500 hover:text-white flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Volver al foro
            </button>

            <div className="border-b border-zinc-800 pb-4">
                <h2 className="text-2xl font-bold text-white mb-2">{thread.title}</h2>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span className="bg-lime-900/30 text-lime-400 px-2 py-0.5 rounded border border-lime-500/20">{thread.category}</span>
                    <span>Iniciado por {thread.authorAddress}</span>
                </div>
            </div>

            <div className="space-y-6">
                {posts.map((post, i) => (
                    <div key={post.id} className={`flex gap-4 ${i === 0 ? 'bg-zinc-900/50 p-4 rounded-xl border border-zinc-800' : ''}`}>
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                                <User className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-zinc-300">
                                    {post.authorAddress === account?.address ? 'Tú' : `${post.authorAddress.slice(0, 6)}...`}
                                </span>
                                <span className="text-xs text-zinc-600">
                                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: es })}
                                </span>
                            </div>
                            <div className="text-zinc-400 text-sm whitespace-pre-wrap">{post.content}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-4 border-t border-zinc-800">
                <div className="flex gap-4">
                    <textarea
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-lime-500 outline-none resize-none h-24"
                        placeholder="Escribe una respuesta..."
                        value={replyContent}
                        onChange={e => setReplyContent(e.target.value)}
                    />
                    <button
                        onClick={handleReply}
                        disabled={!replyContent.trim()}
                        className="h-10 w-10 bg-lime-500 hover:bg-lime-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center text-black"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
