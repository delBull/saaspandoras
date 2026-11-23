"use client";

import { Printer } from "lucide-react";

/** Botón de impresión/guardar PDF (cliente) para la vista imprimible del NDA. */
export function PrintTrigger() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-[11px] font-mono uppercase tracking-wider text-white hover:bg-zinc-800"
    >
      <Printer className="h-3.5 w-3.5" />
      Imprimir / Guardar PDF
    </button>
  );
}
