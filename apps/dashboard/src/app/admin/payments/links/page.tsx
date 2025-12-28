"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// Assuming AdminAuthGuard is available or page is protected by layout
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";

export default function PaymentLinksPage() {
    const router = useRouter();

    return (
        <AdminAuthGuard>
            <div className="p-8 pt-24 max-w-4xl mx-auto space-y-6">
                <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-muted-foreground">
                    <ArrowLeft className="w-4 h-4" />
                    Volver
                </Button>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
                    <h1 className="text-2xl font-bold mb-4">Gestión de Links de Pago</h1>
                    <p className="text-muted-foreground mb-6">
                        Aquí podrás generar links de Stripe y Cripto personalizados.
                        <br />
                        <span className="text-xs opacity-50">Módulo en construcción.</span>
                    </p>
                </div>
            </div>
        </AdminAuthGuard>
    );
}
