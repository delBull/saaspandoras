'use client';

import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { cn, getDashboardDomain } from "@/lib/utils"
import { Zap, Globe, ShieldCheck, TrendingUp, Info, HelpCircle, BookOpen, ChevronDown, ChevronUp, UserCheck, Sparkles, Lightbulb, Target, RefreshCw, X } from "lucide-react";
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


export default function GrowthOSSubTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
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
  const [showDevHub, setShowDevHub] = useState(false);

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

  const fetchApiKey = async (projectId: string) => {
    if (projectId === 'all') {
      setPublicKey('pk_grow_test_xxxxxxx');
      setSecretKey('sk_grow_test_xxxxxxx');
      return;
    }

    setLoadingKey(true);
    try {
      const project = projects.find(p => p.id === Number(projectId));
      if (!project) return;

      let response = await fetch(`/api/admin/projects/${project.slug}/keys`);
      let data = await response.json();

      if (response.ok && data.hasKeys) {
        setPublicKey(data.publicKey);
        setSecretKey(data.secretKey);
      } else {
        response = await fetch(`/api/admin/projects/${project.slug}/keys`, { method: 'POST' });
        data = await response.json();
        if (response.ok) {
          setPublicKey(data.publicKey);
          setSecretKey(data.secretKey);
        }
      }
    } catch (error) {
      console.error('Error fetching API Key:', error);
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
           setProjects(prev => prev.map(p => p.id === Number(selectedProjectId) ? { ...p, discordWebhookUrl: payload.discordWebhookUrl } : p));
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
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchLeads = async (projectId: string) => {
    setLoadingLeads(true);
    try {
      const url = projectId === 'all'
        ? '/api/admin/marketing/leads'
        : `/api/admin/marketing/leads?projectId=${projectId}`;
      const response = await fetch(url);
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
        fetchLeads(selectedProjectId);
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
      
      if (response.ok) {
        // Filter by draft-slug prefix
        const relevant = (data.courses || []).filter((c: any) => 
          c.id.startsWith(`draft-${project.slug}`)
        );
        setProjectCourses(relevant);
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
    fetchLeads('all');
  }, []);

  useEffect(() => {
    fetchLeads(selectedProjectId);
    setAiInsights(null); 

    if (selectedProjectId !== 'all') {
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
  }, [selectedProjectId, projects]);

  useEffect(() => {
    setStats({
      views: Math.floor(leads.length * 4.2),
      clicks: Math.floor(leads.length * 1.8),
      leads: leads.length
    });
  }, [leads]);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'whitelisted': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'active': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'converted': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      default: return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
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

  return (
    <TooltipProvider>
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
                <h4 className="font-bold text-white text-sm">¿Cómo usar Growth OS?</h4>
                <p className="text-xs text-zinc-400">Guía rápida para maximizar el crecimiento de tus protocolos.</p>
              </div>
            </div>
            {showGuide ? <ChevronUp className="text-zinc-500" /> : <ChevronDown className="text-zinc-500" />}
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
              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-zinc-600 hover:text-purple-400 transition-colors p-1 rounded-full hover:bg-white/5">
                    <HelpCircle className="w-5 h-5" />
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-white">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-purple-400">
                      <BookOpen className="w-5 h-5" />
                      Growth OS Overview
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400 pt-4">
                      Sistema centralizado de captación de demanda. Separa los leads de Pandoras de los leads específicos de cada protocolo externo.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4 text-xs text-zinc-400 leading-relaxed">
                    <p>Esta herramienta permite a los protocolos del ecosistema Pandoras gestionar su propia audiencia de forma soberana.</p>
                    <ul className="list-disc ml-4 space-y-2">
                      <li>Seguimiento de conversiones en tiempo real.</li>
                      <li>Segmentación por intención de usuario.</li>
                      <li>Integración vía Script o API global.</li>
                    </ul>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-sm text-zinc-500 mt-1">Gestión de audiencia y captación de demanda para protocolos del ecosistema.</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Proyecto:</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none w-full md:w-72 shadow-xl hover:border-zinc-500 transition-all cursor-pointer"
            >
              <option value="all">🌐 Todos los Proyectos</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
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
                aiInsights?.insights.map((insight, idx) => (
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

        {/* Project Course Manager (New Section - Phase 1.6) */}
        {selectedProjectId !== 'all' && (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 animate-in fade-in duration-700">
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
        )}

        {/* Global Stats Table & Integration */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Conversion Funnel */}
          <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h4 className="font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  Conversion Funnel
                </h4>
                <p className="text-xs text-zinc-500">Rendimiento del Widget en tiempo real.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Live Tracking</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-zinc-400 font-bold">1. IMPRESIONES (VIEWS)</span>
                  <span className="text-white font-mono">{stats.views}</span>
                </div>
                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-full opacity-30"></div>
                </div>
              </div>

              <div className="relative pl-8">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-zinc-800"></div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-zinc-400 font-bold">2. CLICKS EN WIDGET</span>
                  <span className="text-white font-mono">{stats.clicks}</span>
                </div>
                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: `${(stats.clicks / (stats.views || 1)) * 100}%` }}></div>
                </div>
                <div className="text-[10px] text-zinc-600 mt-1">CTR: {Math.round((stats.clicks / (stats.views || 1)) * 100)}%</div>
              </div>

              <div className="relative pl-16">
                <div className="absolute left-11 top-0 bottom-0 w-px bg-zinc-800"></div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-zinc-400 font-bold">3. LEADS CAPTURADOS</span>
                  <span className="text-white font-mono">{stats.leads}</span>
                </div>
                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${(stats.leads / (stats.clicks || 1)) * 100}%` }}></div>
                </div>
                <div className="text-[10px] text-zinc-600 mt-1">Conv. Rate: {Math.round((stats.leads / (stats.clicks || 1)) * 100)}%</div>
              </div>
            </div>
          </div>

          {/* Widget Integration & Settings */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                Growth SDK Config
              </h4>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Dominios Permitidos</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {allowedDomains.map(domain => (
                      <Badge key={domain} variant="secondary" className="bg-zinc-800/50 text-zinc-400 border-zinc-700 text-[10px] flex items-center gap-1 pr-1">
                        {domain}
                        <button onClick={() => removeDomain(domain)} className="hover:text-red-400 p-0.5"><X className="w-2 h-2" /></button>
                      </Badge>
                    ))}
                  </div>

                  {isAddingDomain ? (
                    <div className="flex gap-2">
                      <Input
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        placeholder="dominio.io"
                        className="h-8 text-xs bg-zinc-950 border-zinc-800"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
                      />
                      <UIButton size="sm" className="h-8 px-3 text-[10px] bg-purple-600" onClick={handleAddDomain}>Agregar</UIButton>
                    </div>
                  ) : (
                    <button onClick={() => setIsAddingDomain(true)} className="text-[10px] text-purple-400 font-bold">+ Agregar Dominio</button>
                  )}

                  {/* Visual Webhook Confirmation */}
                  {discordWebhookUrl && (
                    <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden min-w-0">
                        <Badge className="bg-blue-500/20 text-blue-400 border-none text-[8px] uppercase whitespace-nowrap px-1.5 py-0.5 font-black shrink-0">
                          Webhook Activo
                        </Badge>
                        <span className="text-[10px] text-zinc-500 truncate font-mono flex-1">{discordWebhookUrl.substring(0, 30)}...</span>
                      </div>
                      <UIButton 
                        variant="ghost" 
                        size="sm" 
                        className="h-5 w-5 p-0 text-zinc-600 hover:text-red-400"
                        onClick={() => {
                          setDiscordWebhookUrl('');
                          saveProjectSettings({ discordWebhookUrl: null });
                        }}
                      >
                        <X className="w-3 h-3" />
                      </UIButton>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-zinc-800">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Discord Webhook Alertas</label>
                  <div className="flex gap-2">
                    <Input
                      value={discordWebhookUrl}
                      onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                      placeholder="https://discord.com/api/webhooks/..."
                      className="h-8 text-[10px] bg-zinc-950 border-zinc-800 font-mono"
                    />
                    <UIButton size="sm" variant="outline" className="h-8 px-3 text-[10px] border-zinc-700" onClick={() => saveProjectSettings({ discordWebhookUrl })}>
                      Guardar
                    </UIButton>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800 text-[10px] text-zinc-400 font-mono break-all relative group/code">
                   <div className="flex justify-between items-center mb-2">
                    <span className="font-black text-zinc-500 uppercase tracking-widest">Snippet</span>
                    <Badge className="bg-orange-500/10 text-orange-400 text-[9px]">V1.0</Badge>
                   </div>
                   <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                    <code>{`<script src="https://${getDashboardDomain()}/api/v1/widget/v1.js" data-project-id="${selectedProjectId === 'all' ? 'external' : (projects.find(p => p.id === Number(selectedProjectId))?.slug || 'external')}" data-api-key="${publicKey}" defer></script>`}</code>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
            <h4 className="font-bold text-white flex items-center gap-2">Directorio de Leads <Badge variant="secondary" className="bg-zinc-800 text-zinc-400">{leads.length}</Badge></h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950/50 text-zinc-500 uppercase text-[10px] tracking-[0.2em] font-black border-b border-zinc-800">
                <tr>
                  <th className="px-8 py-5">Perfil</th>
                  <th className="px-6 py-5">Protocolo</th>
                  <th className="px-6 py-5">Intención</th>
                  <th className="px-6 py-5">Estado</th>
                  <th className="px-6 py-5 whitespace-nowrap">Growth Modo</th>
                  <th className="px-6 py-5 text-center">Score</th>
                  <th className="px-8 py-5 text-right">Captura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-zinc-800/20 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-zinc-100 font-bold group-hover:text-white transition-colors flex items-center gap-2">
                          {lead.name || lead.email.split('@')[0]}
                          {lead.userId && <UserCheck className="w-3 h-3 text-blue-400" />}
                        </span>
                        <span className="text-zinc-500 text-xs font-mono">{lead.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 cursor-default">
                       <span className="text-white bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700 text-[11px] font-bold">
                        {lead.projectName || 'Pandoras'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                       <span className="flex items-center gap-2 text-zinc-300 font-medium">
                        <span className="text-lg">{getIntentEmoji(lead.intent)}</span>
                        {lead.intent.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                       <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border tracking-wider uppercase ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {lead.metadata?.growth?.state ? (
                        <div className="flex flex-col gap-1">
                          <Badge className={cn(
                            "text-[9px] uppercase font-black px-2 py-0.5 border-none",
                            lead.metadata.growth.state === 'INVEST_READY' ? "bg-green-500 text-white" :
                            "bg-zinc-800 text-zinc-400"
                          )}>
                            {lead.metadata.growth.state}
                          </Badge>
                        </div>
                      ) : <span className="text-zinc-600 text-[10px] italic">Legacy</span>}
                    </td>
                    <td className="px-6 py-5 text-center font-mono font-black">{lead.score || 0}</td>
                    <td className="px-8 py-5 text-right text-zinc-500 text-xs">
                      {new Date(lead.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
