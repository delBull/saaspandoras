'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    UsersIcon, EnvelopeIcon, PaperAirplaneIcon, TrashIcon,
    PlusIcon, CheckCircleIcon, XCircleIcon, XMarkIcon,
    Cog6ToothIcon, DocumentTextIcon, ClockIcon
} from '@heroicons/react/24/outline';
import {
    getNewsletterData, addSubscriber, removeSubscriber,
    sendCampaign, getTemplates, updateNewsletterSettings, deleteCampaign
} from '@/actions/newsletter';
import type { NewsletterData, NewsletterSubscriber, NewsletterCampaign, NewsletterSettings } from '@/actions/newsletter';

export function NewsletterTab({ project }: { project: any }) {
    const [data, setData] = useState<NewsletterData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<'subscribers' | 'campaigns' | 'compose' | 'settings'>('subscribers');
    const [templates, setTemplates] = useState<any[]>([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [d, tpls] = await Promise.all([
            getNewsletterData(Number(project.id)),
            getTemplates(),
        ]);
        setData(d);
        setTemplates(tpls);
        setLoading(false);
    }, [project.id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) return <div className="text-zinc-500 p-8 text-center">Cargando newsletter...</div>;
    if (!data) return null;

    return (
        <div className="w-full space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Newsletter</h2>
                    <p className="text-zinc-500 text-sm mt-1">
                        {data.subscribers.length} suscriptores · {data.campaigns.filter(c => c.status === 'sent').length} campañas enviadas
                    </p>
                </div>
            </div>

            {/* Section Nav */}
            <div className="flex items-center gap-1 p-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl w-fit">
                {[
                    { id: 'subscribers', label: 'Suscriptores', icon: <UsersIcon className="w-4 h-4" /> },
                    { id: 'campaigns', label: 'Campañas', icon: <EnvelopeIcon className="w-4 h-4" /> },
                    { id: 'compose', label: 'Redactar', icon: <DocumentTextIcon className="w-4 h-4" /> },
                    { id: 'settings', label: 'Config', icon: <Cog6ToothIcon className="w-4 h-4" /> },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSection(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeSection === tab.id
                                ? 'bg-zinc-800 text-white shadow-lg'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {activeSection === 'subscribers' && (
                <SubscribersSection project={project} data={data} onUpdate={fetchData} />
            )}
            {activeSection === 'campaigns' && (
                <CampaignsSection project={project} data={data} onUpdate={fetchData} />
            )}
            {activeSection === 'compose' && (
                <ComposeSection project={project} templates={templates} onUpdate={fetchData} />
            )}
            {activeSection === 'settings' && (
                <SettingsSection project={project} data={data} onUpdate={fetchData} />
            )}
        </div>
    );
}

/* ───── Subscribers ───── */

function SubscribersSection({ project, data, onUpdate }: { project: any; data: NewsletterData; onUpdate: () => void }) {
    const [showAdd, setShowAdd] = useState(false);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        setSubmitting(true);
        await addSubscriber(Number(project.id), { email: email.trim(), name: name.trim(), source: 'manual' });
        setEmail('');
        setName('');
        setShowAdd(false);
        setSubmitting(false);
        onUpdate();
    };

    const handleRemove = async (id: string) => {
        if (!confirm('¿Eliminar este suscriptor?')) return;
        await removeSubscriber(Number(project.id), id);
        onUpdate();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Suscriptores ({data.subscribers.length})</h3>
                <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-black rounded-xl text-sm font-bold transition-all">
                    <PlusIcon className="w-4 h-4" />
                    Agregar Manual
                </button>
            </div>

            {showAdd && (
                <form onSubmit={handleAdd} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Email *"
                        required
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-amber-500/50"
                    />
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Nombre (opcional)"
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-amber-500/50"
                    />
                    <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-black rounded-xl text-sm font-bold transition-all disabled:opacity-50">
                        {submitting ? '...' : 'Guardar'}
                    </button>
                </form>
            )}

            {data.subscribers.length === 0 ? (
                <div className="text-zinc-500 text-sm p-8 text-center border border-dashed border-zinc-800 rounded-2xl">
                    No hay suscriptores aún
                </div>
            ) : (
                <div className="space-y-2">
                    {data.subscribers.map((s) => (
                        <div key={s.id} className="flex items-center justify-between bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-4">
                            <div>
                                <div className="font-medium text-white text-sm">{s.email}</div>
                                {s.name && <div className="text-xs text-zinc-500">{s.name}</div>}
                                <div className="text-xs text-zinc-600 mt-1">
                                    {new Date(s.subscribedAt).toLocaleDateString()} · {s.source}
                                </div>
                            </div>
                            <button onClick={() => handleRemove(s.id)} className="p-2 text-zinc-600 hover:text-red-400 transition-colors">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ───── Campaigns ───── */

function CampaignsSection({ project, data, onUpdate }: { project: any; data: NewsletterData; onUpdate: () => void }) {
    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar esta campaña?')) return;
        await deleteCampaign(Number(project.id), id);
        onUpdate();
    };

    if (data.campaigns.length === 0) {
        return (
            <div className="text-zinc-500 text-sm p-8 text-center border border-dashed border-zinc-800 rounded-2xl">
                No hay campañas enviadas aún
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {data.campaigns.map((c) => (
                <div key={c.id} className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-5">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-white">{c.subject}</span>
                                {c.status === 'sent' ? (
                                    <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                                ) : (
                                    <ClockIcon className="w-4 h-4 text-amber-400" />
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                                <span className="capitalize">{c.type}</span>
                                <span>·</span>
                                <span>{c.recipientCount} destinatarios</span>
                                {c.sentAt && (
                                    <>
                                        <span>·</span>
                                        <span>{new Date(c.sentAt).toLocaleDateString()}</span>
                                    </>
                                )}
                            </div>
                            <p className="text-sm text-zinc-400 mt-2 line-clamp-2">{c.preview}</p>
                        </div>
                        <button onClick={() => handleDelete(c.id)} className="p-2 text-zinc-600 hover:text-red-400 transition-colors ml-4">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ───── Compose ───── */

function ComposeSection({ project, templates, onUpdate }: { project: any; templates: any[]; onUpdate: () => void }) {
    const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
    const [subject, setSubject] = useState('');
    const [preview, setPreview] = useState('');
    const [body, setBody] = useState('');
    const [type, setType] = useState<string>('custom');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const loadTemplate = (tpl: any) => {
        setSelectedTemplate(tpl);
        setType(tpl.type);
        setSubject(tpl.subject.replace(/\{\{project\}\}/g, project.title).replace(/\{\{name\}\}/g, 'Suscriptor'));
        setPreview(tpl.preview.replace(/\{\{project\}\}/g, project.title));
        setBody(tpl.body
            .replace(/\{\{project\}\}/g, project.title)
            .replace(/\{\{name\}\}/g, '{{name}}')
        );
    };

    const handleSend = async () => {
        if (!subject.trim() || !body.trim()) return;
        setSending(true);
        await sendCampaign(Number(project.id), {
            type: type as any,
            subject: subject.trim(),
            preview: preview.trim(),
            body: body.trim(),
        });
        setSending(false);
        setSent(true);
        onUpdate();
        setTimeout(() => setSent(false), 3000);
    };

    return (
        <div className="space-y-6">
            {/* Template selector */}
            <div>
                <h3 className="text-lg font-bold text-white mb-3">Plantillas</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {templates.map((tpl) => (
                        <button
                            key={tpl.type}
                            onClick={() => loadTemplate(tpl)}
                            className={`text-left bg-zinc-900/50 border rounded-2xl p-4 transition-all hover:bg-zinc-800/50 ${selectedTemplate?.type === tpl.type ? 'border-amber-500/50 bg-zinc-800/50' : 'border-zinc-800'
                                }`}
                        >
                            <div className="text-sm font-bold text-white capitalize mb-1">{tpl.type}</div>
                            <div className="text-xs text-zinc-500 line-clamp-2">{tpl.preview}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Compose form */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-lg font-bold text-white">Redactar Newsletter</h3>
                <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Asunto"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-amber-500/50"
                />
                <input
                    type="text"
                    value={preview}
                    onChange={e => setPreview(e.target.value)}
                    placeholder="Vista previa (texto corto)"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-amber-500/50"
                />
                <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder="Cuerpo del mensaje (soporta Markdown)"
                    rows={10}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-amber-500/50 resize-y"
                />
                <div className="text-xs text-zinc-600">
                    Variables disponibles:{' '}
                    <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-amber-400">{'{'}${'name}'}</code>{' '}
                    <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-amber-400">{'{'}${'project}'}</code>
                </div>
                <button
                    onClick={handleSend}
                    disabled={sending || !subject.trim() || !body.trim()}
                    className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-black rounded-xl text-sm font-bold transition-all"
                >
                    {sent ? (
                        <><CheckCircleIcon className="w-4 h-4" /> Enviado</>
                    ) : sending ? (
                        'Enviando...'
                    ) : (
                        <><PaperAirplaneIcon className="w-4 h-4" /> Enviar Newsletter</>
                    )}
                </button>
            </div>
        </div>
    );
}

/* ───── Settings ───── */

function SettingsSection({ project, data, onUpdate }: { project: any; data: NewsletterData; onUpdate: () => void }) {
    const [settings, setSettings] = useState<NewsletterSettings>(data.settings);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await updateNewsletterSettings(Number(project.id), settings);
        setSaving(false);
        onUpdate();
    };

    return (
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5 space-y-4 max-w-lg">
            <h3 className="text-lg font-bold text-white">Configuración</h3>

            <label className="flex items-center justify-between">
                <span className="text-sm text-zinc-300">Auto-enviar Welcome al suscribirse</span>
                <input
                    type="checkbox"
                    checked={settings.autoSendWelcome}
                    onChange={e => setSettings(s => ({ ...s, autoSendWelcome: e.target.checked }))}
                    className="toggle"
                />
            </label>

            <div className="space-y-2">
                <label className="text-xs text-zinc-500">Nombre del remitente</label>
                <input
                    type="text"
                    value={settings.senderName}
                    onChange={e => setSettings(s => ({ ...s, senderName: e.target.value }))}
                    placeholder="Ej: Equipo de {{project}}"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-amber-500/50"
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs text-zinc-500">Email del remitente</label>
                <input
                    type="email"
                    value={settings.senderEmail}
                    onChange={e => setSettings(s => ({ ...s, senderEmail: e.target.value }))}
                    placeholder="Ej: hello@{{project}}.com"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-amber-500/50"
                />
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-black rounded-xl text-sm font-bold transition-all"
            >
                {saving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
        </div>
    );
}


