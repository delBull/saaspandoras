'use client';

export default function PrintButton() {
  return (
    <button 
      onClick={() => {
        if (typeof window !== 'undefined') window.print();
      }}
      className="text-xs border border-[#D4A853] text-[#D4A853] px-4 py-2 rounded-full hover:bg-[#D4A853] hover:text-black transition-colors"
    >
      Guardar PDF
    </button>
  );
}
