"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings2, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { createCampaign } from "@/actions/marketing";

export function CreateCampaignModal() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const triggerType = formData.get("triggerType") as string;

        try {
            const res = await createCampaign({ name, triggerType });
            if (res.success && res.campaign) {
                toast.success("Campaña creada exitosamente");
                setOpen(false);
                router.push(`/admin/marketing/${res.campaign.id}`);
            } else {
                toast.error("Error al crear la campaña");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-400 hover:text-white gap-2">
                    <Settings2 className="w-4 h-4" />
                    Crear Campaña
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-700 text-white">
                <DialogHeader>
                    <DialogTitle>Nueva Campaña</DialogTitle>
                    <DialogDescription>
                        Configura los datos básicos para iniciar una nueva campaña de marketing.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre de la Campaña</Label>
                        <Input id="name" name="name" required placeholder="Ej: Onboarding Q1" className="bg-zinc-800 border-zinc-700" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="triggerType">Disparador (Trigger)</Label>
                        <Select name="triggerType" defaultValue="manual">
                            <SelectTrigger id="triggerType" className="bg-zinc-800 border-zinc-700">
                                <SelectValue placeholder="Selecciona un trigger" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                <SelectItem value="manual">Manual (Desde Panel)</SelectItem>
                                <SelectItem value="auto_registration">Registro de Usuario</SelectItem>
                                <SelectItem value="api_event">Evento API</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            Crear Campaña
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
