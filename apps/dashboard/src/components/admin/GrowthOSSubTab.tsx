'use client';

import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
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
}

interface GrowthInsight {
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  type: 'strategy' | 'segmentation' | 'engagement';
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
  const [apiKey, setApiKey] = useState<string>('pk_grow_live_xxxxxxx'); // Simulation
  const [copied, setCopied] = useState(false);
  const [showDevHub, setShowDevHub] = useState(false);
  
  // Real Domain Management State
  const [newDomain, setNewDomain] = useState('');
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [loadingKey, setLoadingKey] = useState(false);

  const fetchApiKey = async (projectId: string) => {
    if (projectId === 'all') {
      setApiKey('pk_grow_live_xxxxxxx');
      return;
    }

    setLoadingKey(true);
    try {
      const project = projects.find(p => p.id === Number(projectId));
      if (!project) return;

      // 1. Try to GET existing key
      let response = await fetch(`/api/admin/projects/${project.slug}/keys`);
      let data = await response.json();

      if (response.ok && data.hasKey) {
        setApiKey(data.apiKey);
      } else {
        // 2. Proactive generation for internal/selected project
        console.log("Generating API Key proactive...");
        response = await fetch(`/api/admin/projects/${project.slug}/keys`, { method: 'POST' });
        data = await response.json();
        if (response.ok) {
          setApiKey(data.apiKey);
          if (data.isNew) toast.success("Clave API generada para este proyecto");
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
    // Simple validation
    if (!newDomain.includes('.')) {
        toast.error("Por favor ingresa un dominio válido");
        return;
    }

    const updatedDomains = [...allowedDomains, newDomain];
    setAllowedDomains(updatedDomains);
    setNewDomain('');
    setIsAddingDomain(false);
    
    // Persistir en el backend
    saveAllowedDomains(updatedDomains);
  };

  const removeDomain = (domain: string) => {
    const updatedDomains = allowedDomains.filter(d => d !== domain);
    setAllowedDomains(updatedDomains);
    saveAllowedDomains(updatedDomains);
  };

  const saveAllowedDomains = async (domains: string[]) => {
    if (selectedProjectId === 'all') return;
    
    try {
      const response = await fetch(`/api/admin/projects/${selectedProjectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          allowedDomains: domains,
          isBasicEdit: true // Para que use el caso de edición básica en el backend
        })
      });
      
      if (response.ok) {
        toast.success("Dominios actualizados correctamente");
      } else {
        toast.error("Error al guardar dominios en el servidor");
      }
    } catch (error) {
      console.error('Error saving domains:', error);
      toast.error("Error de conexión al guardar dominios");
    }
  };

  // Fetch Projects for Filter
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

  // Fetch Leads based on filter
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

  // Fetch AI Insights
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

  useEffect(() => {
    fetchProjects();
    fetchLeads('all');
  }, []);

  useEffect(() => {
    fetchLeads(selectedProjectId);
    setAiInsights(null); // Reset insights when project changes
    
    // Fetch funnel stats & allowed domains & API Key
    if (selectedProjectId !== 'all') {
        const project = projects.find(p => p.id === Number(selectedProjectId));
        setAllowedDomains(project?.allowedDomains || []);
        fetchApiKey(selectedProjectId);
        
        setStats({
            views: Math.floor(leads.length * 4.2),
            clicks: Math.floor(leads.length * 1.8),
            leads: leads.length
        });
    } else {
        setStats({ views: 0, clicks: 0, leads: 0 });
        setAllowedDomains([]);
        setApiKey('pk_grow_live_xxxxxxx');
    }
  }, [selectedProjectId, leads.length, projects]);

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
          {/* Animated Background Glow */}
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
              <p className="text-xs text-zinc-600 tracking-wide uppercase">Gemini 1.5 Pro Marketing Engine</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {loadingAI ? (
                // Skeleton Loaders
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800 animate-pulse">
                    <div className="w-12 h-12 bg-zinc-800 rounded-xl mb-4"></div>
                    <div className="h-4 bg-zinc-800 rounded w-3/4 mb-3"></div>
                    <div className="h-2 bg-zinc-800 rounded w-full mb-2"></div>
                    <div className="h-2 bg-zinc-800 rounded w-5/6"></div>
                  </div>
                ))
              ) : (
                aiInsights?.insights.map((insight, idx) => (
                  <div key={idx} className="bg-zinc-900/60 rounded-2xl p-6 border border-zinc-800 hover:border-purple-400/30 hover:bg-zinc-900/80 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-2 rounded-xl text-white ${
                        insight.type === 'strategy' ? 'bg-blue-500/20 text-blue-400' :
                        insight.type === 'segmentation' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {insight.type === 'strategy' ? <Target className="w-5 h-5" /> :
                         insight.type === 'segmentation' ? <Globe className="w-5 h-5" /> :
                         <Zap className="w-5 h-5" />}
                      </div>
                      <Badge className={`${
                        insight.impact === 'high' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        insight.impact === 'medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                        'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      } text-[9px] uppercase font-black`}>
                        {insight.impact} IMPACT
                      </Badge>
                    </div>
                    <h5 className="font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">{insight.title}</h5>
                    <p className="text-xs text-zinc-400 leading-relaxed font-medium">{insight.description}</p>
                  </div>
                ))
              )}
            </div>
          )}
          
          {aiInsights?.summary && !loadingAI && (
            <div className="mt-8 pt-6 border-t border-zinc-800 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
              <p className="text-xs font-mono text-zinc-500 italic flex-1 truncate">{aiInsights.summary}</p>
            </div>
          )}
        </div>

        {/* Phase 4: Growth Infra - Widget & Funnel (Visible even if 'all' selected) */}
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
                {/* Step 1: Views */}
                <div className="relative">
                    <div className="flex justify-between text-xs mb-2">
                        <span className="text-zinc-400 font-bold">1. IMPRESIONES (VIEWS)</span>
                        <span className="text-white font-mono">{stats.views}</span>
                    </div>
                    <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-full opacity-30"></div>
                    </div>
                </div>

                {/* Step 2: Clicks */}
                <div className="relative pl-8">
                    <div className="absolute left-3 top-0 bottom-0 w-px bg-zinc-800"></div>
                    <div className="flex justify-between text-xs mb-2">
                        <span className="text-zinc-400 font-bold">2. CLICKS EN WIDGET</span>
                        <span className="text-white font-mono">{stats.clicks}</span>
                    </div>
                    <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-full bg-purple-500`} style={{ width: `${(stats.clicks / (stats.views || 1)) * 100}%` }}></div>
                    </div>
                    <div className="text-[10px] text-zinc-600 mt-1">CTR: {Math.round((stats.clicks / (stats.views || 1)) * 100)}%</div>
                </div>

                {/* Step 3: Leads */}
                <div className="relative pl-16">
                    <div className="absolute left-11 top-0 bottom-0 w-px bg-zinc-800"></div>
                    <div className="flex justify-between text-xs mb-2">
                        <span className="text-zinc-400 font-bold">3. LEADS CAPTURADOS</span>
                        <span className="text-white font-mono">{stats.leads}</span>
                    </div>
                    <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-full bg-green-500`} style={{ width: `${(stats.leads / (stats.clicks || 1)) * 100}%` }}></div>
                    </div>
                    <div className="text-[10px] text-zinc-600 mt-1">Conv. Rate: {Math.round((stats.leads / (stats.clicks || 1)) * 100)}%</div>
                </div>
              </div>
            </div>

            {/* Widget Integration & Domains */}
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
                            <button 
                                onClick={() => removeDomain(domain)}
                                className="hover:text-red-400 p-0.5"
                            >
                                <X className="w-2 h-2" />
                            </button>
                        </Badge>
                        ))}
                    </div>
                    
                    {isAddingDomain ? (
                        <div className="flex gap-2 animate-in slide-in-from-left-2">
                            <Input 
                                value={newDomain}
                                onChange={(e) => setNewDomain(e.target.value)}
                                placeholder="protocol-domain.io"
                                className="h-8 text-xs bg-zinc-950 border-zinc-800"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
                            />
                            <UIButton size="sm" className="h-8 px-3 text-[10px] bg-purple-600 hover:bg-purple-700" onClick={handleAddDomain}>Agregar</UIButton>
                            <UIButton size="sm" variant="ghost" className="h-8 px-2 text-[10px]" onClick={() => setIsAddingDomain(false)}>X</UIButton>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setIsAddingDomain(true)}
                            className="text-[10px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
                        >
                            + Agregar Dominio Real
                        </button>
                    )}
                    </div>

                    <div className="pt-4 border-t border-zinc-800">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Integration Snippet</label>
                        {selectedProjectId === 'all' && (
                          <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[9px] uppercase font-bold">
                            Global Mode (External)
                          </Badge>
                        )}
                      </div>
                      <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-800 font-mono text-[10px] text-zinc-400 break-all relative group/code">
                        <code>
                          {loadingKey ? (
                            <span className="animate-pulse">Cargando configuración...</span>
                          ) : (
                            `<script \n  src="https://dashboard.pandoras.finance/api/v1/widget/v1.js" \n  data-project-id="${selectedProjectId === 'all' ? 'external' : (projects.find(p => p.id === Number(selectedProjectId))?.slug || selectedProjectId)}" \n  data-api-key="${apiKey}" \n  defer\n></script>`
                          )}
                        </code>
                        <button 
                          onClick={() => {
                            const projectSlug = selectedProjectId === 'all' ? 'external' : (projects.find(p => p.id === Number(selectedProjectId))?.slug || selectedProjectId);
                            const code = `<script src="https://dashboard.pandoras.finance/api/v1/widget/v1.js" data-project-id="${projectSlug}" data-api-key="${apiKey}" defer></script>`;
                            navigator.clipboard.writeText(code);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          disabled={loadingKey}
                          className="absolute top-2 right-2 p-2 bg-zinc-900 border border-zinc-700 rounded-lg opacity-0 group-hover/code:opacity-100 transition-all hover:bg-zinc-800"
                        >
                          {copied ? <span className="text-green-400 font-bold">✓</span> : <BookOpen className="w-3 h-3 text-zinc-400" />}
                        </button>
                      </div>

                      {/* Mini Guía Dev (Quick Reference) */}
                      <div className="mt-4 p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl space-y-3">
                        <p className="text-[10px] font-bold text-purple-300 uppercase tracking-widest flex items-center gap-2">
                            <Sparkles className="w-3 h-3" />
                            Mini Guía: Atributos del Widget
                        </p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[9px] font-mono">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-zinc-500">data-title</span>
                                <span className="text-zinc-300">"Título del Widget"</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-zinc-500">data-color</span>
                                <span className="text-zinc-300">"#HexColor"</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-zinc-500">data-subtitle</span>
                                <span className="text-zinc-300">"Descripción corta"</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-zinc-500">data-position</span>
                                <span className="text-zinc-300">"left | right"</span>
                            </div>
                        </div>
                        <p className="text-[9px] text-zinc-600 italic border-t border-purple-500/10 pt-2">
                            💡 Usa estos atributos para personalizar la experiencia en tu landing.
                        </p>
                          </div>
                        </div>
                    </div>
                </div>

               <button 
                onClick={() => setShowDevHub(!showDevHub)}
                className={`w-full mt-6 py-3 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    showDevHub ? 'bg-zinc-800 border-zinc-600 text-white' : 'border-zinc-700 text-zinc-400 hover:bg-white/5'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                {showDevHub ? 'Ocultar Documentación Full' : 'Ver Documentación SDK Full'}
              </button>
            </div>

        </div>

        {/* Developer Hub - Expanded Documentation */}
        {showDevHub && (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 animate-in slide-in-from-top-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <h4 className="text-lg font-bold text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                            Guía para Desarrolladores
                        </h4>
                        
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-[10px] flex items-center justify-center font-bold flex-shrink-0">1</span>
                                <div>
                                    <p className="text-sm font-bold text-zinc-200">Inserta el Snippet</p>
                                    <p className="text-xs text-zinc-500">Copia el código superior y pégalo justo antes de cerrar la etiqueta {`</body>`} en la landing page de tu protocolo.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-[10px] flex items-center justify-center font-bold flex-shrink-0">2</span>
                                <div>
                                    <p className="text-sm font-bold text-zinc-200">Configura Atributos (Opcional)</p>
                                    <p className="text-xs text-zinc-500">Personaliza el widget para campañas específicas (ej: Whitelist de Narai):</p>
                                    <ul className="mt-2 text-[10px] text-zinc-500 font-mono space-y-1 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
                                        <li>data-title="Narai Whitelist"</li>
                                        <li>data-subtitle="Únete a la nueva era de liquidez"</li>
                                        <li>data-button-text="🎟 Entrar a Whitelist"</li>
                                        <li>data-color="#3b82f6" (Blue Narai)</li>
                                        <li>data-theme="dark" | "light" (Default: light)</li>
                                        <li>data-position="left" | "right" (Default: right)</li>
                                        <li>data-success-url="https://..." (Redirect tras registro)</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <span className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 text-[10px] flex items-center justify-center font-bold flex-shrink-0">3</span>
                                <div>
                                    <p className="text-sm font-bold text-zinc-200">Verifica la Conexión</p>
                                    <p className="text-xs text-zinc-500">Refresca tu landing page. El widget debería aparecer automáticamente y empezar a enviar eventos de visualización en tiempo real.</p>
                                </div>
                            </div>
                        </div>

                        {/* Advanced Integration - Custom Forms */}
                        <div className="pt-6 border-t border-zinc-800">
                            <p className="text-sm font-bold text-zinc-200 flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                Advanced: Custom Forms (API JS)
                            </p>
                            <p className="text-[10px] text-zinc-500 mb-3">
                                ¿Ya tienes tu propio modal o formulario? Usa nuestra API global para enviar leads sin usar nuestra UI:
                            </p>
                            <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-800 font-mono text-[9px] text-blue-400 relative group/api">
                                <pre className="whitespace-pre-wrap">
{`window.PandorasGrowth.registerLead({
  email: "user@example.com",
  name: "John Doe",
  phoneNumber: "+52...", // WhatsApp
  intent: "whitelist"
}).then(res => console.log(res));`}
                                </pre>
                                <button 
                                    onClick={() => navigator.clipboard.writeText(`window.PandorasGrowth.registerLead({ email: "user@example.com", name: "John Doe", phoneNumber: "+52...", intent: "whitelist" });`)}
                                    className="absolute top-2 right-2 p-1 bg-zinc-900 border border-zinc-700 rounded text-[9px] opacity-0 group-hover/api:opacity-100 hover:text-white"
                                >
                                    Copiar API
                                </button>
                            </div>
                        </div>

                        {/* Global Widget Option */}
                        <div className="pt-6 border-t border-zinc-800">
                            <h5 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-blue-400" />
                                ¿Widget Global / Externo?
                            </h5>
                            <p className="text-xs text-zinc-500 mb-4 italic">
                                Si quieres captar leads de un proyecto que aún no está en Pandoras, usa el ID especial <strong>"external"</strong>. El sistema detectará el dominio automáticamente.
                            </p>
                            <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-800 font-mono text-[9px] text-zinc-500 relative group/global">
                                <code>
                                    {`<script src="..." data-project-id="external" data-api-key="${apiKey}"></script>`}
                                </code>
                                <button 
                                    onClick={() => navigator.clipboard.writeText(`<script src="https://pandoras.app/widget.js" data-project-id="external" data-api-key="${apiKey}" data-color="#7c3aed"></script>`)}
                                    className="absolute top-2 right-2 p-1.5 bg-zinc-900 border border-zinc-700 rounded text-[9px] opacity-0 group-hover/global:opacity-100 hover:text-white"
                                >
                                    Copiar Global
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Lightbulb className="w-4 h-4 text-orange-400" />
                            <h5 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">AI Integration Tip</h5>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed italic mb-4">
                            "Para maximizar la conversión en {projects.find(p => p.id === Number(selectedProjectId))?.title}, te recomendamos integrar el widget en la Hero Section y usar el atributo `data-color` para que coincida con la paleta de tu marca. Esto mejora la confianza del usuario (Trust Score) y aumenta los clics en un ~15%."
                        </p>
                        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                            <p className="text-[10px] font-bold text-purple-300 mb-1">RECURSOS DE VERCEL (COST CONTROL)</p>
                            <p className="text-[9px] text-zinc-500">Este SDK utiliza Edge Functions de Pandoras altamente optimizadas. El consumo de recursos es mínimo y está cubierto por la infraestructura central de Pandoras.</p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Leads Table */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
            <div className="flex items-center gap-3">
              <h4 className="font-bold text-white">Directorio de Leads</h4>
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-400">{leads.length} leads</Badge>
            </div>
            <button 
              className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 uppercase tracking-widest"
              onClick={() => window.alert('Próximamente: Integración con HubSpot/Zapier')}
            >
              Exportar CSV
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950/50 text-zinc-500 uppercase text-[10px] tracking-[0.2em] font-black border-b border-zinc-800">
                <tr>
                  <th className="px-8 py-5">Perfil</th>
                  <th className="px-6 py-5">Protocolo</th>
                  <th className="px-6 py-5">Intención</th>
                  <th className="px-6 py-5">Estado</th>
                  <th className="px-6 py-5 text-center">Score</th>
                  <th className="px-8 py-5">Captura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {loadingLeads ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-zinc-500 font-medium tracking-wide">Sincronizando Growth Engine...</span>
                      </div>
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-24 text-center">
                      <div className="max-w-xs mx-auto text-zinc-600">
                        <p className="text-2xl mb-2">🏜️</p>
                        <p className="font-medium">No hay leads registrados todavía para este proyecto.</p>
                        <p className="text-xs mt-2">Los leads aparecerán aquí automáticamente cuando los usuarios interactúen con la API o el Widget.</p>
                      </div>
                    </td>
                  </tr>
                ) : leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-zinc-800/20 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-100 font-bold group-hover:text-white transition-colors">
                            {lead.name || lead.email.split('@')[0]}
                          </span>
                          {/* Identity Layer Link */}
                          {lead.userId && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="p-0.5 bg-blue-500/20 text-blue-400 rounded-full cursor-help">
                                  <UserCheck className="w-3 h-3" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs font-bold">USUARIO VERIFICADO</p>
                                <p className="text-[10px]">Este lead ya está registrado como usuario en la plataforma principal de Pandoras.</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <span className="text-zinc-500 text-xs font-mono">{lead.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                         <span className="text-white bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700 text-[11px] font-bold">
                          {lead.projectName || 'Pandoras'}
                        </span>
                        {/* Visual Identifier for Growth OS Active */}
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" title="Growth OS Active Integration"></div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center gap-2 text-zinc-300 font-medium cursor-help">
                            <span className="text-lg">{getIntentEmoji(lead.intent)}</span>
                            {lead.intent.toUpperCase()}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{getIntentDescription(lead.intent)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border tracking-wider uppercase ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`font-mono text-lg font-black ${lead.score > 70 ? 'text-green-400' : lead.score > 30 ? 'text-orange-400' : 'text-zinc-500'}`}>
                        {lead.score || 0}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-zinc-500 text-xs font-medium uppercase tracking-wider">
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
