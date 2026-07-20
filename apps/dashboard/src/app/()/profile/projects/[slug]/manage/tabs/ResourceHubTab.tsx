'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { PlusIcon, TrashIcon, ArrowTopRightOnSquareIcon, DocumentTextIcon, ChatBubbleOvalLeftEllipsisIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { getProjectResources, createProjectResource, updateProjectResource, deleteProjectResource } from '@/actions/resources';

export function ResourceHubTab({ project }: { project: any }) {
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [showMdGuide, setShowMdGuide] = useState(false);
    const [activeMdField, setActiveMdField] = useState<string | null>(null);

    // Document state (from platform_assets)
    const [documents, setDocuments] = useState<any[]>([]);
    const [deletedDocIds, setDeletedDocIds] = useState<number[]>([]);

    useEffect(() => {
        const fetchDocs = async () => {
            const res = await getProjectResources(project.id);
            if (res.success && res.resources) {
                // Filter only type document
                setDocuments(res.resources.filter((r: any) => r.type === 'document'));
            }
            setIsFetching(false);
        };
        fetchDocs();
    }, [project.id]);

    // AI Assistant state — read from project.w2eConfig
    const w2e = typeof project.w2eConfig === 'string'
        ? (() => { try { return JSON.parse(project.w2eConfig); } catch { return {}; } })()
        : (project.w2eConfig || {});
    const [aiKnowledgeBase, setAiKnowledgeBase] = useState<string>(w2e.aiKnowledgeBase || '');
    const [botToken, setBotToken] = useState<string>(w2e.botConfig?.telegramToken || '');
    const [savingAI, setSavingAI] = useState(false);
    const [registeringBot, setRegisteringBot] = useState(false);

    // Shortlink states
    const [shortlinkSlug, setShortlinkSlug] = useState('');
    const [creatingShortlink, setCreatingShortlink] = useState(false);
    const [isCreatingShortlink, setIsCreatingShortlink] = useState(false);

    const handleCreateShortlink = async (destinationUrl: string) => {
        if (!shortlinkSlug) return toast.error('Ingresa un slug válido');
        setIsCreatingShortlink(true);
        try {
            const res = await fetch('/api/admin/shortlinks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug: shortlinkSlug.toLowerCase().trim(),
                    destinationUrl,
                    title: `Hub de Recursos: ${project.title}`,
                    description: '',
                    type: 'redirect',
                    landingConfig: null
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al crear');

            toast.success(`Shortlink creado: pbox.dev/${shortlinkSlug}`);
            setCreatingShortlink(false);
            setShortlinkSlug('');
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsCreatingShortlink(false);
        }
    };

    // Keep community & markdown docs in extraConfig since they are just UI config strings
    const [config, setConfig] = useState((project.extraConfig as any)?.resourceHub || {
        markdownDocs: {
            dossier_en: '', dossier_es: '', one_pager_en: '', one_pager_es: '', deck_en: '', deck_es: ''
        },
        community: [
            { label: 'Canal Oficial', url: '', type: 'channel' },
            { label: 'Telegram', url: '', type: 'chat' }
        ]
    });

    const handleSave = async () => {
        setIsLoading(true);
        try {
            // Save extra config
            const res = await fetch(`/api/v1/projects/${project.id}/admin/config`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resourceHub: config })
            });
            if (!res.ok) throw new Error('Failed to update config');

            // Save documents (platform_assets)
            for (const doc of documents) {
                if (doc.id) {
                    // Update existing
                    await updateProjectResource(doc.id, {
                        title: doc.title,
                        description: doc.description,
                        url: doc.url
                    });
                } else {
                    // Create new
                    await createProjectResource({
                        projectId: project.id,
                        type: 'document',
                        title: doc.title,
                        description: doc.description,
                        url: doc.url,
                        visibility: 'public'
                    });
                }
            }

            // Delete removed docs
            for (const id of deletedDocIds) {
                await deleteProjectResource(id);
            }
            setDeletedDocIds([]); // reset

            toast.success('Hub de Recursos guardado ✓');
            
            // Refresh documents
            const docsRes = await getProjectResources(project.id);
            if (docsRes.success && docsRes.resources) {
                setDocuments(docsRes.resources.filter((r: any) => r.type === 'document'));
            }

        } catch (error) {
            toast.error('Error al guardar la configuración');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveAI = async () => {
        setSavingAI(true);
        try {
            const newW2eConfig = { ...w2e, aiKnowledgeBase, botConfig: { ...w2e.botConfig, telegramToken: botToken } };
            const res = await fetch(`/api/v1/projects/${project.id}/admin/config`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ w2eConfig: newW2eConfig })
            });
            if (!res.ok) throw new Error('Failed to save AI config');
            toast.success('Configuración IA guardada ✓');
        } catch {
            toast.error('Error al guardar la configuración IA');
        } finally {
            setSavingAI(false);
        }
    };

    const handleRegisterBot = async () => {
        if (!botToken) return toast.error('Ingresa un Bot Token válido');
        setRegisteringBot(true);
        try {
            const res = await fetch(`/api/v1/projects/${project.slug}/bot/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ botToken })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('¡Bot vinculado exitosamente a Telegram!');
                await handleSaveAI();
            } else {
                toast.error(`Error: ${data.error}`);
            }
        } catch {
            toast.error('Error de conexión al registrar el bot');
        } finally {
            setRegisteringBot(false);
        }
    };

    const updateMdDoc = (key: string, value: string) => {
        setConfig({
            ...config,
            markdownDocs: {
                ...(config.markdownDocs || {}),
                [key]: value
            }
        });
    };

    const addDocument = () => {
        setDocuments([...documents, { title: '', url: '', description: '' }]);
    };

    const removeDocument = (i: number) => {
        const doc = documents[i];
        if (doc.id) {
            setDeletedDocIds([...deletedDocIds, doc.id]);
        }
        setDocuments(documents.filter((_: any, idx: number) => idx !== i));
    };

    const addCommunity = () => {
        setConfig({ ...config, community: [...config.community, { label: '', url: '', type: 'channel' }] });
    };

    const removeCommunity = (i: number) => {
        setConfig({ ...config, community: config.community.filter((_: any, idx: number) => idx !== i) });
    };

    const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/resources/${project.slug}` : `https://dash.pandoras.finance/resources/${project.slug}`;

    const MD_FIELDS = [
        { key: 'dossier_es', label: 'Dossier Privado (ES)' },
        { key: 'dossier_en', label: 'Dossier Privado (EN)' },
        { key: 'one_pager_es', label: 'One Pager (ES)' },
        { key: 'one_pager_en', label: 'One Pager (EN)' },
        { key: 'deck_es', label: 'Deck Overview (ES)' },
        { key: 'deck_en', label: 'Deck Overview (EN)' },
    ];

    if (isFetching) return <div className="text-zinc-500 animate-pulse text-sm">Cargando recursos...</div>;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 w-full"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-[#D4A853]" />
                        Hub de Recursos
                    </h3>
                    <p className="text-zinc-400 text-sm mt-1">
                        Configura los documentos y comunidades que aparecerán en tu sala VIP.
                    </p>
                </div>
                <a
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-[#D4A853] border border-[#D4A853]/30 px-3 py-1.5 rounded-lg hover:bg-[#D4A853]/10 transition-colors"
                >
                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                    Ver Hub Público
                </a>
            </div>

            {/* URL del Hub */}
            <div className="bg-zinc-900/50 border border-[#D4A853]/20 rounded-2xl p-4 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">URL Pública:</span>
                    <code className="text-xs text-[#D4A853] flex-1 truncate">{publicUrl}</code>
                    <button
                        onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success('URL copiada'); }}
                        className="text-xs text-zinc-400 hover:text-white border border-white/10 px-2 py-1 rounded-lg transition-colors"
                    >
                        Copiar
                    </button>
                    <button
                        onClick={() => setCreatingShortlink(!creatingShortlink)}
                        className="text-xs text-lime-400 bg-lime-400/10 hover:bg-lime-400/20 px-3 py-1 rounded-lg transition-colors flex items-center gap-1 font-bold"
                    >
                        🪄 Transformar en Shortlink
                    </button>
                </div>

                {creatingShortlink && (
                    <div className="flex items-center gap-2 mt-2 p-3 bg-black/40 border border-lime-400/20 rounded-xl animate-[fadeIn_0.2s_ease-out]">
                        <span className="text-sm text-zinc-500 font-mono">pbox.dev/</span>
                        <input
                            value={shortlinkSlug}
                            onChange={e => setShortlinkSlug(e.target.value)}
                            placeholder="hub-proyecto"
                            className="bg-transparent border-b border-lime-400/30 text-sm text-lime-100 placeholder-zinc-600 focus:outline-none focus:border-lime-400 px-1 w-48"
                        />
                        <button
                            onClick={() => handleCreateShortlink(publicUrl)}
                            disabled={isCreatingShortlink}
                            className="ml-auto text-sm bg-lime-400 text-black px-4 py-1.5 rounded-lg font-bold hover:bg-lime-500 disabled:opacity-50"
                        >
                            {isCreatingShortlink ? 'Creando...' : 'Crear'}
                        </button>
                    </div>
                )}
            </div>

            {/* Documentos */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Documentación Oficial</h4>
                    <button
                        onClick={addDocument}
                        className="flex items-center gap-1 text-xs text-[#D4A853] hover:text-white transition-colors"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Agregar
                    </button>
                </div>

                <div className="space-y-3">
                    {documents.map((doc: any, index: number) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                            <input
                                type="text"
                                value={doc.title}
                                onChange={(e) => {
                                    const d = [...documents];
                                    d[index] = { ...d[index], title: e.target.value };
                                    setDocuments(d);
                                }}
                                className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm focus:border-[#D4A853] focus:outline-none"
                                placeholder="Título (ej. Dossier)"
                            />
                            <input
                                type="text"
                                value={doc.description || ''}
                                onChange={(e) => {
                                    const d = [...documents];
                                    d[index] = { ...d[index], description: e.target.value };
                                    setDocuments(d);
                                }}
                                className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm focus:border-[#D4A853] focus:outline-none"
                                placeholder="Descripción corta"
                            />
                            <div className="relative w-full">
                                <input
                                    type="url"
                                    value={doc.url || ''}
                                    onChange={(e) => {
                                        const d = [...documents];
                                        d[index] = { ...d[index], url: e.target.value };
                                        setDocuments(d);
                                    }}
                                    className="w-full bg-black border border-white/10 rounded-xl p-3 pr-24 text-sm focus:border-[#D4A853] focus:outline-none"
                                    placeholder="https:// o ipfs://"
                                />
                                {doc.url?.includes('/docs/') && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-[#D4A853]/10 border border-[#D4A853]/30 px-2 py-1 rounded text-[9px] text-[#D4A853] uppercase font-bold tracking-wider pointer-events-none">
                                        <span>⚡️ Dinámico</span>
                                    </div>
                                )}
                            </div>
                            <button onClick={() => removeDocument(index)} className="p-2 text-zinc-600 hover:text-red-400 transition-colors">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {documents.length === 0 && (
                        <div className="text-center py-8 text-zinc-600 text-sm border-2 border-dashed border-white/5 rounded-xl">
                            No has agregado documentos oficiales
                        </div>
                    )}
                </div>
            </div>

            {/* Markdown Docs Area */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Documentos Interactivos</h4>
                        <p className="text-xs text-zinc-500 mt-1">Escribe usando formato Markdown. Estos documentos se renderizarán en el Portal y en Telegram.</p>
                    </div>
                    <button
                        onClick={() => setShowMdGuide(!showMdGuide)}
                        className="text-xs text-[#D4A853] underline hover:text-white"
                    >
                        {showMdGuide ? 'Ocultar Guía' : 'Ver Guía Markdown'}
                    </button>
                </div>

                {showMdGuide && (
                    <div className="bg-black/40 border border-[#D4A853]/20 rounded-xl p-4 text-xs text-zinc-400 space-y-2 mb-4 font-mono">
                        <p><span className="text-[#D4A853]">#</span> Título Principal</p>
                        <p><span className="text-[#D4A853]">##</span> Subtítulo</p>
                        <p><span className="text-[#D4A853]">-</span> Lista de viñetas</p>
                        <p><span className="text-[#D4A853]">**</span>texto en negrita<span className="text-[#D4A853]">**</span></p>
                        <p><span className="text-[#D4A853]">[</span>Enlace<span className="text-[#D4A853]">](</span>https://...<span className="text-[#D4A853]">)</span></p>
                    </div>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                    {MD_FIELDS.map((field) => (
                        <button
                            key={field.key}
                            onClick={() => setActiveMdField(field.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${activeMdField === field.key
                                    ? 'bg-[#D4A853]/20 border-[#D4A853] text-[#D4A853]'
                                    : 'bg-black border-white/10 text-zinc-500 hover:border-white/30'
                                }`}
                        >
                            {field.label}
                            {config.markdownDocs?.[field.key] ? ' (✓)' : ''}
                        </button>
                    ))}
                </div>

                {activeMdField && (
                    <div className="relative">
                        <textarea
                            value={config.markdownDocs?.[activeMdField] || ''}
                            onChange={(e) => updateMdDoc(activeMdField, e.target.value)}
                            className="w-full h-[400px] bg-black border border-[#D4A853]/30 rounded-xl p-4 text-sm text-zinc-300 font-mono focus:border-[#D4A853] focus:outline-none resize-none"
                            placeholder={`Escribe aquí el contenido para ${MD_FIELDS.find(f => f.key === activeMdField)?.label}...`}
                        />
                        <div className="absolute bottom-4 right-4 text-[10px] text-zinc-600 bg-black px-2 py-1 rounded">
                            {config.markdownDocs?.[activeMdField]?.length || 0} chars
                        </div>
                    </div>
                )}
            </div>

            {/* AI Assistant */}
            <div className="bg-zinc-900/50 border border-purple-500/20 rounded-2xl p-6 space-y-4">
                <div className="flex flex-col gap-2 mb-4">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-purple-400 flex items-center gap-2">
                        <SparklesIcon className="w-4 h-4" />
                        AI Agent (Knowledge Base)
                    </h4>
                    <p className="text-xs text-zinc-500">
                        Pega aquí información en texto plano (FAQ, transcripciones, datos duros). El Agente de IA usará esto como su cerebro principal para responder en Telegram y Widget.
                    </p>
                </div>
                
                <textarea
                    value={aiKnowledgeBase}
                    onChange={(e) => setAiKnowledgeBase(e.target.value)}
                    className="w-full h-48 bg-black border border-purple-500/20 rounded-xl p-4 text-sm text-purple-200/70 focus:border-purple-400 focus:outline-none resize-none"
                    placeholder="Ejemplo: 'El proyecto se lanzó en 2024. El precio del token es de $0.50. El equipo fundador es...'"
                />

                <div className="pt-4 border-t border-white/5 space-y-3">
                    <h5 className="text-xs font-bold uppercase text-zinc-500">Telegram Bot Integration</h5>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={botToken}
                            onChange={(e) => setBotToken(e.target.value)}
                            placeholder="Pega el Token de BotFather (ej. 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11)"
                            className="flex-1 bg-black border border-white/10 rounded-xl p-3 text-sm focus:border-purple-400 focus:outline-none"
                        />
                        <button
                            onClick={handleRegisterBot}
                            disabled={registeringBot || !botToken}
                            className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {registeringBot ? 'Conectando...' : 'Vincular Bot'}
                        </button>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        onClick={handleSaveAI}
                        disabled={savingAI}
                        className="bg-purple-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-purple-500 transition-colors shadow-[0_0_15px_rgba(147,51,234,0.3)]"
                    >
                        {savingAI ? 'Guardando...' : 'Actualizar Cerebro AI'}
                    </button>
                </div>
            </div>

            {/* Links de Comunidad */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                        <ChatBubbleOvalLeftEllipsisIcon className="w-4 h-4" />
                        Comunidad Oficial
                    </h4>
                    <button
                        onClick={addCommunity}
                        className="flex items-center gap-1 text-xs text-[#D4A853] hover:text-white transition-colors"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Agregar
                    </button>
                </div>

                <div className="space-y-3">
                    {config.community.map((comm: any, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={comm.label}
                                onChange={(e) => {
                                    const c = [...config.community];
                                    c[index] = { ...c[index], label: e.target.value };
                                    setConfig({ ...config, community: c });
                                }}
                                className="w-1/3 bg-black border border-white/10 rounded-xl p-3 text-sm focus:border-[#D4A853] focus:outline-none"
                                placeholder="Nombre (ej. Telegram Oficial)"
                            />
                            <select
                                value={comm.type}
                                onChange={(e) => {
                                    const c = [...config.community];
                                    c[index] = { ...c[index], type: e.target.value };
                                    setConfig({ ...config, community: c });
                                }}
                                className="w-1/4 bg-black border border-white/10 rounded-xl p-3 text-sm focus:border-[#D4A853] focus:outline-none"
                            >
                                <option value="channel">Canal de Anuncios</option>
                                <option value="chat">Chat (Grupo)</option>
                                <option value="social">Red Social (X, IG)</option>
                            </select>
                            <input
                                type="url"
                                value={comm.url}
                                onChange={(e) => {
                                    const c = [...config.community];
                                    c[index] = { ...c[index], url: e.target.value };
                                    setConfig({ ...config, community: c });
                                }}
                                className="flex-1 bg-black border border-white/10 rounded-xl p-3 text-sm focus:border-[#D4A853] focus:outline-none"
                                placeholder="URL (https://t.me/...)"
                            />
                            <button onClick={() => removeCommunity(index)} className="p-2 text-zinc-600 hover:text-red-400 transition-colors">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Global Actions */}
            <div className="flex justify-end pt-4 pb-12 sticky bottom-0 z-10 p-4">
                <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-zinc-200 transition-transform active:scale-95 disabled:opacity-50 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                >
                    {isLoading ? 'Guardando...' : 'Guardar Todos los Cambios'}
                </button>
            </div>
        </motion.div>
    );
}
