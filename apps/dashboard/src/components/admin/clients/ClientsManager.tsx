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
import { getClients, createClient, createPaymentLink, getClientLinks, updatePaymentStatus, manualSendReceipt, sendProtocolSOW, advanceProtocolState } from "@/actions/clients";
import { ProtocolMetadata } from "@/types/protocol-state";
import type { clients, paymentLinks } from "@/db/schema";
import { SOWTemplateManager } from "../sow/SOWTemplateManager";
import { getSOWTemplates } from "@/actions/sow";
import { sendMSALink } from "@/actions/clients";
import { Check, Mail, Info } from "lucide-react";


// ... existing imports ...

// ... (existing helper functions) ...

function ProtocolStageBadge({ metadata }: { metadata: any }) {
    const meta = (metadata as { protocol?: ProtocolMetadata }) || {};
    const state = meta.protocol?.state || 'LEAD';

    const colors: Record<string, string> = {
        'LEAD': 'text-zinc-500 border-zinc-700 bg-zinc-900',
        'ACTIVE_TIER_1': 'text-purple-400 border-purple-900 bg-purple-950/20',
        'IN_PROGRESS_TIER_1': 'text-yellow-400 border-yellow-900 bg-yellow-950/20',
        'APPROVED_TIER_1': 'text-purple-300 border-purple-500 bg-purple-500/10',
        'ACTIVE_TIER_2': 'text-blue-400 border-blue-900 bg-blue-950/20',
        'IN_PROGRESS_TIER_2': 'text-yellow-400 border-yellow-900 bg-yellow-950/20',
        'APPROVED_TIER_2': 'text-blue-300 border-blue-500 bg-blue-500/10',
        'ACTIVE_TIER_3': 'text-orange-400 border-orange-900 bg-orange-950/20',
        'IN_PROGRESS_TIER_3': 'text-yellow-400 border-yellow-900 bg-yellow-950/20',
        'DEPLOYED': 'text-lime-400 border-lime-500 bg-lime-500/10 font-bold',
    };

    return (
        <Badge variant="outline" className={`text-[10px] ${colors[state] || colors.LEAD}`}>
            {state.replace(/_/g, ' ')}
        </Badge>
    );
}

