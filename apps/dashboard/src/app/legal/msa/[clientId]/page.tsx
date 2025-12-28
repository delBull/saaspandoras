"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { MSA_CONTENT_V1 } from "@/lib/msa-content";
import { acceptMSA } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";

export default function MSAAcceptancePage() {
    const params = useParams();
    const router = useRouter();
    const clientId = params.clientId as string;

    const [signature, setSignature] = useState("");
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    async function handleAccept() {
        if (!agreed || !signature) {
            toast.error("Please agree and sign to proceed");
            return;
        }

        setLoading(true);
        const res = await acceptMSA(clientId, signature);
        if (res.success) {
            setSubmitted(true);
            toast.success("MSA Accepted Successfully");
        } else {
            toast.error("Error accepting MSA. Please try again or contact support.");
        }
        setLoading(false);
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
                <CheckCircle className="w-16 h-16 text-lime-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Agreement Accepted</h1>
                <p className="text-zinc-400 text-center max-w-md">
                    Thank you, {signature}. Your Master Services Agreement has been recorded.
                    You can now proceed with your Protocol SOWs.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8 border-b border-zinc-800 pb-4">
                    <h1 className="text-xl md:text-2xl font-bold text-lime-500">Pandora's Finance</h1>
                    <p className="text-sm text-zinc-400">Legal Agreements Authorization</p>
                </header>

                <main className="grid grid-cols-1 gap-8">
                    <div className="bg-white text-black p-8 rounded-lg shadow-lg max-h-[60vh] overflow-y-auto border border-zinc-700">
                        <div dangerouslySetInnerHTML={{ __html: MSA_CONTENT_V1 }} />
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <h3 className="text-md font-semibold mb-2 text-zinc-300">Documentos Relacionados (Informativos)</h3>
                        <p className="text-sm text-zinc-500 mb-2">Este acuerdo se complementa con el marco técnico descrito en:</p>
                        <a href="/litepaper" target="_blank" className="text-lime-500 hover:text-lime-400 text-sm hover:underline flex items-center">
                            📄 Litepaper Técnico Oficial v1.0
                        </a>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-6">
                        <h2 className="text-lg font-semibold">Acceptance & Signature</h2>

                        <div className="flex items-start space-x-3">
                            <Checkbox id="terms" checked={agreed} onCheckedChange={(c) => setAgreed(!!c)} className="mt-1 border-zinc-600 data-[state=checked]:bg-lime-500 data-[state=checked]:text-black" />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    I have read and agree to the Master Services Agreement (MSA) v1.0
                                </Label>
                                <p className="text-sm text-zinc-500">
                                    By checking this box, you confirm that you have the authority to bind the entity you represent.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Digital Signature (Full Name)</Label>
                            <Input
                                value={signature}
                                onChange={(e) => setSignature(e.target.value)}
                                placeholder="e.g. Juan Perez"
                                className="bg-zinc-950 border-zinc-800"
                            />
                            <p className="text-xs text-zinc-500">This signature will be legally binding.</p>
                        </div>

                        <Button
                            onClick={handleAccept}
                            disabled={loading || !agreed || !signature.trim()}
                            className="w-full bg-lime-500 text-black hover:bg-lime-400 font-bold h-12 text-lg"
                        >
                            {loading ? <Loader2 className="animate-spin mr-2" /> : "Sign & Accept Agreement"}
                        </Button>
                    </div>
                </main>
            </div>
        </div>
    );
}
