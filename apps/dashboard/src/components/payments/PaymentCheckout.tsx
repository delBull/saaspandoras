"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle, CreditCard, Wallet, Landmark } from "lucide-react";
import { PayEmbed } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { base, mainnet, polygon, optimism, arbitrum } from "thirdweb/chains";

// Initialize Thirdweb
const client = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
});

export function PaymentCheckout({ link, client: clientData }: { link: any, client: any }) {
    const [method, setMethod] = useState("crypto");
    const [loading, setLoading] = useState(false);
    const [wireSent, setWireSent] = useState(false);

    // Filter enabled methods (assuming config is correct)
    const enabledMethods = (link.methods as string[]) || ["crypto"];

    const handleWireConfirm = async () => {
        setLoading(true);
        try {
            await fetch('/api/payments/verify-wire', {
                method: 'POST',
                body: JSON.stringify({
                    linkId: link.id,
                    clientId: clientData?.id,
                    amount: link.amount,
                    method: 'wire_manual'
                })
            });
            toast.success("Notificación enviada. Un administrador confirmará tu pago.");
            setWireSent(true);
        } catch (e) {
            toast.error("Error enviando notificación. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    if (wireSent) {
        return (
            <Card className="w-full max-w-lg bg-zinc-900 border-lime-500/50">
                <CardContent className="pt-6 text-center space-y-4">
                    <CheckCircle className="w-16 h-16 text-lime-500 mx-auto" />
                    <h2 className="text-2xl font-bold text-white">¡Gracias!</h2>
                    <p className="text-zinc-400">Hemos recibido tu notificación de transferencia. <br />Confirmaremos la recepción en breve.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-4xl bg-zinc-900 border-zinc-800 shadow-2xl overflow-hidden grid md:grid-cols-2">
            {/* Left: Summary */}
            <div className="p-8 bg-zinc-950 flex flex-col justify-between border-r border-zinc-800">
                <div>
                    <div className="mb-8">
                        {/* Logo Placeholder */}
                        <div className="w-10 h-10 bg-white rounded-full mb-4"></div>
                        <h1 className="text-xl font-bold text-zinc-500 uppercase tracking-widest">Pandora's Finance</h1>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <div className="text-sm text-zinc-500 mb-1">Concepto</div>
                            <h2 className="text-2xl font-bold text-white leading-tight">{link.title}</h2>
                            {link.description && <p className="text-zinc-400 text-sm mt-2">{link.description}</p>}

                            <div className="mt-4 p-3 bg-red-950/30 border border-red-900/50 rounded-md">
                                <p className="text-xs text-red-200/80 font-medium">
                                    ⚠️ Disclaimer: Este pago corresponde a una fase de análisis y definición técnica. No implica garantía de despliegue ni retornos futuros.
                                </p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-zinc-900">
                            <div className="flex justify-between items-end">
                                <span className="text-zinc-500">Total a Pagar</span>
                                <span className="text-4xl font-bold text-lime-400">${Number(link.amount).toLocaleString()} <span className="text-lg text-zinc-500">USD</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-xs text-zinc-600">
                    Cliente: {clientData?.name} ({clientData?.email}) <br />
                    ID Referencia: {link.id}
                </div>
            </div>

            {/* Right: Payment Methods */}
            <div className="p-8 bg-black">
                <Tabs value={method} onValueChange={setMethod} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-zinc-900 mb-6">
                        {enabledMethods.includes('crypto') && (
                            <TabsTrigger value="crypto" className="data-[state=active]:bg-zinc-800">
                                <Wallet className="w-4 h-4 mr-2" /> Crypto
                            </TabsTrigger>
                        )}
                        {enabledMethods.includes('stripe') && (
                            <TabsTrigger value="stripe" className="data-[state=active]:bg-zinc-800">
                                <CreditCard className="w-4 h-4 mr-2" /> Card
                            </TabsTrigger>
                        )}
                        {enabledMethods.includes('wire') && (
                            <TabsTrigger value="wire" className="data-[state=active]:bg-zinc-800">
                                <Landmark className="w-4 h-4 mr-2" /> Wire
                            </TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="crypto" className="space-y-4">
                        <div className="text-center mb-4">
                            <h3 className="text-white font-medium">Pago Seguro Web3</h3>
                            <p className="text-xs text-zinc-500">USDC, ETH, MATIC en redes principales</p>
                        </div>
                        <div className="flex justify-center theme-dark">
                            <PayEmbed
                                client={client}
                                payOptions={{
                                    prefillBuy: {
                                        chain: base,
                                        amount: link.amount,
                                    }
                                }}
                                theme={"dark"}
                            />
                            {/* <Button onClick={manualVerify}>Ya pagué</Button> - Future improvement */}
                        </div>
                    </TabsContent>

                    <TabsContent value="wire" className="space-y-6">
                        <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 space-y-4">
                            <h3 className="text-white font-bold flex items-center"><Landmark className="w-4 h-4 mr-2 text-lime-500" /> Datos Bancarios (México)</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between border-b border-zinc-800 pb-2">
                                    <span className="text-zinc-500">Banco</span>
                                    <span className="text-white font-mono">Banregio</span>
                                </div>
                                <div className="flex justify-between border-b border-zinc-800 pb-2">
                                    <span className="text-zinc-500">CLABE</span>
                                    <span className="text-white font-mono select-all">058375000152087056</span>
                                </div>
                                <div className="flex justify-between border-b border-zinc-800 pb-2">
                                    <span className="text-zinc-500">Beneficiario</span>
                                    <span className="text-white">Pandoras Finance</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Referencia</span>
                                    <span className="text-lime-500 font-mono select-all">{link.id.substring(0, 8)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-white">Subir Comprobante (Opcional)</Label>
                            <Input type="file" className="bg-zinc-900 border-zinc-800" />
                            <Button
                                onClick={handleWireConfirm}
                                disabled={loading}
                                className="w-full bg-lime-500 text-black hover:bg-lime-400 font-bold"
                            >
                                {loading ? <Loader2 className="animate-spin mr-2" /> : "Ya realicé la transferencia"}
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="stripe" className="text-center py-12 space-y-6">
                        <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                            <CreditCard className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                            <h3 className="text-white font-bold text-lg mb-2">Pago con Tarjeta</h3>
                            <p className="text-zinc-400 text-sm mb-6">
                                Procesado de forma segura vía Stripe. Aceptamos Visa, Mastercard y Amex.
                            </p>
                            <Button
                                onClick={async () => {
                                    setLoading(true);
                                    try {
                                        const res = await fetch('/api/stripe/create-checkout', {
                                            method: 'POST',
                                            body: JSON.stringify({
                                                linkId: link.id,
                                                clientId: clientData?.id,
                                                amount: link.amount,
                                                title: link.title,
                                                clientEmail: clientData?.email
                                            })
                                        });
                                        const data = await res.json();
                                        if (data.url) {
                                            window.location.href = data.url;
                                        } else {
                                            toast.error("Error iniciando pago");
                                            setLoading(false);
                                        }
                                    } catch (e) {
                                        toast.error("Error de conexión");
                                        setLoading(false);
                                    }
                                }}
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-6 text-lg"
                            >
                                {loading ? <Loader2 className="animate-spin mr-2" /> : "Pagar Ahora"}
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </Card>
    );
}
