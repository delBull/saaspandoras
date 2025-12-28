
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Calendar } from "lucide-react";

interface GovernanceProposalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (proposal: { title: string; description: string; endDate: string }) => void;
}

export function GovernanceProposalModal({ isOpen, onClose, onSubmit }: GovernanceProposalModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [endDate, setEndDate] = useState("");

    const handleSubmit = () => {
        if (!title || !description || !endDate) return;
        onSubmit({ title, description, endDate });
        setTitle("");
        setDescription("");
        setEndDate("");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-[500px]">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle className="text-xl font-bold">Crear Nueva Propuesta</DialogTitle>

                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Título de la Propuesta</Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej: Aumentar Rewards de Staking"
                            className="bg-zinc-900 border-zinc-700 focus:ring-lime-500/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Descripción</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Detalla el objetivo y los cambios propuestos..."
                            className="bg-zinc-900 border-zinc-700 min-h-[120px] focus:ring-lime-500/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Fecha de Finalización</Label>
                        <div className="relative">
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-zinc-900 border-zinc-700 pl-10 focus:ring-lime-500/50"
                            />
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} className="border-zinc-700 hover:bg-zinc-900">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!title || !description || !endDate}
                        className="bg-lime-500 text-black hover:bg-lime-400 font-bold"
                    >
                        Publicar Propuesta
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
