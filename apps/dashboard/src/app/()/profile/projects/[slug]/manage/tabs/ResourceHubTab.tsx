'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { PlusIcon, TrashIcon, ArrowTopRightOnSquareIcon, DocumentTextIcon, ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/outline';

export function ResourceHubTab({ project }: { project: any }) {
    const [isLoading, setIsLoading] = useState(false);
    const [config, setConfig] = useState((project.extraConfig as any)?.resourceHub || {
        documents: [
            { title: 'Dossier Ejecutivo', url: '', desc: 'Resumen estratégico del proyecto' },
            { title: 'Términos y Condiciones', url: '', desc: 'Marco operativo y documentación legal' },
            { title: 'Whitepaper', url: '', desc: 'Arquitectura, visión y funcionamiento' }
        ],
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

    const publicUrl = `https://dash.pandoras.finance/resources/${project.slug}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-4xl"
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
            <div className="bg-zinc-900/50 border border-[#D4A853]/20 rounded-2xl p-4 flex items-center gap-3">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">URL Pública:</span>
                <code className="text-xs text-[#D4A853] flex-1 truncate">{publicUrl}</code>
                <button
                    onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success('URL copiada'); }}
                    className="text-xs text-zinc-400 hover:text-white border border-white/10 px-2 py-1 rounded-lg transition-colors"
                >
                    Copiar
                </button>
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
                            <input
                                type="url"
                                value={doc.url}
                                onChange={(e) => {
                                    const d = [...config.documents];
                                    d[index] = { ...d[index], url: e.target.value };
                                    setConfig({ ...config, documents: d });
                                }}
                                className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm focus:border-[#D4A853] focus:outline-none"
                                placeholder="https:// o ipfs://"
                            />
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
        </motion.div>
    );
}
