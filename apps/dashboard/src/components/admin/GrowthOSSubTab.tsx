'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { cn, getDashboardDomain } from "@/lib/utils"
import { Zap, Globe, ShieldCheck, Terminal, TrendingUp, Info, HelpCircle, BookOpen, ChevronDown, ChevronUp, UserCheck, Sparkles, Lightbulb, Target, RefreshCw, X, Monitor, ExternalLink, FileText, Loader2, LayoutDashboard, Coins, PenTool, Flame, BarChart3, Users, Fingerprint, Wallet, Mail, ListFilter, Phone, FileSignature, Calendar, XCircle, MoreVertical, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { recordCallOutcome, getLeadInsights, toggleLeadNurture, archiveLead } from "@/actions/growth-os";
import { MarketAttackEngine } from "./growth/MarketAttackEngine";
import { CampaignPerformanceDashboard } from "./marketing/CampaignPerformanceDashboard";
import { DAOMetrics } from "../dao/DAOMetrics";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button as UIButton } from "@/components/ui/button";
import { toast } from "sonner";

interface Project {
  id: number;
  title: string;
  slug: string;
  status: string;
  allowedDomains: string[];
  discordWebhookUrl?: string | null;
}

interface Lead {
  id: string;
  email: string;
  name: string | null;
  status: string;
  intent: string;
  score: number;
  metadata: any;
  createdAt: string;
  projectName: string;
  userId: string | null;
  origin: string | null;
  fingerprint: string | null;
  identityId: string | null;
  quality: string | null;
  lastAction?: string;
  conversionValue?: string | null;
  probability?: number | null;
  priorityScore?: number;
  engagementLevel?: 'low' | 'mid' | 'high' | 'critical';
  profile?: {
    riskProfile: 'low' | 'medium' | 'high';
    investmentStyle: 'yield' | 'flip' | 'speculative';
    convictionScore: number;
  };
  intentBucket?: 'low' | 'medium' | 'high' | 'closing';
  phoneNumber?: string | null;
  walletAddress?: string | null;
}

interface Course {
  id: string;
  title: string;
  category: string;
  isActive: boolean;
  xpReward: number;
}


interface GrowthInsight {
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  type: 'strategy' | 'segmentation' | 'engagement';
}

interface LeadSuggestion {
  lead: Lead;
  attribution: {
    score: number;
    factors: {
      domainMatch: boolean;
      fingerprintMatch: boolean;
      emailMatch: boolean;
    };
  };
}


