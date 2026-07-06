'use client';

import React from 'react';
import Link from 'next/link';

export default function AccessLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-black font-sans selection:bg-black selection:text-white">
      {/* 
        Top Bar: Only visible on screen, hidden on print. 
        Provides navigation back and the PDF download button.
      */}
      <div className="fixed top-0 w-full z-50 flex items-center justify-between px-6 py-4 bg-[#F9F9F9]/80 backdrop-blur-md border-b border-black/5 print:hidden">
        <Link 
          href={`/briefings/${params.slug}/access`} 
          className="text-xs font-bold uppercase tracking-[0.2em] hover:opacity-50 transition-opacity"
        >
          ← Access Hub
        </Link>
        <button 
          onClick={handlePrint}
          className="text-xs font-bold uppercase tracking-[0.2em] border border-black px-4 py-2 hover:bg-black hover:text-white transition-all active:scale-95"
        >
          Descargar PDF
        </button>
      </div>

      {/* 
        Main content wrapper. 
        Top padding prevents overlap with fixed bar on screen.
      */}
      <main className="pt-24 pb-32 print:pt-0 print:pb-0">
        {children}
      </main>
    </div>
  );
}
