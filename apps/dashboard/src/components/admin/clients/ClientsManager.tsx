"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, CreditCard, Link as LinkIcon, Copy, History, FileText, CheckCircle, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { getClients, createClient, createPaymentLink, getClientLinks, updatePaymentStatus, manualSendReceipt } from "@/actions/clients";

// Types
import type { clients, paymentLinks } from "@/db/schema";

type Client = typeof clients.$inferSelect;
type PaymentLink = typeof paymentLinks.$inferSelect;

export function ClientsManager() {
    const [clientsList, setClientsList] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewClient, setShowNewClient] = useState(false);
    const [showPaymentBridge, setShowPaymentBridge] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    // Filter state
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadClients();
    }, []);

    async function loadClients() {
        setLoading(true);
        const res = await getClients();
        if (res.success && res.data) {
            setClientsList(res.data);
        }
        setLoading(false);
    }

    const filteredClients = clientsList.filter(c =>
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.walletAddress?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="relative w-full max-w-sm">
                    <Input
                        placeholder="Buscar por email, nombre o wallet..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-zinc-900 border-zinc-800"
                    />
                </div>
                <Button onClick={() => setShowNewClient(true)} className="bg-lime-500 text-black hover:bg-lime-400">
                    <Plus className="w-4 h-4 mr-2" /> Nuevo Cliente
                </Button>
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle>Base de Clientes</CardTitle>
                    <CardDescription>Gestión de leads y bridge de pagos.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-zinc-800 hover:bg-zinc-900">
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Fuente</TableHead>
                                    <TableHead>Paquete</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredClients.map(client => (
                                    <TableRow key={client.id} className="border-zinc-800 hover:bg-zinc-900/50">
                                        <TableCell>
                                            <div className="font-medium text-white">{client.name || "Sin Nombre"}</div>
                                            <div className="text-xs text-zinc-500">{client.email}</div>
                                        </TableCell>
                                        <TableCell><Badge variant="outline" className="text-xs bg-zinc-950">{client.source}</Badge></TableCell>
                                        <TableCell className="text-zinc-300 text-sm capital">{client.package || "-"}</TableCell>
                                        <TableCell>
                                            <StatusBadge status={client.status} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => { setSelectedClient(client); setShowHistory(true); }}
                                                >
                                                    <History className="w-4 h-4 text-zinc-400" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="h-8"
                                                    onClick={() => { setSelectedClient(client); setShowPaymentBridge(true); }}
                                                >
                                                    <CreditCard className="w-3 h-3 mr-2" /> Cobrar
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* MODALS */}
            <CreateClientModal open={showNewClient} onOpenChange={setShowNewClient} onSuccess={loadClients} />
            {selectedClient && (
                <>
                    <PaymentBridgeModal
                        open={showPaymentBridge}
                        onOpenChange={setShowPaymentBridge}
                        client={selectedClient}
                        onSuccess={() => { setShowPaymentBridge(false); setSelectedClient(null); }}
                    />
                    <ClientHistoryModal
                        open={showHistory}
                        onOpenChange={setShowHistory}
                        client={selectedClient}
                    />
                </>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        'lead': 'text-zinc-400 border-zinc-700',
        'negotiating': 'text-blue-400 border-blue-900 bg-blue-950/20',
        'closed_won': 'text-lime-400 border-lime-900 bg-lime-950/20',
        'closed_lost': 'text-red-400 border-red-900 bg-red-950/20',
        'churned': 'text-orange-400 border-orange-900'
    };
    return (
        <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase ${colors[status] || 'text-zinc-500'}`}>
            {status.replace('_', ' ')}
        </span>
    );
}

// --- SUBCOMPONENTS (Clean separation) ---

function CreateClientModal({ open, onOpenChange, onSuccess }: { open: boolean, onOpenChange: (v: boolean) => void, onSuccess: () => void }) {
    const [form, setForm] = useState({ name: '', email: '', phone: '', source: 'manual' });
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        const res = await createClient(form);
        if (res.success) {
            toast.success("Cliente creado");
            onSuccess();
            onOpenChange(false);
            setForm({ name: '', email: '', phone: '', source: 'manual' });
        } else {
            toast.error("Error al crear cliente");
        }
        setLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle>Registrar Nuevo Cliente</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="grid gap-2">
                        <Label>Nombre</Label>
                        <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-zinc-900" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Email</Label>
                        <Input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="bg-zinc-900" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Phone (Optional)</Label>
                        <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="bg-zinc-900" />
                    </div>
                    <Button disabled={loading} type="submit" className="w-full bg-white text-black hover:bg-zinc-200">
                        {loading ? <Loader2 className="animate-spin" /> : "Guardar"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function PaymentBridgeModal({ open, onOpenChange, client, onSuccess }: { open: boolean, onOpenChange: (v: boolean) => void, client: Client, onSuccess: () => void }) {
    const [form, setForm] = useState({ title: 'Servicios de Protocolo', amount: '5000', description: '' });
    const [loading, setLoading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);

    async function handleGenerate(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        // Create Link
        const res = await createPaymentLink({
            clientId: client.id,
            title: form.title,
            amount: form.amount,
            description: form.description,
            methods: ["stripe", "crypto", "wire"],
            isActive: true
        });

        if (res.success && res.data) {
            const url = `${window.location.origin}/pay/${res.data.id}`;
            setGeneratedLink(url);
            toast.success("Link generado con éxito");
        } else {
            toast.error("Error al generar link");
        }
        setLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Payment Bridge</DialogTitle>
                    <CardDescription>Generar enlace de pago privado para {client.name}</CardDescription>
                </DialogHeader>

                {!generatedLink ? (
                    <form onSubmit={handleGenerate} className="space-y-4 pt-4">
                        <div className="grid gap-2">
                            <Label>Concepto</Label>
                            <Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="bg-zinc-900" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Monto (USD)</Label>
                            <Input required type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="bg-zinc-900" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Descripción / Notas</Label>
                            <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-zinc-900" />
                        </div>

                        <div className="pt-2">
                            <div className="text-xs text-zinc-500 mb-2">Métodos Habilitados (Default): Crypto, Stripe, Wire</div>
                            <Button disabled={loading} type="submit" className="w-full bg-lime-500 text-black hover:bg-lime-400 font-bold">
                                {loading ? <Loader2 className="animate-spin" /> : "Generar Smart Link"}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-6 pt-4">
                        <div className="p-4 bg-zinc-900 rounded-lg border border-lime-500/30 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                                <LinkIcon className="text-lime-500 w-8 h-8" />
                                <h3 className="font-bold text-lg text-white">Link Listo</h3>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <Input value={generatedLink} readOnly className="font-mono text-xs bg-black" />
                                <Button size="icon" variant="secondary" onClick={() => { navigator.clipboard.writeText(generatedLink); toast.success("Copiado"); }}>
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="w-full" onClick={() => window.open(generatedLink, '_blank')}>Abrir</Button>
                            <Button className="w-full bg-white text-black" onClick={onSuccess}>Cerrar</Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function ClientHistoryModal({ open, onOpenChange, client }: { open: boolean, onOpenChange: (v: boolean) => void, client: Client }) {
    const [links, setLinks] = useState<PaymentLink[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (open && client) {
            loadLinks();
        }
    }, [open, client]);

    async function loadLinks() {
        setLoading(true);
        const res = await getClientLinks(client.id);
        if (res.success && res.data) {
            setLinks(res.data);
        }
        setLoading(false);
    }

    async function handleMarkPaid(linkId: string) {
        if (!confirm("¿Confirmar que este pago fue recibido? Se enviará un recibo automáticamente.")) return;
        const res = await updatePaymentStatus(linkId, 'paid');
        if (res.success) {
            toast.success("Pago registrado y recibo enviado.");
            loadLinks();
        } else {
            toast.error("Error al actualizar pago.");
        }
    }

    async function handleSendReceipt(linkId: string) {
        if (!confirm("¿Reenviar recibo por correo?")) return;
        const res = await manualSendReceipt(linkId);
        if (res.success) {
            toast.success("Recibo reenviado.");
        } else {
            toast.error("Error al enviar recibo.");
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Historial: {client?.name}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    {loading ? <Loader2 className="animate-spin mx-auto" /> : (
                        <div className="space-y-4">
                            {links.length === 0 ? <div className="text-zinc-500 text-center">Sin actividad reciente.</div> : (
                                <div className="space-y-2">
                                    {links.map(link => (
                                        <div key={link.id} className="bg-zinc-900 p-3 rounded border border-zinc-800 flex justify-between items-center bg-green-500">
                                            <div className="text-sm">
                                                <div className="font-bold text-white">{link.title}</div>
                                                <div className="text-zinc-500 text-xs">${link.amount} USD &bull; {new Date(link.createdAt).toLocaleDateString()}</div>
                                                <div className="mt-1 flex gap-2">
                                                    <span className="text-[10px] bg-zinc-800 px-1 rounded text-zinc-400 font-mono">{link.id.substring(0, 8)}...</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button size="icon" variant="ghost" title="Descargar Factura (Próximamente)">
                                                    <FileText className="w-4 h-4 text-zinc-600" />
                                                </Button>

                                                {/* Logic for 'Paid' detection is weak here without transactions join, assuming manual mark for MVP */}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleSendReceipt(link.id)}
                                                    className="h-8 text-xs"
                                                >
                                                    Reenviar Recibo
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    className="bg-lime-900/30 text-lime-400 hover:bg-lime-900/50 h-8 text-xs border border-lime-500/30"
                                                    onClick={() => handleMarkPaid(link.id)}
                                                >
                                                    <CheckCircle className="w-3 h-3 mr-1" /> Marcar Pagado
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
