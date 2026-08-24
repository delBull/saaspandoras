import React from 'react';
import Script from 'next/script';

export const metadata = {
  title: 'Hermes OS — Command Center',
  description: 'Telegram Mini App (TMA) for Hermes OS Operators and Founders',
};

export default function TmaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <head>
        <Script 
          src="https://telegram.org/js/telegram-web-app.js" 
          strategy="beforeInteractive" 
        />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans selection:bg-indigo-500/30">
        <main className="min-h-screen flex flex-col max-w-md mx-auto relative overflow-x-hidden pb-12">
          {children}
        </main>
      </body>
    </html>
  );
}
