"use client";
import { Suspense } from "react";
import ConversationalForm from "@/components/ConversationalForm";
import { Loader2 } from "lucide-react";

export default function UtilityApplyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-lime-400" />
            <h2 className="text-xl font-semibold mb-2">Cargando Formulario</h2>
            <p className="text-zinc-400">Preparando tu aplicación de protocolo de utilidad...</p>
          </div>
        </div>
      }
    >
      <ConversationalForm />
    </Suspense>
  );
}
