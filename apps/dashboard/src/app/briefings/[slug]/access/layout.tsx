import React from 'react';
import Link from 'next/link';
import { PrintButton } from './PrintButton';

export default async function AccessLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-black font-sans selection:bg-black selection:text-white">
      {/* 
        Top Bar: Only visible on screen, hidden on print. 
        Provides navigation back and the PDF download button.
      */}
      <div className="fixed top-0 w-full z-50 flex items-center justify-between px-6 py-4 bg-[#F9F9F9]/80 backdrop-blur-md border-b border-black/5 print:hidden">
        <Link 
          href={`/briefings/${slug}/access`} 
          className="text-xs font-bold uppercase tracking-[0.2em] hover:opacity-50 transition-opacity"
        >
          ← Access Hub
        </Link>
        <PrintButton />
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
