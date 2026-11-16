'use client';

/**
 * Descarga como PDF usando el diálogo de impresión del navegador
 * ("Guardar como PDF"). No añade dependencias ni servicios externos.
 */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200 print:hidden"
    >
      Descargar PDF
    </button>
  );
}
