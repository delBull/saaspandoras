"use client";

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, Send, Phone, Mail, User } from "lucide-react";
import { toast } from "sonner";

interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  tierName?: string;
  source?: string;
}

export function LeadCaptureModal({ isOpen, onClose, tierName, source = 'growth-os-landing' }: LeadCaptureModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/v1/marketing/leads/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'external' // Using our internal bypass for this landing
        },
        body: JSON.stringify({
          ...formData,
          phoneNumber: formData.whatsapp,
          intent: tierName ? 'invest' : 'explore',
          projectId: 'pandoras-protocol',
          scope: 'b2b',
          consent: true,
          origin: window.location.href,
          metadata: {
            source,
            sessionId: typeof window !== 'undefined' ? localStorage.getItem("growth_session_id") : null,
            tags: [source, 'organic', tierName ? 'premium' : 'exploration'],
            tier: tierName || 'general',
            requestedAt: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        setSuccess(true);
        toast.success("Solicitud enviada correctamente");
        // We don't close immediately to show success state
      } else {
        const error = await response.json();
        toast.error(error.message || "Error al enviar la solicitud");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px] bg-zinc-950 border-zinc-800 text-white p-0 overflow-hidden rounded-3xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-emerald-500 to-indigo-500"></div>
        
        {success ? (
          <div className="p-12 flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black tracking-tight">¡SOLICITUD RECIBIDA!</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Un estratega senior de Pandora revisará tu perfil y se pondrá en contacto contigo en las próximas 24 horas.
              </p>
            </div>
            <Button 
              onClick={onClose}
              className="w-full bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 h-12 rounded-2xl font-bold"
            >
              Cerrar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-2xl font-black tracking-tight text-white uppercase italic">
                {tierName ? `SETUP: ${tierName}` : 'PIDE TU SETUP AHORA'}
              </DialogTitle>
              <DialogDescription className="text-zinc-500 font-medium">
                Déjanos tus datos para agendar una llamada estratégica y desplegar tu Growth Engine.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <User className="w-3 h-3" /> Nombre Completo
                </Label>
                <Input 
                  id="name" 
                  placeholder="Tu nombre" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-zinc-900/50 border-zinc-800 focus:border-purple-500/50 h-12 rounded-xl text-white placeholder:text-zinc-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <Mail className="w-3 h-3" /> Email Corporativo
                </Label>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="tu@protocolo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="bg-zinc-900/50 border-zinc-800 focus:border-purple-500/50 h-12 rounded-xl text-white placeholder:text-zinc-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <Phone className="w-3 h-3" /> WhatsApp (Opcional)
                </Label>
                <Input 
                  id="whatsapp" 
                  placeholder="+52..." 
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                  className="bg-zinc-900/50 border-zinc-800 focus:border-purple-500/50 h-12 rounded-xl text-white placeholder:text-zinc-600"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-purple-500/20 group"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  OBTENER SETUP
                  <Send className="ml-2 w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </>
              )}
            </Button>
            
            <p className="text-[9px] text-zinc-600 text-center font-bold uppercase tracking-tighter">
              Al enviar aceptas que procesemos tus datos para fines de prospección comercial.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
