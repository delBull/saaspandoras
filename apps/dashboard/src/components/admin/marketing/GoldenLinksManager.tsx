"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Link2, Copy, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "@saasfly/ui/use-toast";
import { getGoldenLinks, createGoldenLink, deleteGoldenLink } from "@/actions/marketing";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function GoldenLinksManager() {
    const [links, setLinks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [open, setOpen] = useState(false);

    // Form state
    const [campaignId, setCampaignId] = useState("");
    const [slug, setSlug] = useState("");
    const [referrerId, setReferrerId] = useState("");

    const fetchLinks = async () => {
        setLoading(true);
        try {
            const res = await getGoldenLinks();
            if (res.success) {
                setLinks(res.links || []);
            }
        } catch (e) {
            toast({ title: "Error", description: "No se pudieron cargar los Golden Links.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLinks();
    }, []);

    const handleCreate = async () => {
        if (!campaignId || !slug) {
            toast({ title: "Error", description: "Campaña y Slug son requeridos.", variant: "destructive" });
            return;
        }

        setIsCreating(true);
        const res = await createGoldenLink({
            campaignId: parseInt(campaignId),
            slug,
            referrerId: referrerId || undefined
        });
        
        setIsCreating(false);

        if (res.success) {
            toast({ title: "Éxito", description: "Enlace generado correctamente." });
            setOpen(false);
            setCampaignId("");
            setSlug("");
            setReferrerId("");
            fetchLinks();
        } else {
            toast({ title: "Error", description: res.error || "Hubo un problema.", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este enlace dorado?")) return;
        
        const res = await deleteGoldenLink(id);
        if (res.success) {
            toast({ title: "Eliminado", description: "Enlace eliminado." });
            fetchLinks();
        } else {
            toast({ title: "Error", description: "Error al eliminar.", variant: "destructive" });
        }
    };

    const copyToClipboard = (slug: string) => {
        navigator.clipboard.writeText(`https://pandoras.finance/m/${slug}`);
        toast({ title: "Copiado", description: "Enlace copiado al portapapeles." });
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-purple-500" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                <div>
                    <h3 className="font-semibold text-white text-lg">Golden Links (Captura Autónoma)</h3>
                    <p className="text-sm text-zinc-400">Genera enlaces personalizados para captura de leads con Hermes.</p>
                </div>
                
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Nuevo Enlace
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                        <DialogHeader>
                            <DialogTitle>Generar Golden Link</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm text-zinc-400">ID Campaña Destino</label>
                                <Input 
                                    type="number" 
                                    placeholder="Ej. 1" 
                                    value={campaignId} 
                                    onChange={e => setCampaignId(e.target.value)} 
                                    className="bg-zinc-800 border-zinc-700" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-zinc-400">Slug del Enlace (Único)</label>
                                <Input 
                                    placeholder="ej. promo-2026" 
                                    value={slug} 
                                    onChange={e => setSlug(e.target.value)} 
                                    className="bg-zinc-800 border-zinc-700" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-zinc-400">ID del Referidor (Opcional)</label>
                                <Input 
                                    placeholder="Tu identificador o Wallet" 
                                    value={referrerId} 
                                    onChange={e => setReferrerId(e.target.value)} 
                                    className="bg-zinc-800 border-zinc-700" 
                                />
                            </div>
                            <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={handleCreate} disabled={isCreating}>
                                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generar Enlace"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-800/50 text-zinc-400 uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3">Enlace (Slug)</th>
                            <th className="px-4 py-3">Campaña</th>
                            <th className="px-4 py-3">Referidor</th>
                            <th className="px-4 py-3">Canal</th>
                            <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {links.map((link) => (
                            <tr key={link.id} className="hover:bg-zinc-800/30 transition-colors">
                                <td className="px-4 py-3 font-medium text-purple-400 flex items-center gap-2">
                                    <Link2 className="w-4 h-4" />
                                    /m/{link.slug}
                                </td>
                                <td className="px-4 py-3 text-white">{link.campaignTitle || `#${link.campaignId}`}</td>
                                <td className="px-4 py-3 text-zinc-400">{link.referrerId || 'Orgánico'}</td>
                                <td className="px-4 py-3">
                                    <Badge variant="outline" className="bg-zinc-800 text-zinc-300 border-zinc-700 uppercase text-[10px]">
                                        {link.channel}
                                    </Badge>
                                </td>
                                <td className="px-4 py-3 flex justify-end gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={() => copyToClipboard(link.slug)}>
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={() => handleDelete(link.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {links.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                                    No has generado ningún Golden Link.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
