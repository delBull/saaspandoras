'use client';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-xs font-bold uppercase tracking-[0.2em] border border-black px-4 py-2 hover:bg-black hover:text-white transition-all active:scale-95"
    >
      Descargar PDF
    </button>
  );
}