function ProtocolActions({ client, onSuccess, onSendSOW }: { client: Client, onSuccess: () => void, onSendSOW?: (tier: string) => void }) {
    const meta = (client.metadata as { protocol?: ProtocolMetadata }) || {};
    const state = meta.protocol?.state || 'LEAD';
    const [loading, setLoading] = useState(false);

    function handleOpenSend(tier: 'TIER_1' | 'TIER_2' | 'TIER_3') {
        if (onSendSOW) onSendSOW(tier);
    }


    async function handleAdvance(target: string) {
        if (!confirm(`Mark this phase as DELIVERED and approved?`)) return;
        setLoading(true);
        // We reuse advanceProtocolState but we need to import it or make sure it's available. 
        // It is not imported at top yet! I need to check imports.
        // Wait, ClientsManager imports everything from @/actions/clients.
        // But advanceProtocolState is not in the import list at line 14.
        // I will assume I need to update imports too?
        // Actually I'll use a specific server action just for this if needed, but likely I can add it to imports.
        // For now let's write the logic assuming I add the import.
        const res = await advanceProtocolState(client.id, target as any);
        if (res.success) {
            toast.success("State Updated!");
            onSuccess();
        } else {
            toast.error("Failed update");
        }
        setLoading(false);
    }

    async function handleSendMSA() {
        if (!confirm("Send MSA Link via Email?")) return;
        setLoading(true);
        const res = await sendMSALink(client.id);
        if (res.success) {
            toast.success("MSA Link Sent!");
            onSuccess();
        } else {
            toast.error("Failed to send MSA");
        }
        setLoading(false);
    }

    // 0. CHECK MSA STATUS
    // If not accepted/sent, we should prioritize showing that? 
    // Or just show a fast action.
    const msaStatus = meta.protocol?.msa_status;
    const isMSAApproved = msaStatus === 'accepted';

    // RENDER MSA BADGE/ACTION
    const MSAAction = () => {
        if (isMSAApproved) {
            return (
                <div title="MSA Signed" className="flex items-center justify-center w-7 h-7 bg-green-900/30 border border-green-500/30 rounded mr-2">
                    <Check className="w-4 h-4 text-green-500" />
                </div>
            );
        }
        if (msaStatus === 'sent') {
            return (
                <Button size="icon" variant="outline" className="h-7 w-7 mr-2 border-yellow-500/30 text-yellow-500" onClick={handleSendMSA} title="Resend MSA">
                    <Mail className="w-3 h-3" />
                </Button>
            );
        }
        return (
            <Button size="sm" variant="outline" className="h-7 text-xs mr-2 border-zinc-700 text-zinc-400 hover:text-white" onClick={handleSendMSA}>
                Send MSA
            </Button>
        );
    };

    // Helper wrapper to include MSA action
    const WithMSA = ({ children }: { children: React.ReactNode }) => (
        <div className="flex items-center">
            <MSAAction />
            {children}
        </div>
    );

    if (state === 'LEAD' || !state) {
        return (
            <WithMSA>
                <Button size="sm" variant="outline" className="h-7 text-xs border-purple-500/30 text-purple-400 hover:bg-purple-900/30" disabled={loading} onClick={() => handleOpenSend('TIER_1')}>
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Send Tier 1"}
                </Button>
            </WithMSA>
        );
    }

    if (state === 'ACTIVE_TIER_1') {
        return <span className="text-[10px] text-zinc-500 italic mr-2">Waiting Payment (T1)...</span>;
    }

    if (state === 'IN_PROGRESS_TIER_1') {
        return (
            <Button size="sm" variant="outline" className="h-7 text-xs border-yellow-500/30 text-yellow-400 hover:bg-yellow-900/30" disabled={loading} onClick={() => handleAdvance('APPROVED_TIER_1')}>
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Mark T1 Delivered"}
            </Button>
        );
    }

    if (state === 'APPROVED_TIER_1' || state === 'SKIPPED_TIER_1') {
        return (
            <Button size="sm" variant="outline" className="h-7 text-xs border-blue-500/30 text-blue-400 hover:bg-blue-900/30" disabled={loading} onClick={() => handleOpenSend('TIER_2')}>
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Send Tier 2"}
            </Button>
        );
    }

    if (state === 'ACTIVE_TIER_2') {
        return <span className="text-[10px] text-zinc-500 italic mr-2">Waiting Payment (T2)...</span>;
    }

    if (state === 'IN_PROGRESS_TIER_2') {
        return (
            <Button size="sm" variant="outline" className="h-7 text-xs border-yellow-500/30 text-yellow-400 hover:bg-yellow-900/30" disabled={loading} onClick={() => handleAdvance('APPROVED_TIER_2')}>
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Mark T2 Delivered"}
            </Button>
        );
    }

    if (state === 'APPROVED_TIER_2') {
        return (
            <Button size="sm" variant="outline" className="h-7 text-xs border-orange-500/30 text-orange-400 hover:bg-orange-900/30" disabled={loading} onClick={() => handleOpenSend('TIER_3')}>
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Deploy (Tier 3)"}
            </Button>
        );
    }

    if (state === 'ACTIVE_TIER_3') {
        return <span className="text-[10px] text-orange-500 italic mr-2">Waiting Payment (T3)...</span>;
    }

    if (state === 'IN_PROGRESS_TIER_3') {
        return (
            <Button size="sm" variant="outline" className="h-7 text-xs border-yellow-500/30 text-yellow-400 hover:bg-yellow-900/30" disabled={loading} onClick={() => handleAdvance('DEPLOYED')}>
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Mark Deployed"}
            </Button>
        );
    }

    return null;
}


type Client = typeof clients.$inferSelect;
type PaymentLink = typeof paymentLinks.$inferSelect;

export function ClientsManager() {
    const [clientsList, setClientsList] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewClient, setShowNewClient] = useState(false);
    const [showPaymentBridge, setShowPaymentBridge] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [showSendSOW, setShowSendSOW] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedTier, setSelectedTier] = useState<string>('TIER_1');

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
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setShowInfo(true)} className="text-zinc-500 hover:text-white">
                        <Info className="w-5 h-5" />
                    </Button>
                    <Button variant="outline" onClick={() => window.open('/litepaper', '_blank')} className="border-zinc-700 text-zinc-400 hover:bg-zinc-800">
                        <FileText className="w-4 h-4 mr-2" /> Ver Litepaper
                    </Button>
                    <Button variant="outline" onClick={() => setShowTemplates(true)} className="border-zinc-700 text-zinc-400 hover:bg-zinc-800">
                        <FileText className="w-4 h-4 mr-2" /> Templates
                    </Button>
                    <Button onClick={() => setShowNewClient(true)} className="bg-lime-500 text-black hover:bg-lime-400">
                        <Plus className="w-4 h-4 mr-2" /> Nuevo Cliente
                    </Button>
                </div>
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
                                    <TableHead>Activity</TableHead>
                                    <TableHead>Stage</TableHead>
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
                                        <TableCell className="text-zinc-400 text-xs text-xs">
                                            {(client.metadata as any)?.protocol?.sow_history?.length > 0 ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-zinc-300">{(client.metadata as any).protocol.sow_history.slice(-1)[0].tier}</span>
                                                    <span className="text-[10px] opacity-50">{new Date((client.metadata as any).protocol.sow_history.slice(-1)[0].sent_at).toLocaleDateString()}</span>
                                                </div>
                                            ) : <span className="text-zinc-600">-</span>}
                                        </TableCell>
                                        <TableCell>
                                            <ProtocolStageBadge metadata={client.metadata} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2 items-center">
                                                <ProtocolActions
                                                    client={client}
                                                    onSuccess={loadClients}
                                                    onSendSOW={(tier) => { setSelectedClient(client); setSelectedTier(tier); setShowSendSOW(true); }}
                                                />

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
            <SOWTemplateManager open={showTemplates} onOpenChange={setShowTemplates} />

            {showSendSOW && selectedClient && (
                <SendSOWModal
                    open={showSendSOW}
                    onOpenChange={setShowSendSOW}
                    client={selectedClient}
                    tier={selectedTier}
                    onSuccess={() => { setShowSendSOW(false); loadClients(); }}
                />
            )}

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
            <InfoModal open={showInfo} onOpenChange={setShowInfo} />
        </div>
    );
}

