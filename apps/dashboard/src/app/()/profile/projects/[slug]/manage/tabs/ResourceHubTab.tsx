'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { PlusIcon, TrashIcon, ArrowTopRightOnSquareIcon, DocumentTextIcon, ChatBubbleOvalLeftEllipsisIcon, SparklesIcon } from '@heroicons/react/24/outline';

export function ResourceHubTab({ project }: { project: any }) {
    const [isLoading, setIsLoading] = useState(false);
    const [showMdGuide, setShowMdGuide] = useState(false);
    const [activeMdField, setActiveMdField] = useState<string | null>(null);

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

    const [config, setConfig] = useState((project.extraConfig as any)?.resourceHub || {
        documents: [
            { title: 'Dossier Ejecutivo', url: '', desc: 'Resumen estratégico del proyecto' },
            { title: 'Términos y Condiciones', url: '', desc: 'Marco operativo y documentación legal' },
            { title: 'Whitepaper', url: '', desc: 'Arquitectura, visión y funcionamiento' }
        ],
        markdownDocs: {
            dossier_en: '',
            dossier_es: '',
            one_pager_en: '',
            one_pager_es: '',
            deck_en: '',
            deck_es: ''
        },
        community: [
            { label: 'Canal Oficial', url: '', type: 'channel' },
            { label: 'Telegram', url: '', type: 'chat' }
        ]
    });

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/v1/projects/${project.id}/admin/config`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resourceHub: config })
            });

            if (!res.ok) throw new Error('Failed to update');
            toast.success('Hub de Recursos guardado ✓');
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
        setConfig({ ...config, documents: [...config.documents, { title: '', url: '', desc: '' }] });
    };

    const removeDocument = (i: number) => {
        setConfig({ ...config, documents: config.documents.filter((_: any, idx: number) => idx !== i) });
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

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://dash.pandoras.finance';

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
                    {config.documents.map((doc: any, index: number) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                            <input
                                type="text"
                                value={doc.title}
                                onChange={(e) => {
                                    const d = [...config.documents];
                                    d[index] = { ...d[index], title: e.target.value };
                                    setConfig({ ...config, documents: d });
                                }}
                                className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm focus:border-[#D4A853] focus:outline-none"
                                placeholder="Título (ej. Dossier)"
                            />
                            <input
                                type="text"
                                value={doc.desc}
                                onChange={(e) => {
                                    const d = [...config.documents];
                                    d[index] = { ...d[index], desc: e.target.value };
                                    setConfig({ ...config, documents: d });
                                }}
                                className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm focus:border-[#D4A853] focus:outline-none"
                                placeholder="Descripción corta"
                            />
                            <div className="relative w-full">
                                <input
                                    type="url"
                                    value={doc.url}
                                    onChange={(e) => {
                                        const d = [...config.documents];
                                        d[index] = { ...d[index], url: e.target.value };
                                        setConfig({ ...config, documents: d });
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
                </div>
            </div>

            {/* Comunidad */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                        <ChatBubbleOvalLeftEllipsisIcon className="w-4 h-4 inline mr-1 text-[#D4A853]" />
                        Comunidad
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
                        <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto] gap-2 items-center">
                            <input
                                type="text"
                                value={comm.label}
                                onChange={(e) => {
                                    const c = [...config.community];
                                    c[index] = { ...c[index], label: e.target.value };
                                    setConfig({ ...config, community: c });
                                }}
                                className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm focus:border-[#D4A853] focus:outline-none"
                                placeholder="Etiqueta (ej. Telegram)"
                            />
                            <input
                                type="url"
                                value={comm.url}
                                onChange={(e) => {
                                    const c = [...config.community];
                                    c[index] = { ...c[index], url: e.target.value };
                                    setConfig({ ...config, community: c });
                                }}
                                className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm focus:border-[#D4A853] focus:outline-none"
                                placeholder="https://t.me/..."
                            />
                            <select
                                value={comm.type}
                                onChange={(e) => {
                                    const c = [...config.community];
                                    c[index] = { ...c[index], type: e.target.value };
                                    setConfig({ ...config, community: c });
                                }}
                                className="bg-black border border-white/10 rounded-xl p-3 text-sm focus:border-[#D4A853] focus:outline-none"
                            >
                                <option value="channel">Canal</option>
                                <option value="chat">Chat</option>
                                <option value="portal">Portal</option>
                            </select>
                            <button onClick={() => removeCommunity(index)} className="p-2 text-zinc-600 hover:text-red-400 transition-colors">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Save */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="px-8 py-2.5 bg-[#D4A853] text-black text-sm font-bold rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-50"
                >
                    {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>

            {/* ===== AI ASSISTANT SECTION ===== */}
            <div className="bg-zinc-900/50 border border-purple-500/20 rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-purple-500/15">
                            <SparklesIcon className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h4 className="text-base font-bold text-white">Asistente IA del Proyecto</h4>
                            <p className="text-sm text-zinc-400 mt-0.5">
                                Configura el cerebro y la conexión Telegram del Conserje IA.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSaveAI}
                        disabled={savingAI}
                        className="px-4 py-2 bg-purple-500/15 text-purple-400 border border-purple-500/30 text-sm font-bold rounded-xl hover:bg-purple-500/25 transition-colors disabled:opacity-50"
                    >
                        {savingAI ? 'Guardando...' : '✓ Guardar IA'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Left: Knowledge Base */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Base de Conocimiento / Prompt Guía</label>
                        <textarea
                            className="w-full h-64 bg-black border border-white/10 rounded-xl p-4 text-sm text-zinc-300 placeholder:text-zinc-700 focus:border-purple-500/50 focus:outline-none transition-colors resize-y font-mono"
                            placeholder={`Eres el asistente oficial de ${project.title}. El proyecto se trata de... Las fases de inversión son... El token vale $X USD.\n\nReglas importantes:\n- No prometas rendimientos garantizados.\n- El pago es en USDC.\n- Dirige al usuario al portal de inversión.`}
                            value={aiKnowledgeBase}
                            onChange={(e) => setAiKnowledgeBase(e.target.value)}
                        />
                        <p className="text-[10px] text-zinc-600">Este texto se inyecta como system prompt en cada conversación del bot. Mantén las reglas claras y concisas.</p>
                    </div>

                    {/* Right: Telegram Bot Token */}
                    <div className="space-y-4">
                        <div className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-3">
                            <h5 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                                ✈️ Conexión Telegram
                            </h5>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Bot Token</label>
                                <div className="flex gap-2">
                                    <input
                                        type="password"
                                        placeholder="123456789:AAHxxxxxxxxxxxxxxxxxxxx"
                                        className="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-700 focus:border-purple-500/50 outline-none transition-colors"
                                        value={botToken}
                                        onChange={(e) => setBotToken(e.target.value)}
                                    />
                                    <button
                                        onClick={handleRegisterBot}
                                        disabled={registeringBot || !botToken}
                                        className="px-3 py-2 bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 text-xs font-bold rounded-lg hover:bg-indigo-500/25 transition-colors disabled:opacity-50 whitespace-nowrap"
                                    >
                                        {registeringBot ? 'Vinculando...' : 'Vincular'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-xl p-4 space-y-2">
                            <h6 className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">¿Cómo obtener tu Token?</h6>
                            <ol className="text-[11px] text-zinc-400 list-decimal list-inside space-y-1 leading-relaxed">
                                <li>Abre Telegram y busca <strong className="text-white">@BotFather</strong></li>
                                <li>Envíale el comando <strong className="text-indigo-300">/newbot</strong></li>
                                <li>Sigue las instrucciones y dale un nombre al bot</li>
                                <li>Copia el <strong className="text-white">HTTP API Token</strong> que recibirás</li>
                                <li>Pégalo aquí y haz clic en <strong className="text-indigo-300">Vincular</strong></li>
                            </ol>
                        </div>

                        {botToken && (
                            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2">
                                <span className="text-emerald-400 text-lg">✓</span>
                                <p className="text-[11px] text-emerald-400">Bot configurado. Haz clic en <strong>Vincular</strong> para registrar el webhook.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Ecosistema Documental y Data Room */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                
                {/* Left Column: Data Room (New) */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gradient-to-br from-emerald-900/30 to-black border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <h4 className="text-sm font-bold uppercase tracking-widest text-emerald-400 mb-2 flex items-center gap-2 relative z-10">
                            <DocumentTextIcon className="w-4 h-4" />
                            Due Diligence Data Room
                        </h4>
                        <p className="text-xs text-zinc-400 mb-6 relative z-10">
                            Centro de transparencia institucional con documentación categorizada (Identity, Asset, Legal, Financial, etc).
                        </p>
                        
                        <div className="space-y-3 relative z-10">
                            <a 
                                href={`/api/v1/projects/${project.id}/admin/dataroom-redirect?website=${encodeURIComponent(project.website || '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full flex items-center justify-between bg-black/40 hover:bg-black/60 border border-emerald-500/20 p-3 rounded-xl transition-colors text-sm text-emerald-100 cursor-pointer"
                            >
                                <span className="font-bold">Ver Data Room Público</span>
                                <ArrowTopRightOnSquareIcon className="w-4 h-4 text-emerald-500" />
                            </a>
                            <p className="text-[10px] text-zinc-500 text-center">
                                Los documentos del Data Room se inyectan a nivel base de datos en `project_documents`.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Documentos Nativos Dinámicos */}
                <div className="lg:col-span-2 bg-zinc-900/50 border border-[#D4A853]/20 rounded-2xl p-6 space-y-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h4 className="text-base font-bold uppercase tracking-widest text-[#D4A853]">Documentos Nativos Dinámicos</h4>
                            <p className="text-xs text-zinc-400 mt-1 max-w-lg">
                                Escribe o pega el contenido en formato Markdown. Se renderizarán automáticamente en el portal del usuario con diseño optimizado para web y PDF.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowMdGuide(true)}
                            className="text-xs text-[#D4A853] border border-[#D4A853]/50 px-3 py-1.5 rounded-lg hover:bg-[#D4A853]/10 transition-colors whitespace-nowrap"
                        >
                            Guía de Markdown
                        </button>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
                        <span className="text-blue-400 text-lg">💡</span>
                        <div className="text-xs text-blue-200/80 space-y-1">
                            <p className="font-bold text-blue-400 mb-1">¿Cómo conectarlos a tu Hub?</p>
                            <p>1. Redacta el contenido Markdown abajo.</p>
                            <p>2. Haz clic en <span className="text-blue-400 font-bold">Copiar URL</span> junto al documento.</p>
                            <p>3. Pega esa URL en "Documentación Oficial" (arriba) en lugar de subir un PDF.</p>
                        </div>
                    </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {MD_FIELDS.map((field) => {
                        const isEn = field.key.endsWith('_en');
                        const locale = isEn ? 'en' : 'es';
                        let routePath = field.key.replace('_es', '').replace('_en', '');
                        if (routePath === 'one_pager') routePath = 'one-pager';
                        const docUrl = `${baseUrl}/resources/${project.slug}/docs/${routePath}?lang=${locale}`;

                        return (
                        <div key={field.key} className="flex items-center justify-between bg-black/40 border border-white/5 p-4 rounded-xl hover:border-[#D4A853]/30 transition-colors">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-white">{field.label}</span>
                                <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">MD Format</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(docUrl);
                                        toast.success('URL Dinámica copiada');
                                    }}
                                    className="text-[10px] bg-blue-500/15 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-lg transition-colors font-bold uppercase tracking-wider"
                                >
                                    Copiar URL
                                </button>
                                <button
                                    onClick={() => setActiveMdField(field.key)}
                                    className="text-[10px] bg-[#D4A853]/10 hover:bg-[#D4A853]/20 text-[#D4A853] border border-[#D4A853]/30 px-4 py-1.5 rounded-lg transition-colors font-bold uppercase tracking-wider"
                                >
                                    Editar
                                </button>
                            </div>
                        </div>
                    )})}
                </div>
            </div>
            </div>

            {/* Modals */}
            {showMdGuide && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-lg w-full">
                        <h3 className="text-lg font-bold mb-4 text-[#D4A853]">Guía Rápida de Markdown</h3>
                        <div className="space-y-4 text-sm text-zinc-300">
                            <div>
                                <strong className="text-white block mb-1">Títulos</strong>
                                <code className="bg-black px-2 py-1 rounded"># Título Principal</code><br />
                                <code className="bg-black px-2 py-1 rounded">## Subtítulo</code>
                            </div>
                            <div>
                                <strong className="text-white block mb-1">Énfasis</strong>
                                <code className="bg-black px-2 py-1 rounded">**Texto en Negritas**</code><br />
                                <code className="bg-black px-2 py-1 rounded">*Texto en Cursiva*</code>
                            </div>
                            <div>
                                <strong className="text-white block mb-1">Listas</strong>
                                <code className="bg-black px-2 py-1 rounded">- Elemento 1</code><br />
                                <code className="bg-black px-2 py-1 rounded">- Elemento 2</code>
                            </div>
                            <div>
                                <strong className="text-white block mb-1">Saltos de Línea</strong>
                                Simplemente presiona <code className="bg-black px-1 rounded">Enter</code> dos veces para separar párrafos.
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setShowMdGuide(false)}
                                className="px-6 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Markdown Editor Modal */}
            {activeMdField && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8">
                    <div className="bg-zinc-900 border border-[#D4A853]/30 rounded-2xl p-6 w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">Editar Documento</h3>
                                <p className="text-sm text-[#D4A853] uppercase tracking-widest mt-1">
                                    {MD_FIELDS.find(f => f.key === activeMdField)?.label}
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowMdGuide(true)}
                                    className="text-xs text-zinc-400 hover:text-white transition-colors"
                                >
                                    Ver Guía Markdown
                                </button>
                            </div>
                        </div>

                        <textarea
                            value={config.markdownDocs?.[activeMdField] || ''}
                            onChange={(e) => updateMdDoc(activeMdField, e.target.value)}
                            className="flex-1 w-full bg-black border border-white/10 rounded-xl p-6 text-sm font-mono focus:border-[#D4A853] focus:outline-none resize-none overflow-y-auto leading-relaxed text-zinc-300"
                            placeholder={`Escribe aquí el contenido en Markdown...`}
                        />

                        <div className="mt-6 flex justify-between items-center">
                            <p className="text-xs text-zinc-500">
                                Los cambios no se guardan permanentemente hasta que presiones "Guardar Cambios" en el Hub.
                            </p>
                            <button
                                onClick={() => setActiveMdField(null)}
                                className="px-8 py-2.5 bg-[#D4A853] text-black text-sm font-bold rounded-xl hover:bg-yellow-400 transition-colors"
                            >
                                Listo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
