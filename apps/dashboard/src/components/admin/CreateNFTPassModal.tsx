'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@saasfly/ui/use-toast";
import { Loader2, ArrowRight, Check, Image as ImageIcon, Wallet, Shield } from "lucide-react";
import { useActiveAccount } from "thirdweb/react";

interface CreateNFTPassModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateNFTPassModal({ isOpen, onClose }: CreateNFTPassModalProps) {
    const { toast } = useToast();
    const account = useActiveAccount();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [deployedAddress, setDeployedAddress] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        symbol: "",
        description: "",
        maxSupply: "1000",
        price: "0",
        image: "",
        treasury: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleNext = () => {
        if (step === 1 && (!formData.name || !formData.symbol)) {
            toast({ title: "Faltan datos", description: "Nombre y Símbolo son obligatorios", variant: "destructive" });
            return;
        }
        setStep(step + 1);
    };

    const handleBack = () => setStep(step - 1);

    const handleDeploy = async () => {
        if (!account?.address) {
            toast({ title: "Error", description: "Conecta tu wallet primero", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                symbol: formData.symbol,
                maxSupply: formData.maxSupply,
                price: formData.price,
                owner: account.address,
                treasuryAddress: formData.treasury || account.address,
                image: formData.image
            };

            const res = await fetch("/api/admin/deploy/nft-pass", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Error en despliegue");

            setDeployedAddress(data.address);
            toast({
                title: "¡Pase Creado!",
                description: `Contrato desplegado en ${data.address}`,
            });
            setStep(4); // Success Step
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: String(e), variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setStep(1);
        setDeployedAddress(null);
        setFormData({ name: "", symbol: "", description: "", maxSupply: "1000", price: "0", image: "", treasury: "" });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl">Crear Nuevo NFT Pass</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Configura y despliega un nuevo contrato de acceso (SCaaS).
                    </DialogDescription>
                </DialogHeader>

                {step === 1 && (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nombre del Pase</Label>
                            <Input name="name" placeholder="Ej. VIP Access Card" value={formData.name} onChange={handleChange} className="bg-zinc-800 border-zinc-700" />
                        </div>
                        <div className="space-y-2">
                            <Label>Símbolo</Label>
                            <Input name="symbol" placeholder="Ej. VIP" value={formData.symbol} onChange={handleChange} className="bg-zinc-800 border-zinc-700" />
                        </div>
                        <div className="space-y-2">
                            <Label>Descripción (Sistema)</Label>
                            <Input name="description" placeholder="Propósito del pase..." value={formData.description} onChange={handleChange} className="bg-zinc-800 border-zinc-700" />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4 py-4">
                        <div className="flex items-center gap-2 mb-2 p-2 bg-blue-900/20 text-blue-300 rounded text-xs border border-blue-800/50">
                            <Shield className="w-4 h-4" />
                            Reglas de Acceso y Economía
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Max Supply (0 = Infinito)</Label>
                                <Input name="maxSupply" type="number" value={formData.maxSupply} onChange={handleChange} className="bg-zinc-800 border-zinc-700" />
                            </div>
                            <div className="space-y-2">
                                <Label>Precio (ETH)</Label>
                                <Input name="price" type="number" step="0.001" value={formData.price} onChange={handleChange} className="bg-zinc-800 border-zinc-700" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Wallet Tesorería (Opcional)</Label>
                            <Input name="treasury" placeholder="0x..." value={formData.treasury} onChange={handleChange} className="bg-zinc-800 border-zinc-700" />
                            <p className="text-xs text-zinc-500">Si se deja vacío, tú recibirás los pagos.</p>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4 py-4">
                        <div className="flex items-center gap-2 mb-2 p-2 bg-purple-900/20 text-purple-300 rounded text-xs border border-purple-800/50">
                            <ImageIcon className="w-4 h-4" />
                            Apariencia y Metadata
                        </div>
                        <div className="space-y-2">
                            <Label>Imagen URL</Label>
                            <Input name="image" placeholder="https://..." value={formData.image} onChange={handleChange} className="bg-zinc-800 border-zinc-700" />
                            <p className="text-xs text-zinc-500">URL pública de la imagen del pase.</p>
                        </div>
                        {formData.image && (
                            <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden border border-zinc-700 bg-black/50 flex items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={formData.image} alt="Preview" className="h-full object-contain" />
                            </div>
                        )}
                        <div className="border-t border-zinc-800 pt-4 mt-4">
                            <h4 className="text-sm font-semibold mb-2">Resumen</h4>
                            <div className="text-xs text-zinc-400 space-y-1">
                                <p><span className="text-zinc-500">Nombre:</span> {formData.name}</p>
                                <p><span className="text-zinc-500">Símbolo:</span> {formData.symbol}</p>
                                <p><span className="text-zinc-500">Supply:</span> {formData.maxSupply}</p>
                                <p><span className="text-zinc-500">Precio:</span> {formData.price} ETH</p>
                            </div>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                            <Check className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-white">¡Despliegue Exitoso!</h3>
                        <div className="bg-zinc-950 p-3 rounded border border-zinc-800 w-full break-all font-mono text-xs text-zinc-400">
                            {deployedAddress}
                        </div>
                        <p className="text-sm text-zinc-400">
                            El contrato ha sido desplegado y registrado en el sistema.
                        </p>
                    </div>
                )}

                <DialogFooter className="flex justify-between sm:justify-between w-full">
                    {step < 4 && (
                        <Button variant="ghost" onClick={step === 1 ? onClose : handleBack} disabled={loading}>
                            {step === 1 ? "Cancelar" : "Atrás"}
                        </Button>
                    )}

                    {step < 3 && (
                        <Button onClick={handleNext}>
                            Siguiente <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    )}

                    {step === 3 && (
                        <Button onClick={handleDeploy} disabled={loading} className="bg-lime-500 hover:bg-lime-600 text-black font-semibold">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wallet className="w-4 h-4 mr-2" />}
                            {loading ? "Desplegando..." : "Desplegar Contrato"}
                        </Button>
                    )}

                    {step === 4 && (
                        <Button onClick={reset} className="w-full">
                            Cerrar
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
