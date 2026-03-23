'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Target, 
  MessageSquare, 
  MousePointer2, 
  Copy, 
  Check, 
  Rocket, 
  TrendingUp, 
  Eye, 
  ArrowRight,
  ShieldAlert,
  Settings2,
  RefreshCw,
  Share2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Instagram,
  Twitter,
  Flame,
  AlertCircle,
  BarChart3,
  Clock,
  CheckCircle2
} from "lucide-react";
import { useRouter } from 'next/navigation';
import { createDemandDraft, launchCampaign } from "@/actions/campaigns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { marketAttackData, type MarketAttackContent } from "@/lib/market-attack-data";
import { cn } from "@/lib/utils";

interface MarketAttackEngineProps {
  projectId?: string;
  projectName?: string;
}

export function MarketAttackEngine({ projectId, projectName }: MarketAttackEngineProps) {
  // --- STATE ---
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'auto' | 'pandora' | 'project'>('auto');
  const [activeTab, setActiveTab] = useState<'hooks' | 'angles' | 'scripts' | 'ctas'>('hooks');
  const [readyState, setReadyState] = useState<'ready' | 'generating' | 'empty'>('ready');
  const [sequenceMode, setSequenceMode] = useState<'quick' | '3-day'>('quick');
  
  // Selection indices for cycling
  const [selectedHookIdx, setSelectedHookIdx] = useState(0);
  const [selectedScriptIdx, setSelectedScriptIdx] = useState(0);
  const [selectedCtaIdx, setSelectedCtaIdx] = useState(0);
  const [selectedAngleIdx, setSelectedAngleIdx] = useState(0);
  const [selectedEmotionIdx, setSelectedEmotionIdx] = useState(0);
  
  // Interaction states
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'instagram' | 'twitter' | 'tiktok'>('instagram');
  const [postDraft, setPostDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activePostType, setActivePostType] = useState<'hook' | 'script' | 'cta' | 'auto-launch' | null>(null);

  // TODAY'S EXECUTION Tracker
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  // --- DERIVED DATA ---
  const activeContent = useMemo((): MarketAttackContent => {
    if (viewMode === 'pandora') return marketAttackData.pandora;
    if (viewMode === 'project') return marketAttackData.project;
    return (projectId && projectId !== 'all') ? marketAttackData.project : marketAttackData.pandora;
  }, [viewMode, projectId]);

  // Reset indices when content changes
  useEffect(() => {
    setSelectedHookIdx(0);
    setSelectedScriptIdx(0);
    setSelectedCtaIdx(0);
  }, [activeContent]);

  // --- HANDLERS ---
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copiado al portapapeles");
    
    // Tracking simulation
    console.log("track", "launch_action", {
      type: "copy",
      key,
      layer: viewMode === 'auto' ? (projectId && projectId !== 'all' ? 'project' : 'pandora') : viewMode
    });
    
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleSendToCampaigns = async (type: string = "draft", overrideContent?: string) => {
    setIsSending(true);
    try {
      const result = await createDemandDraft({ 
        projectId: Number(projectId) || 1,
        hook: activeContent.whatToSay.hooks[selectedHookIdx] || '',
        script: activeContent.whatToSay.scripts[selectedScriptIdx] || '',
        cta: activeContent.whatToSay.ctas[selectedCtaIdx] || '',
        angle: activeContent.whatToSay.angles[selectedAngleIdx] || '',
        emotion: activeContent.whatToSay.emotions[selectedEmotionIdx] || '',
        mechanism: activeContent.core.mechanism || ''
      });
      
      if (result.success) {
        toast.success("Contenido (DNA) guardado en Campañas");
        
        if (type === "auto-launch") {
          const launchResult = await launchCampaign({
            projectId: Number(projectId) || 1,
            draftId: result.draft!.id,
            name: `Demand Engine - ${new Date().toLocaleDateString()}`,
            platform: "multi"
          });
          
          if (launchResult.success) {
            toast.success("¡Campaña lanzada con éxito!");
            setCompletedTasks(prev => [...new Set([...prev, "auto-launch"])]);
            router.push('/marketing?sub=campaigns');
          }
        } else {
          router.push('/marketing?sub=campaigns&draft=true');
        }
      } else {
        toast.error("Error al guardar el borrador");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsSending(false);
      setIsPostModalOpen(false);
    }
  };

  const handleAutoLaunch = async () => {
    setReadyState('generating');
    toast.info("Compilando narrativa optimizada...");
    
    setTimeout(async () => {
      await handleSendToCampaigns("auto-launch");
      setReadyState('ready');
    }, 1500);
  };

  const handleCreatePost = (type: 'hook' | 'script' | 'cta') => {
    const content = type === 'hook' ? activeContent.whatToSay.hooks[selectedHookIdx] :
                    type === 'script' ? activeContent.whatToSay.scripts[selectedScriptIdx] :
                    activeContent.whatToSay.ctas[selectedCtaIdx];
    
    setPostDraft(content || '');
    setActivePostType(type);
    setIsPostModalOpen(true);
  };

  const handleGenerateAd = () => {
    setReadyState('generating');
    setTimeout(() => {
      const adContent = `${activeContent.whatToSay.hooks[selectedHookIdx]}\n\n${activeContent.whatToSay.scripts[selectedScriptIdx]}\n\n${activeContent.whatToSay.ctas[selectedCtaIdx]}`;
      handleCopy(adContent, 'ad');
      setReadyState('ready');
      toast.success("¡Anuncio generado y copiado!");
    }, 1200);
  };

  const cycle = (type: 'hook' | 'script' | 'cta', direction: 'next' | 'prev') => {
    const list = type === 'hook' ? activeContent.whatToSay.hooks :
                 type === 'script' ? activeContent.whatToSay.scripts :
                 activeContent.whatToSay.ctas;
    const setter = type === 'hook' ? setSelectedHookIdx :
                   type === 'script' ? setSelectedScriptIdx :
                   setSelectedCtaIdx;
    const current = type === 'hook' ? selectedHookIdx :
                    type === 'script' ? selectedScriptIdx :
                    selectedCtaIdx;

    if (direction === 'next') {
      setter((current + 1) % list.length);
    } else {
      setter((current - 1 + list.length) % list.length);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  // --- RENDER HELPERS ---
  const renderLaunchSection = (num: number, title: string, subtitle: string, type: 'hook' | 'script' | 'cta', index: number) => {
    const content = type === 'hook' ? activeContent.whatToSay.hooks[index] :
                    type === 'script' ? activeContent.whatToSay.scripts[index] :
                    activeContent.whatToSay.ctas[index];
    const key = `${type}-${index}`;
    const isCopied = copiedKey === key;
    const isCompleted = completedTasks.includes(type);

    return (
      <div className={cn(
        "bg-zinc-950/40 border rounded-2xl p-5 space-y-4 transition-all group",
        isCompleted ? "border-emerald-500/20" : "border-zinc-800/50 hover:border-purple-500/30"
      )}>
        <div className="flex justify-between items-start">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">
                {sequenceMode === '3-day' ? `Day ${num}` : `${num}. ${title}`}
              </h4>
              {isCompleted && <CheckCircle2 size={10} className="text-emerald-500" />}
            </div>
            <p className="text-[9px] text-zinc-500 font-medium uppercase tracking-wider">
              {sequenceMode === '3-day' ? title : subtitle}
            </p>
          </div>
          <div className="flex gap-1">
            <button onClick={() => cycle(type, 'prev')} className="p-1 text-zinc-600 hover:text-white transition-colors"><ChevronLeft size={14}/></button>
            <button onClick={() => cycle(type, 'next')} className="p-1 text-zinc-600 hover:text-white transition-colors"><ChevronRight size={14}/></button>
          </div>
        </div>

        <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 min-h-[80px] flex items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
             <Badge className="bg-emerald-500/10 text-emerald-500 text-[8px] border-emerald-500/20 px-1 py-0 font-black">
                {num === 1 ? "87.4% Conv" : num === 2 ? "High Engagement" : "Viral Loop"}
             </Badge>
          </div>
          <p className="text-xs font-bold text-zinc-200 leading-relaxed italic">
            "{content}"
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "flex-1 h-9 text-[10px] font-black uppercase tracking-widest transition-all",
              isCopied ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
            )}
            onClick={() => handleCopy(content || '', key)}
          >
            {isCopied ? <><Check size={12} className="mr-1.5"/> Copied ✓</> : <><Copy size={12} className="mr-1.5"/> Copy</>}
          </Button>
          <Button 
            size="sm" 
            className="flex-1 h-9 text-[10px] font-black uppercase tracking-widest bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-600/10"
            onClick={() => handleCreatePost(type)}
          >
            Create Post
          </Button>
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-32"
    >
      {/* --- HEADER --- */}
      <section className="relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Rocket className="w-32 h-32 text-purple-500" />
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px] font-black tracking-widest uppercase">
                Demand Engine v2.6
              </Badge>
              <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[10px] font-black tracking-widest uppercase animate-pulse">
                <Flame size={10} className="mr-1"/> Hot Insights
              </Badge>
            </div>
            
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-2 italic">
                Do this. Now.
              </h1>
              <p className="text-zinc-500 text-sm max-w-xl font-bold uppercase tracking-tight">
                From insights to output. Decisively fast execution. <span className="text-zinc-700">|</span> <span className="text-purple-400">Execution takes &lt; 60 seconds</span>
              </p>
            </div>

            {/* QUICK STATS BAR */}
            <div className="flex gap-6 pt-2">
               <div className="flex items-center gap-2">
                  <BarChart3 size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Performance Score: <span className="text-white">87%</span></span>
               </div>
               <div className="flex items-center gap-2 border-l border-zinc-800 pl-6">
                  <Clock size={14} className="text-purple-500" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Next Peak Hour: <span className="text-white">19:00</span></span>
               </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800">
               <button 
                onClick={() => setSequenceMode('quick')}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  sequenceMode === 'quick' ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                Quick Post
              </button>
              <button 
                onClick={() => setSequenceMode('3-day')}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  sequenceMode === '3-day' ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                3-Day Sequence
              </button>
            </div>

            <Button 
                onClick={handleAutoLaunch}
                disabled={readyState === 'generating'}
                className="w-full h-12 bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-[0.2em] italic text-[11px] group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Zap size={14} className="mr-2 group-hover:animate-bounce" />
                {readyState === 'generating' ? 'Automating...' : 'Auto-Launch Campaign'}
            </Button>
          </div>
        </div>
      </section>

      {/* --- LAUNCH PANEL (3 PHASES) --- */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <motion.div variants={itemVariants} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 relative">
            {/* TODAY'S EXECUTION TRACKER */}
            <div className="absolute -top-4 left-8 bg-zinc-950 border border-zinc-800 px-6 py-2 rounded-full flex items-center gap-4 shadow-xl z-20">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Today's Execution</span>
               <div className="h-4 w-px bg-zinc-800" />
               <div className="flex items-center gap-2">
                  <Badge className="bg-purple-500/20 text-purple-400 border-none font-black text-[10px]">
                    {completedTasks.length}/3 Done
                  </Badge>
                  {completedTasks.length === 3 && <CheckCircle2 size={14} className="text-emerald-500 animate-pulse" />}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {renderLaunchSection(1, "Awareness", "Capture Attention", "hook", selectedHookIdx)}
              {renderLaunchSection(2, "Show them what they’re missing", "Build Desire", "script", selectedScriptIdx)}
              {renderLaunchSection(3, "Conversion", "Call to Action", "cta", selectedCtaIdx)}
            </div>
            
            <div className="mt-8 pt-6 border-t border-zinc-800/50 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><AlertCircle size={12} className="text-orange-500"/> No thinking required</span>
                <span className="flex items-center gap-1.5"><Rocket size={12} className="text-purple-500"/> Multi-channel ready</span>
              </div>
              <div className="flex items-center gap-2">
                View: 
                <button onClick={() => setViewMode('auto')} className={cn("hover:text-white transition-colors", viewMode === 'auto' && "text-purple-400")}>Auto</button>
                <button onClick={() => setViewMode('pandora')} className={cn("hover:text-white transition-colors", viewMode === 'pandora' && "text-purple-400")}>Global</button>
                <button onClick={() => setViewMode('project')} className={cn("hover:text-white transition-colors", viewMode === 'project' && "text-purple-400")}>Project</button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* --- STRATEGY SIDEBAR --- */}
        <div className="space-y-6">
          {/* --- STRATEGIC DNA --- */}
          <motion.div variants={itemVariants} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm relative overflow-hidden group">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6 flex items-center justify-between font-mono">
              Strategic DNA
              <Zap className="w-3 h-3 text-orange-500" />
            </h4>
            <div className="space-y-6 relative z-10">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Angle</p>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setSelectedAngleIdx(prev => (prev > 0 ? prev - 1 : activeContent.whatToSay.angles.length - 1))}
                      className="p-1 hover:bg-white/10 rounded-md transition-colors"
                    >
                      <ChevronLeft size={10} />
                    </button>
                    <button 
                      onClick={() => setSelectedAngleIdx(prev => (prev < activeContent.whatToSay.angles.length - 1 ? prev + 1 : 0))}
                      className="p-1 hover:bg-white/10 rounded-md transition-colors"
                    >
                      <ChevronRight size={10} />
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                  <p className="text-xs text-white font-bold tracking-tight">{activeContent.whatToSay.angles[selectedAngleIdx]}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Emotion</p>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setSelectedEmotionIdx(prev => (prev > 0 ? prev - 1 : activeContent.whatToSay.emotions.length - 1))}
                      className="p-1 hover:bg-white/10 rounded-md transition-colors"
                    >
                      <ChevronLeft size={10} />
                    </button>
                    <button 
                      onClick={() => setSelectedEmotionIdx(prev => (prev < activeContent.whatToSay.emotions.length - 1 ? prev + 1 : 0))}
                      className="p-1 hover:bg-white/10 rounded-md transition-colors"
                    >
                      <ChevronRight size={10} />
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                  <p className="text-xs text-white font-bold tracking-tight">{activeContent.whatToSay.emotions[selectedEmotionIdx]}</p>
                </div>
              </div>
            </div>
          </motion.div>

           <motion.div variants={itemVariants} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6 flex items-center justify-between font-mono">
              Core Narrative
              <Settings2 className="w-3 h-3 hover:rotate-45 transition-transform cursor-pointer" />
            </h4>
            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">The Enemy</p>
                <p className="text-xs text-zinc-400 font-medium italic leading-relaxed">"{activeContent.core.enemy}"</p>
              </div>
              <div className="space-y-2">
                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">The Mechanism</p>
                <p className="text-xs text-zinc-400 font-medium italic leading-relaxed">"{activeContent.core.mechanism}"</p>
              </div>
              <div className="pt-6 border-t border-zinc-800">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      Growth Score
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[10px]">9.8/10</Badge>
                 </div>
              </div>
            </div>
          </motion.div>

          <Button variant="ghost" className="w-full justify-start text-zinc-500 hover:text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-widest gap-3 h-12 rounded-2xl border border-transparent hover:border-zinc-800 font-mono">
            <Monitor className="w-4 h-4" />
            Social Preview
          </Button>
        </div>
      </section>

      {/* --- REPOSITORY --- */}
      <section className="bg-zinc-900/50 border border-zinc-800 rounded-[3rem] p-10 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-white flex items-center gap-3 tracking-tighter">
              <MessageSquare className="w-7 h-7 text-blue-400" />
              Content Repository
            </h3>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Access all pre-calculated assets</p>
          </div>
          
          <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 w-full md:w-auto overflow-x-auto">
            {['hooks', 'angles', 'scripts', 'ctas'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all whitespace-nowrap",
                  activeTab === tab ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="wait">
            {activeContent.whatToSay[activeTab].map((item, idx) => (
              <motion.div
                key={`${activeTab}-${idx}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
                className="group relative p-8 bg-zinc-950 border border-zinc-800 rounded-3xl hover:border-purple-500/50 transition-all flex flex-col justify-between shadow-xl"
              >
                <p className={cn(
                  "text-zinc-300 leading-relaxed font-bold",
                  activeTab === 'hooks' || activeTab === 'ctas' ? "text-lg" : "text-sm"
                )}>
                  {item}
                </p>
                <div className="mt-8 flex justify-between items-center">
                  <Badge variant="outline" className="text-[10px] font-black text-zinc-500 uppercase p-0 border-none">Variante {idx + 1}</Badge>
                  <button 
                    onClick={() => handleCopy(item, `${activeTab}-repo-${idx}`)}
                    className="p-3 bg-zinc-900 text-white rounded-xl hover:bg-purple-600 transition-all hover:scale-110"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* --- MODALS --- */}
      <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-lg rounded-[2.5rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-3 tracking-tighter italic">
              <Share2 className="w-6 h-6 text-purple-400" />
              Final Execution
            </DialogTitle>
            <DialogDescription className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mt-2">
              Optimize and sync with your campaigns
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 py-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Platform Optimized For</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'instagram', icon: Instagram, label: 'Insta' },
                  { id: 'twitter', icon: Twitter, label: 'X (Twitter)' },
                  { id: 'tiktok', icon: Monitor, label: 'TikTok' }
                ].map((p) => (
                  <button 
                    key={p.id}
                    onClick={() => setSelectedPlatform(p.id as any)}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all hover:scale-105",
                      selectedPlatform === p.id ? "bg-purple-600/10 border-purple-600 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                    )}
                  >
                    <p.icon size={24}/>
                    <span className="text-[9px] font-black uppercase tracking-widest">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Content Draft</label>
              <textarea 
                value={postDraft}
                onChange={(e) => setPostDraft(e.target.value)}
                className="w-full h-40 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-sm text-zinc-200 focus:ring-2 focus:ring-purple-600 outline-none resize-none font-bold italic leading-relaxed"
              />
            </div>

            <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl flex gap-4 items-start">
               <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                  <CheckCircle2 size={20}/>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Smart-Sync Active</p>
                  <p className="text-[10px] text-zinc-500 font-medium leading-relaxed italic">
                    Saving this will create a draft in your Marketing Dashboard and link it to the {selectedPlatform} funnel.
                  </p>
               </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-between gap-4">
            <Button variant="ghost" onClick={() => setIsPostModalOpen(false)} className="text-zinc-500 hover:text-white font-black uppercase text-[10px] tracking-widest">
              Cancel
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                onClick={() => handleSendToCampaigns(activePostType || 'draft', postDraft)}
                disabled={isSending}
                className="flex-1 sm:flex-none h-12 bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest text-[10px] px-8 rounded-2xl"
              >
                {isSending ? 'Saving...' : 'Send to Campaigns'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