function SendSOWModal({ open, onOpenChange, client, tier, onSuccess }: { open: boolean, onOpenChange: (v: boolean) => void, client: Client, tier: string, onSuccess: () => void }) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState('default');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, [tier]);

    async function loadTemplates() {
        // Load templates for this tier
        const res = await getSOWTemplates(tier);
        if (res.success && res.data) {
            setTemplates(res.data.filter((t: any) => t.isActive));
        }
    }

    async function handleSend() {
        setLoading(true);
        // @ts-expect-error - dynamic args
        const res = await sendProtocolSOW(client.id, tier, selectedTemplate, amount);
        if (res.success) {
            toast.success("SOW Sent!");
            onSuccess();
            onOpenChange(false);
        } else {
            toast.error("Failed to send");
        }
        setLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle>Send {tier}</DialogTitle>
                    <CardDescription>Select template and confirm details for {client.name}.</CardDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>SOW Template</Label>
                        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                            <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                <SelectValue placeholder="Select Template" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">Default System Template</SelectItem>
                                {templates.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Override Amount (USD) (Optional)</Label>
                        <Input
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="Leave empty for default price"
                            className="bg-zinc-900"
                        />
                    </div>
                    <Button onClick={handleSend} disabled={loading} className="w-full bg-lime-500 text-black font-bold hover:bg-lime-400">
                        {loading ? <Loader2 className="animate-spin" /> : "Confirm & Send SOW"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
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

function InfoModal({ open, onOpenChange }: { open: boolean, onOpenChange: (v: boolean) => void }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Flujo de Operaciones: Clientes & Protocolos</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 pt-4 text-sm text-zinc-300">
                    <div className="space-y-2">
                        <h3 className="text-lime-400 font-bold flex items-center"><CheckCircle className="w-4 h-4 mr-2" /> 1. Lead & SOW Tier 1</h3>
                        <p>
                            Al crear un cliente (Lead), se habilita el envío del <strong>SOW Tier 1 (Viabilidad)</strong>.
                            Esto genera un link de pago único. Al pagarse, el cliente avanza a estado <em>ACTIVE_TIER_1</em>.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-blue-400 font-bold flex items-center"><CheckCircle className="w-4 h-4 mr-2" /> 2. Master Services Agreement (MSA)</h3>
                        <p>
                            Antes de avanzar a Tier 2, se recomienda enviar y firmar el MSA. Puedes enviarlo desde la columna de acciones (botón "Send MSA" o ícono de Sobre).
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-orange-400 font-bold flex items-center"><CheckCircle className="w-4 h-4 mr-2" /> 3. Tier 2 & 3 (Arquitectura & Deploy)</h3>
                        <p>
                            El flujo sigue secuencialmente. Una vez entregado el Tier 1, se habilita el Tier 2, y posteriormente el Tier 3.
                            Cada Tier tiene su propio SOW y Link de Pago.
                        </p>
                    </div>

                    <div className="bg-zinc-900 p-4 rounded border border-zinc-800 mt-4">
                        <h4 className="font-bold text-white mb-2">⚙️ Configuración & Precios</h4>
                        <p className="text-xs">
                            Al enviar cualquier Tier, puedes <strong>sobrescribir el precio</strong> default en el modal de confirmación.
                            Esto permite ajustar costos según la complejidad del proyecto específico del cliente.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
