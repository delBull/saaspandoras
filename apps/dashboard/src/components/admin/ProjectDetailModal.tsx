'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Info, 
  Settings, 
  Layers, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Mail,
  Phone,
  User,
  Globe,
  FileText,
  Shield,
  Zap
} from "lucide-react";
import type { Project } from '@/types/admin';
import type { UtilityPhase } from '@/types/deployment';
import { toast } from "sonner";

interface ProjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onUpdate: (projectId: string, updates: any) => Promise<void>;
  actionsLoading?: boolean;
}

export function ProjectDetailModal({
  isOpen,
  onClose,
  project,
  onUpdate,
  actionsLoading = false
}: ProjectDetailModalProps) {
  const [localPhases, setLocalPhases] = useState<UtilityPhase[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  // Load phases from project w2eConfig
  useEffect(() => {
    if (project?.w2eConfig) {
      const config = typeof project.w2eConfig === 'string' 
        ? JSON.parse(project.w2eConfig) 
        : project.w2eConfig;
      setLocalPhases(config.phases || []);
    } else {
      setLocalPhases([]);
    }
  }, [project]);

  if (!project) return null;

  const handleTogglePhase = (index: number, isActive: boolean) => {
    const updated = [...localPhases];
    const target = updated[index];
    if (target) {
      updated[index] = { ...target, isActive } as UtilityPhase;
      setLocalPhases(updated);
    }
  };

  const handleSavePhases = async () => {
    try {
      const config = typeof project.w2eConfig === 'string' 
        ? JSON.parse(project.w2eConfig) 
        : { ...project.w2eConfig };
      
      const newConfig = {
        ...config,
        phases: localPhases
      };

      await onUpdate(project.id, {
        isBasicEdit: true,
        w2eConfig: newConfig
      });
      
      toast.success("Configuración de fases actualizada globalmente");
    } catch (error) {
      toast.error("Error al actualizar las fases");
    }
  };

  const isV2 = (project as any).protocolVersion === 2;
  const isDeployed = project.deploymentStatus === 'deployed';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-950 border-zinc-800 text-zinc-200">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div className="space-y-1">
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
              {project.title}
              {isV2 && (
                <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                  V2 Protocol
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm">
              ID: {project.id} • Slug: {project.slug}
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2">
             <Badge variant={isDeployed ? "outline" : "secondary"} className={isDeployed ? "border-green-500/50 text-green-400" : ""}>
               {isDeployed ? "🚀 Deployed" : "💡 Draft / Approved"}
             </Badge>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-zinc-900 border-zinc-800 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white gap-2">
              <Info className="w-4 h-4" /> Resumen
            </TabsTrigger>
            <TabsTrigger value="protocol" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white gap-2">
              <Shield className="w-4 h-4" /> Protocolo
            </TabsTrigger>
            <TabsTrigger value="phases" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white gap-2">
              <Layers className="w-4 h-4" /> Fases de Venta
            </TabsTrigger>
            <TabsTrigger value="due-diligence" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white gap-2">
              <FileText className="w-4 h-4" /> Due Diligence
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6 animate-in fade-in-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Información Básica</h4>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Categoría:</span>
                    <span className="text-white font-medium">{project.businessCategory}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Meta:</span>
                    <span className="text-lime-400 font-bold">${Number(project.targetAmount).toLocaleString()} USD</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Estado Legal:</span>
                    <Badge variant="outline" className="border-zinc-700">{project.legalStatus || 'N/A'}</Badge>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
                    <div className="space-y-0.5">
                      <span className="text-sm font-medium text-white flex items-center gap-2">
                        Protocol Version V2 {((project as any).protocolVersion === 2) ? "✅" : ""}
                      </span>
                      <p className="text-[10px] text-zinc-500">Activa características avanzadas y artefactos V2.</p>
                    </div>
                    <Switch 
                      checked={(project as any).protocolVersion === 2}
                      onCheckedChange={async (checked) => {
                        try {
                          await onUpdate(project.id, {
                            isBasicEdit: true,
                            protocolVersion: checked ? 2 : 1
                          });
                          toast.success(`Protocolo actualizado a V${checked ? '2' : '1'}`);
                        } catch (e) {
                          toast.error("Error al actualizar la versión del protocolo");
                        }
                      }}
                      className="data-[state=checked]:bg-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Representante</h4>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <User className="w-4 h-4 text-zinc-500" />
                    <span className="text-white">{project.applicantName || 'Sin nombre'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-zinc-500" />
                    <a href={`mailto:${project.applicantEmail}`} className="text-indigo-400 hover:underline">{project.applicantEmail || 'Sin email'}</a>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-zinc-500" />
                    <span className="text-zinc-300">{project.applicantPhone || 'Sin teléfono'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Enlaces Públicos</h4>
                <div className="flex flex-wrap gap-3">
                  {project.website && (
                    <Button variant="outline" size="sm" className="bg-zinc-900 border-zinc-800 gap-2" asChild>
                      <a href={project.website} target="_blank" rel="noopener noreferrer"><Globe className="w-4 h-4" /> Web</a>
                    </Button>
                  )}
                  {project.twitterUrl && (
                    <Button variant="outline" size="sm" className="bg-zinc-900 border-zinc-800 gap-2" asChild>
                      <a href={project.twitterUrl} target="_blank" rel="noopener noreferrer">𝕏 Twitter</a>
                    </Button>
                  )}
                  {project.telegramUrl && (
                    <Button variant="outline" size="sm" className="bg-zinc-900 border-zinc-800 gap-2" asChild>
                      <a href={project.telegramUrl} target="_blank" rel="noopener noreferrer">✈️ Telegram</a>
                    </Button>
                  )}
                </div>
            </div>
          </TabsContent>

          {/* PROTOCOL TAB */}
          <TabsContent value="protocol" className="space-y-6 animate-in fade-in-50">
            <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 space-y-4">
              <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-4 h-4" /> Smart Contracts (Growth Hub)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="space-y-1">
                  <span className="text-zinc-500 block">Utility Contract:</span>
                  <div className="flex items-center justify-between bg-zinc-950 p-2 rounded border border-zinc-800 group">
                    <span className="text-white truncate">{project.utilityContractAddress || 'N/A'}</span>
                    {project.utilityContractAddress && (
                      <a href={`https://sepolia.etherscan.io/address/${project.utilityContractAddress}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-white transition-colors" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-zinc-500 block">License Contract:</span>
                  <div className="flex items-center justify-between bg-zinc-950 p-2 rounded border border-zinc-800 group">
                    <span className="text-white truncate">{project.licenseContractAddress || 'N/A'}</span>
                    {project.licenseContractAddress && (
                      <a href={`https://sepolia.etherscan.io/address/${project.licenseContractAddress}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-white transition-colors" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-zinc-500 block">Governor:</span>
                  <div className="flex items-center justify-between bg-zinc-950 p-2 rounded border border-zinc-800 group">
                    <span className="text-white truncate">{project.governorContractAddress || 'N/A'}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-zinc-500 block">Treasury (Multi-Sig):</span>
                  <div className="flex items-center justify-between bg-zinc-950 p-2 rounded border border-zinc-800 group">
                    <span className="text-white truncate">{project.treasuryAddress || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Artifacts Summary */}
              {isV2 && (project as any).artifacts && (
                <div className="pt-4 border-t border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-3 block">Artifacts Overview</span>
                  <div className="flex flex-wrap gap-2">
                    {((project as any).artifacts as any[]).map((art, i) => (
                      <Badge key={i} className="bg-indigo-900/30 text-indigo-300 border border-indigo-700/50 py-1">
                        {art.name || art.type} • {art.address?.slice(0, 6)}...
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* PHASES TAB */}
          <TabsContent value="phases" className="space-y-6 animate-in fade-in-50">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white">Gestión de Etapas</h4>
                <p className="text-xs text-zinc-500">Activa o pausa fases del protocolo globalmente. Los cambios afectan a Web y Telegram.</p>
              </div>
              <Button 
                onClick={handleSavePhases} 
                disabled={actionsLoading || localPhases.length === 0}
                className="bg-lime-500 hover:bg-lime-600 text-black font-bold"
              >
                {actionsLoading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>

            {localPhases.length === 0 ? (
              <div className="bg-zinc-900/50 p-8 rounded-xl border border-dashed border-zinc-800 text-center">
                <AlertTriangle className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">Este proyecto no tiene fases configuradas en w2eConfig.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {localPhases.map((phase, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-4 rounded-xl border ${phase.isActive !== false ? 'bg-zinc-900/80 border-lime-500/20' : 'bg-zinc-950 border-zinc-800 opacity-70'} transition-all`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${phase.isActive !== false ? 'bg-lime-500/10 text-lime-400' : 'bg-zinc-800 text-zinc-500'}`}>
                        {phase.type === 'amount' ? <Zap className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{phase.name}</span>
                          <Badge className={phase.isActive !== false ? "bg-lime-500/10 text-lime-400" : "bg-zinc-800"}>
                            {phase.isActive !== false ? "Activo" : "Pausado"}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                          {phase.type === 'amount' ? `Asignación: ${Number(phase.tokenAllocation || 0).toLocaleString()} NFTs` : `Límite: ${phase.limit} días`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-mono text-zinc-400">${Number(phase.tokenPrice || 0).toFixed(2)} USD/NFT</p>
                      </div>
                      <Switch 
                        checked={phase.isActive !== false} 
                        onCheckedChange={(checked) => handleTogglePhase(idx, checked)}
                        className="data-[state=checked]:bg-lime-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* DUE-DILIGENCE TAB */}
          <TabsContent value="due-diligence" className="space-y-6 animate-in fade-in-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 space-y-3">
                  <h5 className="text-xs font-bold text-zinc-500 uppercase">Valuación Profesional</h5>
                  {project.valuationDocumentUrl ? (
                    <Button variant="outline" className="w-full justify-start gap-2 border-zinc-700 bg-zinc-950 text-lime-400" asChild>
                      <a href={project.valuationDocumentUrl} target="_blank" rel="noopener noreferrer"><FileText className="w-4 h-4" /> Ver Documento</a>
                    </Button>
                  ) : (
                    <div className="text-xs text-zinc-600 italic">No disponible</div>
                  )}
               </div>
               <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 space-y-3">
                  <h5 className="text-xs font-bold text-zinc-500 uppercase">Reporte Due Diligence</h5>
                  {project.dueDiligenceReportUrl ? (
                    <Button variant="outline" className="w-full justify-start gap-2 border-zinc-700 bg-zinc-950 text-cyan-400" asChild>
                      <a href={project.dueDiligenceReportUrl} target="_blank" rel="noopener noreferrer"><CheckCircle2 className="w-4 h-4" /> Ver Reporte</a>
                    </Button>
                  ) : (
                    <div className="text-xs text-zinc-600 italic">No disponible</div>
                  )}
               </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-6 border-t border-zinc-800 mt-6">
          <Button variant="ghost" onClick={onClose} className="text-zinc-500 hover:text-white">Cerrar</Button>
          <Button onClick={onClose} className="bg-white text-black hover:bg-zinc-200 font-bold">Hecho</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
