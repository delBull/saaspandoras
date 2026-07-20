'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Link as LinkIcon, FileText, Video, Presentation, Calendar, MoreHorizontal, ExternalLink, Activity } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createProjectResource } from "@/actions/resources";

const RESOURCE_TYPES = [
    { value: 'document', label: 'Documento / PDF' },
    { value: 'project_event', label: 'Evento' },
    { value: 'podcast', label: 'Podcast' },
    { value: 'video', label: 'Video' },
    { value: 'landing', label: 'Landing Page' },
    { value: 'calculator', label: 'Calculadora' },
    { value: 'keynote', label: 'Keynote' },
    { value: 'meeting', label: 'Reunión / Zoom' },
    { value: 'link', label: 'Enlace Genérico' },
    { value: 'other', label: 'Otro' },
];

export function ResourceDashboard({ project, resources }: { project: any, resources: any[] }) {
    const router = useRouter();
    const [openNew, setOpenNew] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resourceType, setResourceType] = useState('document');

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        
        try {
            const tagsInput = formData.get("tags") as string;
            const tagsArray = tagsInput ? tagsInput.split(',').map(t => t.trim()) : [];

            const res = await createProjectResource({
                projectId: project.id,
                type: formData.get("type") as string,
                title: formData.get("title") as string,
                description: formData.get("description") as string,
                url: formData.get("url") as string,
                version: formData.get("version") as string,
                visibility: formData.get("visibility") as string,
                tags: tagsArray,
                eventConfig: formData.get("type") === 'project_event' ? {
                    host: formData.get("eventHost") as string,
                    language: formData.get("eventLanguage") as string,
                    lifecycle: formData.get("eventLifecycle") as string,
                    capacity: formData.get("eventCapacity") ? parseInt(formData.get("eventCapacity") as string) : null,
                    opensAt: formData.get("eventOpensAt") as string,
                    closesAt: formData.get("eventClosesAt") as string,
                } : undefined
            });

            if (res.success) {
                toast.success("Recurso creado correctamente");
                setOpenNew(false);
                router.refresh();
            } else {
                toast.error(res.error || "Error al crear recurso");
            }
        } catch(err) {
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                    <Badge variant="outline">Total: {resources.length}</Badge>
                </div>
                
                <Dialog open={openNew} onOpenChange={setOpenNew}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            New Resource
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Añadir Recurso</DialogTitle>
                            <DialogDescription>
                                Registra un nuevo asset institucional para {project.title}.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tipo</label>
                                    <select 
                                        name="type" 
                                        required 
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={resourceType}
                                        onChange={(e) => setResourceType(e.target.value)}
                                    >
                                        {RESOURCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Visibilidad</label>
                                    <select name="visibility" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                        <option value="public">Public</option>
                                        <option value="internal">Internal</option>
                                        <option value="partner">Partner</option>
                                        <option value="investor">Investor</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nombre / Título</label>
                                <input name="title" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Ej: Investment Deck" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Versión</label>
                                    <input name="version" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="v1, v2..." defaultValue="v1" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tags (separados por coma)</label>
                                    <input name="tags" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Pitch, Founder, RWA" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">URL del Recurso (Drive, YouTube, etc)</label>
                                <input name="url" type="url" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="https://..." />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Descripción (Markdown)</label>
                                <textarea name="description" className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Detalles de este recurso..." />
                            </div>

                            {resourceType === 'project_event' && (
                                <div className="p-4 border rounded-lg bg-zinc-900/30 space-y-4">
                                    <h4 className="text-sm font-medium text-blue-400">Configuración de Evento</h4>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium">Host / Presentador</label>
                                            <input name="eventHost" className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs" placeholder="Ej: John Doe" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium">Idioma</label>
                                            <select name="eventLanguage" className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs">
                                                <option value="es">Español</option>
                                                <option value="en">Inglés</option>
                                                <option value="pt">Portugués</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium">Ciclo de Vida</label>
                                            <select name="eventLifecycle" className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs">
                                                <option value="scheduled">Programado</option>
                                                <option value="open_registration">Registro Abierto</option>
                                                <option value="live">En Vivo</option>
                                                <option value="replay_available">Replay Disponible</option>
                                                <option value="archived">Archivado</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium">Capacidad Máxima</label>
                                            <input name="eventCapacity" type="number" className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs" placeholder="Ilimitado" />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium">Abre Registro</label>
                                            <input name="eventOpensAt" type="datetime-local" className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium">Cierra Registro</label>
                                            <input name="eventClosesAt" type="datetime-local" className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setOpenNew(false)}>Cancelar</Button>
                                <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Crear Recurso'}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {resources.map((resource) => (
                    <Card key={resource.id} className="hover:border-blue-500/50 transition-colors">
                        <CardHeader className="pb-2 relative">
                            <div className="flex justify-between items-start pr-6">
                                <div>
                                    <Badge variant="outline" className="mb-2 text-[10px] uppercase tracking-wider">{resource.type.replace('_', ' ')}</Badge>
                                    <CardTitle className="text-md leading-tight">{resource.title} <span className="text-xs text-muted-foreground font-normal ml-1">{resource.version}</span></CardTitle>
                                </div>
                            </div>
                            <div className="absolute top-4 right-4">
                                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground">Editar</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">
                                {resource.description || 'Sin descripción'}
                            </div>

                            {resource.tags && resource.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-4">
                                    {resource.tags.map((tag: string, i: number) => (
                                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                                <div className="flex space-x-3 text-xs text-muted-foreground font-mono">
                                    <div className="flex items-center" title="Campañas vinculadas">
                                        <LinkIcon className="w-3 h-3 mr-1" /> {resource.linkedCampaignCount}
                                    </div>
                                    <div className="flex items-center" title="Clicks / Views">
                                        <Activity className="w-3 h-3 mr-1" /> {resource.clicks + resource.views}
                                    </div>
                                </div>

                                {resource.url && (
                                    <a href={resource.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-400">
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
