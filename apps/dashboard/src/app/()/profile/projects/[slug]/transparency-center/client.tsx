"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, FileText, CheckCircle2, AlertCircle, Eye, EyeOff, FileKey, Users, ShieldCheck, Lock } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card } from "~/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";

export default function TransparencyCenterClient({ project }: { project: any }) {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        documentType: "legal",
        category: "project_overview",
        status: "AVAILABLE",
        verificationStatus: "NOT_VERIFIED",
        visibility: "PUBLIC",
        url: "",
        storageProvider: "external",
        fileType: "external_link"
    });

    useEffect(() => {
        fetchDocuments();
    }, [project.id]);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/v1/projects/${project.id}/admin/documents`);
            if (res.ok) {
                const data = await res.json();
                setDocuments(data.documents || []);
            }
        } catch (error) {
            console.error("Failed to fetch documents", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`/api/v1/projects/${project.id}/admin/documents`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setIsAdding(false);
                setFormData({
                    title: "",
                    description: "",
                    documentType: "legal",
                    category: "project_overview",
                    status: "AVAILABLE",
                    verificationStatus: "NOT_VERIFIED",
                    visibility: "PUBLIC",
                    url: "",
                    storageProvider: "external",
                    fileType: "external_link"
                });
                fetchDocuments();
            } else {
                const err = await res.json();
                alert(err.error || "Error al crear documento");
            }
        } catch (error) {
            console.error("Error creating document:", error);
            alert("Error al crear documento");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Seguro que deseas eliminar este documento?")) return;
        try {
            const res = await fetch(`/api/v1/projects/${project.id}/admin/documents/${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                fetchDocuments();
            }
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-heading text-white">Transparency Center</h1>
                    <p className="text-zinc-400 mt-1">Gestiona los documentos de {project.title} y construye confianza institucional.</p>
                </div>
                <Dialog open={isAdding} onOpenChange={setIsAdding}>
                    <DialogTrigger asChild>
                        <Button className="bg-white text-black hover:bg-zinc-200">
                            <Plus className="w-4 h-4 mr-2" />
                            Nuevo Documento
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Agregar Documento de Transparencia</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <label className="text-sm text-zinc-400">Título del Documento</label>
                                <Input 
                                    required 
                                    value={formData.title}
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                    className="bg-zinc-900 border-zinc-800"
                                    placeholder="Ej. S'Narai Investment Thesis"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-zinc-400">Descripción (Opcional)</label>
                                <Input 
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    className="bg-zinc-900 border-zinc-800"
                                    placeholder="Breve resumen del contenido"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-zinc-400">Tipo de Documento</label>
                                    <Select value={formData.documentType} onValueChange={v => setFormData({...formData, documentType: v})}>
                                        <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="marketing">Marketing</SelectItem>
                                            <SelectItem value="disclosure">Disclosure</SelectItem>
                                            <SelectItem value="legal">Legal</SelectItem>
                                            <SelectItem value="technical">Technical</SelectItem>
                                            <SelectItem value="financial">Financial</SelectItem>
                                            <SelectItem value="operational">Operational</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-zinc-400">Categoría</label>
                                    <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                                        <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="project_overview">Project Overview</SelectItem>
                                            <SelectItem value="legal_asset_protection">Legal & Asset Protection</SelectItem>
                                            <SelectItem value="financial_model">Financial Model</SelectItem>
                                            <SelectItem value="development_progress">Development Progress</SelectItem>
                                            <SelectItem value="technology_security">Tech & Security</SelectItem>
                                            <SelectItem value="investor_education">Investor Education</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-zinc-400">Estado del Documento</label>
                                    <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                                        <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="AVAILABLE">Disponible</SelectItem>
                                            <SelectItem value="REGULATORY_PROCESS">En Trámite (Regulatorio)</SelectItem>
                                            <SelectItem value="CONSTRUCTION_PENDING">Pendiente de Obra</SelectItem>
                                            <SelectItem value="DRAFT">Borrador (Interno)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-zinc-400">Nivel de Verificación</label>
                                    <Select value={formData.verificationStatus} onValueChange={v => setFormData({...formData, verificationStatus: v})}>
                                        <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NOT_VERIFIED">No Verificado</SelectItem>
                                            <SelectItem value="SELF_VERIFIED">Verificación Interna</SelectItem>
                                            <SelectItem value="EXTERNAL_VERIFIED">Auditoría Externa</SelectItem>
                                            <SelectItem value="BLOCKCHAIN_VERIFIED">Verificado en Blockchain (NOM-151)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-zinc-400">Visibilidad (Roles)</label>
                                <Select value={formData.visibility} onValueChange={v => setFormData({...formData, visibility: v})}>
                                    <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PUBLIC">Público (Todos)</SelectItem>
                                        <SelectItem value="PARTNER_ONLY">Solo Gestores Inmobiliarios</SelectItem>
                                        <SelectItem value="INVESTOR_ONLY">Solo Inversionistas</SelectItem>
                                        <SelectItem value="ADMIN_ONLY">Solo Administradores</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-zinc-400">URL del Documento (Drive/DocSend/Notion)</label>
                                <Input 
                                    value={formData.url}
                                    onChange={e => setFormData({...formData, url: e.target.value})}
                                    className="bg-zinc-900 border-zinc-800"
                                    placeholder="https://..."
                                />
                            </div>

                            <Button type="submit" className="w-full bg-white text-black hover:bg-zinc-200 mt-4" disabled={submitting}>
                                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Guardar Documento"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
                </div>
            ) : documents.length === 0 ? (
                <div className="text-center py-20 border border-zinc-800 border-dashed rounded-xl">
                    <ShieldCheck className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">No hay documentos</h3>
                    <p className="text-zinc-500">Agrega documentos estratégicos y legales para construir el Transparency Center del proyecto.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {documents.map((doc) => (
                        <Card key={doc.id} className="bg-zinc-950/50 border-zinc-800/50 p-5 flex flex-col md:flex-row gap-4 items-start md:items-center">
                            <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0">
                                {doc.verificationStatus === 'BLOCKCHAIN_VERIFIED' ? (
                                    <ShieldCheck className="w-6 h-6 text-green-500" />
                                ) : doc.verificationStatus === 'EXTERNAL_VERIFIED' ? (
                                    <CheckCircle2 className="w-6 h-6 text-blue-500" />
                                ) : (
                                    <FileText className="w-6 h-6 text-zinc-400" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-white truncate">{doc.title}</h3>
                                    {doc.status === 'AVAILABLE' && <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-green-500/10 text-green-500 border border-green-500/20">Disponible</span>}
                                    {doc.status === 'REGULATORY_PROCESS' && <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">En Trámite</span>}
                                    {doc.status === 'CONSTRUCTION_PENDING' && <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">Obra Pendiente</span>}
                                </div>
                                {doc.description && <p className="text-sm text-zinc-400 truncate mb-2">{doc.description}</p>}
                                <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                                    <span className="flex items-center gap-1"><FileKey className="w-3 h-3" /> {doc.documentType}</span>
                                    <span className="flex items-center gap-1">
                                        {doc.visibility === 'PUBLIC' && <Eye className="w-3 h-3" />}
                                        {doc.visibility === 'INVESTOR_ONLY' && <Users className="w-3 h-3" />}
                                        {doc.visibility === 'PARTNER_ONLY' && <Lock className="w-3 h-3" />}
                                        {doc.visibility === 'ADMIN_ONLY' && <EyeOff className="w-3 h-3" />}
                                        {doc.visibility}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-4 md:mt-0">
                                {doc.url ? (
                                    <Button variant="outline" size="sm" className="border-zinc-700 bg-transparent text-white" asChild>
                                        <a href={doc.url} target="_blank" rel="noreferrer">Ver</a>
                                    </Button>
                                ) : (
                                    <Button variant="outline" size="sm" className="border-zinc-700 bg-transparent text-white" disabled>
                                        Sin Enlace
                                    </Button>
                                )}
                                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-950/30" onClick={() => handleDelete(doc.id)}>
                                    Eliminar
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