const StrategyContent = ({ type = 'monetization' }: { type?: 'monetization' | 'roadmap' }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isTestingData, setIsTestingData] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [showTestModal, setShowTestModal] = useState(false);

  useEffect(() => {
    const endpoint = type === 'roadmap' ? '/api/admin/docs/growth-roadmap' : '/api/admin/docs/monetization-plan';
    fetch(endpoint)
      .then(res => res.json())
      .then(data => {
        setContent(data.content || '');
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [type]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4 bg-zinc-950 min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Desencriptando Estrategia Maestra...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 md:p-16 bg-zinc-950 text-zinc-300 font-sans selection:bg-purple-500/30 selection:text-white leading-relaxed overflow-x-hidden relative">
      {/* Background Ambient Effects */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 blur-[120px] pointer-events-none"></div>

      <div className="max-w-3xl mx-auto space-y-10 relative z-10">
        {/* Document Header Decorator - Premium Style */}
        <div className="flex justify-between items-end border-b border-zinc-800 pb-10 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group hover:rotate-6 transition-transform">
               <span className="text-white font-black italic text-2xl">P</span>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm uppercase tracking-tighter text-white">Pandora's Protocol</span>
              <span className="text-[10px] text-purple-400 uppercase font-black tracking-[0.2em]">Strategy & Growth Engine</span>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <Badge className="bg-zinc-900 text-zinc-400 border-zinc-800 text-[9px] uppercase tracking-widest mb-2 px-3">Protocol Confidential</Badge>
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">
              Expediente: <span className="text-white">GOS-2026-MARKETING</span>
            </div>
          </div>
        </div>

        {/* Hero Concept */}
        <div className="py-6 border-l-2 border-emerald-500/30 pl-8 bg-emerald-500/5 rounded-r-2xl mb-12">
           <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-2">Executive Summary</h4>
           <p className="text-lg font-medium text-white italic leading-snug">
              "La transición de un modelo SaaS de herramientas a un modelo de socio de crecimiento basado en resultados tangibles."
           </p>
        </div>

        {/* Dynamic Content Rendering */}
        <div className="space-y-6">
          {content?.split('\n').map((line, i) => {
            const trimLine = line.trim();
            if (line.startsWith('# ')) return (
              <h1 key={i} className="text-4xl md:text-5xl font-black tracking-tighter mb-10 text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500 font-sans">
                {line.replace('# ', '')}
              </h1>
            );
            
            if (line.startsWith('## ')) return (
              <h2 key={i} className="text-2xl font-black mt-16 mb-6 text-white flex items-center gap-3">
                <span className="w-8 h-px bg-purple-500/50"></span>
                {line.replace('## ', '')}
              </h2>
            );
            
            if (line.startsWith('### ')) return (
              <h3 key={i} className="text-lg font-black mt-10 mb-4 text-purple-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {line.replace('### ', '')}
              </h3>
            );
            
            if (line.startsWith('> ')) return (
              <div key={i} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent rounded-r-xl -ml-4"></div>
                <div className="border-l-4 border-purple-500 pl-6 py-4 my-8 italic text-zinc-300 text-lg leading-relaxed relative z-10">
                  {line.replace('> ', '')}
                </div>
              </div>
            );
            
            if (trimLine === '---') return <hr key={i} className="my-14 border-zinc-800" />;
            if (trimLine === '') return null;
            
            // Table Detection
            if (line.includes('|') && !line.includes('---')) {
               const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
               if (cells.length > 0) {
                 return (
                   <div key={i} className="my-6 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
                     <table className="w-full text-left text-sm">
                       <tbody>
                         <tr className="divide-x divide-zinc-800">
                           {cells.map((td, tdi) => (
                             <td key={tdi} className="p-4 font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
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
              <div key={i} className="flex items-start gap-3 mb-3 group">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform"></div>
                <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">
                  {line.replace('- ', '')}
                </span>
              </div>
            );
            
            return (
              <p key={i} className="text-base text-zinc-400 leading-relaxed font-medium mb-6 text-pretty first-letter:text-2xl first-letter:font-black first-letter:text-white first-letter:mr-1">
                {line}
              </p>
            );
          })}
        </div>

        {/* Footer Signature - Premium Style */}
        <div className="mt-24 pt-12 border-t border-zinc-800 flex justify-between items-center bg-gradient-to-t from-zinc-900/20 to-transparent p-8 rounded-b-3xl">
             <div className="flex flex-col">
                <span className="text-[9px] uppercase font-black tracking-[0.3em] text-zinc-600 mb-1">Authenticated by</span>
                <span className="font-bold text-white tracking-tighter text-lg">Growth OS Core Engine</span>
             </div>
             <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full border border-red-500/20 flex flex-col items-center justify-center text-red-500/40 text-[7px] font-black uppercase text-center -rotate-12 border-dashed relative">
                   <div className="absolute inset-0 bg-red-500/5 rounded-full animate-pulse"></div>
                   Classified<br/>Marketing<br/>V3
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};


/**
 * Action Menu for Lead Management
 */function LeadActionMenu({ lead, onActionComplete }: { lead: Lead, onActionComplete: () => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [outcomeData, setOutcomeData] = useState({
      outcome: 'warm' as 'hot'|'warm'|'cold'|'no_show',
      notes: '',
      dealValue: 0,
      probability: 50,
      expectedCloseDate: '',
      nextStep: ''
  });

  const handleRecordCall = async () => {
    setLoading(true);
    try {
        const res = await recordCallOutcome({
            leadId: lead.id,
            ...outcomeData
        });
        if (res.success) {
            toast.success("Call outcome recorded & Engine triggered");
            setIsRecording(false);
            onActionComplete();
        } else {
            toast.error(res.error || "Failed to record outcome");
        }
    } catch (e) {
        toast.error("Internal Error");
    } finally {
        setLoading(false);
    }
  };

  const handleArchive = async () => {
    setLoading(true);
    try {
        const res = await archiveLead(lead.id);
        if (res.success) {
            toast.success("Lead archivado");
            onActionComplete();
        } else {
            toast.error(res.error || "Failed to archive");
        }
    } catch (e) {
        toast.error("Internal Error");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Dialog open={isRecording} onOpenChange={setIsRecording}>
        <DialogTrigger asChild>
          <UIButton variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-zinc-800">
            <Phone className="w-4 h-4 text-emerald-400" />
          </UIButton>
        </DialogTrigger>
        <DialogContent className="bg-zinc-950 border border-zinc-800 rounded-[2rem] text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-3">
               <Phone className="text-emerald-500" />
               Registrar Resultado de Llamada
            </DialogTitle>
            <DialogDescription className="text-zinc-500 font-medium">
               Esto actualizará el score del lead y disparará la siguiente acción del Growth OS.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 pt-6">
            <div className="grid grid-cols-2 gap-3">
                {['hot', 'warm', 'cold', 'no_show'].map((o) => (
                    <button
                        key={o}
                        onClick={() => setOutcomeData(prev => ({ ...prev, outcome: o as any }))}
                        className={cn(
                            "py-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-tighter transition-all",
                            outcomeData.outcome === o 
                                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/10"
                                : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                        )}
                    >
                        {o.replace('_', ' ')}
                    </button>
                ))}
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Notas del Deal</label>
                <textarea 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Resumen de la llamada..."
                    value={outcomeData.notes}
                    onChange={(e) => setOutcomeData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Valor Estimado ($)</label>
                    <Input 
                        type="number"
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl h-12"
                        value={outcomeData.dealValue}
                        onChange={(e) => setOutcomeData(prev => ({ ...prev, dealValue: Number(e.target.value) }))}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Probabilidad (%)</label>
                    <Input 
                        type="number"
                        min="0"
                        max="100"
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl h-12"
                        value={outcomeData.probability}
                        onChange={(e) => setOutcomeData(prev => ({ ...prev, probability: Number(e.target.value) }))}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Cierre Estimado</label>
                    <Input 
                        type="date"
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl h-12"
                        value={outcomeData.expectedCloseDate}
                        onChange={(e) => setOutcomeData(prev => ({ ...prev, expectedCloseDate: e.target.value }))}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Siguiente Paso</label>
                    <Input 
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl h-12"
                        placeholder="e.g. Enviar SOW"
                        value={outcomeData.nextStep}
                        onChange={(e) => setOutcomeData(prev => ({ ...prev, nextStep: e.target.value }))}
                    />
                </div>
            </div>
          </div>

          <DialogFooter className="mt-8">
            <UIButton 
              variant="outline" 
              onClick={() => setIsRecording(false)}
              className="rounded-xl border-zinc-800 text-zinc-400 hover:bg-zinc-900 h-10 px-6 font-bold"
            >
              Cancelar
            </UIButton>
            <UIButton 
              onClick={handleRecordCall}
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-10 px-8 font-black uppercase tracking-tighter"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar & Procesar'}
            </UIButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UIButton 
          variant="ghost" 
          size="sm" 
          disabled={loading}
          onClick={handleArchive}
          className="h-8 w-8 p-0 rounded-full hover:bg-zinc-800 group"
      >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 text-red-500/50 group-hover:text-red-400 transition-colors" />}
      </UIButton>

      {/* Manual Nurture Toggle */}
      <UIButton 
          variant="ghost" 
          size="sm" 
          disabled={loading}
          onClick={async () => {
              setLoading(true);
              const isCurrentlyEnabled = lead.metadata?.growth?.nurtureEnabled !== false;
              const res = await toggleLeadNurture(lead.id, !isCurrentlyEnabled);
              if (res.success) {
                  toast.success(`Nurturing ${!isCurrentlyEnabled ? 'activado' : 'desactivado'}`);
                  onActionComplete();
              } else {
                  toast.error("Error al cambiar estado de nurturing");
              }
              setLoading(false);
          }}
          className={cn(
              "h-8 w-8 p-0 rounded-full transition-all",
              lead.metadata?.growth?.nurtureEnabled !== false 
                  ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400" 
                  : "hover:bg-zinc-800 text-zinc-600"
          )}
          title={lead.metadata?.growth?.nurtureEnabled !== false ? "Desactivar Nurturing Educativo" : "Activar Nurturing Educativo"}
      >
          {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <BookOpen className="w-4 h-4" />}
      </UIButton>
    </div>
  );
}

export default function GrowthOSSubTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [ownerContext, setOwnerContext] = useState<'pandora' | 'client'>('pandora');
  const [scope, setScope] = useState<'b2b' | 'b2c'>('b2c');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  // Filtering States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [intentFilter, setIntentFilter] = useState('all');

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showGuide, setShowGuide] = useState(false);

  // AI Advisor States
  const [aiInsights, setAiInsights] = useState<{ insights: GrowthInsight[], summary: string } | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Growth Infra States
  const [stats, setStats] = useState({ views: 0, clicks: 0, leads: 0 });
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState<string>('');
  const [publicKey, setPublicKey] = useState<string>('pk_grow_test_xxxxxxx');
  const [secretKey, setSecretKey] = useState<string>('sk_grow_test_xxxxxxx');
  const [copied, setCopied] = useState(false);

  // Real Domain Management State
  const [newDomain, setNewDomain] = useState('');
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [loadingKey, setLoadingKey] = useState(false);

  // Unification States
  const [suggestions, setSuggestions] = useState<LeadSuggestion[]>([]);
  const [isUnifying, setIsUnifying] = useState(false);
  const [isScanningSuggestions, setIsScanningSuggestions] = useState(false);
  const [showUnifyModal, setShowUnifyModal] = useState(false);

  // Course Management States
  const [projectCourses, setProjectCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [isTogglingCourse, setIsTogglingCourse] = useState<string | null>(null);

  // Section Navigation
  const [activeSection, setActiveSection] = useState<'overview' | 'monetization' | 'content' | 'market-attack' | 'performance' | 'roadmap' | 'intelligence' | 'developers'>('overview');

  // States for testing live data
  const [isTestingData, setIsTestingData] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);

  const fetchApiKey = async (projectId: string, force?: boolean) => {
    if (projectId === 'all') {
      setPublicKey('pk_grow_test_xxxxxxx');
      setSecretKey('sk_grow_test_xxxxxxx');
      return;
    }

    setLoadingKey(true);
    // 🧹 Clear stale placeholder immediately so UI reflects loading state
    setPublicKey('Cargando...');
    setSecretKey('Cargando...');

    try {
      const project = projects.find(p => p.id === Number(projectId));
      if (!project) {
        setPublicKey('— Proyecto no encontrado —');
        setSecretKey('— Proyecto no encontrado —');
        return;
      }

      // Use slug if available, otherwise fallback to numeric ID (route handles both)
      const routeKey = project.slug || String(project.id);

      let data: any;
      let response: Response;

      if (!force) {
        response = await fetch(`/api/admin/projects/${routeKey}/keys`);
        data = await response.json().catch(() => ({}));
      }

      if (!force && response!?.ok && data?.hasKeys) {
        // Existing keys: show fingerprints
        setPublicKey(data.publicKey || '— Sin llave pública —');
        setSecretKey(data.secretKey || '— Sin llave secreta —');
      } else {
        // Generate/Regenerate
        const url = `/api/admin/projects/${routeKey}/keys${force ? '?rotate=true' : ''}`;
        response = await fetch(url, { method: 'POST' });
        data = await response.json().catch(() => ({}));
        if (response.ok) {
          setPublicKey(data.publicKey || '— Error al obtener llave —');
          setSecretKey(data.secretKey || '— Error al obtener llave —');
          if (force) toast.success("Nuevas llaves generadas exitosamente");
          else toast.success("Llaves de API generadas para este proyecto");
        } else {
          setPublicKey('— Error al generar —');
          setSecretKey('— Error al generar —');
          toast.error(data?.message || "Error al generar llaves");
        }
      }
    } catch (error) {
      console.error('Error fetching API Key:', error);
      setPublicKey('— Error de conexión —');
      setSecretKey('— Error de conexión —');
      toast.error("Fallo de conexión con el servicio de llaves");
    } finally {
      setLoadingKey(false);
    }
  };


  const handleAddDomain = () => {
    if (!newDomain) return;
    if (allowedDomains.includes(newDomain)) {
      toast.error("El dominio ya está en la lista");
      return;
    }
    if (!newDomain.includes('.')) {
      toast.error("Por favor ingresa un dominio válido");
      return;
    }

    const updatedDomains = [...allowedDomains, newDomain];
    setAllowedDomains(updatedDomains);
    setNewDomain('');
    setIsAddingDomain(false);
    saveProjectSettings({ allowedDomains: updatedDomains });
  };

  const removeDomain = (domain: string) => {
    const updatedDomains = allowedDomains.filter(d => d !== domain);
    setAllowedDomains(updatedDomains);
    saveProjectSettings({ allowedDomains: updatedDomains });
  };

  const saveProjectSettings = async (payload: any) => {
    if (selectedProjectId === 'all') return;

    try {
      const response = await fetch(`/api/admin/projects/${selectedProjectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          isBasicEdit: true
        })
      });

      if (response.ok) {
        toast.success("Configuración actualizada");
        if (payload.discordWebhookUrl !== undefined) {
           setDiscordWebhookUrl(payload.discordWebhookUrl || '');
           setProjects(prev => prev.map(p => String(p.id) === String(selectedProjectId) ? { ...p, discordWebhookUrl: payload.discordWebhookUrl } : p));
        }
      } else {
        toast.error("Error al guardar en el servidor");
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error("Error de conexión");
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/admin/projects');
      const data = await response.json();
      if (Array.isArray(data)) {
        setProjects(data);
      } else {
        console.error('Projects API returned non-array data:', data);
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

    const fetchLeads = async (projectId: string, currentScope: string) => {
      setLoadingLeads(true);
      try {
        const url = new URL('/api/admin/marketing/leads', window.location.origin);
        
        if (projectId !== 'all') {
          url.searchParams.append('projectId', projectId);
          url.searchParams.append('ownerContext', 'client');
        } else {
          // Ecosystem view: show everything owned by Pandora (B2B + Core B2C)
          url.searchParams.append('ownerContext', 'pandora');
        }
        url.searchParams.append('scope', currentScope);

      const response = await fetch(url.toString());
      const result = await response.json();
      setLeads(result.data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoadingLeads(false);
    }
  };

  const fetchAIInsights = async () => {
    if (leads.length === 0) return;
    setLoadingAI(true);
    try {
      const projectName = selectedProjectId === 'all'
        ? 'Ecosistema Pandoras'
        : projects.find(p => p.id === Number(selectedProjectId))?.title;

      const response = await fetch('/api/admin/marketing/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads, projectName })
      });
      const data = await response.json();
      setAiInsights(data);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
    } finally {
      setLoadingAI(false);
    }
  };

  const fetchSuggestions = async (projectId: string) => {
    if (projectId === 'all') {
      setSuggestions([]);
      return;
    }

    setIsScanningSuggestions(true);
    try {
      const response = await fetch(`/api/admin/marketing/leads/suggestions?projectId=${projectId}`);
      const result = await response.json();
      if (result.success) {
        setSuggestions(result.data);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsScanningSuggestions(false);
    }
  };

  const handleUnify = async (leadIds: string[]) => {
    if (selectedProjectId === 'all' || leadIds.length === 0) return;

    setIsUnifying(true);
    try {
      const response = await fetch('/api/admin/marketing/leads/unify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: Number(selectedProjectId),
          leadIds,
          attributionMethod: 'domain_match'
        })
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`¡Éxito! ${result.attributedCount} leads unificados`);
        setShowUnifyModal(false);
        fetchSuggestions(selectedProjectId);
        fetchLeads(selectedProjectId, scope);
      } else {
        toast.error("Error al unificar leads");
      }
    } catch (error) {
      console.error('Error unifying leads:', error);
      toast.error("Error de conexión");
    } finally {
      setIsUnifying(false);
    }
  };

  const fetchProjectCourses = async (projectId: string) => {
    if (projectId === 'all') {
      setProjectCourses([]);
      return;
    }

    const project = projects.find(p => p.id === Number(projectId));
    if (!project) return;

    setLoadingCourses(true);
    try {
      const response = await fetch('/api/admin/courses');
      const data = await response.json();
      
      if (response.ok && Array.isArray(data.courses)) {
        // Filter by draft-slug prefix
        const relevant = data.courses.filter((c: any) => 
          c.id.startsWith(`draft-${project.slug}`)
        );
        setProjectCourses(relevant);
      } else {
        console.error('Courses API error or malformed data:', data);
        setProjectCourses([]);
      }
    } catch (error) {
      console.error('Error fetching project courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleToggleCourseStatus = async (courseId: string, currentStatus: boolean) => {
    setIsTogglingCourse(courseId);
    try {
      const response = await fetch('/api/admin/courses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: courseId,
          isActive: !currentStatus
        })
      });

      if (response.ok) {
        toast.success(!currentStatus ? "Curso publicado globalmente" : "Curso movido a borrador privado");
        setProjectCourses(prev => prev.map(c => c.id === courseId ? { ...c, isActive: !currentStatus } : c));
      } else {
        toast.error("Error al actualizar estado del curso");
      }
    } catch (error) {
       console.error('Error toggling course status:', error);
       toast.error("Error de conexión");
    } finally {
      setIsTogglingCourse(null);
    }
  };


  useEffect(() => {
    fetchProjects();
    fetchLeads('all', 'b2c');
  }, []);

  useEffect(() => {
    const isPandora = selectedProjectId === 'all';
    setOwnerContext(isPandora ? 'pandora' : 'client');
    
    // Auto-scope logic: Pandora usually works B2B (Hunter), Clients usually B2C (Growth)
    // But we allow manual override via the selector
    fetchLeads(selectedProjectId, scope);
    setAiInsights(null); 

    if (!isPandora) {
      const project = projects.find(p => p.id === Number(selectedProjectId));
      setAllowedDomains(project?.allowedDomains || []);
      setDiscordWebhookUrl(project?.discordWebhookUrl || '');
      fetchApiKey(selectedProjectId);
      fetchSuggestions(selectedProjectId);
      fetchProjectCourses(selectedProjectId);
    } else {
      setAllowedDomains([]);
      setPublicKey('pk_grow_test_xxxxxxx');
      setSecretKey('sk_grow_test_xxxxxxx');
      setSuggestions([]);
      setDiscordWebhookUrl('');
      setProjectCourses([]);
    }
  }, [selectedProjectId, projects, scope]);

  useEffect(() => {
    setStats({
      views: Math.floor(leads.length * 4.2),
      clicks: Math.floor(leads.length * 1.8),
      leads: leads.length
    });
  }, [leads]);


  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'curious': return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
      case 'aware': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'engaged': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'hot': return 'bg-red-500/20 text-red-400 border-red-500/30 shadow-lg shadow-red-500/10';
      case 'investor': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'evangelist': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  const getPriorityBadge = (score: number = 0) => {
    if (score >= 150) return { label: 'ULTRA', color: 'text-red-500', bg: 'bg-red-500/20' };
    if (score >= 100) return { label: 'PRIORITY', color: 'text-orange-500', bg: 'bg-orange-500/20' };
    return { label: 'STANDARD', color: 'text-zinc-500', bg: 'bg-zinc-500/20' };
  };

  const getQualityColor = (quality: string) => {
    switch (quality?.toLowerCase()) {
      case 'high': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'low': return 'bg-zinc-500/20 text-zinc-500 border-zinc-500/30';
      default: return 'bg-zinc-500/10 text-zinc-600 border-zinc-800/50';
    }
  };

  const getIntentEmoji = (intent: string) => {
    switch (intent) {
      case 'invest': return '💰';
      case 'whitelist': return '📝';
      case 'earn': return '💸';
      case 'explore': return '🔍';
      default: return '👤';
    }
  };

  const getIntentDescription = (intent: string) => {
    switch (intent) {
      case 'invest': return 'Usuario interesado en invertir en la preventa o pool del protocolo.';
      case 'whitelist': return 'Usuario aplicando para acceso exclusivo o lista blanca.';
      case 'earn': return 'Interés en yield farming, staking o tareas de incentivos.';
      case 'explore': return 'Interés general en conocer el proyecto y roadmap.';
      default: return 'Intención no especificada.';
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = searchTerm === '' || 
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.walletAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesIntent = intentFilter === 'all' || lead.intent?.toLowerCase() === intentFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesIntent;
  });

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">


        {/* Lead Unification Alert (Strategic Feature) */}
        {selectedProjectId !== 'all' && (suggestions.length > 0 || isScanningSuggestions) && (
          <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/20 border border-blue-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in zoom-in-95 duration-500">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400">
                <RefreshCw className={`w-6 h-6 ${isScanningSuggestions ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <h4 className="font-bold text-white flex items-center gap-2">
                  Detección de Leads Externos
                  <Badge className="bg-blue-500 text-white border-none text-[9px] uppercase">Estrategia Activa</Badge>
                </h4>
                <p className="text-sm text-zinc-400">
                  {isScanningSuggestions
                    ? "Escaneando el pool global de leads para tu dominio..."
                    : `Hemos detectado ${suggestions.length} leads capturados vía widget global que coinciden con tus dominios.`}
                </p>
              </div>
            </div>

            <Dialog open={showUnifyModal} onOpenChange={setShowUnifyModal}>
              <DialogTrigger asChild>
                <UIButton disabled={isScanningSuggestions || suggestions.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6">
                  Revisar y Unificar
                </UIButton>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl bg-zinc-950 border-zinc-800 text-white">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-blue-400">
                    <RefreshCw className="w-5 h-5" />
                    Unificación de Audiencia (Relational)
                  </DialogTitle>
                  <DialogDescription className="text-zinc-400">
                    Atribuye leads globales a tu protocolo sin destruir el origen. Esto permite compartir analytics y rewards.
                  </DialogDescription>
                </DialogHeader>

                <div className="max-h-[400px] overflow-y-auto space-y-3 my-4 pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
                  {suggestions.map((s) => (
                    <div key={s.lead.id} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 hover:border-blue-500/20 transition-all">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">{s.lead.email}</span>
                        <span className="text-[10px] text-zinc-500 font-mono mt-1">Origin: {s.lead.origin}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <Badge className={`${s.attribution.score >= 0.5 ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'} border-none text-[10px]`}>
                            {Math.round(s.attribution.score * 100)}% Confianza
                          </Badge>
                          <p className="text-[9px] text-zinc-600 mt-1">Matching: {s.attribution.factors.domainMatch ? 'Domain' : 'Other'}</p>
                        </div>
                        <UIButton
                          size="sm"
                          variant="outline"
                          className="h-8 border-zinc-700 hover:bg-blue-600 hover:text-white"
                          onClick={() => handleUnify([s.lead.id])}
                          disabled={isUnifying}
                        >
                          Unificar
                        </UIButton>
                      </div>
                    </div>
                  ))}
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-3 border-t border-zinc-800 pt-6">
                  <p className="text-[10px] text-zinc-500 italic flex-1">
                    * Al unificar, el lead se asocia a tu proyecto pero mantiene su registro global.
                  </p>
                  <UIButton
                    onClick={() => handleUnify(suggestions.map(s => s.lead.id))}
                    disabled={isUnifying}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Unificar {suggestions.length} leads (Bulk)
                  </UIButton>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Header & Filter */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800/50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white tracking-tight">🚀 Growth OS</h3>
              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px] uppercase font-bold tracking-widest">Protocol Multi-tenant</Badge>
              <div className="flex items-center -space-x-px">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link 
                      href="/growth-os" 
                      target="_blank"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest transition-all group"
                    >
                      <Monitor className="w-3 h-3" />
                      Preview Landing
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-950 border-zinc-800 text-[10px] text-zinc-400">
                    Ver cómo los protocolos ven los paquetes de Growth OS
                  </TooltipContent>
                </Tooltip>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-zinc-600 hover:text-purple-400 transition-colors p-1 rounded-full hover:bg-white/5">
                    <HelpCircle className="w-5 h-5" />
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-white">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-purple-400">
                      <Zap className="w-5 h-5" />
                      Growth OS: Ecosistema de Demanda
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400 pt-4">
                      Infraestructura autónoma de captación y conversión. Growth OS permite a cada protocolo operar como una entidad soberana de marketing dentro del ecosistema Pandoras.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4 text-xs text-zinc-400 leading-relaxed">
                    <p>
                      A diferencia de un CRM tradicional, Growth OS combina **Inteligencia de Mercado** con **Ejecución de Contenido** en tiempo real.
                    </p>
                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1" />
                        <p><span className="text-white font-bold">Demand Engine:</span> Generación de contenido con ADN estratégico (Ángulos y Emociones).</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1" />
                        <p><span className="text-white font-bold">Relational Leads:</span> Atribución inteligente de audiencia global a protocolos específicos.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1" />
                        <p><span className="text-white font-bold">ROI Tracking:</span> Scoring algorítmico basado en conversiones reales y revenue share.</p>
                      </div>
                    </div>
                    <p className="italic text-[10px]">Utiliza el panel de Market Attack para lanzar ofensivas de marketing coordinadas en menos de 60 segundos.</p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-sm text-zinc-500 mt-1">Gestión de audiencia y captación de demanda para protocolos del ecosistema.</p>
          </div>

          <div className="flex flex-col md:flex-row items-end gap-6 w-full md:w-auto">
            {/* Context & Project Selectors (Compact Vertical Stack) */}
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <div className="flex flex-col items-start gap-1">
                <label htmlFor="context-selector" className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Contexto</label>
                <select
                  id="context-selector"
                  value={selectedProjectId === 'all' ? 'pandora' : 'client'}
                  onChange={(e) => {
                    if (e.target.value === 'pandora') {
                      setSelectedProjectId('all');
                    } else if (projects && projects.length > 0) {
                      setSelectedProjectId(String(projects[0]?.id));
                    }
                  }}
                  className="bg-zinc-950 border border-zinc-800 text-white rounded-lg px-3 py-1 text-xs focus:ring-1 focus:ring-purple-500/50 outline-none w-full md:w-44 shadow-lg hover:border-zinc-700 transition-all cursor-pointer h-8"
                >
                  <option value="pandora">🛡️ Pandora Ecosystem</option>
                  <option value="client">🚀 Active Project</option>
                </select>
              </div>

              {selectedProjectId !== 'all' && (
                <div className="flex flex-col items-start gap-1 animate-in fade-in slide-in-from-top-1 duration-300">
                  <label className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Protocolo</label>
                  <select
                    id="project-selector"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 text-white rounded-lg px-3 py-1 text-xs focus:ring-1 focus:ring-purple-500/50 outline-none w-full md:w-44 shadow-lg hover:border-zinc-700 transition-all cursor-pointer h-8"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Scope / Mode Selector */}
            <div className="flex flex-col items-start gap-1 w-full md:w-auto border-l border-zinc-800/50 pl-6">
              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Modo de Captación</label>
              <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 h-10">
                <button
                  onClick={() => setScope('b2b')}
                  className={cn(
                    "px-4 py-0 rounded-lg text-xs font-bold transition-all",
                    scope === 'b2b' ? "bg-purple-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  Hunter (B2B)
                </button>
                <button
                  onClick={() => setScope('b2c')}
                  className={cn(
                    "px-4 py-0 rounded-lg text-xs font-bold transition-all",
                    scope === 'b2c' ? "bg-blue-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  Growth (B2C)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Global Sub-Navigation */}
        <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800/50 w-full overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'monetization', label: 'Strategy', icon: <Coins className="w-4 h-4" /> },
            { id: 'roadmap', label: 'Roadmap', icon: <BookOpen className="w-4 h-4 text-purple-400" /> },
            { id: 'intelligence', label: 'Governance IQ', icon: <Sparkles className="w-4 h-4 text-blue-400" /> },
            { id: 'content', label: 'Content', icon: <PenTool className="w-4 h-4" /> },
            { id: 'market-attack', label: 'Market Attack', icon: <Flame className="w-4 h-4 text-orange-500" /> },
            { id: 'performance', label: 'Performance', icon: <BarChart3 className="w-4 h-4 text-emerald-500" /> },
            { id: 'developers', label: 'Developers', icon: <Monitor className="w-4 h-4 text-indigo-400" /> },
          ].map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-1",
                activeSection === section.id 
                  ? "bg-zinc-900 text-white shadow-xl shadow-black/40 border border-zinc-800" 
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {section.icon}
              {section.label}
              {section.id === 'market-attack' && <Badge className="ml-1 bg-orange-500 text-white text-[8px] px-1 py-0 h-4 border-none animate-pulse">HOT</Badge>}
            </button>
          ))}
        </div>

        {activeSection === 'market-attack' && (
          <MarketAttackEngine 
            projectId={selectedProjectId} 
            projectName={selectedProjectId === 'all' ? 'Pandora Global' : projects.find(p => String(p.id) === String(selectedProjectId))?.title} 
          />
        )}

        {activeSection === 'intelligence' && (
          <div className="space-y-6">
             <div className="bg-gradient-to-r from-blue-900/20 to-zinc-900/40 p-8 rounded-3xl border border-blue-500/20 mb-8">
                <h3 className="text-2xl font-black text-white italic flex items-center gap-3 mb-2">
                   <Sparkles className="w-7 h-7 text-blue-400" /> 
                   Governance Growth Engine (GGE)
                </h3>
                <p className="text-zinc-400 text-sm max-w-2xl font-medium">
                   Optimización de la captura de poder basada en marketing estratégico. Aquí monitoreamos cómo tus campañas se convierten en decisiones de protocolo.
                </p>
             </div>
             <DAOMetrics projectId={Number(selectedProjectId === 'all' ? 0 : selectedProjectId)} />
          </div>
        )}

        {activeSection === 'monetization' && (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl overflow-hidden min-h-[600px] flex flex-col">
            <div className="p-8 border-b border-zinc-800 bg-zinc-900/60">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Coins className="w-6 h-6 text-yellow-400" />
                Monetization Master Plan
              </h3>
              <p className="text-sm text-zinc-500">Plan estratégico para la viabilidad económica del ecosistema.</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              <StrategyContent type="monetization" />
            </div>
          </div>
        )}

        {activeSection === 'roadmap' && (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl overflow-hidden min-h-[600px] flex flex-col">
            <div className="p-8 border-b border-zinc-800 bg-zinc-900/60">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-purple-400" />
                Growth OS Roadmap
              </h3>
              <p className="text-sm text-zinc-500">Hoja de ruta física del desarrollo y despliegue del motor de crecimiento.</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              <StrategyContent type="roadmap" />
            </div>
          </div>
        )}

        {activeSection === 'overview' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Guía de Inicio Rápido (Top Section) */}
            <div className="bg-gradient-to-r from-purple-900/20 to-indigo-900/10 border border-purple-500/20 rounded-2xl overflow-hidden shadow-2xl">
              <button
                onClick={() => setShowGuide(!showGuide)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-white text-sm">¿Cómo usar Growth House?</h4>
                    <p className="text-xs text-zinc-400">Guía rápida para maximizar el crecimiento de tus protocolos.</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mr-4" onClick={(e) => e.stopPropagation()}>
                    <Dialog>
                        <DialogTrigger asChild>
                            <UIButton variant="outline" size="sm" className="bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20 text-[10px] font-black uppercase tracking-widest h-8 px-4 rounded-xl">
                                <Zap className="w-3 h-3 mr-2" />
                                Acquisition Playbook
                            </UIButton>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-300 max-w-2xl max-h-[80vh] overflow-y-auto rounded-[2.5rem] selection:bg-purple-500/30">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black text-white flex items-center gap-3">
                                    <Target className="text-purple-500" />
                                    Institutional Acquisition Playbook
                                </DialogTitle>
                                <DialogDescription className="text-zinc-500 uppercase text-[10px] font-bold tracking-[0.2em]">
                                    Phase 85: Deterministic Closing Machine
                                </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-8 py-6">
                                <section className="space-y-3">
                                    <h3 className="text-purple-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                        <Fingerprint className="w-4 h-4" />
                                        1. El Funnel Psicológico
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                                        {[
                                            { s: 'CURIOUS', d: 'Interés inicial, navegando.' },
                                            { s: 'AWARE', d: 'Entiende el valor, consume docs.' },
                                            { s: 'ENGAGED', d: 'Wallet conectada, comportamiento activo.' },
                                            { s: 'HOT', d: 'Umbral de convicción alcanzado. (TARGET)' }
                                        ].map(item => (
                                            <div key={item.s} className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                                                <span className="block font-black text-white mb-1">{item.s}</span>
                                                <span className="text-zinc-500">{item.d}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="space-y-3">
                                    <h3 className="text-emerald-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                        <Flame className="w-4 h-4" />
                                        2. Cómo Cerrar (Closing Strike)
                                    </h3>
                                    <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl space-y-3">
                                        <p className="text-sm font-medium text-zinc-300 italic">"El sistema identifica oportunidades de strike basadas en el Priority Score (Intent × Wallet × Decay)."</p>
                                        <ul className="space-y-2 text-xs text-zinc-400">
                                            <li className="flex gap-2">
                                                <span className="text-emerald-500 font-bold">1.</span>
                                                <span>Busca leads en estado <strong className="text-white">HOT</strong> con <strong className="text-white">Priority {'>'} 120</strong>.</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="text-emerald-500 font-bold">2.</span>
                                                <span>El sistema dispara <strong className="text-white">SALES_INTERVENTION</strong> (Alerta Discord + Pitch personalizado).</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="text-emerald-500 font-bold">3.</span>
                                                <span>Usa el <strong className="text-white">Lead Brief</strong> generado para el toque humano final.</span>
                                            </li>
                                        </ul>
                                    </div>
                                </section>

                                <section className="space-y-3">
                                    <h3 className="text-blue-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                        <Coins className="w-4 h-4" />
                                        3. Oferta Dinámica & Escasez
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
                                            <h4 className="text-[10px] font-black text-zinc-500 uppercase mb-2">Resolución de Hook</h4>
                                            <p className="text-xs">El motor elige entre <strong className="text-white">Fixed Yield Tier</strong> (Perfil Conservador) o <strong className="text-white">Equity Upside</strong> (Perfil Especulativo).</p>
                                        </div>
                                        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
                                            <h4 className="text-[10px] font-black text-zinc-500 uppercase mb-2">Escasez Pro</h4>
                                            <p className="text-xs">Usa el contador de <strong className="text-white">Slots Remaining</strong> en tus seguimientos manuales para crear urgencia real.</p>
                                        </div>
                                    </div>
                                </section>

                                <div className="pt-6 border-t border-zinc-800">
                                    <p className="text-[9px] uppercase font-black tracking-[0.3em] text-zinc-600 text-center">Protocol Confidential // Acquisition Machine v3.0</p>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                    {showGuide ? <ChevronUp className="text-zinc-500" /> : <ChevronDown className="text-zinc-500" />}
                </div>
              </button>

              {showGuide && (
                <div className="p-6 pt-0 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-widest">
                      <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px]">1</span>
                      Captura Automática
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Usa nuestra API o el Widget en las landings de tus protocolos. Los leads se sincronizan en tiempo real aquí.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px]">2</span>
                      Filtrado Inteligente
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Usa el selector de proyecto para ver métricas específicas. Verás el **"Quality Score"** calculado por nuestro motor de IA.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-400 font-bold text-xs uppercase tracking-widest">
                      <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-[10px]">3</span>
                      Acción de CRM
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Identifica a los **"Usuarios Verificados"** (con cuenta en Pandoras) para priorizar whitelists y oportunidades de inversión.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800 hover:border-blue-500/30 transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Globe className="w-5 h-5" /></div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="text-xs font-bold text-zinc-600 flex items-center gap-1 cursor-help hover:text-blue-400 p-0.5 rounded transition-colors group/info">
                        AUDIENCIA <Info className="w-3 h-3 group-hover/info:animate-pulse" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
                      <DialogHeader>
                        <DialogTitle className="text-blue-400 flex items-center gap-2">
                          <Globe className="w-5 h-5" />
                          Audiencia Total
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                          Número total de correos únicos capturados para este proyecto a través de todos los canales de entrada (Widget, API, Formulario).
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="text-3xl font-bold text-white">{leads.length}</div>
                <div className="text-xs text-zinc-500 mt-1">Total Leads capturados</div>
              </div>

          <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800 hover:border-green-500/30 transition-all">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-green-500/10 rounded-lg text-green-400"><ShieldCheck className="w-5 h-5" /></div>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-xs font-bold text-zinc-600 flex items-center gap-1 cursor-help hover:text-green-400 p-0.5 rounded transition-colors group/info">
                    WHITELIST <Info className="w-3 h-3 group-hover/info:animate-pulse" />
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-green-400 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5" />
                      Sistema de Whitelist
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                      Usuarios que han sido marcados como aprobados o prioritarios. Esto permite filtrar a los usuarios con mayor potencial de interacción con el protocolo.
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
            <div className="text-3xl font-bold text-white">
              {leads.filter(l => l.status === 'whitelisted').length}
            </div>
            <div className="text-xs text-green-500/70 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {Math.round((leads.filter(l => l.status === 'whitelisted').length / (leads.length || 1)) * 100)}% conversión
            </div>
          </div>

          <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800 hover:border-purple-500/30 transition-all">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Zap className="w-5 h-5" /></div>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-xs font-bold text-zinc-600 flex items-center gap-1 cursor-help hover:text-purple-400 p-0.5 rounded transition-colors group/info">
                    INTENCIÓN <Info className="w-3 h-3 group-hover/info:animate-pulse" />
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-purple-400 flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Nivel de Intención
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                      Usuarios que han completado formularios de Whitelist o han expresado interés explícito en participar en rondas de preventa o staking.
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
            <div className="text-3xl font-bold text-white">
              {leads.filter(l => l.intent === 'whitelist').length}
            </div>
            <div className="text-xs text-zinc-500 mt-1">Aplicantes a Whitelist</div>
          </div>

          <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800 hover:border-orange-500/30 transition-all">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400 font-mono font-bold">QS</div>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-xs font-bold text-zinc-600 flex items-center gap-1 cursor-help hover:text-orange-400 p-0.5 rounded transition-colors group/info">
                    QUALITY <Info className="w-3 h-3 group-hover/info:animate-pulse" />
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-orange-400 flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Quality Score (QS)
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                      Nuestro motor de IA puntúa cada lead basándose en su comportamiento, completitud de perfil y acciones on-chain vinculadas.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4 text-xs text-zinc-400">
                    <div className="flex justify-between items-center p-3 bg-zinc-900 rounded-xl">
                      <span>Intención de Inversión</span>
                      <span className="text-green-400">+30 pts</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-zinc-900 rounded-xl">
                      <span>Usuario Registrado en Pandoras</span>
                      <span className="text-blue-400">+20 pts</span>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="text-3xl font-bold text-white">
              {Math.round(leads.reduce((acc, l) => acc + (l.score || 0), 0) / (leads.length || 1))}
            </div>
            <div className="text-xs text-zinc-500 mt-1">Avg. Lead Score</div>
          </div>
        </div>

        {/* AI Growth Advisor Panel */}
        <div className="bg-gradient-to-br from-indigo-950/40 via-purple-950/40 to-zinc-950/40 border border-purple-500/20 rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-purple-500/10 blur-[100px] group-hover:bg-purple-500/20 transition-all duration-1000"></div>

          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  AI Growth Advisor
                  <Badge className="bg-white/10 text-white/70 border-white/10 text-[10px] uppercase">Beta</Badge>
                </h4>
                <p className="text-sm text-zinc-400">Analiza tu audiencia y genera recomendaciones estratégicas.</p>
              </div>
            </div>

            <button
              onClick={fetchAIInsights}
              disabled={loadingAI || leads.length === 0}
              className="bg-white text-zinc-950 px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group-active:scale-95"
            >
              {loadingAI ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Procesando Audiencia...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4" />
                  Generar Insights
                </>
              )}
            </button>
          </div>

          {!aiInsights && !loadingAI ? (
            <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-3xl group-hover:border-purple-500/20 transition-colors">
              <div className="p-4 bg-zinc-900/50 rounded-full mb-4">
                <Lightbulb className="w-8 h-8 text-zinc-700" />
              </div>
              <p className="text-sm font-medium text-zinc-500 mb-1 italic">Presiona el botón para iniciar el análisis inteligente.</p>
              <p className="text-xs text-zinc-600 tracking-wide uppercase">Pro Marketing Engine</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {loadingAI ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800 animate-pulse">
                    <div className="w-12 h-12 bg-zinc-800 rounded-xl mb-4"></div>
                    <div className="h-4 bg-zinc-800 rounded w-3/4 mb-3"></div>
                  </div>
                ))
              ) : (
                aiInsights?.insights?.map((insight, idx) => (
                  <div key={idx} className="bg-zinc-900/60 rounded-2xl p-6 border border-zinc-800 hover:border-purple-400/30 hover:bg-zinc-900/80 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-2 rounded-xl text-white ${insight.type === 'strategy' ? 'bg-blue-500/20 text-blue-400' :
                        insight.type === 'segmentation' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {insight.type === 'strategy' ? <Target className="w-5 h-5" /> :
                        insight.type === 'segmentation' ? <Globe className="w-5 h-5" /> :
                        <Zap className="w-5 h-5" />}
                      </div>
                    </div>
                    <h5 className="font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">{insight.title}</h5>
                    <p className="text-xs text-zinc-400 leading-relaxed font-medium">{insight.description}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Lead List Table (New Section) */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-zinc-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                <Users className="text-blue-500" />
                {scope === 'b2b' ? 'Hunter Leads (B2B)' : 'Growth Leads (B2C)'}
              </h3>
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-1">
                {selectedProjectId === 'all' ? 'Pandora Ecosystem' : 'Project Specific'} • {leads.length} Records
              </p>
            </div>

            {/* Subtle Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:flex-none lg:w-64 group">
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 group-focus-within:text-purple-400 transition-colors" />
                <Input 
                  placeholder="Buscar por email o wallet..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 h-9 pl-9 text-xs rounded-xl focus:ring-1 focus:ring-purple-500/50 outline-none transition-all"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-zinc-400 rounded-xl px-4 h-9 text-[10px] font-black uppercase tracking-widest focus:ring-1 focus:ring-purple-500/50 outline-none cursor-pointer transition-all hover:border-zinc-700"
              >
                <option value="all">TODOS LOS ESTADOS</option>
                <option value="curious">CURIOUS</option>
                <option value="aware">AWARE</option>
                <option value="engaged">ENGAGED</option>
                <option value="hot">HOT</option>
                <option value="whitelister">WHITELISTER</option>
              </select>

              <select
                value={intentFilter}
                onChange={(e) => setIntentFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-zinc-400 rounded-xl px-4 h-9 text-[10px] font-black uppercase tracking-widest focus:ring-1 focus:ring-purple-500/50 outline-none cursor-pointer transition-all hover:border-zinc-700"
              >
                <option value="all">TODAS LAS INTENCIONES</option>
                <option value="invest">INVEST</option>
                <option value="whitelist">WHITELIST</option>
                <option value="earn">EARN</option>
                <option value="explore">EXPLORE</option>
              </select>

              <Badge className={cn("px-4 py-2 border-none font-black text-[10px] hidden sm:flex", 
                scope === 'b2b' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
              )}>
                {scope === 'b2b' ? 'B2B ENGINE' : 'B2C ENGINE'}
              </Badge>
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            <table className="w-full text-left min-w-[1100px]">
              <thead>
                <tr className="bg-zinc-950/50 text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-800">
                  <th className="px-8 py-4">Lead Identity</th>
                  <th className="px-8 py-4">Persona</th>
                  <th className="px-8 py-4">Source / Origin</th>
                   <th className="px-8 py-4">Status / Funnel</th>
                  <th className="px-8 py-4">Priority / Score</th>
                  <th className="px-8 py-4">Behavioral Profile</th>
                  <th className="px-8 py-4">Forecast ($)</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center justify-center opacity-30">
                        <Users className="w-12 h-12 mb-4" />
                        <p className="text-sm font-bold italic">No leads found with current filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((l) => (
                    <tr key={l.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors uppercase tracking-tight">
                            {l.name || (l.email ? l.email.split('@')[0] : 'Anonymous')}
                          </span>
                          <span className="text-[10px] text-zinc-600 font-mono mt-0.5" title={l.id}>Hash: {l.id.split('-')[0]}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                             <Mail className={cn("w-3 h-3 transition-colors", l.email ? "text-blue-400" : "text-zinc-700")} />
                             <span className={cn("text-[10px] font-medium", l.email ? "text-zinc-300" : "text-zinc-600")}>
                               {l.email || 'Email missing'}
                             </span>
                          </div>
                          <div className="flex items-center gap-2">
                             <Wallet className={cn("w-3 h-3 transition-colors", l.walletAddress ? "text-purple-400" : "text-zinc-700")} />
                             <span className={cn("text-[10px] font-mono", l.walletAddress ? "text-zinc-300" : "text-zinc-600")}>
                               {l.walletAddress ? `${l.walletAddress.slice(0, 6)}...${l.walletAddress.slice(-4)}` : 'Wallet missing'}
                             </span>
                          </div>
                          <div className="flex items-center gap-2">
                             <Phone className={cn("w-3 h-3 transition-colors", l.phoneNumber ? "text-emerald-400" : "text-zinc-700")} />
                             <span className={cn("text-[10px] font-medium", l.phoneNumber ? "text-emerald-300" : "text-zinc-600")}>
                               {l.phoneNumber || 'Phone missing'}
                             </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-zinc-400">{l.projectName || 'Pandora Global'}</span>
                          <span className="text-[9px] text-zinc-600 truncate max-w-[150px]" title={l.origin || ''}>{l.origin || 'Direct Capture'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-1.5">
                          <Badge className={cn("text-[9px] font-black uppercase border-none w-fit px-3 py-1", getStatusColor(l.status))}>
                            {l.status}
                          </Badge>
                          <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest leading-none">{l.intent || 'EXPLORE'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                           <div className="flex items-center gap-2">
                              <span className={cn("text-base font-black", l.priorityScore && l.priorityScore > 100 ? "text-red-500" : "text-white")}>
                                {l.priorityScore || 0}
                              </span>
                              {l.priorityScore && l.priorityScore > 120 && (
                                <Flame className="w-4 h-4 text-red-500 animate-pulse" />
                              )}
                           </div>
                           <div className="flex items-center gap-1.5">
                              <span className="text-[9px] text-zinc-500 font-bold uppercase">QS: {l.score || 0}</span>
                              <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500" style={{ width: `${Math.min(l.score || 0, 100)}%` }} />
                              </div>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-wrap gap-1.5">
                          {l.quality && (
                            <Badge className={cn("text-[8px] border-none uppercase px-2 py-0.5", getQualityColor(l.quality))}>
                              {l.quality} QUALITY
                            </Badge>
                          )}
                          {l.profile?.riskProfile && (
                            <Badge variant="outline" className="text-[8px] bg-zinc-950 border-zinc-800 text-zinc-400">
                              {l.profile.riskProfile.toUpperCase()} RISK
                            </Badge>
                          )}
                          {l.engagementLevel === 'critical' && (
                            <Badge className="bg-red-500/20 text-red-500 text-[8px] animate-pulse border-none">CRITICAL</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white">
                            ${(Number(l.conversionValue || 0)).toLocaleString()}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[9px] text-zinc-500 font-black">{l.probability || 0}% CLOSED</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <LeadActionMenu lead={l} onActionComplete={() => fetchLeads(selectedProjectId, scope)} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

          </div>
        )}

        {activeSection === 'content' && (
          <div className="space-y-6">
            {selectedProjectId === 'all' ? (
              <div className="bg-zinc-900/40 border-2 border-dashed border-zinc-800 rounded-3xl p-20 flex flex-col items-center justify-center text-center">
                <PenTool className="w-12 h-12 text-zinc-700 mb-4" />
                <h4 className="text-white font-bold text-lg mb-2">Editor de Contenido por Proyecto</h4>
                <p className="text-zinc-500 max-w-md">Selecciona un proyecto específico para gestionar sus cursos, guías de educación y threads autogenerados.</p>
              </div>
            ) : (
              <div className="animate-in fade-in duration-500">
                {/* Project Course Manager */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white flex items-center gap-2">
                          Gestor de Contenido Educativo
                          <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">Marketing Nurturing</Badge>
                        </h4>
                        <p className="text-sm text-zinc-500">Administra los cursos autogenerados por IA para nutrir a tus leads.</p>
                      </div>
                    </div>
                  </div>

                  {loadingCourses ? (
                    <div className="py-12 flex justify-center">
                      <RefreshCw className="w-8 h-8 text-zinc-800 animate-spin" />
                    </div>
                  ) : projectCourses.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-3xl">
                      <BookOpen className="w-8 h-8 text-zinc-800 mb-3" />
                      <p className="text-sm text-zinc-600">Aún no hay cursos generados para este protocolo.</p>
                      <p className="text-[10px] text-zinc-700 mt-1 uppercase font-bold">Se crean automáticamente al capturar el primer lead</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {projectCourses.map((course) => (
                        <div key={course.id} className="bg-zinc-950/50 p-5 rounded-2xl border border-zinc-800 flex items-center justify-between group hover:border-blue-500/30 transition-all">
                          <div className="flex items-center gap-4 overflow-hidden">
                            <div className={`p-2 rounded-xl ${course.isActive ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>
                              {course.isActive ? <Globe className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                            </div>
                            <div className="overflow-hidden">
                              <h5 className="font-bold text-sm text-white truncate">{course.title}</h5>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-zinc-500 font-mono uppercase">{course.id}</span>
                                <span className="text-zinc-700 text-[10px]">|</span>
                                <span className="text-[10px] text-zinc-400">{course.category}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0 ml-4">
                            <Badge className={cn(
                              "text-[9px] uppercase font-black px-2 py-0.5 border-none",
                              course.isActive ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400"
                            )}>
                              {course.isActive ? "Público" : "Privado (Draft)"}
                            </Badge>
                            
                            <UIButton
                              size="sm"
                              variant={course.isActive ? "outline" : "default"}
                              className={cn(
                                "h-8 text-[10px] font-bold rounded-xl",
                                course.isActive ? "border-zinc-800 text-zinc-400 hover:bg-zinc-900" : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
                              )}
                              disabled={isTogglingCourse === course.id}
                              onClick={() => handleToggleCourseStatus(course.id, course.isActive)}
                            >
                              {isTogglingCourse === course.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                              ) : course.isActive ? (
                                "Mover a Privado"
                              ) : (
                                <>
                                  <Globe className="w-3 h-3 mr-1" />
                                  Publicar Globalmente
                                </>
                              )}
                            </UIButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-6 flex items-center gap-2 p-3 bg-zinc-950/30 rounded-xl border border-zinc-800/50">
                    <Info className="w-4 h-4 text-zinc-600" />
                    <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                      <strong>Nota:</strong> Los cursos marcados como "Privados" solo son accesibles mediante el enlace directo enviado a los leads. Al "Publicar Globalmente", el curso aparecerá en el marketplace principal de la Academia Pandoras.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {activeSection === 'performance' && (
          <CampaignPerformanceDashboard projectId={Number(selectedProjectId)} />
        )}
        {activeSection === 'developers' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Developer Hub Header */}
            <div className="bg-gradient-to-r from-zinc-900/40 to-indigo-950/20 p-8 rounded-[2.5rem] border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-black text-white italic flex items-center gap-3 mb-2">
                  <Monitor className="w-7 h-7 text-indigo-400" />
                  Developer Hub
                </h3>
                <p className="text-zinc-400 text-sm max-w-2xl font-medium">
                  {selectedProjectId === 'all' 
                    ? "Configuración global para integraciones externas y gestión del Pandora Growth Widget."
                    : "Configuración técnica, integración de webhooks y gestión de dominios autorizados para el Growth Widget v2.0."}
                </p>
              </div>

              <UIButton 
                onClick={() => setShowDocsModal(true)}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest px-8 h-12 rounded-2xl shadow-lg shadow-indigo-500/20 shrink-0"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Guía de Integración
              </UIButton>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Keys & Webhooks */}
              <div className="lg:col-span-2 space-y-6">
                {/* Integration Keys */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6">
                  <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-purple-400" />
                    API Credentials {selectedProjectId === 'all' && <Badge variant="outline" className="text-[8px] border-zinc-700 text-zinc-500 uppercase">Global</Badge>}
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Public Key</label>
                      <div className="flex bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-400 font-mono items-center justify-between">
                        <span className={cn(
                          "mr-4", 
                          !publicKey.includes('...') && publicKey !== 'Cargando...' && "text-white font-bold"
                        )}>
                          {publicKey}
                        </span>
                        <UIButton variant="ghost" size="sm" className="h-6 text-[8px]" onClick={() => {
                          navigator.clipboard.writeText(publicKey);
                          toast.success("Public Key copiada");
                        }}>COPY</UIButton>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                        Secret Key {secretKey.includes('...') && <span className="text-orange-400/60 lowercase ml-2 font-normal italic">(fingerprint)</span>}
                      </label>
                      <div className="flex bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-400 font-mono items-center justify-between">
                        <span className={cn(
                          "mr-4 italic",
                          secretKey.includes('...') ? 'text-zinc-600' : 'text-purple-400 font-bold not-italic'
                        )}>
                            {secretKey}
                        </span>
                        <UIButton variant="ghost" size="sm" className="h-6 text-[8px]" onClick={() => {
                          navigator.clipboard.writeText(secretKey);
                          toast.success("Secret Key copiada");
                        }}>COPY</UIButton>
                      </div>
                      {secretKey.includes('...') && (
                        <p className="text-[9px] text-zinc-600 ml-1 italic">Para ver la llave completa por seguridad, debe regenerarla.</p>
                      )}
                    </div>

                    {selectedProjectId !== 'all' && (
                      <div className="pt-2">
                        <UIButton 
                          variant="outline" 
                          size="sm" 
                          disabled={loadingKey}
                          onClick={() => fetchApiKey(selectedProjectId, true)}
                          className="w-full rounded-xl border-dashed border-zinc-700 text-zinc-500 hover:text-white hover:border-zinc-500 text-[9px] h-8 font-black uppercase tracking-widest"
                        >
                          {loadingKey ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <RefreshCw className="w-3 h-3 mr-2" />}
                          Regenerar Credenciales (Rotar Llaves)
                        </UIButton>
                        <p className="text-[8px] text-zinc-600 mt-2 italic px-1">
                          * Al regenerar, las llaves anteriores dejarán de funcionar instantáneamente.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Webhook Configuration */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6">
                  <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-400" />
                    Notifications / Webhooks {selectedProjectId === 'all' && <Badge variant="outline" className="text-[8px] border-zinc-700 text-zinc-500 uppercase">Default</Badge>}
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Discord Webhook URL</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://discord.com/api/webhooks/..."
                          value={discordWebhookUrl}
                          onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                          className="bg-zinc-950 border-zinc-800 text-white rounded-xl h-10 text-xs"
                          disabled={selectedProjectId === 'all'}
                        />
                        <UIButton
                          onClick={() => saveProjectSettings({ discordWebhookUrl })}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6 h-10"
                          disabled={selectedProjectId === 'all'}
                        >
                          Guardar
                        </UIButton>
                      </div>
                      <p className="text-[9px] text-zinc-500 mt-1 italic">
                        {selectedProjectId === 'all' 
                          ? "Selecciona un protocolo específico para configurar notificaciones personalizadas de Discord."
                          : "Recibe alertas automáticas en Discord cuando se capture un nuevo lead para este protocolo."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Domain Management */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-400" />
                      Authorized Domains {selectedProjectId === 'all' && <Badge variant="outline" className="text-[8px] border-zinc-700 text-zinc-500 uppercase">Global</Badge>}
                    </h4>
                    <Dialog open={isAddingDomain} onOpenChange={setIsAddingDomain}>
                      <DialogTrigger asChild>
                        <UIButton size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg h-8 px-4 text-[10px]">
                          + ADD DOMAIN
                        </UIButton>
                      </DialogTrigger>
                      <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
                        <DialogHeader>
                          <DialogTitle>Autorizar Nuevo Dominio</DialogTitle>
                          <DialogDescription>El widget solo funcionará en los dominios que agregues a esta lista.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Input
                            placeholder="ejemplo.com"
                            value={newDomain}
                            onChange={(e) => setNewDomain(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
                            className="bg-zinc-900 border-zinc-800"
                          />
                        </div>
                        <DialogFooter>
                          <UIButton onClick={handleAddDomain} className="bg-emerald-600 hover:bg-emerald-700">Guardar Dominio</UIButton>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-2">
                    {allowedDomains.length === 0 ? (
                      <div className="py-8 text-center border-2 border-dashed border-zinc-800 rounded-2xl">
                        <p className="text-xs text-zinc-600 font-medium">No hay dominios autorizados</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {allowedDomains.map((domain) => (
                          <div key={domain} className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-xl group hover:border-emerald-500/30 transition-all">
                            <span className="text-xs text-zinc-300 font-medium">{domain}</span>
                            <button
                              onClick={() => removeDomain(domain)}
                              className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Reference & Quick Start */}
              <div className="space-y-6">
                {/* Lead Attributes Table */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6">
                  <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <ListFilter className="w-4 h-4 text-orange-400" />
                    Lead Attributes
                  </h4>
                  <div className="space-y-3">
                    {[
                      { key: 'email', type: 'string', desc: 'Correo principal' },
                      { key: 'name', type: 'string', desc: 'Nombre del titular' },
                      { key: 'intent', type: 'enum', desc: 'whitelist, invest, earn' },
                      { key: 'score', type: 'number', desc: 'Quality Score (0-100)' },
                      { key: 'origin', type: 'string', desc: 'URL de captación' },
                    ].map((attr) => (
                      <div key={attr.key} className="flex justify-between items-start pb-2 border-b border-zinc-800/50 last:border-0">
                        <div className="flex flex-col">
                          <code className="text-[10px] text-orange-400 font-bold">{attr.key}</code>
                          <span className="text-[9px] text-zinc-500">{attr.desc}</span>
                        </div>
                        <Badge variant="outline" className="text-[8px] bg-zinc-950 font-mono border-zinc-800 text-zinc-600">{attr.type}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Infrastructure Quick Health */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6">
                   <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      Technical Health
                   </h4>
                   <UIButton
                      disabled={selectedProjectId === 'all'}
                      onClick={async () => {
                        setIsTestingData(true);
                        setShowTestModal(true);
                        try {
                          const project = projects.find(p => String(p.id) === String(selectedProjectId));
                          if (!project) return;
                          const [configRes, stateRes] = await Promise.all([
                            fetch(`/api/public/project/${project.slug}/config?apiKey=${publicKey}`),
                            fetch(`/api/public/project/${project.slug}/state?apiKey=${publicKey}`)
                          ]);
                          const config = await configRes.json();
                          const state = await stateRes.json();
                          setTestResult({ config, state });
                        } catch (error) {
                          console.error('Error testing live data:', error);
                          toast.error("Error al recuperar datos en tiempo real");
                        } finally {
                          setIsTestingData(false);
                        }
                      }}
                      className={cn(
                        "w-full font-bold rounded-xl h-10 text-xs shadow-lg",
                        selectedProjectId === 'all' 
                          ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20"
                      )}
                   >
                     {selectedProjectId === 'all' ? "SELECCIONA PROTOCOLO" : "VERIFICAR ENDPOINTS"}
                   </UIButton>
                </div>
              </div>
            </div>

            {/* Checkout Links Generator */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                 <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white flex items-center gap-2">
                      Payment Links Generados
                      <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">Checkout Hub</Badge>
                    </h4>
                    <p className="text-sm text-zinc-500">Enlaces de pago de alto cierre para usar en páginas externas.</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                 {['silver', 'gold', 'platinum'].map(tier => {
                    const projectUrlSlug = selectedProjectId === 'all' ? 'global' : projects.find(p => String(p.id) === String(selectedProjectId))?.slug;
                    const url = `${getDashboardDomain()}/pay/${projectUrlSlug}/${tier}`;
                    return (
                        <div key={tier} className="bg-zinc-950 border border-zinc-800 hover:border-emerald-500/30 transition-all rounded-2xl p-5 relative group">
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <UIButton size="sm" className="h-7 text-[8px] uppercase tracking-widest font-black bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl" onClick={() => {
                                navigator.clipboard.writeText(url);
                                toast.success("Enlace de pago copiado");
                              }}>Copia</UIButton>
                            </div>
                            <h5 className="font-bold text-white text-sm capitalize mb-1 flex items-center gap-2">{tier} Tier</h5>
                            <p className="text-[10px] text-emerald-500 font-mono truncate">{url}</p>
                        </div>
                    );
                 })}
              </div>
            </div>

            {/* Bottom Section: Injection Snippet */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white flex items-center gap-2">
                      Quick Widget Injection
                      <Badge variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-400">SDK v2.0</Badge>
                    </h4>
                    <p className="text-sm text-zinc-500">Copia este snippet en el {'<body>'} de la landing page {selectedProjectId === 'all' ? 'externa' : 'de tu protocolo'}.</p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-950 rounded-3xl p-8 font-mono text-sm text-zinc-400 border border-zinc-800 relative group overflow-hidden">
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <UIButton className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-6" onClick={() => {
                    const project = projects.find(p => String(p.id) === String(selectedProjectId));
                    const projectSlug = project?.slug || (selectedProjectId === 'all' ? 'global' : selectedProjectId);
                    const snippet = `<!-- Pandoras Growth OS Widget -->\n<script \n  src="${getDashboardDomain()}/api/widget/v1.js" \n  data-project-id="${projectSlug}" \n  data-api-key="${publicKey}" \n  data-theme="premium"\n></script>`;
                    navigator.clipboard.writeText(snippet);
                    toast.success("Snippet copiado");
                  }}>COPY SNIPPET</UIButton>
                </div>
                <code>
                  <span className="text-zinc-600">{'<!-- Pandoras Growth OS Widget -->'}</span><br/>
                  <span className="text-indigo-400">{'<script'}</span><br/>
                  {'  src="'}<span className="text-emerald-400">{getDashboardDomain()}/api/widget/v1.js</span>{'"'}<br/>
                  {'  data-project-id="'}<span className="text-purple-400">{projects.find(p => String(p.id) === String(selectedProjectId))?.slug || (selectedProjectId === 'all' ? 'global' : selectedProjectId)}</span>{'"'}<br/>
                  {'  data-api-key="'}<span className="text-emerald-400">{publicKey}</span>{'"'}<br/>
                  {'  data-theme="'}<span className="text-purple-400">premium</span>{'"'}<br/>
                  <span className="text-indigo-400">{'>'}{'</script>'}</span>
                </code>
              </div>
            </div>
          </div>
        )}

        {/* Growth Infrastructure Health (Hidden in Tabs, shown in Developers) */}
        {activeSection === 'overview' && selectedProjectId !== 'all' && (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white flex items-center gap-2">
                    Growth Infrastructure Health
                    <Badge variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-400">V2.0 SYSTEM</Badge>
                  </h4>
                  <p className="text-sm text-zinc-500">Monitorea la integridad de la configuración de economía y crecimiento.</p>
                </div>
              </div>

              <UIButton 
                onClick={async () => {
                  setIsTestingData(true);
                  setShowTestModal(true);
                  try {
                    const project = projects.find(p => String(p.id) === String(selectedProjectId));
                    if (!project) return;
                    
                    const [configRes, stateRes] = await Promise.all([
                      fetch(`/api/public/project/${project.slug}/config?apiKey=${publicKey}`),
                      fetch(`/api/public/project/${project.slug}/state?apiKey=${publicKey}`)
                    ]);
                    
                    const config = await configRes.json();
                    const state = await stateRes.json();
                    
                    setTestResult({ config, state });
                  } catch (error) {
                    console.error('Error testing live data:', error);
                    toast.error("Error al recuperar datos en tiempo real");
                  } finally {
                    setIsTestingData(false);
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-6 h-12 shadow-lg shadow-indigo-600/20 flex items-center gap-2"
              >
                <Monitor className="w-4 h-4" />
                Verificar Endpoints Live
              </UIButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Validation Cards (Keep in Overview for quick status, but fragments moved to Developers) */}
              <div className={cn(
                "p-5 rounded-2xl border transition-all",
                (testResult?.config?.tiers?.length || 0) > 0 ? "bg-zinc-950/50 border-zinc-800" : "bg-orange-500/5 border-orange-500/20"
              )}>
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-zinc-900 rounded-lg text-zinc-500"><Coins className="w-4 h-4" /></div>
                  {(testResult?.config?.tiers?.length || 0) > 0 ? (
                    <Badge className="bg-green-500/10 text-green-400 border-none text-[8px]">OK</Badge>
                  ) : (
                    <Badge className="bg-orange-500 text-white border-none text-[8px] animate-pulse">CRITICAL</Badge>
                  )}
                </div>
                <h5 className="font-bold text-sm text-white">Tier System</h5>
                <p className="text-[10px] text-zinc-500 mt-1">
                  {(testResult?.config?.tiers?.length || 0) > 0 
                    ? `${testResult.config.tiers.length} Tiers configurados.`
                    : "No se detectaron Tiers."}
                </p>
              </div>

              <div className={cn(
                "p-5 rounded-2xl border transition-all",
                (testResult?.config?.phases?.length || 0) > 0 ? "bg-zinc-950/50 border-zinc-800" : "bg-red-500/5 border-red-500/20"
              )}>
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-zinc-900 rounded-lg text-zinc-500"><Zap className="w-4 h-4" /></div>
                  {(testResult?.config?.phases?.length || 0) > 0 ? (
                    <Badge className="bg-green-500/10 text-green-400 border-none text-[8px]">OK</Badge>
                  ) : (
                    <Badge className="bg-red-500 text-white border-none text-[8px] animate-pulse">ERROR</Badge>
                  )}
                </div>
                <h5 className="font-bold text-sm text-white">Utility Phases</h5>
                <p className="text-[10px] text-zinc-500 mt-1">
                  {(testResult?.config?.phases?.length || 0) > 0 
                    ? `${testResult.config.phases.length} Fases activas.`
                    : "No hay fases configuradas."}
                </p>
              </div>

              <div className={cn(
                "p-5 rounded-2xl border transition-all",
                testResult?.config?.treasuryAddress ? "bg-zinc-950/50 border-zinc-800" : "bg-orange-500/5 border-orange-500/20"
              )}>
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-zinc-900 rounded-lg text-zinc-500"><Wallet className="w-4 h-4" /></div>
                  {testResult?.config?.treasuryAddress ? (
                    <Badge className="bg-green-500/10 text-green-400 border-none text-[8px]">OK</Badge>
                  ) : (
                    <Badge className="bg-orange-500 text-white border-none text-[8px] animate-pulse">WARNING</Badge>
                  )}
                </div>
                <h5 className="font-bold text-sm text-white">Treasury Sync</h5>
                <p className="text-[10px] text-zinc-500 mt-1 truncate">
                  {testResult?.config?.treasuryAddress 
                    ? "Sincronizado"
                    : "Falta dirección tesorería."}
                </p>
              </div>

              <div className={cn(
                "p-5 rounded-2xl border transition-all",
                (testResult?.config?.totalAllocation || 0) > 0 ? "bg-zinc-950/50 border-zinc-800" : "bg-orange-500/5 border-orange-500/20"
              )}>
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-zinc-900 rounded-lg text-zinc-500"><Target className="w-4 h-4" /></div>
                  {(testResult?.config?.totalAllocation || 0) > 0 ? (
                    <Badge className="bg-green-500/10 text-green-400 border-none text-[8px]">OK</Badge>
                  ) : (
                    <Badge className="bg-orange-500 text-white border-none text-[8px] animate-pulse">LEAKAGE</Badge>
                  )}
                </div>
                <h5 className="font-bold text-sm text-white">Supply Integrity</h5>
                <p className="text-[10px] text-zinc-500 mt-1">
                  {(testResult?.config?.totalAllocation || 0) > 0 
                    ? "Allocation verificado."
                    : "Pool vacío."}
                </p>
              </div>
            </div>
          </div>
        )}

        <Dialog open={showTestModal} onOpenChange={setShowTestModal}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-4xl p-8 rounded-[2.5rem]">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-black italic flex items-center gap-2">
                <RefreshCw className={cn("w-5 h-5 text-blue-400", isTestingData && "animate-spin")} />
                Test Live Data: {projects.find(p => String(p.id) === String(selectedProjectId))?.title}
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Config Panel */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Config Response (Normalized)</span>
                  {testResult?.config && <Badge className="bg-green-500/10 text-green-400 text-[8px] border-none">200 OK</Badge>}
                </div>
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 h-[400px] overflow-auto no-scrollbar">
                  {isTestingData ? (
                    <div className="h-full flex items-center justify-center"><RefreshCw className="w-8 h-8 animate-spin text-zinc-800" /></div>
                  ) : testResult?.config ? (
                    <pre className="text-[10px] text-blue-400 font-mono leading-relaxed">{JSON.stringify(testResult.config, null, 2)}</pre>
                  ) : (
                    <div className="h-full flex items-center justify-center text-zinc-700 text-xs italic">Intentando recuperar configuración...</div>
                  )}
                </div>
              </div>

              {/* State Panel */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Real-time State (On-chain)</span>
                  {testResult?.state && <Badge className="bg-emerald-500/10 text-emerald-400 text-[8px] border-none">ACTIVE</Badge>}
                </div>
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 h-[400px] overflow-auto no-scrollbar">
                  {isTestingData ? (
                    <div className="h-full flex items-center justify-center"><RefreshCw className="w-8 h-8 animate-spin text-zinc-800" /></div>
                  ) : testResult?.state ? (
                    <pre className="text-[10px] text-emerald-400 font-mono leading-relaxed">{JSON.stringify(testResult.state, null, 2)}</pre>
                  ) : (
                    <div className="h-full flex items-center justify-center text-zinc-700 text-xs italic">Intentando recuperar estado en tiempo real...</div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-900 flex justify-between items-center">
              <p className="text-[10px] text-zinc-500 leading-relaxed max-w-sm italic">
                Esta utilidad verifica que los endpoints públicos de configuración y estado responden correctamente para el widget v2.0.
              </p>
              <UIButton variant="outline" className="rounded-xl border-zinc-800 font-bold text-xs" onClick={() => setShowTestModal(false)}>
                Cerrar Verificación
              </UIButton>
            </div>
          </DialogContent>
        </Dialog>

        {/* Developer Documentation Modal */}
        <Dialog open={showDocsModal} onOpenChange={setShowDocsModal}>
          <DialogContent className="bg-zinc-950 border border-zinc-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-0">
            <div className="sticky top-0 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 p-8 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase italic tracking-tight">Growth Widget v2.0</h2>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Guía de Integración Técnica</p>
                </div>
              </div>
              <UIButton variant="ghost" size="icon" onClick={() => setShowDocsModal(false)} className="rounded-full hover:bg-white/5">
                <X className="w-5 h-5 text-zinc-500" />
              </UIButton>
            </div>

            <div className="p-8 space-y-12">
              {/* Nueva sección: Guía de Conexión de Cables */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <Badge className="bg-indigo-500 text-black font-black text-[10px]">INFRAESTRUCTURA</Badge>
                  <h3 className="text-lg font-black uppercase italic tracking-tight">Conexión de Cables (Full Stack)</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 bg-zinc-900/40 rounded-3xl border border-zinc-800/50 hover:border-indigo-500/30 transition-all group">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4 border border-indigo-500/20 group-hover:bg-indigo-500/20">
                      <Terminal className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h4 className="text-sm font-bold text-zinc-100 mb-2">Cable 1: Identidad</h4>
                    <p className="text-[11px] text-zinc-500 leading-relaxed italic">
                      El Widget identifica al usuario en tu sitio externo y prepara el <strong>Login Invisible</strong> en Pandora.
                    </p>
                  </div>
                  
                  <div className="p-5 bg-zinc-900/40 rounded-3xl border border-zinc-800/50 hover:border-emerald-500/30 transition-all group">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 border border-emerald-500/20 group-hover:bg-emerald-500/20">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h4 className="text-sm font-bold text-zinc-100 mb-2">Cable 2: Handshake</h4>
                    <p className="text-[11px] text-zinc-500 leading-relaxed italic">
                      Al llegar al pago, el sistema acuña automáticamente la <strong>Pandora Key</strong> y la <strong>Access Card</strong> del protocolo.
                    </p>
                  </div>
                  
                  <div className="p-5 bg-zinc-900/40 rounded-3xl border border-zinc-800/50 hover:border-purple-500/30 transition-all group">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 border border-purple-500/20 group-hover:bg-purple-500/20">
                      <Zap className="w-5 h-5 text-purple-400" />
                    </div>
                    <h4 className="text-sm font-bold text-zinc-100 mb-2">Cable 3: Sincronía</h4>
                    <p className="text-[11px] text-zinc-500 leading-relaxed italic">
                      Tras la compra, Pandora envía un Webhook a tu servidor confirmando que el usuario ya es <strong>Holder Oficial</strong>.
                    </p>
                  </div>
                </div>
              </section>

              {/* Step 1: Client-Side Installation */}
              <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-indigo-500 text-black font-black text-[10px]">PASO 01</Badge>
                    <h3 className="text-lg font-black uppercase italic">Inyección del Widget</h3>
                  </div>
                  <p className="text-zinc-400 text-sm font-medium">Agrega el siguiente script antes del cierre de la etiqueta <code className="text-indigo-400">&lt;/body&gt;</code> en tu aplicación web.</p>
                  
                  <div className="bg-zinc-900 rounded-2xl p-6 font-mono text-xs border border-zinc-800 relative group">
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <UIButton size="sm" variant="outline" className="h-7 text-[8px] uppercase tracking-widest font-black" onClick={() => {
                        const project = projects.find(p => String(p.id) === String(selectedProjectId));
                        const projectSlug = project?.slug || (selectedProjectId === 'all' ? 'global' : selectedProjectId);
                        navigator.clipboard.writeText(`<script\n  src="${getDashboardDomain()}/api/widget/v1.js"\n  data-project-id="${projectSlug}"\n  data-public-key="${publicKey}"\n  async\n></script>`);
                        toast.success("Script copiado");
                      }}>Copiar</UIButton>
                    </div>
                    <pre className="text-zinc-300 leading-relaxed">
{`<script
  src="${getDashboardDomain()}/api/widget/v1.js"
  data-project-id="${projects.find(p => String(p.id) === String(selectedProjectId))?.slug || (selectedProjectId === 'all' ? 'global' : selectedProjectId)}"
  data-public-key="${publicKey}"
  async
></script>`}
                    </pre>
                  </div>
                  <p className="text-[10px] text-zinc-600 italic">* Reemplaza data-public-key con tu llave pública actual si no estás en un proyecto específico.</p>
              </section>

              {/* Step 2: Custom Attributes */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className="bg-emerald-500 text-black font-black text-[10px]">PASO 02</Badge>
                  <h3 className="text-lg font-black uppercase italic">Manejo de Atributos (Data-Layer)</h3>
                </div>
                <p className="text-zinc-400 text-sm font-medium">El widget captura automáticamente el email, pero puedes enriquecer el lead enviando metadatos adicionales desde tu aplicación.</p>
                
                <div className="bg-zinc-900 rounded-2xl p-6 font-mono text-xs border border-zinc-800">
                  <pre className="text-zinc-300 leading-relaxed">
{`window.PandoraWidget.identify({
  email: "user@example.com",
  metadata: {
    capital: "100k+",      // Signal para Scoring
    intent: "invest",      // 'whitelist', 'invest', 'earn'
    source: "landing_v2"   // Origen de captura
  }
});`}
                  </pre>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Atributo: intent</span>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Determina la automatización que se dispara (D1, D2, D3). Valores sugeridos: <code className="text-emerald-400">whitelist</code>, <code className="text-emerald-400">invest</code>, <code className="text-emerald-400">earn</code>.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Atributo: capital</span>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Ajusta el multiplicador de score. Formatos aceptados: <code className="text-emerald-400">5k-25k</code>, <code className="text-emerald-400">25k-100k</code>, <code className="text-emerald-400">100k+</code>.
                    </p>
                  </div>
                </div>
              </section>

              {/* Step 3: Server-Side Webhooks */}
              <section className="space-y-4 pb-8">
                <div className="flex items-center gap-3">
                  <Badge className="bg-purple-500 text-black font-black text-[10px]">PASO 03</Badge>
                  <h3 className="text-lg font-black uppercase italic">Webhooks & Eventos</h3>
                </div>
                <p className="text-zinc-400 text-sm font-medium">Configura el webhook de Discord en el panel anterior para recibir alertas en tiempo real de cada conversión.</p>
                
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Event: WAITLIST_JOIN</h4>
                    <p className="text-[9px] text-zinc-500">Se dispara inmediatamente al capturar un lead.</p>
                  </div>
                </div>
              </section>
            </div>
            
            <div className="bg-zinc-900/50 p-8 border-t border-zinc-800 flex justify-center">
              <UIButton onClick={() => setShowDocsModal(false)} className="bg-white text-black font-black uppercase text-[10px] tracking-widest px-12 h-12 rounded-2xl">
                Entendido
              </UIButton>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
