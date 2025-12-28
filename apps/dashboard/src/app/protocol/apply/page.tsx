import { ApplyFormProtocol } from "@/components/apply/ApplyFormProtocol";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ProtocolApplyPage() {
    return (
        <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl mb-8 flex items-center">
                <Link
                    href="/"
                    className="flex items-center text-zinc-500 hover:text-white transition-colors text-sm"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Inicio
                </Link>
            </div>

            <ApplyFormProtocol />

            <p className="mt-8 text-zinc-600 text-xs text-center max-w-md">
                Al aplicar, aceptas que tu proyecto será evaluado bajo criterios de viabilidad técnica y económica de Pandora's Finance.
            </p>
        </main>
    );
}
