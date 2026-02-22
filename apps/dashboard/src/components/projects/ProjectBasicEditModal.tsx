'use client';

import React, { useState, useEffect } from 'react';
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
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface ProjectBasicEditModalProps {
    project: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function ProjectBasicEditModal({ project, open, onOpenChange, onSuccess }: ProjectBasicEditModalProps) {
    const [formData, setFormData] = useState({
        title: '',
        tagline: '',
        description: '',
        logoUrl: '',
        coverPhotoUrl: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resolveIpfs = (url: string) => {
        if (!url) return "";
        if (url.startsWith('ipfs://')) {
            return url.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
        }
        return url;
    };

    useEffect(() => {
        if (project) {
            setFormData({
                title: project.title || '',
                tagline: project.tagline || '',
                description: project.description || '',
                logoUrl: project.logoUrl || '',
                coverPhotoUrl: project.coverPhotoUrl || '',
            });
        }
    }, [project]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // We use the admin endpoint but modified to allow owners
            const response = await fetch(`/api/admin/projects/${project.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    isBasicEdit: true // Flag to tell API this is a partial owner edit
                }),
            });

            if (response.ok) {
                toast.success("Proyecto actualizado correctamente");
                onSuccess();
                onOpenChange(false);
            } else {
                const data = await response.json();
                toast.error(data.message || "Error al actualizar el proyecto");
            }
        } catch (error) {
            console.error("Error updating project:", error);
            toast.error("Error de conexión");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!project) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-zinc-950 border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle>Editar Protocolo</DialogTitle>
                    <DialogDescription>
                        Modifica la información básica de tu protocolo. Los cambios son instantáneos.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Nombre del Protocolo</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="bg-zinc-900 border-zinc-800 focus:border-lime-500"
                            placeholder="Ej: Pandora's Ecosystem"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tagline">Slogan (Resumen corto)</Label>
                        <Input
                            id="tagline"
                            value={formData.tagline}
                            onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                            className="bg-zinc-900 border-zinc-800 focus:border-lime-500"
                            placeholder="Ej: The premier work-to-earn infrastructure"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción Detallada</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="bg-zinc-900 border-zinc-800 min-h-[120px] focus:border-lime-500"
                            placeholder="Describe los objetivos y utilidad de tu protocolo..."
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Logo Upload */}
                        <div className="space-y-2">
                            <Label>Logo del Proyecto</Label>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden">
                                    {formData.logoUrl ? (
                                        <img src={resolveIpfs(formData.logoUrl)} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <PhotoIcon className="w-8 h-8 text-zinc-700" />
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const toastId = toast.loading("Subiendo logo...");
                                            try {
                                                const formDataUpload = new FormData();
                                                formDataUpload.append('file', file);
                                                const res = await fetch('/api/v1/core/upload', {
                                                    method: 'POST',
                                                    body: formDataUpload
                                                });
                                                const data = await res.json();
                                                if (data.url) {
                                                    setFormData({ ...formData, logoUrl: data.url });
                                                    toast.success("Logo subido", { id: toastId });
                                                }
                                            } catch (err) {
                                                toast.error("Error al subir", { id: toastId });
                                            }
                                        }}
                                        className="bg-zinc-900 border-zinc-800 text-xs text-zinc-400 file:bg-zinc-800 file:text-white file:border-0 file:rounded-md file:mr-4 file:px-2 file:py-1 cursor-pointer"
                                    />
                                    <p className="text-[10px] text-zinc-500">O ingresa URL manual abajo</p>
                                </div>
                            </div>
                            <Input
                                id="logoUrl"
                                value={formData.logoUrl}
                                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                                className="bg-zinc-900 border-zinc-800 focus:border-lime-500 text-xs"
                                placeholder="https://..."
                            />
                        </div>

                        {/* Cover Upload */}
                        <div className="space-y-2">
                            <Label>Imagen de Portada</Label>
                            <div className="flex flex-col gap-2">
                                <div className="h-16 w-full rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden">
                                    {formData.coverPhotoUrl ? (
                                        <img src={resolveIpfs(formData.coverPhotoUrl)} alt="Cover" className="w-full h-full object-cover" />
                                    ) : (
                                        <PhotoIcon className="w-8 h-8 text-zinc-700" />
                                    )}
                                </div>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const toastId = toast.loading("Subiendo portada...");
                                        try {
                                            const formDataUpload = new FormData();
                                            formDataUpload.append('file', file);
                                            const res = await fetch('/api/v1/core/upload', {
                                                method: 'POST',
                                                body: formDataUpload
                                            });
                                            const data = await res.json();
                                            if (data.url) {
                                                setFormData({ ...formData, coverPhotoUrl: data.url });
                                                toast.success("Portada subida", { id: toastId });
                                            }
                                        } catch (err) {
                                            toast.error("Error al subir", { id: toastId });
                                        }
                                    }}
                                    className="bg-zinc-900 border-zinc-800 text-xs text-zinc-400 file:bg-zinc-800 file:text-white file:border-0 file:rounded-md file:mr-4 file:px-2 file:py-1 cursor-pointer"
                                />
                                <Input
                                    id="coverUrl"
                                    value={formData.coverPhotoUrl}
                                    onChange={(e) => setFormData({ ...formData, coverPhotoUrl: e.target.value })}
                                    className="bg-zinc-900 border-zinc-800 focus:border-lime-500 text-xs"
                                    placeholder="URL de portada"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-4 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-lime-500 hover:bg-lime-600 text-black font-bold"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
