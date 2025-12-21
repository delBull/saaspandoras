"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { createPaymentLink } from "@/actions/payments";

export function CreatePaymentLinkModal() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [createdLink, setCreatedLink] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setCreatedLink(null);

        const formData = new FormData(e.currentTarget);
        const title = formData.get("title") as string;
        const amount = parseFloat(formData.get("amount") as string);
        const currency = formData.get("currency") as string;
        // description optional

        try {
            const res = await createPaymentLink({ title, amount, currency });
            if (res.success && res.link) {
                toast.success("Link de pago generado");
                // Construct the public URL (mocking localhost/prod logic)
                const baseUrl = window.location.origin;
                setCreatedLink(`${baseUrl}/pay/${res.link.id}`);
            } else {
                toast.error("Error al generar link");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (createdLink) {
            navigator.clipboard.writeText(createdLink);
            toast.success("Copiado al portapapeles");
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) setCreatedLink(null); // Reset on close
            setOpen(val);
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-400 hover:text-white gap-2">
                    <CreditCard className="w-4 h-4" />
                    Links de Pago
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-700 text-white">
                <DialogHeader>
                    <DialogTitle>Generar Link de Pago</DialogTitle>
                    <DialogDescription>
                        Crea un enlace único para aceptar pagos en Cripto o Fiat.
                    </DialogDescription>
                </DialogHeader>

                {!createdLink ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Concepto</Label>
                            <Input id="title" name="title" required placeholder="Ej: Consultoría Inicial" className="bg-zinc-800 border-zinc-700" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Monto</Label>
                                <Input id="amount" name="amount" type="number" step="0.01" required placeholder="0.00" className="bg-zinc-800 border-zinc-700" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currency">Moneda</Label>
                                <Select name="currency" defaultValue="USD">
                                    <SelectTrigger id="currency" className="bg-zinc-800 border-zinc-700">
                                        <SelectValue placeholder="USD" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                        <SelectItem value="USD">USD ($)</SelectItem>
                                        <SelectItem value="ETH">ETH (Ξ)</SelectItem>
                                        <SelectItem value="SOL">SOL (◎)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white">
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                                Generar Link
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                            <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
                            <h3 className="font-bold text-green-500">¡Link Generado!</h3>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="created-link">URL Pública</Label>
                            <div className="flex gap-2">
                                <Input id="created-link" readOnly value={createdLink} className="bg-zinc-950 font-mono text-xs" />
                                <Button size="icon" variant="secondary" onClick={copyToClipboard}>
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setOpen(false)}>Cerrar</Button>
                            <Button onClick={() => setCreatedLink(null)}>Crear Otro</Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
