'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QrCodeIcon, PlusIcon, PencilIcon, TrashIcon, ArrowTopRightOnSquareIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface ProjectQRManagerProps {
    project: any;
}

function QRPreview({ url }: { url: string }) {
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    
    useEffect(() => {
        import("qrcode").then(QRCodeLib => {
            QRCodeLib.default.toDataURL(url, { width: 300, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
                .then(setImgSrc)
                .catch(console.error);
        });
    }, [url]);

    if (!imgSrc) return <div className="w-[80px] h-[80px] bg-white/5 animate-pulse rounded-xl" />;
    return <img src={imgSrc} alt="QR Preview" className="w-[80px] h-[80px] rounded-xl bg-white border border-white/10" />;
}

export function ProjectQRManager({ project }: ProjectQRManagerProps) {
    const [qrs, setQrs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        slug: '',
        destinationUrl: '',
        title: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Edit state
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editUrl, setEditUrl] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Dynamic Domain
    const [baseDomain, setBaseDomain] = useState('pbox.dev');
    const [fullHost, setFullHost] = useState('https://pbox.dev');

    useEffect(() => {
        const origin = window.location.origin;
        const host = window.location.host;
        const isProd = !origin.includes('staging') && !origin.includes('localhost');
        setBaseDomain(isProd ? 'pbox.dev' : host);
        setFullHost(isProd ? 'https://pbox.dev' : origin);
        
        fetchQRs();
    }, [project.id]);

    const fetchQRs = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/shortlinks?show_all=true');
            if (res.ok) {
                const data = await res.json();
                if (data.data) {
                    // Filter those that have projectId matching in landingConfig and are marked as business QRs
                    const filtered = data.data.filter((sl: any) => 
                        sl.landingConfig?.projectId === project.id && sl.landingConfig?.isDynamicQR
                    );
                    setQrs(filtered);
                }
            }
        } catch (error) {
            console.error('Error fetching QRs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateQR = async () => {
        if (!formData.slug || !formData.destinationUrl || !formData.title) {
            return toast.error('Ingresa título, slug y destino URL');
        }
        
        setIsSubmitting(true);
        try {
            const cleanSlug = formData.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
            const res = await fetch('/api/admin/shortlinks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug: cleanSlug,
                    destinationUrl: formData.destinationUrl,
                    title: formData.title,
                    description: `QR Dinámico de Negocio para ${project.title || project.slug}`,
                    landingConfig: { 
                        isMasked: false, 
                        projectId: project.id, 
                        isDynamicQR: true 
                    }
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al crear QR');
            
            toast.success(`QR Dinámico creado exitosamente`);
            setFormData({ slug: '', destinationUrl: '', title: '' });
            setShowCreateForm(false);
            fetchQRs();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteQR = async (id: number) => {
        if (!confirm('¿Seguro que deseas eliminar este QR Dinámico? El código impreso dejará de funcionar permanentemente.')) return;
        try {
            const res = await fetch('/api/admin/shortlinks', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al eliminar');
            
            setQrs(prev => prev.filter(sl => sl.id !== id));
            toast.success('QR eliminado');
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const startEdit = (qr: any) => {
        setEditingId(qr.id);
        setEditUrl(qr.destinationUrl);
    };

    const handleSaveEdit = async (id: number) => {
        if (!editUrl) return toast.error('La URL no puede estar vacía');
        setIsSavingEdit(true);
        try {
            const res = await fetch('/api/admin/shortlinks', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, destinationUrl: editUrl })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al actualizar');
            }
            toast.success('Destino del QR actualizado correctamente');
            setEditingId(null);
            fetchQRs();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsSavingEdit(false);
        }
    };

    const downloadQR = async (slug: string, title: string) => {
        try {
            const QRCodeLib = (await import("qrcode")).default;
            const url = `${fullHost}/${slug}`;
            const dataUrl = await QRCodeLib.toDataURL(url, { width: 1000, margin: 2 });
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = `QR-${project.slug}-${title.replace(/\s+/g, '-')}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Descargando código QR...');
        } catch (e) {
            console.error("QR Download failed", e);
            toast.error("Fallo al generar imagen del QR.");
        }
    };

    return (
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-lime-500/10 rounded-lg">
                        <QrCodeIcon className="w-5 h-5 text-lime-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">QRs Dinámicos</h3>
                        <p className="text-zinc-400 text-sm">Crea códigos QR físicos donde puedes cambiar el enlace de destino en cualquier momento.</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreateForm(v => !v)}
                    className="flex items-center gap-2 px-4 py-2 bg-lime-500/10 text-lime-400 border border-lime-500/20 text-sm font-bold rounded-xl hover:bg-lime-500/20 transition-colors"
                >
                    <PlusIcon className="w-4 h-4" />
                    Crear QR
                </button>
            </div>

            {/* Formulario de Creación */}
            {showCreateForm && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-6 p-5 bg-black/50 border border-lime-500/20 rounded-xl space-y-4"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs text-zinc-500 mb-1">Nombre para uso interno (Ej. QR Menú, QR Flyer Lobby) *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm focus:border-lime-500 focus:outline-none text-white"
                                placeholder="Flyer Primavera 2026"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-500 mb-1">Enlace Corto (Slug) *</label>
                            <div className="flex items-center">
                                <span className="bg-zinc-800 text-zinc-400 text-sm px-3 py-3 rounded-l-xl border border-r-0 border-white/10">{baseDomain}/</span>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-r-xl p-3 text-sm focus:border-lime-500 focus:outline-none text-white font-mono"
                                    placeholder={`${project.slug}-menu`}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-500 mb-1">Enlace de Destino (Hacia donde te lleva) *</label>
                            <input
                                type="url"
                                value={formData.destinationUrl}
                                onChange={e => setFormData({ ...formData, destinationUrl: e.target.value })}
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm focus:border-lime-500 focus:outline-none text-white"
                                placeholder="https://mi-dominio.com/..."
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleCreateQR}
                            disabled={isSubmitting}
                            className="px-6 py-2.5 bg-lime-500 text-black text-sm font-bold rounded-xl hover:bg-lime-400 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'Creando...' : 'Crear y Generar QR'}
                        </button>
                        <button
                            onClick={() => setShowCreateForm(false)}
                            className="px-6 py-2.5 bg-zinc-800 text-zinc-400 text-sm font-bold rounded-xl hover:bg-zinc-700 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Listado de QRs */}
            {isLoading ? (
                <div className="text-zinc-500 text-sm text-center py-8">Cargando QRs...</div>
            ) : qrs.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
                    <QrCodeIcon className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                    <p className="text-zinc-500 text-sm">No tienes QRs dinámicos creados.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {qrs.map(qr => (
                        <div key={qr.id} className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
                            <div className="flex gap-4">
                                <div className="shrink-0 pt-1">
                                    <QRPreview url={`${fullHost}/${qr.slug}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-white text-sm truncate">{qr.title}</h4>
                                        <button
                                            onClick={() => handleDeleteQR(qr.id)}
                                            className="text-red-400 hover:text-red-300 p-1 shrink-0 ml-2"
                                            title="Eliminar QR"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs mb-3">
                                        <span className="text-lime-400 font-mono tracking-wide bg-lime-400/10 px-2 py-1 rounded truncate">
                                            {baseDomain}/{qr.slug}
                                        </span>
                                    </div>
                                    
                                    <div className="mt-2">
                                        <p className="text-[10px] uppercase text-zinc-500 font-bold mb-1">Enlace de Destino Actual:</p>
                                    {editingId === qr.id ? (
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={editUrl}
                                                onChange={e => setEditUrl(e.target.value)}
                                                className="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:border-lime-500 focus:outline-none"
                                            />
                                            <button 
                                                onClick={() => handleSaveEdit(qr.id)}
                                                disabled={isSavingEdit}
                                                className="text-xs bg-lime-500 text-black px-3 py-1.5 rounded-lg font-bold hover:bg-lime-400 disabled:opacity-50"
                                            >
                                                Guardar
                                            </button>
                                            <button 
                                                onClick={() => setEditingId(null)}
                                                className="text-xs bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg hover:bg-zinc-700"
                                            >
                                                ✗
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 group">
                                            <a 
                                                href={qr.destinationUrl} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="text-xs text-zinc-300 hover:text-blue-400 truncate max-w-[200px]"
                                                title={qr.destinationUrl}
                                            >
                                                {qr.destinationUrl}
                                            </a>
                                            <button 
                                                onClick={() => startEdit(qr)}
                                                className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-lime-400 transition-all p-1"
                                                title="Cambiar destino"
                                            >
                                                <PencilIcon className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            </div>
                            
                            <div className="flex gap-2 mt-5 pt-4 border-t border-white/5">
                                <button
                                    onClick={() => downloadQR(qr.slug, qr.title)}
                                    className="flex-1 flex items-center justify-center gap-2 text-xs bg-lime-500/10 text-lime-400 border border-lime-500/20 py-2 rounded-lg font-bold hover:bg-lime-500/20 transition-colors"
                                >
                                    <ArrowDownTrayIcon className="w-4 h-4" />
                                    Descargar QR
                                </button>
                                <a
                                    href={`${fullHost}/${qr.slug}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-center gap-2 text-xs bg-zinc-800 text-zinc-300 border border-white/5 py-2 px-3 rounded-lg hover:bg-zinc-700 transition-colors"
                                    title="Probar enlace"
                                >
                                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
