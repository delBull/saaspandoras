"use client";

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DocumentVisorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentVisorModal({ isOpen, onClose }: DocumentVisorModalProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    fetch('/api/v1/marketing/docs')
      .then(res => res.json())
      .then(data => {
        setContent(data.content || '');
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [isOpen]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center p-20 gap-4 bg-zinc-950 min-h-[50vh]">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Cargando Documentación Estratégica...</p>
        </div>
      );
    }

    if (!content) {
      return (
        <div className="p-20 text-center text-zinc-500">
          No se pudo cargar la documentación. Por favor intente más tarde.
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {content.split('\n').map((line, i) => {
          const trimLine = line.trim();
          if (line.startsWith('# ')) return (
            <h1 key={i} className="text-3xl md:text-5xl font-black tracking-tighter mb-8 text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
              {line.replace('# ', '')}
            </h1>
          );
          
          if (line.startsWith('## ')) return (
            <h2 key={i} className="text-xl font-black mt-12 mb-4 text-white flex items-center gap-3">
              <span className="w-6 h-px bg-purple-500/50"></span>
              {line.replace('## ', '')}
            </h2>
          );
          
          if (line.startsWith('### ')) return (
            <h3 key={i} className="text-sm font-black mt-8 mb-2 text-purple-400 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              {line.replace('### ', '')}
            </h3>
          );
          
          if (line.startsWith('> ')) return (
            <div key={i} className="border-l-4 border-purple-500 pl-6 py-4 my-8 italic text-zinc-300 text-lg leading-relaxed relative bg-purple-900/5 rounded-r-xl">
              {line.replace('> ', '')}
            </div>
          );
          
          if (trimLine === '---') return <hr key={i} className="my-10 border-zinc-800" />;
          if (trimLine === '') return null;
          
          // Table Detection
          if (line.includes('|') && !line.includes('---')) {
             const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
             if (cells.length > 0) {
               return (
                 <div key={i} className="my-6 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/30">
                   <table className="w-full text-left text-sm">
                     <tbody>
                       <tr className="divide-x divide-zinc-800">
                         {cells.map((td, tdi) => (
                           <td key={tdi} className="p-4 font-medium text-zinc-400">
                             {td}
                           </td>
                         ))}
                       </tr>
                     </tbody>
                   </table>
                 </div>
               );
             }
          }

          if (line.startsWith('- ')) return (
            <div key={i} className="flex items-start gap-3 mb-3">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span className="text-sm font-medium text-zinc-400">
                {line.replace('- ', '')}
              </span>
            </div>
          );
          
          return (
            <p key={i} className="text-sm text-zinc-400 leading-relaxed font-medium mb-4 text-pretty first-letter:text-lg first-letter:font-black first-letter:text-white first-letter:mr-0.5">
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[800px] w-[95vw] h-[90vh] bg-zinc-950 border-zinc-800 text-white p-0 overflow-hidden flex flex-col rounded-[2.5rem]">
        {/* Superior Decorator */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 blur-[100px] pointer-events-none"></div>

        {/* Modal Header */}
        <div className="p-8 border-b border-zinc-800 flex justify-between items-center relative z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black italic text-xl shadow-lg shadow-purple-500/20">P</div>
            <div>
              <DialogTitle className="text-base font-black uppercase tracking-tight">Growth OS <span className="text-zinc-500 italic lowercase">v3.0</span></DialogTitle>
              <DialogDescription className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Documentación Estratégica Confidencial</DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 uppercase text-[9px] font-black tracking-widest px-3 py-1 bg-emerald-500/5">Verified Partner</Badge>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 relative z-10 font-sans custom-scrollbar">
           {renderContent()}
           
           {/* Footer Signature */}
           <div className="mt-20 pt-10 border-t border-zinc-900 flex justify-between items-center bg-zinc-900/10 rounded-2xl p-6">
             <div className="flex flex-col">
                <span className="text-[8px] uppercase font-black tracking-[0.3em] text-zinc-600 mb-1">Signed by</span>
                <span className="font-bold text-white tracking-tighter text-sm">Pandora Growth Intelligence</span>
             </div>
             <div className="w-16 h-16 rounded-full border border-red-500/10 flex items-center justify-center text-red-500/30 text-[6px] font-black uppercase text-center -rotate-12">
                Executive<br/>Approval<br/>GOS
             </div>
           </div>
        </div>

        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #18181b;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #27272a;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
