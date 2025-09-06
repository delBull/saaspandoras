'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@saasfly/ui/dialog";
import { Loader2, CheckCircle, XCircle, Info } from "lucide-react";

function ProgressStep({ title, status }: { title: string; status: 'pending' | 'success' | 'error' | 'skipped'; }) {
  const statusIcons = { pending: <Loader2 className="animate-spin h-5 w-5 text-gray-400" />, success: <CheckCircle className="h-5 w-5 text-green-500" />, error: <XCircle className="h-5 w-5 text-red-500" />, skipped: <Info className="h-5 w-5 text-gray-500" /> };
  const statusText = { pending: "Pendiente...", success: "Completado", error: "Error", skipped: "Omitido" };
  return ( <div className="flex items-center justify-between text-sm"><p>{title}</p><div className="flex items-center gap-2">{statusIcons[status]}<span className="text-gray-400 w-24 text-right">{statusText[status]}</span></div></div> );
}

export function ProgressModal({ isOpen, onOpenChange, approvingStatus, swapStatus, networkStatus }: { isOpen: boolean; onOpenChange: (isOpen: boolean) => void; approvingStatus: 'pending' | 'success' | 'error' | 'skipped'; swapStatus: 'pending' | 'success' | 'error'; networkStatus: 'pending' | 'success' | 'error'; }) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white" aria-describedby="progress-modal-desc">
        <DialogHeader><DialogTitle>Procesando Swap</DialogTitle><DialogDescription id="progress-modal-desc">Tu transacción se está procesando en la blockchain. Por favor, no cierres esta ventana.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-4"><ProgressStep title="1. Aprobando token" status={approvingStatus} /><ProgressStep title="2. Ejecutando swap" status={swapStatus} /><ProgressStep title="3. Esperando confirmación" status={networkStatus} /></div>
      </DialogContent>
    </Dialog>
  );
}
