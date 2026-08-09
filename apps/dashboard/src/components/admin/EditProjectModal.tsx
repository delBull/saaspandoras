'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { projectSchema, type ProjectFormData } from '../conversational-form/types';
import type { Project } from '@/types/admin';
import { Loader2, Globe, FileText, Twitter, MessageSquare, Send, Linkedin, Image as ImageIcon, Video, Settings2, Shield } from 'lucide-react';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSuccess: () => void;
  walletAddress?: string;
}

export function EditProjectModal({ isOpen, onClose, project, onSuccess, walletAddress }: EditProjectModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const binding = project?.hermesBinding ?? null;
  const isExistingBinding = binding?.bindingMode === "existing";
  const hasBinding = binding !== null;

  const methods = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema as any),
    defaultValues: {
      title: project?.title || '',
      description: project?.description || '',
      tagline: project?.tagline || '',
      businessCategory: (project?.businessCategory as any) || 'other',
      logoUrl: project?.logoUrl || '',
      coverPhotoUrl: project?.coverPhotoUrl || '',
      videoPitch: project?.videoPitch || '',
      website: project?.website || '',
      whitepaperUrl: project?.whitepaperUrl || '',
      twitterUrl: project?.twitterUrl || '',
      discordUrl: project?.discordUrl || '',
      telegramUrl: project?.telegramUrl || '',
      linkedinUrl: project?.linkedinUrl || '',
      whatsappPhone: project?.whatsappPhone || '',
      protoclMecanism: project?.protoclMecanism || '',
      artefactUtility: project?.artefactUtility || '',
      worktoearnMecanism: project?.worktoearnMecanism || '',
      applicantName: project?.applicantName || '',
      applicantEmail: project?.applicantEmail || '',
      applicantPhone: project?.applicantPhone || '',
      applicantPosition: project?.applicantPosition || '',
      legalStatus: (project?.legalStatus as any) || 'not_formed',
      monetizationModel: project?.monetizationModel || '',
      bankBeneficiary: project?.legalConfig?.bankInstructions?.beneficiary || '',
      bankName: project?.legalConfig?.bankInstructions?.bank || '',
      bankClabe: project?.legalConfig?.bankInstructions?.clabe || '',
      ambassadorCommissionRate: (project?.ambassadorCommissionRate as any) || '4.00',
      managerCommissionRate: (project?.managerCommissionRate as any) || '3.00',
    },
  });

  const { register, handleSubmit, formState: { errors }, watch, setValue } = methods;

  // React to project changes to update defaults
  React.useEffect(() => {
    if (project) {
      methods.reset({
        title: project.title || '',
        description: project.description || '',
        tagline: project.tagline || '',
        businessCategory: (project.businessCategory as any) || 'other',
        logoUrl: project.logoUrl || '',
        coverPhotoUrl: project.coverPhotoUrl || '',
        videoPitch: project.videoPitch || '',
        website: project.website || '',
        whitepaperUrl: project.whitepaperUrl || '',
        twitterUrl: project.twitterUrl || '',
        discordUrl: project.discordUrl || '',
        telegramUrl: project.telegramUrl || '',
        linkedinUrl: project.linkedinUrl || '',
        whatsappPhone: project.whatsappPhone || '',
        protoclMecanism: project.protoclMecanism || '',
        artefactUtility: project.artefactUtility || '',
        worktoearnMecanism: project.worktoearnMecanism || '',
        applicantName: project.applicantName || '',
        applicantEmail: project.applicantEmail || '',
        applicantPhone: project.applicantPhone || '',
        applicantPosition: project.applicantPosition || '',
        legalStatus: (project.legalStatus as any) || 'not_formed',
        monetizationModel: project.monetizationModel || '',
        bankBeneficiary: project.legalConfig?.bankInstructions?.beneficiary || '',
        bankName: project.legalConfig?.bankInstructions?.bank || '',
        bankClabe: project.legalConfig?.bankInstructions?.clabe || '',
        ambassadorCommissionRate: (project.ambassadorCommissionRate as any) || '4.00',
        managerCommissionRate: (project.managerCommissionRate as any) || '3.00',
      });
    }
  }, [project, methods]);

  const onSubmit = async (data: ProjectFormData) => {
    if (!project) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-thirdweb-address': walletAddress || '',
          'x-wallet-address': walletAddress || '',
          'x-user-address': walletAddress || '',
        },
        body: JSON.stringify({
          ...data,
          legalConfig: {
            ...project.legalConfig,
            bankInstructions: {
              beneficiary: data.bankBeneficiary,
              bank: data.bankName,
              clabe: data.bankClabe
            }
          },
          // Ensure validationAgreement is sent if required by schema
          verificationAgreement: true, 
        }),
      });

      if (response.ok) {
        toast.success('Proyecto actualizado correctamente');
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Error al actualizar el proyecto');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Error de conexión al actualizar el proyecto');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-lime-400" />
            Editar Protocolo: <span className="text-lime-400">{project.title}</span>
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Actualiza los detalles fundamentales, activos visuales y mecánicas de tu creación.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="identity" className="w-full">
            <TabsList className="grid grid-cols-5 bg-zinc-900 border border-zinc-800 p-1 mb-6">
              <TabsTrigger value="identity" className="data-[state=active]:bg-lime-500 data-[state=active]:text-black">Identidad</TabsTrigger>
              <TabsTrigger value="visuals" className="data-[state=active]:bg-lime-500 data-[state=active]:text-black">Visuales</TabsTrigger>
              <TabsTrigger value="community" className="data-[state=active]:bg-lime-500 data-[state=active]:text-black">Comunidad</TabsTrigger>
              <TabsTrigger value="mechanics" className="data-[state=active]:bg-lime-500 data-[state=active]:text-black">Mecánicas</TabsTrigger>
              <TabsTrigger value="bots" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white font-semibold">🤖 Hermes Agent</TabsTrigger>
            </TabsList>

            {/* TAB: IDENTITY */}
            <TabsContent value="identity" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título del Protocolo</Label>
                  <Input 
                    id="title" 
                    {...register('title')} 
                    className="bg-zinc-900 border-zinc-800 focus:ring-lime-500" 
                    placeholder="Ej: Pandora's DAO"
                  />
                  {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Eslogan / Slogan</Label>
                  <Input 
                    id="tagline" 
                    {...register('tagline')} 
                    className="bg-zinc-900 border-zinc-800 focus:ring-lime-500"
                    placeholder="Resumen del valor en una frase"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción Detallada</Label>
                <Textarea 
                  id="description" 
                  {...register('description')} 
                  className="bg-zinc-900 border-zinc-800 focus:ring-lime-500 min-h-[120px]"
                  placeholder="Describe qué problema resuelve y cómo beneficia a la comunidad..."
                />
                {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessCategory">Categoría</Label>
                  <Select 
                    defaultValue={watch('businessCategory')} 
                    onValueChange={(val) => setValue('businessCategory', val as any)}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-800">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="tech_startup">Tech Startup</SelectItem>
                      <SelectItem value="art_collectibles">Arte y Coleccionables</SelectItem>
                      <SelectItem value="defi">DeFi</SelectItem>
                      <SelectItem value="gaming">Gaming</SelectItem>
                      <SelectItem value="real_estate">Bienes Raíces</SelectItem>
                      <SelectItem value="infrastructure">Infraestructura</SelectItem>
                      <SelectItem value="education">Educación</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monetizationModel">Modelo de Monetización</Label>
                  <Input 
                    id="monetizationModel" 
                    {...register('monetizationModel')} 
                    className="bg-zinc-900 border-zinc-800 focus:ring-lime-500"
                    placeholder="Ej: Suscripciones, Fees por transacción..."
                  />
                </div>
              </div>



              <div className="pt-4 border-t border-zinc-800">
                <h4 className="text-sm font-bold text-lime-400 mb-4 flex items-center gap-2">
                  <Send className="w-4 h-4" /> Información de Contacto
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">WhatsApp de Soporte (Público)</Label>
                    <Input {...register('whatsappPhone')} className="bg-zinc-900 border-zinc-800 border-lime-500/30" placeholder="Ej: 521234567890" />
                    <p className="text-[10px] text-zinc-500 italic">Número que aparecerá en los correos y el widget.</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">Teléfono del Solicitante (Privado)</Label>
                    <Input {...register('applicantPhone')} className="bg-zinc-900 border-zinc-800" placeholder="+52..." />
                    <p className="text-[10px] text-zinc-500 italic">Número de contacto directo con el representante.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <h4 className="text-sm font-bold text-lime-400 mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Datos Bancarios (Confidencial)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Beneficiario / Razón Social</Label>
                    <Input {...register('bankBeneficiary')} className="bg-zinc-900 border-zinc-800" placeholder="Nombre completo o empresa..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Banco</Label>
                    <Input {...register('bankName')} className="bg-zinc-900 border-zinc-800" placeholder="Ej: BBVA, Santander..." />
                  </div>
                  <div className="space-y-2">
                    <Label>CLABE / IBAN</Label>
                    <Input {...register('bankClabe')} className="bg-zinc-900 border-zinc-800 font-mono" placeholder="18 dígitos..." />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB: VISUALS */}
            <TabsContent value="visuals" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 gap-8">
                
                {/* Logo Upload Section */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-500">
                    <ImageIcon className="w-4 h-4 text-emerald-400" /> Logo del Protocolo (1:1)
                  </Label>
                  <div className="flex items-center gap-6 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl group hover:border-emerald-500/30 transition-all">
                    <div className="relative w-24 h-24 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shadow-2xl">
                      {watch('logoUrl') ? (
                        <img src={watch('logoUrl')} alt="Logo Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-zinc-700" />
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <Input 
                        type="file"
                        accept="image/*"
                        className="bg-zinc-900 border-zinc-800 text-xs text-zinc-400 file:bg-emerald-500 file:text-black file:border-0 file:rounded-lg file:mr-4 file:px-3 file:py-1 file:font-black file:uppercase file:text-[10px] cursor-pointer"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const toastId = toast.loading("Subiendo logo...");
                          try {
                            const formDataUpload = new FormData();
                            formDataUpload.append('file', file);
                            const res = await fetch('/api/v1/core/upload', {
                              method: 'POST',
                              body: formDataUpload
                            });
                            const data = await res.json();
                            if (data.url) {
                              setValue('logoUrl', data.url);
                              toast.success("Logo actualizado", { id: toastId });
                            }
                          } catch (err) {
                            toast.error("Error al subir logo", { id: toastId });
                          }
                        }}
                      />
                      <div className="relative">
                        <Input 
                          {...register('logoUrl')} 
                          className="bg-zinc-950 border-zinc-800 focus:ring-emerald-500 text-[10px] h-8" 
                          placeholder="O pega una URL directa aquí..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cover Photo Upload Section */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-500">
                    <ImageIcon className="w-4 h-4 text-purple-400" /> Imagen de Portada (Banner)
                  </Label>
                  <div className="space-y-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl group hover:border-purple-500/30 transition-all">
                    <div className="relative w-full h-32 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shadow-2xl">
                      {watch('coverPhotoUrl') ? (
                        <img src={watch('coverPhotoUrl')} alt="Cover Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-12 h-12 text-zinc-700" />
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input 
                        type="file"
                        accept="image/*"
                        className="bg-zinc-900 border-zinc-800 text-xs text-zinc-400 file:bg-purple-500 file:text-white file:border-0 file:rounded-lg file:mr-4 file:px-3 file:py-1 file:font-black file:uppercase file:text-[10px] cursor-pointer"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const toastId = toast.loading("Subiendo portada...");
                          try {
                            const formDataUpload = new FormData();
                            formDataUpload.append('file', file);
                            const res = await fetch('/api/v1/core/upload', {
                              method: 'POST',
                              body: formDataUpload
                            });
                            const data = await res.json();
                            if (data.url) {
                              setValue('coverPhotoUrl', data.url);
                              toast.success("Portada actualizada", { id: toastId });
                            }
                          } catch (err) {
                            toast.error("Error al subir portada", { id: toastId });
                          }
                        }}
                      />
                      <Input 
                        {...register('coverPhotoUrl')} 
                        className="bg-zinc-950 border-zinc-800 focus:ring-purple-500 text-[10px] h-8" 
                        placeholder="O pega una URL directa aquí..."
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-500">
                    <Video className="w-4 h-4 text-zinc-400" /> URL Video de Pitch (YT/Vimeo)
                  </Label>
                  <Input 
                    {...register('videoPitch')} 
                    className="bg-zinc-900 border-zinc-800 focus:ring-emerald-500 h-10"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
              </div>
            </TabsContent>

            {/* TAB: COMMUNITY */}
            <TabsContent value="community" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Globe className="w-4 h-4" /> Sitio Web</Label>
                  <Input {...register('website')} className="bg-zinc-900 border-zinc-800" placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><FileText className="w-4 h-4" /> Whitepaper</Label>
                  <Input {...register('whitepaperUrl')} className="bg-zinc-900 border-zinc-800" placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Twitter className="w-4 h-4" /> Twitter (X)</Label>
                  <Input {...register('twitterUrl')} className="bg-zinc-900 border-zinc-800" placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Discord</Label>
                  <Input {...register('discordUrl')} className="bg-zinc-900 border-zinc-800" placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Send className="w-4 h-4" /> Telegram</Label>
                  <Input {...register('telegramUrl')} className="bg-zinc-900 border-zinc-800" placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Linkedin className="w-4 h-4" /> LinkedIn</Label>
                  <Input {...register('linkedinUrl')} className="bg-zinc-900 border-zinc-800" placeholder="https://..." />
                </div>
              </div>
            </TabsContent>

            {/* TAB: MECHANICS */}
            <TabsContent value="mechanics" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-2">
                <Label>Mecánica del Protocolo</Label>
                <Textarea 
                  {...register('protoclMecanism')} 
                  className="bg-zinc-900 border-zinc-800 min-h-[80px]" 
                  placeholder="¿Cómo se genera valor para la comunidad?"
                />
              </div>
              <div className="space-y-2">
                <Label>Utilidad del Artefacto</Label>
                <Textarea 
                  {...register('artefactUtility')} 
                  className="bg-zinc-900 border-zinc-800 min-h-[80px]" 
                  placeholder="¿Qué beneficios tienen los holders a largo plazo?"
                />
              </div>
              <div className="space-y-2">
                <Label>Mecanismo Work-to-Earn (Labor)</Label>
                <Textarea 
                  {...register('worktoearnMecanism')} 
                  className="bg-zinc-900 border-zinc-800 min-h-[80px]" 
                  placeholder="Si aplica, ¿cómo se recompensa la contribución?"
                />
              </div>
            </TabsContent>



            {/* TAB: HERMES AGENT — Status Adapter (V5.1 Architecture) */}
            {/* 🔒 This tab is READ-ONLY for Pandora's Admin.            */}
            {/*    All Hermes config lives in Hermes Console.             */}
            <TabsContent value="bots" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-4">

                {/* ── Header + SSO Button ──────────────────────────────── */}
                <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-xl">🤖</div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-0.5">
                        Hermes OS
                        {isExistingBinding ? (
                          <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold tracking-wide">🛡️ EXISTING BINDING</span>
                        ) : hasBinding ? (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold tracking-wide">● PROVISIONED</span>
                        ) : (
                          <span className="text-[9px] bg-zinc-500/20 text-zinc-400 border border-zinc-500/30 px-2 py-0.5 rounded-full font-semibold tracking-wide">○ NOT BOUND</span>
                        )}
                      </h4>
                      <p className="text-[11px] text-zinc-400">
                        {isExistingBinding
                          ? 'Golden Reference Tenant — configuración solo en Hermes Console'
                          : hasBinding
                            ? 'Binding Layer V5.1 — instancia activa'
                            : 'Sin binding de Hermes — aprovisiona para activar'}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`/growth-os/hermes`}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-900/30 transition-all no-underline"
                  >
                    Abrir Hermes Console 🚀
                  </a>
                </div>

                {/* ── Binding Status Card ──────────────────────────────── */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl divide-y divide-zinc-800/70">
                  <div className="flex items-center justify-between px-4 py-3 text-xs">
                    <span className="text-zinc-400">Instance ID</span>
                    <code className="text-purple-300 font-mono text-[11px]">
                      {binding?.hermesInstanceId ?? '—'}
                    </code>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 text-xs">
                    <span className="text-zinc-400">Binding Mode</span>
                    <span className={`font-semibold uppercase tracking-wider text-[10px] ${isExistingBinding ? 'text-amber-400' : hasBinding ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {isExistingBinding ? 'existing (read-only)' : hasBinding ? 'provisioned' : 'sin binding'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 text-xs">
                    <span className="text-zinc-400">Plan</span>
                    <span className="text-zinc-200 font-medium">{binding?.plan ?? '—'}</span>
                  </div>
                </div>

                {/* ── S'Narai read-only notice ─────────────────────────── */}
                {isExistingBinding && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
                    <p className="text-[11px] text-amber-300/80 leading-relaxed">
                      <strong className="text-amber-400">🛡️ Protección activa:</strong> S&apos;Narai es el Golden Reference Tenant.
                      Su configuración de agente, prompts, bot tokens y base de conocimientos se gestionan
                      exclusivamente desde <strong>Hermes Console</strong>.
                      Pandora&apos;s Admin solo puede ver el estado del binding.
                    </p>
                  </div>
                )}

                {/* ── Capabilities Grid (read-only) ────────────────────── */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-3">Capabilities Activas</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'identity', label: 'Identity', icon: '🪪' },
                      { key: 'knowledge', label: 'Knowledge', icon: '🧠' },
                      { key: 'runtime', label: 'Runtime', icon: '⚡' },
                      { key: 'analytics', label: 'Analytics', icon: '📊' },
                      { key: 'voice', label: 'Voice', icon: '🎙️' },
                      { key: 'multiagent', label: 'Multi-Agent', icon: '🕸️' },
                    ].map(cap => {
                      const active = ['identity', 'knowledge', 'runtime', 'analytics'].includes(cap.key);
                      return (
                        <div key={cap.key} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] border ${active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}>
                          <span>{cap.icon}</span>
                          <span className="font-medium">{cap.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-3">
                    Para habilitar o deshabilitar capabilities, abre Hermes Console → Plan & Capabilities.
                  </p>
                </div>

              </div>
            </TabsContent>

          </Tabs>

          <DialogFooter className="mt-8 gap-3 sm:gap-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="bg-transparent border-zinc-700 hover:bg-zinc-800 text-zinc-300"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-lime-500 hover:bg-lime-600 text-black font-bold px-8"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
