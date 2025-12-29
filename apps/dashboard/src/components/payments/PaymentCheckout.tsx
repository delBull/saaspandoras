"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle, CreditCard, Wallet, Landmark } from "lucide-react";
import { PayEmbed } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { base, sepolia } from "thirdweb/chains";
import { getContract } from "thirdweb";
import { transfer } from "thirdweb/extensions/erc20";
import { TransactionButton, useActiveAccount } from "thirdweb/react";

// Initialize Thirdweb
const client = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
});

// Token Addresses (Native USDC)
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_SEPOLIA = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

const IS_PROD = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';
const ACTIVE_CHAIN = IS_PROD ? base : sepolia;
const ACTIVE_TOKEN = IS_PROD ? USDC_BASE : USDC_SEPOLIA;
const MERCHANT_WALLET = "0xDEEb671dEda720a75B07E9874e4371c194e38919";

export function PaymentCheckout({ link, client: clientData }: { link: any, client: any }) {
    // Default to 'stripe' if available, then 'crypto'
    const enabledMethods = (link.methods as string[]) || ["stripe", "crypto", "wire"];
    const [method, setMethod] = useState(enabledMethods.includes("stripe") ? "stripe" : "crypto");
    const [loading, setLoading] = useState(false);
    const [wireSent, setWireSent] = useState(false);

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

    const handleCryptoSuccess = async (txInfo: any) => {
        // txInfo usually contains transactionHash 
        // We'll trust the callback but verifying on backend is best practice (which verify-crypto doesn't fully do yet without RPC check, but good for now)
        setLoading(true);
        try {
            await fetch('/api/payments/verify-crypto', {
                method: 'POST',
                body: JSON.stringify({
                    linkId: link.id,
                    clientId: clientData?.id,
                    amount: link.amount,
                    txHash: txInfo?.transactionHash || "unknown",
                    chainId: ACTIVE_CHAIN.id
                })
            });
            toast.success("Pago Crypto confirmado con éxito!");
            // Redirect or show success
            window.location.reload();
        } catch (e) {
            console.error("Crypto Verify Error", e);
            toast.error("Error registrando pago. Contacta soporte.");
        } finally {
            setLoading(false);
        }
    };

    // Prepare Contract
    const usdcContract = getContract({
        client,
        chain: ACTIVE_CHAIN,
        address: ACTIVE_TOKEN
    });

    if (wireSent) {
        return (
            <Card className="w-full max-w-lg bg-zinc-900 border-lime-500/50">
                <CardContent className="pt-6 text-center space-y-4">
                    <CheckCircle className="w-16 h-16 text-lime-500 mx-auto" />
                    <h2 className="text-2xl font-bold text-white">¡Gracias!</h2>
                    <p className="text-zinc-400">Hemos recibido tu notificación de transferencia. <br />Confirmaremos la recepción en breve.</p>
                    <div className="pt-4">
                        <Button onClick={() => window.location.href = '/'} variant="outline" className="border-lime-500 text-lime-500 hover:bg-lime-500 hover:text-black">
                            Continuar a la Plataforma
                        </Button>
                    </div>
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
                        {/* Valid Logo */}
                        <Image src="/apple-touch-icon.png" alt="Pandora's Finance" width={48} height={48} className="mb-4 rounded-lg bg-zinc-900 p-1" />
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
                    ID Referencia: {link.id.substring(0, 8)}...
                </div>
            </div>

            {/* Right: Payment Methods */}
            <div className="p-8 bg-black">
                <Tabs value={method} onValueChange={setMethod} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-zinc-900 mb-6">
                        {enabledMethods.includes('stripe') && (
                            <TabsTrigger value="stripe" className="data-[state=active]:bg-zinc-800">
                                <CreditCard className="w-4 h-4 mr-2" /> Card
                            </TabsTrigger>
                        )}
                        {enabledMethods.includes('crypto') && (
                            <TabsTrigger value="crypto" className="data-[state=active]:bg-zinc-800">
                                <Wallet className="w-4 h-4 mr-2" /> Crypto
                            </TabsTrigger>
                        )}
                        {enabledMethods.includes('wire') && (
                            <TabsTrigger value="wire" className="data-[state=active]:bg-zinc-800">
                                <Landmark className="w-4 h-4 mr-2" /> Wire
                            </TabsTrigger>
                        )}
                    </TabsList>

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

                    <TabsContent value="crypto" className="space-y-4">
                        <div className="text-center mb-4">
                            <h3 className="text-white font-medium">Pago Seguro Web3</h3>
                            <p className="text-xs text-zinc-500">
                                {IS_PROD ? 'Base Mainnet' : 'Sepolia Testnet'} • USDC (Prioridad)
                            </p>
                        </div>
                        <div className="flex flex-col items-center justify-center theme-dark py-8 space-y-4">
                            {!IS_PROD && <div className="text-amber-500 text-xs bg-amber-950/30 p-2 rounded">TESTNET MODE (Sepolia)</div>}

                            <TransactionButton
                                transaction={() => {
                                    // Amount is string string, e.g. "500.00"

                                    const destWallet = link.destinationWallet || MERCHANT_WALLET;

                                    return transfer({
                                        contract: usdcContract,
                                        to: destWallet,
                                        amount: link.amount // e.g., "500"
                                    });
                                }}
                                onTransactionConfirmed={(tx) => handleCryptoSuccess(tx)}
                                onError={(error) => {
                                    console.error("Tx Failed", error);
                                    toast.error("Error en la transacción");
                                }}
                                theme={"dark"}
                                className="w-full !bg-blue-600 hover:!bg-blue-500 text-white font-bold py-4 rounded-xl"
                            >
                                Pagar ${link.amount} USDC
                            </TransactionButton>

                            <p className="text-xs text-zinc-500 max-w-xs text-center">
                                Se abrirá tu wallet para confirmar. Si no tienes USDC en Base, podrás intercambiar otros tokens automáticamente.
                            </p>
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
                </Tabs>
            </div>
        </Card>
    );
}
