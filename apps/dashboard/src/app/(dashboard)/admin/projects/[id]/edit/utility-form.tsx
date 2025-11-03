"use client";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import TypeformApplication from "@/components/TypeformApplication";
import { Loader2 } from "lucide-react";

export default function UtilityFormPage() {
  const params = useParams();
  const projectId = params?.id as string;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-lime-400" />
            <h2 className="text-xl font-semibold mb-2">Cargando Formulario</h2>
            <p className="text-zinc-400">Preparando aplicación de protocolo de utilidad...</p>
          </div>
        </div>
      }
    >
      <TypeformApplication
        isPublic={false}
        projectId={projectId}
        isEdit={!!projectId}
      />
    </Suspense>
  );
}
