'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

interface ProjectBasicEditModalProps {
    project: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const TABS = [
    { id: 'basic', label: 'General' },
    { id: 'utility', label: 'Mecánica de Utilidad' },
    { id: 'strategy', label: 'Estrategia y Sostenibilidad' },
    { id: 'legal', label: 'Legales' },
];

// Human-readable legalStatus labels
const LEGAL_STATUS_LABELS: Record<string, string> = {
    'sapi_mexico': 'S.A.P.I. de C.V. — Sociedad Anónima Promotora de Inversión (México)',
    'sa_mexico': 'S.A. de C.V. — Sociedad Anónima de Capital Variable (México)',
    'srl_mexico': 'S. de R.L. de C.V. — Sociedad de Responsabilidad Limitada (México)',
    'llc_usa': 'LLC — Limited Liability Company (Estados Unidos)',
    'corp_usa': 'Corp. — Corporation (Estados Unidos)',
    'foundation': 'Fundación sin fines de lucro',
    'dao': 'DAO — Organización Autónoma Descentralizada',
    'bvi': 'BVI Ltd. — Compañía en Islas Vírgenes Británicas',
    'cayman': 'Cayman Islands Foundation Company',
    'panama': 'Sociedad Anónima (Panamá)',
    'digital_asset': 'Activo Digital (sin entidad corporativa formal)',
    'pending': 'Pendiente de constituir',
    'other': 'Otro / En proceso de definición',
};

function getLegalLabel(value: string | null | undefined): string {
    if (!value) return 'No definido';
    return LEGAL_STATUS_LABELS[value] ?? value;
}

export function ProjectBasicEditModal({ project, open, onOpenChange, onSuccess }: ProjectBasicEditModalProps) {
    const [activeTab, setActiveTab] = useState('basic');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        // Basic
        title: '',
        tagline: '',
        description: '',
        logoUrl: '',
        coverPhotoUrl: '',
        applicantName: '',
        // Utility Mechanics
        protoclMecanism: '',
        artefactUtility: '',
        worktoearnMecanism: '',
        // Strategy
        monetizationModel: '',
        adquireStrategy: '',
        // Legal
        legalStatus: '',
    });

    const resolveIpfs = (url: string) => {
        if (!url) return '';
        if (url.startsWith('ipfs://')) {
            return url.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
        }
        return url;
    };

    useEffect(() => {
        if (project) {
            // Strip legacy base64 blobs at load time — they can't be sent back in JSON (too large)
            // If the stored value is a data: URI, treat as empty so user can re-upload via the file input
            const cleanUrl = (url: string | null | undefined) =>
                url && !url.startsWith('data:') ? url : '';

            setFormData({
                title: project.title || '',
                tagline: project.tagline || '',
                description: project.description || '',
                // Fallback to legacy field names (snake_case from some API routes)
                logoUrl: cleanUrl(project.logoUrl || project.logo_url || project.imageUrl || project.image_url),
                coverPhotoUrl: cleanUrl(project.coverPhotoUrl || project.cover_photo_url),
                applicantName: project.applicantName || project.applicant_name || '',
                protoclMecanism: project.protoclMecanism || project.protocl_mecanism || '',
                artefactUtility: project.artefactUtility || project.artefact_utility || '',
                worktoearnMecanism: project.worktoearnMecanism || project.worktoearn_mecanism || '',
                monetizationModel: project.monetizationModel || project.monetization_model || '',
                adquireStrategy: project.adquireStrategy || project.adquire_strategy || '',
                legalStatus: project.legalStatus || project.legal_status || '',
            });
            setActiveTab('basic');
        }
    }, [project]);

    const set = (key: string, value: string) =>
        setFormData(prev => ({ ...prev, [key]: value }));

    const handleImageUpload = async (
        file: File,
        field: 'logoUrl' | 'coverPhotoUrl',
        loadingMsg: string,
        successMsg: string
    ) => {
        const toastId = toast.loading(loadingMsg);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/v1/core/upload', { method: 'POST', body: fd });
            const data = await res.json();
            if (data.url) {
                set(field, data.url);
                toast.success(successMsg, { id: toastId });
            }
        } catch {
            toast.error('Error al subir imagen', { id: toastId });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // formData.logoUrl/coverPhotoUrl are already clean (base64 stripped at load).
        // If the file upload API returned a URL, it's already stored there.
        // If somehow still a data URI, send null to avoid body-too-large errors.
        const safeLogoUrl = formData.logoUrl?.startsWith('data:') ? null : (formData.logoUrl || null);
        const safeCoverUrl = formData.coverPhotoUrl?.startsWith('data:') ? null : (formData.coverPhotoUrl || null);

        try {
            const response = await fetch(`/api/admin/projects/${project.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.title,
                    tagline: formData.tagline,
                    description: formData.description,
                    logoUrl: safeLogoUrl,
                    coverPhotoUrl: safeCoverUrl,
                    applicantName: formData.applicantName,
                    protoclMecanism: formData.protoclMecanism,
                    artefactUtility: formData.artefactUtility,
                    worktoearnMecanism: formData.worktoearnMecanism,
                    monetizationModel: formData.monetizationModel,
                    adquireStrategy: formData.adquireStrategy,
                    legalStatus: formData.legalStatus,
                    isBasicEdit: true,
                }),
            });

            if (response.ok) {
                toast.success('Protocolo actualizado correctamente');
                onSuccess();
                onOpenChange(false);
            } else {
                const data = await response.json();
                toast.error(data.message || 'Error al actualizar el protocolo');
            }
        } catch {
            toast.error('Error de conexión');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!project) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-hidden flex flex-col bg-zinc-950 border-zinc-800 text-white p-0">
                <DialogHeader className="px-6 pt-6 pb-0 flex-shrink-0">
                    <DialogTitle className="text-lg font-bold">Editar Protocolo</DialogTitle>
                    <DialogDescription className="text-zinc-500 text-sm">
                        Modifica la información de tu protocolo. Los cambios son instantáneos.
                    </DialogDescription>
                </DialogHeader>

                {/* Tabs */}
                <div className="flex gap-0 border-b border-zinc-800 px-6 flex-shrink-0 mt-4">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'px-4 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors border-b-2 -mb-px',
                                activeTab === tab.id
                                    ? 'border-lime-400 text-lime-400'
                                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                        {/* ── TAB: GENERAL ── */}
                        {activeTab === 'basic' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 space-y-1.5">
                                        <Label>Nombre del Protocolo</Label>
                                        <Input
                                            value={formData.title}
                                            onChange={e => set('title', e.target.value)}
                                            className="bg-zinc-900 border-zinc-800 focus:border-lime-500"
                                            placeholder="Ej: Pandora's Ecosystem"
                                            required
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-1.5">
                                        <Label>Nombre del Creador / Responsable</Label>
                                        <Input
                                            value={formData.applicantName}
                                            onChange={e => set('applicantName', e.target.value)}
                                            className="bg-zinc-900 border-zinc-800 focus:border-lime-500"
                                            placeholder="Nombre completo del creador o empresa responsable"
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-1.5">
                                        <Label>Slogan (Resumen corto)</Label>
                                        <Input
                                            value={formData.tagline}
                                            onChange={e => set('tagline', e.target.value)}
                                            className="bg-zinc-900 border-zinc-800 focus:border-lime-500"
                                            placeholder="Ej: The premier work-to-earn infrastructure"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Descripción Detallada</Label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={e => set('description', e.target.value)}
                                        className="bg-zinc-900 border-zinc-800 min-h-[200px] focus:border-lime-500 resize-y text-sm leading-relaxed"
                                        placeholder="Describe los objetivos, propuesta de valor y utilidad de tu protocolo..."
                                        required
                                    />
                                    <p className="text-[10px] text-zinc-600">{formData.description.length} caracteres</p>
                                </div>

                                {/* Images */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Logo */}
                                    <div className="space-y-2">
                                        <Label>Logo del Proyecto</Label>
                                        <div className="flex items-center gap-3">
                                            <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {formData.logoUrl && !formData.logoUrl.startsWith('data:') ? (
                                                    <Image src={resolveIpfs(formData.logoUrl)} alt="Logo" width={56} height={56} className="w-full h-full object-cover" unoptimized />
                                                ) : (
                                                    <PhotoIcon className="w-7 h-7 text-zinc-700" />
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-1.5">
                                                <Input
                                                    type="file" accept="image/*"
                                                    onChange={e => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleImageUpload(file, 'logoUrl', 'Subiendo logo...', 'Logo subido');
                                                    }}
                                                    className="bg-zinc-900 border-zinc-800 text-xs text-zinc-400 file:bg-zinc-800 file:text-white file:border-0 file:rounded file:mr-3 file:px-2 file:py-1 cursor-pointer"
                                                />
                                                <Input
                                                    value={formData.logoUrl?.startsWith('data:') ? '' : formData.logoUrl}
                                                    onChange={e => set('logoUrl', e.target.value)}
                                                    className="bg-zinc-900 border-zinc-800 text-xs focus:border-lime-500"
                                                    placeholder="https://..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cover */}
                                    <div className="space-y-2">
                                        <Label>Imagen de Portada</Label>
                                        <div className="h-14 w-full rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden mb-1.5">
                                            {formData.coverPhotoUrl && !formData.coverPhotoUrl.startsWith('data:') ? (
                                                <Image src={resolveIpfs(formData.coverPhotoUrl)} alt="Cover" width={600} height={56} className="w-full h-full object-cover" unoptimized />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center"><PhotoIcon className="w-7 h-7 text-zinc-700" /></div>
                                            )}
                                        </div>
                                        <Input
                                            type="file" accept="image/*"
                                            onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (file) handleImageUpload(file, 'coverPhotoUrl', 'Subiendo portada...', 'Portada subida');
                                            }}
                                            className="bg-zinc-900 border-zinc-800 text-xs text-zinc-400 file:bg-zinc-800 file:text-white file:border-0 file:rounded file:mr-3 file:px-2 file:py-1 cursor-pointer"
                                        />
                                        <Input
                                            value={formData.coverPhotoUrl?.startsWith('data:') ? '' : formData.coverPhotoUrl}
                                            onChange={e => set('coverPhotoUrl', e.target.value)}
                                            className="bg-zinc-900 border-zinc-800 text-xs focus:border-lime-500"
                                            placeholder="URL de portada"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── TAB: MECÁNICA DE UTILIDAD ── */}
                        {activeTab === 'utility' && (
                            <div className="space-y-5">
                                <div className="space-y-1.5">
                                    <Label>Mecánica del Protocolo</Label>
                                    <p className="text-xs text-zinc-500">Explica cómo funciona técnicamente el protocolo y cuál es el flujo de participación.</p>
                                    <Textarea
                                        value={formData.protoclMecanism}
                                        onChange={e => set('protoclMecanism', e.target.value)}
                                        className="bg-zinc-900 border-zinc-800 min-h-[160px] focus:border-lime-500 resize-y text-sm leading-relaxed"
                                        placeholder="Describe el flujo técnico del protocolo: cómo participan los usuarios, en qué se basa la mecánica de acceso y los artefactos..."
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Utilidad a Largo Plazo de los Artefactos</Label>
                                    <p className="text-xs text-zinc-500">Define qué valor acumulan los artefactos con el tiempo y por qué son estratégicamente valiosos.</p>
                                    <Textarea
                                        value={formData.artefactUtility}
                                        onChange={e => set('artefactUtility', e.target.value)}
                                        className="bg-zinc-900 border-zinc-800 min-h-[160px] focus:border-lime-500 resize-y text-sm leading-relaxed"
                                        placeholder="Ej: Los Artifacts otorgan derechos de participación en distribuciones de utilidades, acceso preferencial a futuras preventas, y representan proof-of-stake en el ecosistema..."
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Sistema Work-to-Earn</Label>
                                    <p className="text-xs text-zinc-500">Describe cómo los participantes generan recompensas a través de acciones dentro del ecosistema.</p>
                                    <Textarea
                                        value={formData.worktoearnMecanism}
                                        onChange={e => set('worktoearnMecanism', e.target.value)}
                                        className="bg-zinc-900 border-zinc-800 min-h-[160px] focus:border-lime-500 resize-y text-sm leading-relaxed"
                                        placeholder="Ej: Los holders activos reciben puntos de reputación por cada acción verificada (referidos, votaciones, hitos completados). Estos se convierten en distribuciones trimestrales..."
                                    />
                                </div>
                            </div>
                        )}

                        {/* ── TAB: ESTRATEGIA Y SOSTENIBILIDAD ── */}
                        {activeTab === 'strategy' && (
                            <div className="space-y-5">
                                <div className="space-y-1.5">
                                    <Label>Modelo de Monetización (Ingresos del Protocolo)</Label>
                                    <p className="text-xs text-zinc-500">¿Cómo genera ingresos el protocolo de forma recurrente? ¿Cuáles son las fuentes de ingreso?</p>
                                    <Textarea
                                        value={formData.monetizationModel}
                                        onChange={e => set('monetizationModel', e.target.value)}
                                        className="bg-zinc-900 border-zinc-800 min-h-[180px] focus:border-lime-500 resize-y text-sm leading-relaxed"
                                        placeholder="Ej: El protocolo genera ingresos a través de: (1) fees de gestión del 2% anual sobre el AUM, (2) comisión del 10% sobre utilidades distribuidas, (3) licencias de acceso institucional..."
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Estrategia de Adopción (Go-To-Market)</Label>
                                    <p className="text-xs text-zinc-500">¿Cómo planeas adquirir y retener a los primeros participantes? ¿Cuál es el canal de crecimiento principal?</p>
                                    <Textarea
                                        value={formData.adquireStrategy}
                                        onChange={e => set('adquireStrategy', e.target.value)}
                                        className="bg-zinc-900 border-zinc-800 min-h-[180px] focus:border-lime-500 resize-y text-sm leading-relaxed"
                                        placeholder="Ej: Fase Genesis limitada a 200 holders seleccionados por criterios de capital. Distribución por referido verificado con incentivos de posición temprana. Comunidad privada en Telegram como canal principal..."
                                    />
                                </div>

                                {/* Estructura de Recompensa Recurrente — HIDDEN as requested */}
                                {/* <div>... Estructura de Recompensa Recurrente ...</div> */}
                            </div>
                        )}

                        {/* ── TAB: LEGALES ── */}
                        {activeTab === 'legal' && (
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label>Estatus Legal y Jurisdicción</Label>
                                    <p className="text-xs text-zinc-500">Selecciona la estructura legal actual del protocolo o empresa responsable.</p>
                                    <select
                                        value={formData.legalStatus}
                                        onChange={e => set('legalStatus', e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-lime-500 transition-colors"
                                    >
                                        <option value="">— Seleccionar tipo de entidad —</option>
                                        {Object.entries(LEGAL_STATUS_LABELS).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>

                                    {formData.legalStatus && (
                                        <div className="mt-2 p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-0.5">Seleccionado</p>
                                            <p className="text-sm text-white font-medium">{getLegalLabel(formData.legalStatus)}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Current legal status display */}
                                {project.legalStatus && project.legalStatus !== formData.legalStatus && (
                                    <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-0.5">Valor actual guardado</p>
                                        <p className="text-sm text-zinc-400">{getLegalLabel(project.legalStatus)}</p>
                                    </div>
                                )}

                                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                                    <p className="text-xs text-amber-400 font-semibold mb-1">⚠️ Nota sobre estatus legal</p>
                                    <p className="text-xs text-zinc-500 leading-relaxed">
                                        Esta información es visible en la sección de Transparencia y Legal del protocolo. 
                                        Asegúrate de que corresponda a la estructura legal real o planificada, ya que es un factor clave de confianza para los participantes.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="px-6 pb-6 pt-4 border-t border-zinc-800 flex-shrink-0 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-lime-500 hover:bg-lime-400 text-black font-bold"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
