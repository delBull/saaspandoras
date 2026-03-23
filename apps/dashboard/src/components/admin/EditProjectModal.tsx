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
import { Loader2, Globe, FileText, Twitter, MessageSquare, Send, Linkedin, Image as ImageIcon, Video, Settings2, Coins } from 'lucide-react';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSuccess: () => void;
  walletAddress?: string;
}

export function EditProjectModal({ isOpen, onClose, project, onSuccess, walletAddress }: EditProjectModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      protoclMecanism: project?.protoclMecanism || '',
      artefactUtility: project?.artefactUtility || '',
      worktoearnMecanism: project?.worktoearnMecanism || '',
      targetAmount: typeof project?.targetAmount === 'string' ? parseFloat(project.targetAmount) : (project?.targetAmount || 0),
      tokenType: (project as any)?.tokenType || 'erc20',
      totalTokens: project?.totalTokens || 0,
      tokensOffered: typeof project?.tokensOffered === 'string' ? parseFloat(project.tokensOffered) : (project?.tokensOffered || 0),
      tokenPriceUsd: typeof project?.tokenPriceUsd === 'string' ? parseFloat(project.tokenPriceUsd) : (project?.tokenPriceUsd || 0),
      applicantName: project?.applicantName || '',
      applicantEmail: project?.applicantEmail || '',
      applicantPhone: project?.applicantPhone || '',
      applicantPosition: project?.applicantPosition || '',
      legalStatus: (project?.legalStatus as any) || 'sin_entidad_juridica',
      monetizationModel: project?.monetizationModel || '',
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
        protoclMecanism: project.protoclMecanism || '',
        artefactUtility: project.artefactUtility || '',
        worktoearnMecanism: project.worktoearnMecanism || '',
        // Enforce numeric types for form inputs that expect them
        targetAmount: typeof project.targetAmount === 'string' ? parseFloat(project.targetAmount) : (project.targetAmount || 0),
        tokenType: (project as any)?.tokenType || 'erc20',
        totalTokens: project.totalTokens || 0,
        tokensOffered: typeof project.tokensOffered === 'string' ? parseFloat(project.tokensOffered) : (project.tokensOffered || 0),
        tokenPriceUsd: typeof project.tokenPriceUsd === 'string' ? parseFloat(project.tokenPriceUsd) : (project.tokenPriceUsd || 0),
        applicantName: project.applicantName || '',
        applicantEmail: project.applicantEmail || '',
        applicantPhone: project.applicantPhone || '',
        applicantPosition: project.applicantPosition || '',
        legalStatus: (project.legalStatus as any) || 'sin_entidad_juridica',
        monetizationModel: project.monetizationModel || '',
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
            <TabsList className="grid grid-cols-4 bg-zinc-900 border border-zinc-800 p-1 mb-6">
              <TabsTrigger value="identity" className="data-[state=active]:bg-lime-500 data-[state=active]:text-black">Identidad</TabsTrigger>
              <TabsTrigger value="visuals" className="data-[state=active]:bg-lime-500 data-[state=active]:text-black">Visuales</TabsTrigger>
              <TabsTrigger value="community" className="data-[state=active]:bg-lime-500 data-[state=active]:text-black">Comunidad</TabsTrigger>
              <TabsTrigger value="mechanics" className="data-[state=active]:bg-lime-500 data-[state=active]:text-black">Mecánicas</TabsTrigger>
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

              <div className="pt-4 border-t border-zinc-800">
                <h4 className="text-sm font-bold text-lime-400 mb-4 flex items-center gap-2">
                  <Coins className="w-4 h-4" /> Parámetros Económicos Básicos
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Monto Meta (USD)</Label>
                    <Input 
                      type="number" 
                      step="any"
                      {...register('targetAmount', { valueAsNumber: true })} 
                      className="bg-zinc-900 border-zinc-800" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Precio del Token (USD)</Label>
                    <Input 
                      type="number" 
                      step="any"
                      {...register('tokenPriceUsd', { valueAsNumber: true })} 
                      className="bg-zinc-900 border-zinc-800" 
                    />
                  </div>
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
