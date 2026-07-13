import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pandoras Bitcoin Real Estate Initiative',
  description: 'Connecting Bitcoin Communities With Institutional Real Estate Opportunities',
};

export default function BitcoinInitiativeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#050905] text-white min-h-screen font-sans selection:bg-[#F7931A]/30 selection:text-white">
      {children}
    </div>
  );
}
