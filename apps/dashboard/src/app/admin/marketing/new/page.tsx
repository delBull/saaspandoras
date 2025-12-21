"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function NewCampaignPage() {
    const router = useRouter();

    return (
        <div className="p-8 pt-24 max-w-4xl mx-auto space-y-6">
            <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-muted-foreground">
                <ArrowLeft className="w-4 h-4" />
                Volver
            </Button>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
                <h1 className="text-2xl font-bold mb-4">Nueva Campaña</h1>
                <p className="text-muted-foreground mb-6">
                    El constructor visual de campañas estará disponible pronto.
                </p>
                <Button onClick={() => router.back()}>Entendido</Button>
            </div>
        </div>
    );
}
