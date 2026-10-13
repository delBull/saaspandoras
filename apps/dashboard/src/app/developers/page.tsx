'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, 
  Copy, 
  Check, 
  Globe, 
  Zap, 
  Lock, 
  BarChart3, 
  Layers, 
  MessageSquare, 
  Coins,
  Puzzle,
  ChevronDown,
  Loader2,
  BookOpen,
  RefreshCw,
  Shield,
  Activity,
  LineChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDashboardDomain } from '@saasfly/shared';
import { toast } from 'sonner';

interface Project {
  id: number;
  title: string;
  slug: string;
  w2eConfig?: any;
}

export default function DevelopersPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'widget' | 'commerce' | 'portal' | 'api' | 'webhooks' | 'knowledge' | 'logs'>('widget');
  
  // Dynamic State
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [publicKey, setPublicKey] = useState<string>('pk_grow_live_...');
  const [loading, setLoading] = useState(true);
  const [loadingKey, setLoadingKey] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [discordHandle, setDiscordHandle] = useState('');
  const [submittingBeta, setSubmittingBeta] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchApiKey(selectedProject.slug);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/projects');
      const data = await response.json();
      if (Array.isArray(data)) {
        setProjects(data);
        if (data.length > 0) {
          setSelectedProject(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const [rotatingKey, setRotatingKey] = useState(false);

  // Webhook Configuration State
  const [callbackUrl, setCallbackUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [rotatingSecret, setRotatingSecret] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testPingResult, setTestPingResult] = useState<{ success: boolean; message: string } | null>(null);

  // Production / Simulation State
  const [isSimulationMode, setIsSimulationMode] = useState(true);
  const [hasLiveEntitlement, setHasLiveEntitlement] = useState(false);
  const [activatingLive, setActivatingLive] = useState(false);

  // Telemetry & Logs State (Phase 6)
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [usageMetrics, setUsageMetrics] = useState<any>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);

  const fetchApiKey = async (slug: string) => {
    setLoadingKey(true);
    try {
      const response = await fetch(`/api/admin/projects/${slug}/keys`);
      const data = await response.json();
      if (data.hasKeys) {
        setPublicKey(data.publicKey || 'pk_grow_live_...');
      } else {
        // Fallback: check if we can generate
        const genRes = await fetch(`/api/admin/projects/${slug}/keys`, { method: 'POST' });
        const genData = await genRes.json();
        setPublicKey(genData.publicKey || 'pk_grow_live_...');
      }
      setIsSimulationMode(data.isSimulationMode ?? true);
      setHasLiveEntitlement(Boolean(data.hasLiveEntitlement));
      if (data.callbackUrl) {
        setCallbackUrl(data.callbackUrl);
      } else {
        setCallbackUrl('');
      }
      if (data.callbackSecretHash) {
        setWebhookSecret(data.callbackSecretHash);
      } else {
        setWebhookSecret('');
      }

      // Fetch initial usage metrics and logs if public/secret key exists
      if (data.publicKey || data.secretKey) {
        fetchTelemetry(data.publicKey || data.secretKey);
      }
    } catch (error) {
      console.error('Error fetching API key:', error);
    } finally {
      setLoadingKey(false);
    }
  };

  const fetchTelemetry = async (tokenKey: string) => {
    if (!tokenKey || tokenKey.startsWith('pk_grow_live_...')) return;
    setLoadingUsage(true);
    setLoadingLogs(true);
    try {
      const headers = { Authorization: `Bearer ${tokenKey}` };
      const [logsRes, usageRes] = await Promise.all([
        fetch("/api/v1/dev/logs?limit=20", { headers }).catch(() => null),
        fetch("/api/v1/dev/usage", { headers }).catch(() => null),
      ]);

      if (logsRes && logsRes.ok) {
        const logsData = await logsRes.json();
        if (logsData.events) setLogs(logsData.events);
      }
      if (usageRes && usageRes.ok) {
        const usageData = await usageRes.json();
        setUsageMetrics(usageData);
      }
    } catch (err) {
      console.error("Error fetching telemetry:", err);
    } finally {
      setLoadingUsage(false);
      setLoadingLogs(false);
    }
  };

  const handleActivateLive = async () => {
    if (!selectedProject?.slug) return;
    const confirmLive = window.confirm(
      "¿Activar entorno LIVE para este proyecto? Esta acción es irreversible y emitirá tus credenciales oficiales de producción (sk_live_...)."
    );
    if (!confirmLive) return;

    setActivatingLive(true);
    try {
      const res = await fetch("/api/v1/dev/keys/activate-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: selectedProject.slug }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("¡Entorno LIVE activado exitosamente!");
        setIsSimulationMode(false);
        if (data.credentials?.publicKey) {
          setPublicKey(data.credentials.publicKey);
        }
      } else if (res.status === 402) {
        toast.error("Requiere suscripción activa al plan Starter o Growth de DEV_ACCESS para activar LIVE.");
      } else {
        toast.error(data.error || data.message || "Error al activar producción");
      }
    } catch {
      toast.error("Error al activar producción");
    } finally {
      setActivatingLive(false);
    }
  };

  const handleSaveWebhook = async () => {
    if (!selectedProject?.slug) return;
    setSavingWebhook(true);
    setTestPingResult(null);
    try {
      const res = await fetch("/api/v1/dev/webhooks/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: selectedProject.slug,
          callbackUrl: callbackUrl.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Webhook URL configurada exitosamente");
        if (data.webhookSecret) {
          setWebhookSecret(data.webhookSecret);
        }
      } else {
        toast.error(data.error || "Error al configurar webhook");
      }
    } catch {
      toast.error("Error al configurar webhook");
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleRotateWebhookSecret = async () => {
    if (!selectedProject?.slug) return;
    const confirmRotate = window.confirm(
      "¿Rotar el secreto HMAC del webhook? Deberás actualizar la firma en tu servidor receptor inmediatamente."
    );
    if (!confirmRotate) return;

    setRotatingSecret(true);
    try {
      const res = await fetch("/api/v1/dev/webhooks/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: selectedProject.slug,
          callbackUrl: callbackUrl.trim(),
          rotateSecret: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Secreto HMAC rotado exitosamente");
        if (data.webhookSecret) {
          setWebhookSecret(data.webhookSecret);
        }
      } else {
        toast.error(data.error || "Error al rotar secreto HMAC");
      }
    } catch {
      toast.error("Error al rotar secreto HMAC");
    } finally {
      setRotatingSecret(false);
    }
  };

  const handleTestPing = async () => {
    if (!selectedProject?.slug || !callbackUrl.trim()) {
      toast.error("Configura una URL de webhook antes de probar");
      return;
    }
    setTestingWebhook(true);
    setTestPingResult(null);
    try {
      const res = await fetch("/api/v1/webhooks/test", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${publicKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          targetUrl: callbackUrl.trim(),
          eventType: "ping",
          payload: { timestamp: Date.now(), project: selectedProject.slug }
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Ping recibido exitosamente por el destino");
        setTestPingResult({ success: true, message: `Status HTTP ${data.statusCode} (${data.responseTimeMs}ms)` });
      } else {
        toast.error(data.error || "Fallo en el ping de prueba");
        setTestPingResult({ success: false, message: data.error || `HTTP ${res.status}` });
      }
    } catch (err: any) {
      toast.error("Error de conectividad al enviar ping");
      setTestPingResult({ success: false, message: err?.message || "Network Error" });
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleRotateKeys = async () => {
    if (!selectedProject?.slug) return;
    const confirmRotate = window.confirm(
      "¿Estás seguro de rotar tus credenciales? Las llaves actuales se revocarán inmediatamente y cualquier integración activa dejará de funcionar hasta que actualices tu código."
    );
    if (!confirmRotate) return;

    setRotatingKey(true);
    try {
      const res = await fetch("/api/v1/dev/keys/rotate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: selectedProject.slug }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPublicKey(data.credentials.publicKey || 'pk_grow_live_...');
        toast.success("Credenciales rotadas exitosamente");
      } else {
        toast.error(data.error || "Error al rotar credenciales");
      }
    } catch (err) {
      toast.error("Error al rotar credenciales");
    } finally {
      setRotatingKey(false);
    }
  };

  
  const handleBetaRequest = async () => {
    if (!discordHandle.trim()) {
      toast.error('Por favor ingresa tu usuario de Discord');
      return;
    }
    setSubmittingBeta(true);
    try {
      const res = await fetch('/api/developers/beta-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          discordHandle, 
          projectId: selectedProject?.slug || 'none',
          email: 'admin@' + (selectedProject?.slug || 'unknown') + '.com'
        })
      });
      if (res.ok) {
        toast.success('¡Solicitud enviada! Revisa Discord pronto.');
        setShowBetaModal(false);
        setDiscordHandle('');
      } else {
        toast.error('Hubo un error al enviar tu solicitud.');
      }
    } catch (e) {
      toast.error('Hubo un error al enviar tu solicitud.');
    } finally {
      setSubmittingBeta(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success('Snippet copiado');
    setTimeout(() => setCopied(null), 2000);
  };

  const projectSlug = selectedProject?.slug || 'YOUR_PROJECT_SLUG';
  const phases = (selectedProject?.w2eConfig as any)?.phases || [];
  const firstTier = String(phases[0]?.name || phases[0]?.id || phases[0]?.title || 'platinum').toLowerCase();
  const secondTier = String((phases[1] || phases[0])?.name || (phases[1] || phases[0])?.id || (phases[1] || phases[0])?.title || 'silver').toLowerCase();

  const snippets = {
    widget: `<!-- Pandoras Growth OS Widget -->
<script 
  src="https://${getDashboardDomain()}/api/widget/v1.js" 
  data-project-id="${projectSlug}" 
  data-api-key="${publicKey}"
  data-theme="premium"
  defer
></script>`,
    commerce: `// Option A: Data Attributes — Usa "default" para fase activa automática
<button 
  data-pd-checkout-slug="${projectSlug}" 
  data-pd-checkout-tier="default"
> Comprar Ahora </button>

// Option B: Programmatic Popup — Resilient Matching
window.PandorasGrowth.openCheckout('${projectSlug}', 'default');`,
    portal: `// Option A: Data Attributes (Zero Friction - Now with DAO & Claims)
<button data-pd-portal="true"> Mi Portal </button>

// Option B: Programmable Portal Launch
window.PandorasGrowth.openPortal('${projectSlug}');`,
    api: `// Ingestión Directa de Eventos y Leads al Event Spine
await fetch("https://${getDashboardDomain()}/api/v1/integrations/events", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${publicKey}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    eventId: "evt_" + Date.now(),
    eventType: "lead.new",
    projectId: ${selectedProject?.id || 101},
    payload: {
      email: "builder@example.com",
      tags: ["DEV_INTEGRATION"]
    }
  })
});`,
    webhooks: `// Escucha eventos del Growth OS en tu propio backend
// Configura tu URL en Panel Pandoras > Proyectos > Webhooks
app.post("/webhook/pandoras", (req, res) => {
  const { event, data } = req.body;
  
  if (event === 'lead.fastlane_checkout') {
    // 🚀 Se disparó el flujo de Fast-Lane (Email enviado)
    console.log("Fast-Lane Intent:", data.email, data.status);
  }
  
  if (event === 'lead.new' || event === 'lead.returning') {
    // 👤 Lead capturado por el Widget (B2B/B2C)
    console.log("Lead Profile:", data.email, data.intent);
  }

  res.send({ received: true });
});`,
    knowledge: `// Detecta y enruta al Knowledge Center del proyecto
const response = await fetch("https://${getDashboardDomain()}/api/public/project/${projectSlug}/state", {
  headers: { "x-api-key": "${publicKey}" }
});
const state = await response.json();

if (state.knowledgeCenter?.isActive) {
  // Redirige al usuario al portal de acceso (Briefings CMS)
  window.location.href = state.knowledgeCenter.url;
}`,
    logs: `// Consulta de telemetría y entregas de webhooks en vivo
const logsResponse = await fetch("https://${getDashboardDomain()}/api/v1/dev/logs?limit=20", {
  headers: { "Authorization": "Bearer ${publicKey}" }
});
const logs = await logsResponse.json();
console.log("Historial de entregas:", logs);`
  };

  const roadmapItems = [
    {
      title: 'Pandoras Auth SDK',
      version: 'v1.8',
      description: 'Unified Social & Wallet login with automatic session bridging and KYC ready.',
      icon: <Lock className="w-6 h-6 text-indigo-400" />,
      status: 'In Development',
      color: 'indigo'
    },
    {
      title: 'Gamification API',
      version: 'v2.0',
      description: 'Levels, XP, and Achievements as a Service for any protocol or community.',
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      status: 'Planned',
      color: 'yellow'
    },
    {
      title: 'Token Creator & Minting',
      version: 'v2.2',
      description: 'Deploy ERC-20, ERC-721, or ERC-1155 directly from the dashboard.',
      icon: <Coins className="w-6 h-6 text-emerald-400" />,
      status: 'Coming Soon',
      color: 'emerald'
    },
    {
      title: 'NFT Passes & Gate Keeper',
      version: 'v2.5',
      description: 'Gated content, utility layers, and dynamic NFT management for VIP tiers.',
      icon: <Layers className="w-6 h-6 text-purple-400" />,
      status: 'Next Year',
      color: 'purple'
    },
    {
      title: 'Discord & Telegram Webhooks',
      version: 'v2.8',
      description: 'Protocol-level automations and real-time community alerts for every action.',
      icon: <MessageSquare className="w-6 h-6 text-blue-400" />,
      status: 'Planned',
      color: 'blue'
    },
    {
      title: 'Growth CRM & Marketing Hub',
      version: 'v3.2',
      description: 'Unified dashboard for automated user journey mapping and high-intent alerts.',
      icon: <BarChart3 className="w-6 h-6 text-pink-400" />,
      status: 'Coming Soon',
      color: 'pink'
    },
    {
      title: 'Agenda Soberana',
      version: 'v3.0',
      description: 'Decentralized governance, sovereign scheduling, and DAO tools.',
      icon: <Globe className="w-6 h-6 text-sky-400" />,
      status: 'Long Term',
      color: 'sky'
    }
  ];

  return (
    <div className="relative min-h-screen bg-zinc-950/50">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="container relative max-w-6xl py-12 space-y-16">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-white/5 pb-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6 text-center md:text-left flex-1"
          >
            <div className="inline-flex items-center px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest border rounded-full bg-zinc-900/80 border-white/10 text-indigo-400 backdrop-blur-md">
              <Terminal className="w-3.5 h-3.5 mr-2" />
              Developer ecosystem & Hub
            </div>
            <h1 className="text-5xl font-black tracking-tight md:text-6xl lg:text-7xl">
              <span className="text-white">Build for</span> <br />
              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Hyper Growth.
              </span>
            </h1>
            <p className="max-w-2xl text-xl text-zinc-400 font-light leading-relaxed">
              Integra la infraestructura definitiva de Pandoras con fragmentos de código dinámicos.
            </p>
          </motion.div>

          {/* Project Selector - Premium Style */}
          <div className="relative w-full md:w-72 mt-8 md:mt-0">
            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-3 ml-1">Configure your Workspace</p>
            <button 
              onClick={() => setShowSelector(!showSelector)}
              className="w-full h-14 bg-zinc-900 border border-white/10 rounded-2xl px-6 flex items-center justify-between group hover:border-indigo-500/50 transition-all text-sm font-bold text-white shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                {loading ? 'Cargando proyectos...' : selectedProject?.title || 'Seleccionar Proyecto'}
              </div>
              <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform", showSelector && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showSelector && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 p-2 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-50 backdrop-blur-xl overflow-hidden"
                >
                  <div className="max-h-60 overflow-y-auto no-scrollbar">
                    {projects.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedProject(p);
                          setShowSelector(false);
                        }}
                        className={cn(
                          "w-full text-left p-3 rounded-xl text-xs font-bold transition-all mb-1",
                          selectedProject?.id === p.id 
                            ? "bg-indigo-500/10 text-indigo-400" 
                            : "text-zinc-500 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        {p.title}
                      </button>
                    ))}
                    {projects.length === 0 && !loading && (
                      <div className="p-4 text-center text-zinc-600 text-xs italic">No hay proyectos activos</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* DEV_ACCESS Package & Subscription Banner */}
        <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-zinc-950/60 border border-indigo-500/20 backdrop-blur-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                <Shield className="w-3 h-3" />
                {hasLiveEntitlement ? "Suscripción Activa" : "Paquete DEV_ACCESS · Acceso Headless"}
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white">
                {hasLiveEntitlement 
                  ? "Plan Comercial Activo: Entorno LIVE Habilitado"
                  : "Desbloquea Producción: Plan Starter ($99/mes)"}
              </h3>
              <p className="text-xs md:text-sm text-zinc-400 font-light leading-relaxed">
                {hasLiveEntitlement
                  ? "Tu proyecto cuenta con suscripción comercial activa. Puedes activar o usar credenciales LIVE (sk_live_...) con hasta 50,000 eventos/mes y despacho Anti-SSRF en tiempo real."
                  : "Accede al Event Spine, Webhooks de alta velocidad, Ingestión de leads y activa credenciales live oficiales directamente para integrar en tu backend propio."}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              {hasLiveEntitlement ? (
                <div className="px-5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold text-center flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  ENTITLEMENT: VERIFICADO
                </div>
              ) : (
                <Link
                  href={`/nexus/checkout/new?productKey=DEV_ACCESS&plan=starter&slug=${selectedProject?.slug || ''}`}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Coins className="w-4 h-4" />
                  Contratar Starter ($99/mo)
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Features Tabs */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold text-white">SDK & Integrations</h2>
              <p className="text-zinc-500">Snippets de alta performance pre-configurados para <span className="text-white font-bold">{selectedProject?.title || 'tu protocolo'}</span>.</p>
            </div>
            <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-zinc-600 bg-zinc-900/50 px-3 py-1 rounded-lg border border-zinc-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              API STATUS: OPERATIONAL
            </div>
          </div>
          
          <Card className="border-white/5 bg-zinc-900/40 backdrop-blur-xl shadow-2xl overflow-hidden rounded-3xl">
            <div className="grid grid-cols-1 lg:grid-cols-5 min-h-[450px]">
              {/* Sidebar Tabs for Codes */}
              <div className="lg:col-span-1 border-b lg:border-b-0 lg:border-r border-white/5 p-4 bg-zinc-950/20">
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-bold text-zinc-600 mb-4 px-2">Growth OS v2.0</div>
                  <button 
                    onClick={() => setActiveTab('widget')}
                    className={cn(
                      "w-full flex items-center space-x-3 text-sm px-4 py-3 rounded-xl transition-all",
                      activeTab === 'widget' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                    )}
                  >
                    <Globe className="w-4 h-4" />
                    <span>Widget Script</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('commerce')}
                    className={cn(
                      "w-full flex items-center space-x-3 text-sm px-4 py-3 rounded-xl transition-all",
                      activeTab === 'commerce' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                    )}
                  >
                    <Coins className="w-4 h-4" />
                    <div className="flex flex-col items-start">
                      <span>Commerce & Checkout</span>
                      <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest leading-none mt-1">Case-Insensitive</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => setActiveTab('portal')}
                    className={cn(
                      "w-full flex items-center space-x-3 text-sm px-4 py-3 rounded-xl transition-all",
                      activeTab === 'portal' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                    )}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Investor Portal</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('api')}
                    className={cn(
                      "w-full flex items-center space-x-3 text-sm px-4 py-3 rounded-xl transition-all",
                      activeTab === 'api' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                    )}
                  >
                    <Puzzle className="w-4 h-4" />
                    <span>Advanced Lead API</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('knowledge')}
                    className={cn(
                      "w-full flex items-center space-x-3 text-sm px-4 py-3 rounded-xl transition-all",
                      activeTab === 'knowledge' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                    )}
                  >
                    <BookOpen className="w-4 h-4" />
                    <div className="flex flex-col items-start">
                      <span>Knowledge Center</span>
                      <span className="text-[9px] text-purple-400 font-black uppercase tracking-widest leading-none mt-1">Briefing CMS</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => setActiveTab('webhooks')}
                    className={cn(
                      "w-full flex items-center space-x-3 text-sm px-4 py-3 rounded-xl transition-all",
                      activeTab === 'webhooks' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                    )}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <div className="flex flex-col items-start">
                      <span>Webhook Events</span>
                      <span className="text-[9px] text-indigo-400 font-black uppercase tracking-widest leading-none mt-1">Real-Time</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => {
                      setActiveTab('logs');
                      if (publicKey) fetchTelemetry(publicKey);
                    }}
                    className={cn(
                      "w-full flex items-center space-x-3 text-sm px-4 py-3 rounded-xl transition-all",
                      activeTab === 'logs' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                    )}
                  >
                    <Activity className="w-4 h-4" />
                    <div className="flex flex-col items-start">
                      <span>Logs & Telemetría</span>
                      <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest leading-none mt-1">Live Feed</span>
                    </div>
                  </button>
                </div>

                <div className="mt-10 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                   <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-2">Workspace Info</p>
                   <div className="space-y-2">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-500">ID:</span>
                        <span className="text-white font-mono">{selectedProject?.id || '—'}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-500">Slug:</span>
                        <span className="text-white font-mono">{selectedProject?.slug || '—'}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-500">Modo:</span>
                        <span className={cn("font-bold font-mono", isSimulationMode ? "text-amber-400" : "text-emerald-400")}>
                          {isSimulationMode ? "SANDBOX / SIMULATION" : "LIVE / PRODUCTION"}
                        </span>
                      </div>
                   </div>

                   <div className="mt-4 pt-3 border-t border-indigo-500/10 space-y-2">
                      {isSimulationMode && (
                        <button
                          onClick={handleActivateLive}
                          disabled={activatingLive || !selectedProject}
                          className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold text-white transition-all disabled:opacity-50 shadow-md shadow-emerald-500/10"
                          title="Activa el entorno productivo emitiendo sk_live_... (Requiere plan comercial DEV_ACCESS)"
                        >
                          <Zap className={cn("w-3 h-3 text-white", activatingLive && "animate-spin")} />
                          <span>{activatingLive ? "Activando..." : "Activar Entorno LIVE"}</span>
                        </button>
                      )}
                      <button
                        onClick={handleRotateKeys}
                        disabled={rotatingKey || !selectedProject}
                        className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[10px] font-bold text-zinc-300 border border-white/5 transition-all disabled:opacity-50"
                        title="Rotar credenciales revoca las llaves anteriores y emite una nueva de forma determinista"
                      >
                        <RefreshCw className={cn("w-3 h-3 text-indigo-400", rotatingKey && "animate-spin")} />
                        <span>{rotatingKey ? "Rotando..." : isSimulationMode ? "Rotar Llaves Sandbox" : "Rotar Llaves Live"}</span>
                      </button>
                   </div>
                </div>
              </div>

              {/* Code Display Area */}
              <div className="lg:col-span-4 p-0 bg-zinc-950/40 relative group">
                {loadingKey && (
                   <div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm z-20 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                   </div>
                )}
                
                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className={cn(
                      "bg-zinc-800 hover:bg-zinc-700 text-xs rounded-lg h-8 px-4 font-bold border border-white/5",
                      copied === 'code' && "text-emerald-400 border-emerald-500/30 bg-emerald-500/5"
                    )}
                    onClick={() => handleCopy(snippets[activeTab], 'code')}
                  >
                    {copied === 'code' ? (
                      <><Check className="w-3 h-3 mr-2" /> Copied</>
                    ) : (
                      <><Copy className="w-3 h-3 mr-2" /> Copy Code</>
                    )}
                  </Button>
                </div>
                
                <div className="p-8 font-mono text-sm overflow-auto max-h-[500px] leading-relaxed">
                  {activeTab === 'api' ? (
                    <pre className="space-y-1">
                      <div className="text-zinc-600">// Direct Lead & Platform Event Ingestion via REST API</div>
                      <div>
                        <span className="text-purple-400">await</span> <span className="text-blue-400">fetch</span>(<span className="text-emerald-300">"https://${getDashboardDomain()}/api/v1/integrations/events"</span>, {'{'}<br/>
                        {'  method: '}<span className="text-emerald-300">"POST"</span>,<br/>
                        {'  headers: { '}<span className="text-emerald-300">"Authorization"</span>{': '}<span className="text-emerald-300">"Bearer {publicKey}"</span>{', '}<span className="text-emerald-300">"Content-Type"</span>{': '}<span className="text-emerald-300">"application/json"</span>{' },'}<br/>
                        {'  body: '}<span className="text-blue-400">JSON</span>.<span className="text-indigo-400">stringify</span>({'{'}<br/>
                        {'    eventId: '}<span className="text-emerald-300">"evt_" + Date.now()</span>,<br/>
                        {'    eventType: '}<span className="text-emerald-300">"lead.new"</span>,<br/>
                        {'    projectId: '}<span className="text-emerald-300">"{selectedProject?.id || projectSlug}"</span>,<br/>
                        {'    payload: { email: '}<span className="text-emerald-300">"user@example.com"</span>{', tags: ['}<span className="text-emerald-300">"VIP_CLIENT"</span>{'] }'}<br/>
                        {'  })'}<br/>
                        {'});'}
                      </div>
                    </pre>
                  ) : activeTab === 'portal' ? (
                    <pre className="space-y-4">
                      <div>
                        <div className="text-zinc-600 mb-2">// Option A: Data Attributes (Zero Friction - Now with DAO & Claims)</div>
                        <span className="text-zinc-400">&lt;</span><span className="text-blue-400">button</span><br/>
                        <span className="pl-6 text-indigo-400">data-pd-portal</span>=<span className="text-emerald-300">"true"</span><br/>
                        <span className="text-zinc-400">&gt;</span> Mi Portal <span className="text-zinc-400">&lt;/</span><span className="text-blue-400">button</span><span className="text-zinc-400">&gt;</span>
                      </div>
                      
                      <div>
                        <div className="text-zinc-600 mb-2">// Option B: Programmable Portal Launch</div>
                        <span className="text-indigo-400">window</span>.<span className="text-indigo-300">PandorasGrowth</span>.<span className="text-emerald-400">openPortal</span>(<span className="text-emerald-300">'{projectSlug}'</span>);
                      </div>

                      <div className="pt-4 border-t border-white/5 mt-4">
                        <p className="text-zinc-500 text-[10px] uppercase font-black">Nomenclatura Oficial</p>
                        <p className="text-zinc-400 text-xs italic mt-1">
                          • <span className="text-indigo-400 font-bold">Títulos</span>: Unidades de participación (artefactos).<br/>
                          • <span className="text-indigo-400 font-bold">Certificado</span>: Documento legal PDF / On-chain Proof.
                        </p>
                      </div>
                    </pre>
                  ) : activeTab === 'commerce' ? (
                    <pre className="space-y-4">
                      <div>
                        <div className="text-zinc-600 mb-2">// Option A: Data Attributes (Zero Code) - Now Case-Insensitive</div>
                        <span className="text-zinc-400">&lt;</span><span className="text-blue-400">button</span><br/>
                        <span className="pl-6 text-indigo-400">data-pd-checkout-slug</span>=<span className="text-emerald-300">"{projectSlug}"</span><br/>
                        <span className="pl-6 text-indigo-400">data-pd-checkout-tier</span>=<span className="text-emerald-300">"{firstTier}"</span><br/>
                        <span className="text-zinc-400">&gt;</span> Buy Now <span className="text-zinc-400">&lt;/</span><span className="text-blue-400">button</span><span className="text-zinc-400">&gt;</span>
                      </div>
                      
                      <div>
                        <div className="text-zinc-600 mb-2">// Option B: Programmable Popup - Resilient Matching</div>
                        <span className="text-indigo-400">window</span>.<span className="text-indigo-300">PandorasGrowth</span>.<span className="text-emerald-400">openCheckout</span>(<span className="text-emerald-300">'{projectSlug}'</span>, <span className="text-emerald-300">'{secondTier}'</span>);
                      </div>
                    </pre>
                  ) : activeTab === 'webhooks' ? (
                    <div className="space-y-6">
                      {/* Interactive Configuration Card */}
                      <div className="p-4 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-4 font-sans">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                          <div>
                            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                              <Shield className="w-3.5 h-3.5 text-indigo-400" />
                              Configuración de Webhook Receptora
                            </span>
                            <span className="text-[11px] text-zinc-400 block mt-0.5">
                              Destino HTTPS validado con Anti-SSRF para despachar eventos en tiempo real.
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleTestPing}
                              disabled={testingWebhook || !callbackUrl}
                              className="h-8 text-xs font-semibold border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
                            >
                              {testingWebhook ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <Zap className="w-3 h-3 mr-1.5 text-amber-400" />}
                              Test Ping
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSaveWebhook}
                              disabled={savingWebhook || !selectedProject}
                              className="h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
                            >
                              {savingWebhook ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <Check className="w-3 h-3 mr-1.5" />}
                              Guardar URL
                            </Button>
                          </div>
                        </div>

                        {/* Input callbackUrl */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                            Callback URL (Endpoint del receptor)
                          </label>
                          <input
                            type="url"
                            placeholder="https://tu-dominio.com/api/webhooks/pandoras"
                            value={callbackUrl}
                            onChange={(e) => setCallbackUrl(e.target.value)}
                            className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-all"
                          />
                        </div>

                        {/* Secret HMAC & Rotation */}
                        <div className="p-3 rounded-xl bg-zinc-950/60 border border-white/5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider">
                              Secreto de Firma HMAC (whsec_...)
                            </span>
                            <button
                              onClick={handleRotateWebhookSecret}
                              disabled={rotatingSecret || !selectedProject}
                              className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold disabled:opacity-55"
                            >
                              <RefreshCw className={cn("w-2.5 h-2.5", rotatingSecret && "animate-spin")} />
                              {rotatingSecret ? "Rotando..." : "Rotar Secreto"}
                            </button>
                          </div>
                          <div className="flex items-center justify-between bg-zinc-900 px-3 py-2 rounded-lg border border-white/5 font-mono text-xs">
                            <span className="text-emerald-400 truncate max-w-[280px] sm:max-w-md">
                              {webhookSecret ? `${webhookSecret.slice(0, 12)}••••••••••••••••••••••••` : "No generado aún (haz click en Guardar URL)"}
                            </span>
                            {webhookSecret && (
                              <button
                                onClick={() => handleCopy(webhookSecret, 'secret')}
                                className="text-zinc-400 hover:text-white ml-2 shrink-0"
                                title="Copiar secreto completo"
                              >
                                {copied === 'secret' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Test Ping Result Banner */}
                        {testPingResult && (
                          <div className={cn(
                            "px-3 py-2 rounded-xl text-xs font-mono flex items-center justify-between border",
                            testPingResult.success ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"
                          )}>
                            <span>{testPingResult.success ? "✓ Test Ping exitoso:" : "✗ Test Ping fallido:"} {testPingResult.message}</span>
                          </div>
                        )}
                      </div>

                      {/* Code Snippet for Consumer Server */}
                      <pre className="space-y-4">
                        <div>
                          <div className="text-zinc-600 mb-2">// Escucha y verifica la firma HMAC en tu propio backend (Node.js/Express)</div>
                          <span className="text-indigo-400">app</span>.<span className="text-blue-400">post</span>(<span className="text-emerald-300">"/webhook/pandoras"</span>, (<span className="text-orange-300">req</span>, <span className="text-orange-300">res</span>) {`=>`} {'{'}<br/>
                          <span className="pl-6 text-purple-400">const</span> {'{ event, data } = '}<span className="text-orange-300">req</span>.<span className="text-indigo-300">body</span>;<br/>
                          <br/>
                          <span className="pl-6 text-purple-400">if</span> (event === <span className="text-emerald-300">'lead.fastlane_checkout'</span>) {'{'}<br/>
                          <span className="pl-12 text-zinc-500">// Fast-Lane desencadenado y Email de instrucciones enviado</span><br/>
                          <span className="pl-12 text-indigo-400">console</span>.<span className="text-blue-400">log</span>(<span className="text-emerald-300">"🚀 Fast-Lane Intent:"</span>, data.email);<br/>
                          <span className="pl-6">{'}'}</span><br/>
                          <br/>
                          <span className="pl-6 text-purple-400">if</span> (event === <span className="text-emerald-300">'lead.new'</span> || event === <span className="text-emerald-300">'lead.returning'</span>) {'{'}<br/>
                          <span className="pl-12 text-zinc-500">// Lead sincronizado (Autenticación agnóstica o Widget)</span><br/>
                          <span className="pl-12 text-indigo-400">console</span>.<span className="text-blue-400">log</span>(<span className="text-emerald-300">"👤 Lead Data:"</span>, data.intent);<br/>
                          <span className="pl-6">{'}'}</span><br/>
                          <br/>
                          <span className="pl-6 text-orange-300">res</span>.<span className="text-blue-400">send</span>({'{ received: true }'});<br/>
                          {'});'}
                        </div>
                      </pre>
                    </div>
                  ) : activeTab === 'knowledge' ? (
                    <pre className="space-y-4">
                      <div>
                        <div className="text-zinc-600 mb-2">// Lee el State del proyecto para acceder al Knowledge Center</div>
                        <span className="text-purple-400">const</span> response = <span className="text-purple-400">await</span> <span className="text-blue-400">fetch</span>(<span className="text-emerald-300">"https://${getDashboardDomain()}/api/public/project/{projectSlug}/state"</span>);<br/>
                        <span className="text-purple-400">const</span> state = <span className="text-purple-400">await</span> response.<span className="text-blue-400">json</span>();<br/>
                        <br/>
                        <span className="text-purple-400">if</span> (state.knowledgeCenter?.isActive) {'{'}<br/>
                        <span className="pl-6 text-zinc-500">// Redirige al lector de Briefings de Pandoras</span><br/>
                        <span className="pl-6 text-indigo-400">window</span>.<span className="text-indigo-300">location</span>.<span className="text-indigo-300">href</span> = state.knowledgeCenter.url;<br/>
                        {'}'}
                      </div>
                    </pre>
                  ) : activeTab === 'logs' ? (
                    <div className="space-y-6 font-sans">
                      {/* Real-time Usage Metrics Header Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2">
                          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                            <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                              <LineChart className="w-3.5 h-3.5 text-indigo-400" />
                              Cuota Mensual de Eventos
                            </span>
                            <span className="text-indigo-400 font-bold uppercase text-[10px]">
                              Plan {usageMetrics?.plan || (isSimulationMode ? "sandbox" : "starter")}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-white font-mono">
                              {usageMetrics?.monthlyEvents?.used ?? 0}
                            </span>
                            <span className="text-xs text-zinc-500 font-mono">
                              / {usageMetrics?.monthlyEvents?.limit === -1 ? "∞" : (usageMetrics?.monthlyEvents?.limit ?? (isSimulationMode ? 10000 : 50000))} eventos
                            </span>
                          </div>
                          <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all"
                              style={{ 
                                width: `${Math.min(100, Math.max(3, ((usageMetrics?.monthlyEvents?.used || 0) / (usageMetrics?.monthlyEvents?.limit || 50000)) * 100))}%` 
                              }}
                            />
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono flex justify-between">
                            <span>Restantes: {usageMetrics?.monthlyEvents?.remaining === -1 ? "Ilimitados" : (usageMetrics?.monthlyEvents?.remaining ?? 50000)}</span>
                            <span>Reset: {usageMetrics?.monthlyEvents?.resetDate ? new Date(usageMetrics.monthlyEvents.resetDate).toLocaleDateString() : "Fin de mes"}</span>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2">
                          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                            <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                              <Zap className="w-3.5 h-3.5 text-amber-400" />
                              Rate Limit por Minuto
                            </span>
                            <span className="text-emerald-400 font-bold text-[10px]">Fail-Closed Active</span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-white font-mono">
                              {usageMetrics?.rateLimit?.used ?? 0}
                            </span>
                            <span className="text-xs text-zinc-500 font-mono">
                              / {usageMetrics?.rateLimit?.limit ?? (isSimulationMode ? 120 : 300)} req/min
                            </span>
                          </div>
                          <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="bg-amber-400 h-full rounded-full transition-all"
                              style={{ 
                                width: `${Math.min(100, Math.max(2, ((usageMetrics?.rateLimit?.used || 0) / (usageMetrics?.rateLimit?.limit || 300)) * 100))}%` 
                              }}
                            />
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono flex justify-between">
                            <span>Ventana deslizante (60s)</span>
                            <span>Reset en: {usageMetrics?.rateLimit?.resetSeconds ?? 60}s</span>
                          </div>
                        </div>
                      </div>

                      {/* Webhook Deliveries & Event Stream Log */}
                      <div className="rounded-2xl bg-zinc-900/60 border border-white/10 overflow-hidden">
                        <div className="p-3 border-b border-white/5 flex items-center justify-between bg-zinc-950/40">
                          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-indigo-400" />
                            Historial de Eventos & Despachos de Webhook
                          </span>
                          <button
                            onClick={() => publicKey && fetchTelemetry(publicKey)}
                            disabled={loadingLogs}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1"
                          >
                            <RefreshCw className={cn("w-3 h-3", loadingLogs && "animate-spin")} />
                            {loadingLogs ? "Actualizando..." : "Refrescar"}
                          </button>
                        </div>

                        <div className="p-0 overflow-x-auto max-h-[320px]">
                          {logs.length === 0 ? (
                            <div className="p-8 text-center text-xs font-mono text-zinc-500">
                              No hay eventos registrados recientemente para este tenant. 
                              Envía tu primer evento a través de <span className="text-indigo-400">POST /api/v1/integrations/events</span>.
                            </div>
                          ) : (
                            <table className="w-full text-left text-xs font-mono">
                              <thead>
                                <tr className="border-b border-white/5 text-[10px] text-zinc-500 uppercase bg-zinc-950/20">
                                  <th className="p-3">Evento</th>
                                  <th className="p-3">Estado</th>
                                  <th className="p-3">Intentos</th>
                                  <th className="p-3">Fecha</th>
                                  <th className="p-3">Payload Preview</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {logs.map((item) => (
                                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="p-3 font-bold text-white">{item.event}</td>
                                    <td className="p-3">
                                      <span className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                        item.status === 'sent' || item.status === 'delivered' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                        item.status === 'pending' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                        "bg-red-500/10 text-red-400 border border-red-500/20"
                                      )}>
                                        {item.status}
                                      </span>
                                    </td>
                                    <td className="p-3 text-zinc-400">{item.attempts || 1}</td>
                                    <td className="p-3 text-zinc-500 text-[11px] whitespace-nowrap">
                                      {new Date(item.createdAt).toLocaleTimeString()}
                                    </td>
                                    <td className="p-3 text-zinc-400 max-w-xs truncate">
                                      {JSON.stringify(item.payload)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <pre className="space-y-1">
                      <div className="text-zinc-600">&lt;!-- Drop this in your &lt;body&gt; --&gt;</div>
                      <div>
                        <span className="text-zinc-400">&lt;</span><span className="text-blue-400">script</span><br/>
                        <span className="pl-6 text-indigo-400">src</span>=<span className="text-emerald-300">"https://${getDashboardDomain()}/api/widget/v1.js"</span><br/>
                        <span className="pl-6 text-indigo-400">data-project-id</span>=<span className="text-emerald-300">"{projectSlug}"</span><br/>
                        <span className="pl-6 text-indigo-400">data-api-key</span>=<span className="text-emerald-300">"{publicKey}"</span><br/>
                        <span className="pl-6 text-indigo-400">data-theme</span>=<span className="text-emerald-300">"premium"</span><br/>
                        <span className="text-zinc-400">&gt;&lt;/</span><span className="text-blue-400">script</span><span className="text-zinc-400">&gt;</span>
                      </div>
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Roadmap Timeline */}
        <section className="space-y-12 pt-10">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-white italic">ECOSYSTEM ROADMAP</h2>
            <div className="h-1 w-24 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full" />
            <p className="text-zinc-500 max-w-xl mx-auto">Nuestro compromiso con los desarrolladores: Crear las herramientas que tu protocolo necesita para ser masivo.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {roadmapItems.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative"
              >
                <div className={`absolute -inset-0.5 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500`} />
                <Card className="relative h-full transition-all border-white/5 bg-zinc-900/40 backdrop-blur-sm overflow-hidden rounded-3xl hover:border-white/10 shadow-lg">
                  <CardHeader className="p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div className="p-4 border border-white/5 rounded-2xl bg-zinc-950/50 shadow-inner group-hover:scale-110 transition-transform">
                        {item.icon}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="px-2.5 py-1 text-[9px] uppercase font-black tracking-widest rounded-lg border border-white/5 bg-zinc-950 text-indigo-400">
                          {item.version}
                        </span>
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold mb-3">{item.title}</CardTitle>
                    <CardDescription className="text-zinc-400 font-light leading-relaxed h-12 overflow-hidden">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-8 pb-8 pt-0">
                    <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 mr-2 rounded-full bg-zinc-700" />
                        {item.status}
                      </div>
                      <BarChart3 className="w-4 h-4 text-zinc-800" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Final CTA / Contact */}
        <section className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000" />
          <div className="relative p-10 md:p-16 border border-white/10 rounded-[40px] bg-zinc-950/80 backdrop-blur-3xl overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <Zap className="w-32 h-32 text-white/5 -rotate-12 translate-x-8 -translate-y-8" />
            </div>
            
            <div className="max-w-2xl space-y-6 relative z-10">
              <h3 className="text-3xl md:text-4xl font-bold text-white">¿Construyendo algo ambicioso?</h3>
              <p className="text-lg text-zinc-400 font-light">
                Nuestro equipo de **Core Engine** está aceptando socios beta para las nuevas APIs de Tokenización y Gobernanza. Únete al canal #developers-beta en nuestro Discord para obtener early access y colaborar directamente con nosotros.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Button onClick={() => setShowBetaModal(true)} className="bg-indigo-600 hover:bg-indigo-700 h-12 px-10 rounded-2xl font-bold shadow-lg shadow-indigo-500/20">
                  Request Beta Access
                </Button>
                <Button variant="ghost" asChild className="h-12 px-8 rounded-2xl font-bold text-zinc-400 hover:text-white hover:bg-white/5">
                  <Link href="/developers/docs">Ver Documentación de API</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      
      {/* Beta Access Modal */}
      <AnimatePresence>
        {showBetaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowBetaModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-md bg-zinc-900 border border-white/10 p-8 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[50px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
              
              <h3 className="text-2xl font-bold text-white mb-2">Únete a la Beta</h3>
              <p className="text-zinc-400 text-sm mb-6">
                Ingresa tu usuario de Discord. Te agregaremos al canal privado <span className="text-indigo-400 font-mono">#developers-beta</span> para darte soporte directo.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">
                    Discord Username
                  </label>
                  <input 
                    type="text" 
                    placeholder="ej. marco123 o marco#1234" 
                    value={discordHandle}
                    onChange={(e) => setDiscordHandle(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowBetaModal(false)}
                    className="flex-1 rounded-xl text-zinc-400 hover:text-white"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleBetaRequest}
                    disabled={submittingBeta}
                    className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold"
                  >
                    {submittingBeta ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Enviar Request
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </div>
    </div>
  );
}

// Helper for conditional classes
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
