'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@saasfly/ui/dialog";
import { Button } from "@saasfly/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

export function ResultModal({ isOpen, onOpenChange, variant, message, txHash }: { isOpen: boolean; onOpenChange: (isOpen: boolean) => void; variant: 'success' | 'error'; message: string | null; txHash: `0x${string}` | null; }) {
  const explorerUrl = txHash ? `https://basescan.org/tx/${txHash}` : '#';
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white" aria-describedby="result-modal-desc">
        <DialogHeader className="items-center text-center">{variant === 'success' ? <CheckCircle className="h-16 w-16 text-green-500 mb-4" /> : <XCircle className="h-16 w-16 text-red-500 mb-4" />}<DialogTitle className="text-2xl">{variant === 'success' ? "Swap Exitoso" : "Error en el Swap"}</DialogTitle><DialogDescription id="result-modal-desc">{message}</DialogDescription></DialogHeader>
        {txHash && ( <div className="text-center pt-4"><a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="text-lime-400 hover:underline text-sm">Ver en Block Explorer</a></div> )}
        <DialogFooter className="mt-4"><Button onClick={() => onOpenChange(false)} className="w-full">Cerrar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
