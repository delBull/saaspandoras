"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GraduationCap, 
  ShieldCheck, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  FileText, 
  Building2, 
  Scale, 
  Vault, 
  Flame, 
  Award,
  ArrowLeft,
  Users,
  Copy,
  Plus,
  RefreshCw,
  ExternalLink,
  Mail,
  Phone,
  Check,
  Radar,
  Layers,
  BookOpen,
  Cpu,
  TrendingUp,
  Coins, 
  ShieldAlert, 
  Play,
  Share2,
  UserPlus,
  Lock,
  Shield,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { COO_EXECUTIVE_PROGRAM } from "@/lib/pandoras/core/domains/academy/curriculum/coo-program";
import { AcademyCandidate } from "@/lib/pandoras/core/domains/academy/candidates/types";
import { AcademyModule } from "@/lib/pandoras/core/domains/academy/types";

// ─── TRACKS & PROGRAMS CATALOG ───────────────────────────────────────────────

export interface TrackSharedCollaborator {
  email: string;
  name?: string;
  role: "CO_ADMIN" | "INSTRUCTOR" | "VIEWER";
  addedAt: string;
  addedBy?: string;
}

export interface AcademyTrack {
  id: string;
  name: string;
  code: string;
  targetRole: string;
  level: string;
  duration: string;
  modulesCount: number;
  passingScore: number;
  description: string;
  status: "ACTIVE" | "UPCOMING" | "BETA";
  badgeColor: string;
  icon: any;
  createdBy: string;
  creatorName: string;
  isFounderExclusive?: boolean;
  sharedWith: TrackSharedCollaborator[];
  modules: { title: string; weight: number; focus: string }[];
}

const ACADEMY_TRACKS: AcademyTrack[] = [
  {
    id: "prog_rwa_real_estate_master_v1",
    name: "Master Executive en Tokenización Inmobiliaria (RWA Track)",
    code: "RWA-REALESTATE-MASTER-v1.0",
    targetRole: "RWA_REAL_ESTATE_SPECIALIST",
    level: "Tier 1 · Fiduciary & Real Estate Clearance",
    duration: "7 Módulos Socráticos + Tesis S'Narai (~70 min)",
    modulesCount: 7,
    passingScore: 85,
    description: "Especialización para realtors, agencias y desarrolladores en fideicomisos inmobiliarios, bóvedas PAS v1.0, operación hotelera y auditoría RevPAR, tributación cross-border (USA/Canadá) y fondeo de preventas. Culmina con la adquisición de participación real en S'Narai como tesis de inversión.",
    status: "ACTIVE",
    badgeColor: "border-[#D4A853]/40 bg-[#D4A853]/10 text-[#D4A853]",
    icon: Building2,
    createdBy: "SUPER_ADMIN",
    creatorName: "Super Admin (Sovereign Authority)",
    isFounderExclusive: true,
    sharedWith: [],
    modules: [
      { title: "Arquitectura Jurídica, Fideicomisos y Blindaje Registral", weight: 14, focus: "Fideicomiso de Garantía vs SPV" },
      { title: "Finanzas RWA: Rendimientos Duales y Bóvedas On-Chain", weight: 14, focus: "Rentas en USDC + Plusvalía PAS v1.0" },
      { title: "Operación Hotelera, Property Mgmt y Auditoría RevPAR", weight: 14, focus: "Master Host & Conciliación de Flujo" },
      { title: "Fiscalidad Cross-Border (USA/Canadá) y Cumplimiento AML", weight: 14, focus: "W-8BEN, ISR & LFPIORPI" },
      { title: "Psicología de Venta y Cierre Consultivo para Realtors", weight: 14, focus: "Manejo de Objeciones & Anti-Venta" },
      { title: "Estructuración de Preventas para Desarrolladores", weight: 15, focus: "Sustitución de Crédito Puente Bancario" },
      { title: "Tesis de Graduación: Inversión en Fracción Real de S'Narai", weight: 15, focus: "Skin in the Game & Broker License" },
    ]
  },
  {
    id: "prog_coo_executive_v2",
    name: "Chief Operating Officer (COO Track)",
    code: "COO-EXEC-v2.0",
    targetRole: "COO",
    level: "Tier 1 · Executive Clearance",
    duration: "10 Módulos Socráticos (~45 min)",
    modulesCount: 10,
    passingScore: 90,
    description: "Validación socrática y determinista de competencias operativas, blindaje multi-entidad (Holding Wyoming, SPVs, OpCos), estándar PAS v1.0 y gobernanza multi-firma.",
    status: "ACTIVE",
    badgeColor: "border-purple-500/30 bg-purple-500/10 text-purple-300",
    icon: ShieldCheck,
    createdBy: "SUPER_ADMIN",
    creatorName: "Super Admin (Sovereign Authority)",
    isFounderExclusive: true,
    sharedWith: [],
    modules: [
      { title: "Gobernanza y Separación Institucional de Entidades", weight: 10, focus: "Holding vs OpCos vs SPVs" },
      { title: "Pandoras Asset Standard (PAS v1.0) y Estructuración", weight: 10, focus: "Reglas de Capital y Tokenización" },
      { title: "Protocolo de Tesorería, Safe-Stops y Firmas M-of-N", weight: 10, focus: "Límites y Timelocks" },
      { title: "Alineación de Stakeholders y Whitelabel Governance", weight: 10, focus: "Derechos de Voto y Cuotas" },
      { title: "Gestión de Incidentes Críticos y Contención de Fugas", weight: 10, focus: "Protocolo de Emergencia" },
      { title: "Legal Engineering, EIP-191 Deal Rooms y SOPs", weight: 10, focus: "Nexus Deal Rooms & Firmas" },
      { title: "IP Strategy, IMPI, USPTO y Depósitos Safe-Keep", weight: 10, focus: "Registro de Propiedad Intelectual" },
      { title: "Holding Architecture, Subordinación y Flujos", weight: 10, focus: "Holding Wyoming & ADGM" },
      { title: "AI Cognitive Governance y Supervisión de Hermes OS", weight: 10, focus: "Auditoría LLM y Safe Stops" },
      { title: "Ética Fiduciaria y Liderazgo Institucional", weight: 10, focus: "Doctrina Multigeneracional" },
    ]
  },
  {
    id: "prog_cmo_executive_v1",
    name: "Chief Marketing Officer (CMO & Demand Engine)",
    code: "CMO-GROWTH-v1.0",
    targetRole: "CMO",
    level: "Tier 2 · Growth Clearance",
    duration: "5 Módulos Socráticos (~35 min)",
    modulesCount: 5,
    passingScore: 80,
    description: "Estrategia de adquisición institucional, economía de creadores, motor de demanda Pandoras Media Co, protección de marca IMPI y atribución determinista.",
    status: "ACTIVE",
    badgeColor: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    icon: TrendingUp,
    createdBy: "SUPER_ADMIN",
    creatorName: "Super Admin (Sovereign Authority)",
    isFounderExclusive: true,
    sharedWith: [],
    modules: [
      { title: "Pandoras Media Co Architecture y Velocidad de Distribución", weight: 20, focus: "Contenido y Owned Media" },
      { title: "Protección de Marcas IMPI y Co-Branding con Partners", weight: 20, focus: "Brand Moat & Clases 36/42" },
      { title: "Mecanismos de Adquisición Viral y PBOX Points", weight: 20, focus: "Programas Anti-Sybil" },
      { title: "Embudos Agénticos de Hermes y Calificación Conversacional", weight: 20, focus: "Next Best Action en WhatsApp" },
      { title: "Cockpit de Métricas Ejecutivas y Gestión de Crisis PR", weight: 20, focus: "Defensa contra FUD & Transparencia" },
    ]
  },
  {
    id: "prog_cfo_executive_v1",
    name: "Chief Financial Officer (CFO & Capital Engine)",
    code: "CFO-TREASURY-v1.0",
    targetRole: "CFO",
    level: "Tier 1 · Financial Clearance",
    duration: "5 Módulos Socráticos (~40 min)",
    modulesCount: 5,
    passingScore: 80,
    description: "Ingeniería de tesorería descentralizada, estándar PAS v1.0, bóvedas fiduciarias, pools de recompra y distribución pro-rata de dividendos en USDC/Fiat.",
    status: "ACTIVE",
    badgeColor: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    icon: Coins,
    createdBy: "SUPER_ADMIN",
    creatorName: "Super Admin (Sovereign Authority)",
    isFounderExclusive: true,
    sharedWith: [],
    modules: [
      { title: "Pandoras Asset Standard (PAS v1.0) y Bóvedas Fiduciarias", weight: 20, focus: "Colateral 1:1 y Escrow" },
      { title: "Gobernanza de Tesorería On-Chain, Multi-Sig y Safe-Stops", weight: 20, focus: "Protección de Fondos 3/5" },
      { title: "Mecanismos de Recompra (Buyback Engine) y NAV", weight: 20, focus: "Liquidez Secundaria" },
      { title: "Distribución Pro-Rata de Rendimientos en USDC / Fiat", weight: 20, focus: "Snapshots Criptográficos" },
      { title: "Cumplimiento Fiscal Multi-Jurisdiccional y Auditoría", weight: 20, focus: "Reconciliación GAAP / NIF" },
    ]
  },
  {
    id: "prog_hermes_operator_v1",
    name: "Hermes AI Kernel Operator & AI Governance",
    code: "HERMES-OPERATOR-v1.0",
    targetRole: "HERMES_OPERATOR",
    level: "Tier 3 · Technical Clearance",
    duration: "5 Módulos Socráticos (~30 min)",
    modulesCount: 5,
    passingScore: 80,
    description: "Administración de agentes autónomos, Event Spine multicanal, políticas de aislamiento de contexto (ExecutiveScopeValidator) y gobernanza de tool calling.",
    status: "ACTIVE",
    badgeColor: "border-blue-500/30 bg-blue-500/10 text-blue-300",
    icon: Cpu,
    createdBy: "SUPER_ADMIN",
    creatorName: "Super Admin (Sovereign Authority)",
    isFounderExclusive: true,
    sharedWith: [],
    modules: [
      { title: "Arquitectura del Event Spine e Ingesta Multicanal", weight: 20, focus: "Idempotencia & Outbox" },
      { title: "Aislamiento de Contexto Multi-Tenant y Scope Validator", weight: 20, focus: "Prevención de Data Leakage" },
      { title: "Gobernanza de Add-Ons y Sandboxing de Tool Calling", weight: 20, focus: "Límites de Ejecución" },
      { title: "Compilador de Prompts en Capas y Next Best Action", weight: 20, focus: "Inyección de Journeys" },
      { title: "Observabilidad Operativa y Failover Multimodelo", weight: 20, focus: "Resiliencia Zero-Downtime" },
    ]
  }
];

// Helper to reliably get unlock token from search or storage
function getUnlockToken(): string | null {
  if (typeof window === "undefined") return null;
  const fromUrl = new URLSearchParams(window.location.search).get("unlock");
  if (fromUrl) {
    try {
      localStorage.setItem("pandoras_admin_unlock", fromUrl);
    } catch {}
    return fromUrl;
  }
  try {
    return localStorage.getItem("pandoras_admin_unlock");
  } catch {
    return null;
  }
}

// Resilient API Fetch Helper that includes unlock token in both query and headers
async function apiFetch(path: string, options: RequestInit = {}) {
  const unlock = getUnlockToken();
  let url = path;
  if (unlock) {
    const sep = path.includes("?") ? "&" : "?";
    url = `${path}${sep}unlock=${encodeURIComponent(unlock)}`;
  }
  const headers = new Headers(options.headers || {});
  if (unlock) {
    headers.set("x-admin-unlock", unlock);
  }
  return fetch(url, { ...options, headers });
}

interface AcademyConsoleProps {
  role?: "admin" | "manager";
  userEmail?: string;
  userName?: string;
  userWallet?: string;
  isSuperAdmin?: boolean;
  unlockToken?: string;
}

export default function AcademyConsole({ 
  role = "admin", 
  userEmail, 
  userName,
  userWallet,
  isSuperAdmin = false, 
  unlockToken 
}: AcademyConsoleProps) {
  const [activeTab, setActiveTab] = useState<"PROGRAMS" | "CANDIDATES" | "SIMULATOR" | "METRICS">("CANDIDATES");
  
  // Sovereign Super Admin Access & Identity Resolution (Dynamic)
  const isSovereignSuperAdmin = Boolean(
    isSuperAdmin || 
    (role === "admin" && (
      !userEmail || 
      userWallet?.toLowerCase() === "0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9" ||
      userWallet?.toLowerCase() === (process.env.NEXT_PUBLIC_SUPER_ADMIN_WALLET || "").toLowerCase()
    ))
  );
  // Only Sovereign Super Admin has global platform rights over tracks by default
  const isFounderOrAdmin = isSovereignSuperAdmin;
  const currentUserId = (userEmail || userWallet || (isSovereignSuperAdmin ? "SUPER_ADMIN" : "admin")).toLowerCase().trim();
  const currentDisplayName = userName || (isSovereignSuperAdmin ? "Super Admin (Sovereign Authority)" : (userEmail || "Admin"));

  const [courseScope, setCourseScope] = useState<"mine" | "shared" | "all">(isFounderOrAdmin ? "all" : "mine");
  const [tracksState, setTracksState] = useState<AcademyTrack[]>(ACADEMY_TRACKS);
  const [showShareModal, setShowShareModal] = useState(false);
  const [trackToShare, setTrackToShare] = useState<AcademyTrack | null>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState<"CO_ADMIN" | "INSTRUCTOR" | "VIEWER">("CO_ADMIN");

  // Load persistent shares from storage
  useEffect(() => {
    try {
      const savedShares = localStorage.getItem("pandoras_academy_tracks_shares");
      if (savedShares) {
        const parsed = JSON.parse(savedShares) as Record<string, TrackSharedCollaborator[]>;
        setTracksState((prev) =>
          prev.map((t) => (parsed[t.id] ? { ...t, sharedWith: parsed[t.id]! } : t))
        );
      }
    } catch {}
  }, []);

  // Helper to test track ownership dynamically:
  // If user is Sovereign Super Admin, all founder-exclusive or SUPER_ADMIN tracks belong to them.
  const checkIsTrackOwner = (track: AcademyTrack) => {
    if (isSovereignSuperAdmin && (track.createdBy === "SUPER_ADMIN" || track.isFounderExclusive)) {
      return true;
    }
    return track.createdBy.toLowerCase().trim() === currentUserId;
  };

  // Filter visible tracks based on user, scope and dynamic super admin authority
  const visibleTracks = tracksState.filter((track) => {
    const isOwner = checkIsTrackOwner(track);
    const isShared = track.sharedWith.some((s) => s.email.toLowerCase().trim() === currentUserId);

    if (courseScope === "mine") {
      return isOwner;
    }
    if (courseScope === "shared") {
      return isShared;
    }
    if (courseScope === "all") {
      // Super Admin sees all; regular collaborators only see mine + shared
      if (isSovereignSuperAdmin) return true;
      return isOwner || isShared;
    }
    return true;
  });

  const [selectedTrack, setSelectedTrack] = useState<AcademyTrack>(ACADEMY_TRACKS[0]!);

  const handleShareTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackToShare || !shareEmail.trim()) return;

    const emailClean = shareEmail.trim().toLowerCase();
    const newShare: TrackSharedCollaborator = {
      email: emailClean,
      role: shareRole,
      addedAt: new Date().toISOString(),
      addedBy: currentDisplayName,
    };

    const updatedTracks = tracksState.map((t) => {
      if (t.id === trackToShare.id) {
        const filtered = t.sharedWith.filter((s) => s.email.toLowerCase() !== emailClean);
        return { ...t, sharedWith: [...filtered, newShare] };
      }
      return t;
    });

    setTracksState(updatedTracks);
    const updatedSelected = updatedTracks.find((t) => t.id === trackToShare.id);
    if (updatedSelected) {
      setTrackToShare(updatedSelected);
      if (selectedTrack.id === trackToShare.id) {
        setSelectedTrack(updatedSelected);
      }
    }

    // Persist
    try {
      const sharesMap: Record<string, TrackSharedCollaborator[]> = {};
      updatedTracks.forEach((t) => {
        if (t.sharedWith.length > 0) sharesMap[t.id] = t.sharedWith;
      });
      localStorage.setItem("pandoras_academy_tracks_shares", JSON.stringify(sharesMap));
    } catch {}

    toast.success(`Acceso de co-administración otorgado a ${emailClean}`);
    setShareEmail("");
  };

  const handleRevokeShare = (trackId: string, emailToRevoke: string) => {
    const emailClean = emailToRevoke.trim().toLowerCase();
    const updatedTracks = tracksState.map((t) => {
      if (t.id === trackId) {
        return { ...t, sharedWith: t.sharedWith.filter((s) => s.email.toLowerCase() !== emailClean) };
      }
      return t;
    });

    setTracksState(updatedTracks);
    const updatedSelected = updatedTracks.find((t) => t.id === trackId);
    if (updatedSelected) {
      setTrackToShare(updatedSelected);
      if (selectedTrack.id === trackId) {
        setSelectedTrack(updatedSelected);
      }
    }

    try {
      const sharesMap: Record<string, TrackSharedCollaborator[]> = {};
      updatedTracks.forEach((t) => {
        if (t.sharedWith.length > 0) sharesMap[t.id] = t.sharedWith;
      });
      localStorage.setItem("pandoras_academy_tracks_shares", JSON.stringify(sharesMap));
    } catch {}

    toast.info(`Acceso revocado para ${emailClean}`);
  };

  // Candidate state
  const [candidates, setCandidates] = useState<AcademyCandidate[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newCandidateName, setNewCandidateName] = useState("");
  const [newCandidateEmail, setNewCandidateEmail] = useState("");
  const [newCandidatePhone, setNewCandidatePhone] = useState("");
  const [newCandidateNotes, setNewCandidateNotes] = useState("");
  const [newCandidateRole, setNewCandidateRole] = useState("COO");
  const [creatingCandidate, setCreatingCandidate] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [generatedSuiteTokens, setGeneratedSuiteTokens] = useState<Record<string, string> | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Simulator state
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);
  const [candidateResponse, setCandidateResponse] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  const selectedModule = COO_EXECUTIVE_PROGRAM.modules[selectedModuleIndex];

  const fetchCandidates = async () => {
    setLoadingCandidates(true);
    try {
      const res = await apiFetch("/api/admin/academy/candidates");
      const data = await res.json();
      if (data.success) {
        setCandidates(data.candidates);
        setMetrics(data.metrics);
      } else {
        console.warn("[AcademyConsole] fetchCandidates warning:", data.error);
      }
    } catch (e) {
      console.error("[AcademyConsole] Error fetching candidates:", e);
    } finally {
      setLoadingCandidates(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidateName || !newCandidateEmail) return;

    setCreatingCandidate(true);
    setInviteError(null);
    try {
      const res = await apiFetch("/api/admin/academy/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCandidateName,
          email: newCandidateEmail,
          phone: newCandidatePhone,
          notes: newCandidateNotes,
          targetRole: newCandidateRole
        })
      });

      const data = await res.json();
      if (data.success && data.invitation) {
        const link = `${window.location.origin}/academy/assessment/${data.invitation.token}`;
        setGeneratedInviteLink(link);
        // If this is a Suite invitation, also store all 4 track tokens
        if (data.suiteTokens) {
          const suiteLinks: Record<string, string> = {};
          for (const [role, token] of Object.entries(data.suiteTokens as Record<string, string>)) {
            suiteLinks[role] = `${window.location.origin}/academy/assessment/${token}`;
          }
          setGeneratedSuiteTokens(suiteLinks);
        } else {
          setGeneratedSuiteTokens(null);
        }
        setNewCandidateName("");
        setNewCandidateEmail("");
        setNewCandidatePhone("");
        setNewCandidateNotes("");
        fetchCandidates();
      } else {
        setInviteError(data.error || "No se pudo crear la invitación.");
      }
    } catch (e: any) {
      setInviteError(e.message || "Error de conexión con el servidor.");
    } finally {
      setCreatingCandidate(false);
    }
  };

  const handleCopyLink = (tokenOrLink: string) => {
    const fullLink = tokenOrLink.startsWith("http") 
      ? tokenOrLink 
      : `${window.location.origin}/academy/assessment/${tokenOrLink}`;
    navigator.clipboard.writeText(fullLink);
    setCopiedToken(tokenOrLink);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleTestSimulator = async () => {
    if (!candidateResponse.trim() || !selectedModule) return;
    setIsEvaluating(true);
    setEvaluationResult(null);

    const assessment = selectedModule.assessments[0];
    if (!assessment) return;

    try {
      const res = await apiFetch("/api/admin/academy/coo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "EVALUATE_ANSWER",
          moduleIndex: selectedModuleIndex,
          questionId: assessment.id,
          candidateAnswer: candidateResponse
        })
      });

      const data = await res.json();
      if (data.success) {
        setEvaluationResult(data.evaluation);
      }
    } catch (err) {
      console.error("Error evaluating answer in simulator:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CERTIFIED":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">CERTIFICADO</span>;
      case "IN_PROGRESS":
      case "ATTENDED":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">EN CURSO</span>;
      case "FAILED":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">NO APROBADO</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">INVITADO</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#08080A] text-zinc-100 p-1 sm:p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header matching Nexus Drawer Command Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 md:p-5 rounded-2xl bg-[#0C0C10] border border-white/10 shadow-[0_0_50px_rgba(168,85,247,0.08)] min-w-0 overflow-hidden">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 w-full">
            <Link 
              href="/nexus" 
              className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              title="Volver a Nexus"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                {isSovereignSuperAdmin ? (
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-widest bg-amber-500/10 border border-[#D4A853]/40 text-[#D4A853] font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,168,83,0.15)]">
                    <span>👑</span>
                    SUPER ADMIN SOVEREIGN
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-widest bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold">
                    {role === "manager" ? "ACADEMY MANAGER" : "INSTITUTIONAL ADMIN"}
                  </span>
                )}
                {(userName || userEmail) && (
                  <span className="hidden sm:inline-block text-xs font-mono text-zinc-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                    {userName ? `${userName}${userEmail ? ` (${userEmail})` : ''}` : userEmail}
                  </span>
                )}
                <span className="hidden md:inline-block text-xs font-mono text-zinc-500">v2.0 · MULTI-TRACK</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-2.5 min-w-0">
                <GraduationCap className="w-6 h-6 text-purple-400 shrink-0" />
                <span className="truncate">Pandora&apos;s Academy · Certificaciones &amp; Tracks</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <a
              href={`/academy/assessment/preview?track=${selectedTrack.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 text-xs font-mono transition-colors whitespace-nowrap"
              title="Abrir Test Público en nueva pestaña"
            >
              <Play className="w-3.5 h-3.5 fill-purple-300/30 shrink-0" />
              PROBAR TEST ({selectedTrack.code.split('-')[0]})
            </a>
            {role === 'admin' && (
              <button
                onClick={() => {
                  setGeneratedInviteLink(null);
                  setInviteError(null);
                  setShowInviteModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-black font-semibold text-xs font-mono uppercase tracking-wider transition-colors shadow-lg hover:shadow-purple-500/25"
              >
                <Plus className="w-3.5 h-3.5" />
                INVITAR CANDIDATO
              </button>
            )}
            <button
              onClick={fetchCandidates}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Recargar datos"
            >
              <RefreshCw className={`w-4 h-4 ${loadingCandidates ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#0C0C10] border border-white/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab("PROGRAMS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === "PROGRAMS"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            PROGRAMAS & TRACKS ({ACADEMY_TRACKS.length})
          </button>
          <button
            onClick={() => setActiveTab("CANDIDATES")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === "CANDIDATES"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            CANDIDATOS & ASISTENCIA ({candidates.length})
          </button>
          <button
            onClick={() => setActiveTab("SIMULATOR")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === "SIMULATOR"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            SIMULADOR & RÚBRICAS
          </button>
          {role === 'admin' && (
            <button
              onClick={() => setActiveTab("METRICS")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === "METRICS"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              MÉTRICAS & CONVERSIÓN
            </button>
          )}
        </div>

        {/* ─── TAB 1: PROGRAMS & TRACKS ────────────────────────────────────────── */}
        {activeTab === "PROGRAMS" && (
          <div className="space-y-6">
            {/* Deal Room-like Scope Selector Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#0C0C10] border border-white/10">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setCourseScope("mine")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                    courseScope === "mine"
                      ? "bg-purple-500 text-black font-bold shadow-md shadow-purple-500/20"
                      : "text-zinc-400 hover:text-white bg-white/5 border border-white/5"
                  }`}
                >
                  Mis Cursos ({tracksState.filter(t => checkIsTrackOwner(t)).length})
                </button>
                <button
                  type="button"
                  onClick={() => setCourseScope("shared")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                    courseScope === "shared"
                      ? "bg-purple-500 text-black font-bold shadow-md shadow-purple-500/20"
                      : "text-zinc-400 hover:text-white bg-white/5 border border-white/5"
                  }`}
                >
                  Compartidos Conmigo ({tracksState.filter(t => t.sharedWith.some(s => s.email.toLowerCase() === currentUserId)).length})
                </button>
                {isFounderOrAdmin && (
                  <button
                    type="button"
                    onClick={() => setCourseScope("all")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                      courseScope === "all"
                        ? "bg-purple-500 text-black font-bold shadow-md shadow-purple-500/20"
                        : "text-zinc-400 hover:text-white bg-white/5 border border-white/5"
                    }`}
                  >
                    👑 Todos los Cursos ({tracksState.length})
                  </button>
                )}
              </div>

              <div className="text-[11px] text-zinc-500 font-mono flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-[#D4A853]" />
                <span>Aislamiento de Cursos: Activo estilo Deal Room</span>
              </div>
            </div>

            {/* Tracks Grid */}
            {visibleTracks.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-[#0C0C10] border border-white/10 space-y-3">
                <Lock className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-sm text-zinc-300 font-medium">No hay cursos disponibles en esta vista ({courseScope})</p>
                <p className="text-xs text-zinc-500 max-w-md mx-auto">
                  Los cursos creados por el Fundador están protegidos. Solo verás los cursos de tu autoría o aquellos que te hayan sido explícitamente compartidos.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleTracks.map((track) => {
                  const Icon = track.icon;
                  const isSelected = selectedTrack.id === track.id;
                  const isOwner = checkIsTrackOwner(track);
                  return (
                    <div
                      key={track.id}
                      onClick={() => setSelectedTrack(track)}
                      className={`p-5 rounded-2xl bg-[#0C0C10] border cursor-pointer transition-all space-y-3 relative group ${
                        isSelected
                          ? "border-purple-500/60 shadow-[0_0_30px_rgba(168,85,247,0.15)] bg-[#0F0F16]"
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          {track.isFounderExclusive && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-mono uppercase font-bold border border-[#D4A853]/40 bg-[#D4A853]/10 text-[#D4A853]">
                              Founder Exclusivo
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono uppercase font-bold border ${track.badgeColor}`}>
                            {track.status}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">{track.code}</span>
                          {track.sharedWith.length > 0 && (
                            <span className="text-[9px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                              {track.sharedWith.length} Co-Admin{track.sharedWith.length > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-white leading-snug mt-0.5">{track.name}</h3>
                      </div>

                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {track.description}
                      </p>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                        <span>{track.modulesCount} Módulos</span>
                        {isOwner && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTrackToShare(track);
                              setShowShareModal(true);
                            }}
                            className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors p-1 rounded hover:bg-purple-500/10"
                            title="Compartir Administración"
                          >
                            <Share2 className="w-3 h-3" />
                            <span>Compartir</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Selected Track Detail Drawer */}
            <div className="p-6 md:p-8 rounded-3xl bg-[#0C0C10] border border-white/10 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold">
                      {selectedTrack.level}
                    </span>
                    <span className="text-xs font-mono text-zinc-500">{selectedTrack.code}</span>
                    {selectedTrack.isFounderExclusive && (
                      <span className="text-[10px] font-mono text-[#D4A853] bg-[#D4A853]/10 border border-[#D4A853]/30 px-2 py-0.5 rounded">
                        Creado por: {isSovereignSuperAdmin && selectedTrack.isFounderExclusive ? (currentDisplayName || selectedTrack.creatorName) : selectedTrack.creatorName}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-white">{selectedTrack.name}</h2>
                  <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">{selectedTrack.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  {(isFounderOrAdmin || checkIsTrackOwner(selectedTrack)) && (
                    <button
                      type="button"
                      onClick={() => {
                        setTrackToShare(selectedTrack);
                        setShowShareModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-200 hover:text-white font-semibold text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 text-purple-400" />
                      COMPARTIR ({selectedTrack.sharedWith.length})
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setNewCandidateRole(selectedTrack.targetRole);
                      setGeneratedInviteLink(null);
                      setInviteError(null);
                      setShowInviteModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-black font-semibold text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    INVITAR A ESTE TRACK
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-widest text-purple-300">
                  Estructura de Módulos del Track ({selectedTrack.modules.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedTrack.modules.map((mod, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <span className="text-[9px] font-mono text-purple-400 uppercase font-bold">Módulo {idx + 1}</span>
                        <h5 className="text-xs font-semibold text-zinc-200">{mod.title}</h5>
                        <p className="text-[11px] text-zinc-500 font-mono">Foco: {mod.focus}</p>
                      </div>
                      <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-zinc-300 shrink-0 font-bold">
                        {mod.weight}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: CANDIDATES & ATTENDANCE ─────────────────────────────────── */}
        {activeTab === "CANDIDATES" && (
          <div className="space-y-6">
            {/* Metrics Ribbon */}
            {metrics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[#0C0C10] border border-white/10 space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Total Invitados</span>
                  <p className="text-2xl font-bold text-white font-mono">{metrics.total}</p>
                  <span className="text-[10px] text-zinc-400 font-mono">Candidatos Registrados</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0C0C10] border border-white/10 space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Tasa de Asistencia</span>
                  <p className="text-2xl font-bold text-purple-400 font-mono">{metrics.attendanceRate?.toFixed(1) || 0}%</p>
                  <span className="text-[10px] text-emerald-400 font-mono">{metrics.attended} en sesión</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0C0C10] border border-white/10 space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Certificados Emitidos</span>
                  <p className="text-2xl font-bold text-emerald-400 font-mono">{metrics.certified}</p>
                  <span className="text-[10px] text-zinc-400 font-mono">Aprobación ≥90%</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0C0C10] border border-white/10 space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Puntaje Promedio</span>
                  <p className="text-2xl font-bold text-white font-mono">{metrics.avgScore ? metrics.avgScore.toFixed(0) : "N/A"}{metrics.avgScore ? "%" : ""}</p>
                  <span className="text-[10px] text-zinc-400 font-mono">{metrics.inProgress} en progreso</span>
                </div>
              </div>
            )}

            {/* Candidates Table */}
            <div className="rounded-2xl bg-[#0C0C10] border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                  Registro de Candidatos & Estado de Examen
                </span>
                <span className="text-xs font-mono text-zinc-500">
                  {candidates.length} candidato{candidates.length !== 1 ? "s" : ""}
                </span>
              </div>

              {loadingCandidates ? (
                <div className="p-12 text-center text-zinc-500 font-mono text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Cargando candidatos de base de datos...
                </div>
              ) : candidates.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <GraduationCap className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-sm text-zinc-400">No hay candidatos registrados aún.</p>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="px-4 py-2 rounded-xl bg-purple-500 text-black font-semibold text-xs font-mono uppercase"
                  >
                    Invitar Primer Candidato
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-black/40 text-zinc-500 border-b border-white/10 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Candidato / Attendee</th>
                        <th className="py-3 px-4">Track / Rol</th>
                        <th className="py-3 px-4">Estado Asistencia</th>
                        <th className="py-3 px-4">Puntaje</th>
                        <th className="py-3 px-4">Enlace Público de Test</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {candidates.map((cand) => (
                        <tr key={cand.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-white">{cand.name}</div>
                            <div className="text-[11px] text-zinc-500 font-normal">{cand.email}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-zinc-300">
                              {cand.targetRole} Track
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {getStatusBadge(cand.attendanceStatus)}
                          </td>
                          <td className="py-3.5 px-4">
                            {cand.latestScore !== undefined ? (
                              <span className={`font-bold ${cand.latestScore >= 90 ? "text-emerald-400" : "text-amber-400"}`}>
                                {cand.latestScore}%
                              </span>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-[11px] text-purple-300/80 truncate block max-w-xs font-mono">
                              /academy/assessment/...
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {cand.latestAttemptId && (
                                <a
                                  href={`/academy/assessment/${cand.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 text-[10px] font-mono flex items-center gap-1 transition-colors"
                                  title="Abrir Examen del Candidato"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  ABRIR TEST
                                </a>
                              )}
                              <button
                                onClick={() => handleCopyLink(cand.id)}
                                className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white text-[10px] font-mono flex items-center gap-1 transition-colors"
                                title="Copiar Enlace Público"
                              >
                                {copiedToken === cand.id ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                {copiedToken === cand.id ? "COPIADO" : "COPIAR LINK"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 3: SIMULATOR & RUBRICS ─────────────────────────────────────── */}
        {activeTab === "SIMULATOR" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-widest text-purple-300">
                Selecciona Módulo del COO Track
              </h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {COO_EXECUTIVE_PROGRAM.modules.map((m, idx) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedModuleIndex(idx);
                      setEvaluationResult(null);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedModuleIndex === idx
                        ? "bg-purple-500/10 border-purple-500/50 text-white shadow-lg"
                        : "bg-[#0C0C10] border-white/10 text-zinc-400 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="text-purple-400 font-bold">Módulo {idx + 1}</span>
                      <span>{m.weightPercentage}% Ponderación</span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-200 line-clamp-1">{m.title}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              {selectedModule && (
                <div className="p-6 rounded-2xl bg-[#0C0C10] border border-white/10 space-y-4">
                  <div>
                    <span className="text-[10px] font-mono text-purple-400 uppercase font-bold">
                      Pregunta Socrática Oficial · Módulo {selectedModuleIndex + 1}
                    </span>
                    <h3 className="text-sm md:text-base font-semibold text-white mt-1">
                      {selectedModule.assessments[0]?.questionPrompt || selectedModule.description}
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono text-zinc-400">Respuesta del Candidato a Simular:</label>
                    <textarea
                      rows={5}
                      value={candidateResponse}
                      onChange={(e) => setCandidateResponse(e.target.value)}
                      placeholder="Escribe o pega una respuesta técnica/operativa para evaluar con el motor determinista de Hermes..."
                      className="w-full bg-black/60 border border-white/15 rounded-xl p-3.5 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/60 transition-all"
                    />
                  </div>

                  <button
                    onClick={handleTestSimulator}
                    disabled={isEvaluating || !candidateResponse.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-500 hover:bg-purple-400 text-black font-semibold text-xs font-mono uppercase tracking-wider transition-all disabled:opacity-50"
                  >
                    {isEvaluating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        EVALUANDO CON HERMES DETERMINISTIC ENGINE...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        EVALUAR RESPUESTA CON RÚBRICAS DETERMINISTAS
                      </>
                    )}
                  </button>

                  {evaluationResult && (
                    <div className="mt-4 p-4 rounded-xl bg-black/60 border border-purple-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-purple-300 font-bold">Resultado de Evaluación</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          Score: {evaluationResult.score}%
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                        {evaluationResult.feedback}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 4: METRICS & CERTIFICATIONS ────────────────────────────────── */}
        {activeTab === "METRICS" && (
          <div className="p-6 md:p-8 rounded-3xl bg-[#0C0C10] border border-white/10 space-y-6 text-center max-w-2xl mx-auto">
            <Award className="w-12 h-12 text-purple-400 mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Libro Maestro de Certificaciones Institucionales</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Cada candidato aprobado con un puntaje ≥90% recibe un certificado firmado con hash SHA-256 ligado al snapshot congelado de los 6 documentos canónicos de Pandora's.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-left space-y-2 font-mono text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Algoritmo de Firma:</span>
                <span className="text-white">SHA-256 Dynamic Snapshot Hash</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Vigencia de Certificación:</span>
                <span className="text-white">365 Días (Renovación Anual)</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Emisor Oficial:</span>
                <span className="text-purple-300">Pandora's Academy Core · Institutional Control Plane</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── INVITE CANDIDATE MODAL ─────────────────────────────────────────── */}
        <AnimatePresence>
          {showInviteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative w-full max-w-lg bg-[#0C0C10] border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className="w-5 h-5 text-purple-400" />
                    <h3 className="text-base font-bold text-white">Invitar Candidato a Evaluación</h3>
                  </div>
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="p-1 rounded-lg text-zinc-500 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {generatedInviteLink ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-xs font-mono">
                        <CheckCircle2 className="w-4 h-4" />
                        {generatedSuiteTokens ? '👑 SUITE EJECUTIVA CREADA — 4 TRACKS' : 'INVITACIÓN CREADA EXITOSAMENTE'}
                      </div>
                      <p className="text-xs text-zinc-300 font-sans">
                        {generatedSuiteTokens
                          ? 'Comparte el enlace del Track 1 (COO). Al aprobar, verá automáticamente el botón para el siguiente track:'
                          : 'Comparte este enlace público con el candidato para que ingrese directamente a su evaluación:'}
                      </p>
                    </div>

                    {generatedSuiteTokens ? (
                      <div className="space-y-2">
                        {(['COO', 'CMO', 'CFO', 'HERMES_OPERATOR'] as const).map((role, idx) => {
                          const link = generatedSuiteTokens[role];
                          if (!link) return null;
                          const labels: Record<string, string> = {
                            COO: '🔵 Track 1 — COO (Compartir primero)',
                            CMO: '🟢 Track 2 — CMO',
                            CFO: '🟡 Track 3 — CFO',
                            HERMES_OPERATOR: '🟣 Track 4 — Hermes Operator'
                          };
                          return (
                            <div key={role} className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-1">
                              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{labels[role]}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono text-purple-300 truncate flex-1">{link}</span>
                                <button
                                  onClick={() => handleCopyLink(link)}
                                  className="px-2.5 py-1.5 rounded-lg bg-purple-500 text-black font-semibold text-[10px] font-mono uppercase tracking-wider shrink-0"
                                >
                                  {copiedToken === link ? <Check className="w-3 h-3" /> : 'COPIAR'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-black/60 border border-white/15 flex items-center justify-between gap-2">
                        <span className="text-xs font-mono text-purple-300 truncate">{generatedInviteLink}</span>
                        <button
                          onClick={() => handleCopyLink(generatedInviteLink)}
                          className="px-3 py-1.5 rounded-lg bg-purple-500 text-black font-semibold text-xs font-mono uppercase tracking-wider shrink-0"
                        >
                          COPIAR
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setGeneratedInviteLink(null);
                        setGeneratedSuiteTokens(null);
                        setShowInviteModal(false);
                      }}
                      className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-zinc-300 hover:bg-white/10"
                    >
                      Cerrar
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCreateCandidate} className="space-y-4 text-xs font-mono">
                    <div className="space-y-1">
                      <label className="text-zinc-400">Nombre Completo *</label>
                      <input
                        type="text"
                        required
                        value={newCandidateName}
                        onChange={(e) => setNewCandidateName(e.target.value)}
                        placeholder="Ej. Pablo Sepúlveda"
                        className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/60"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-zinc-400">Correo Electrónico *</label>
                      <input
                        type="email"
                        required
                        value={newCandidateEmail}
                        onChange={(e) => setNewCandidateEmail(e.target.value)}
                        placeholder="Ej. pablosegali@gmail.com"
                        className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/60"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-zinc-400">Teléfono / WhatsApp</label>
                      <input
                        type="text"
                        value={newCandidatePhone}
                        onChange={(e) => setNewCandidatePhone(e.target.value)}
                        placeholder="Ej. +52 1 33 2415 8568"
                        className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/60"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-zinc-400">Track / Alcance de Evaluación</label>
                      <select
                        value={newCandidateRole}
                        onChange={(e) => setNewCandidateRole(e.target.value)}
                        className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500/60"
                      >
                        <option value="ALL_TRACKS">👑 SUITE EJECUTIVA COMPLETA (4 Tracks — COO, CMO, CFO, Hermes)</option>
                        <option value="COO">Chief Operating Officer (COO Track)</option>
                        <option value="CMO">Chief Marketing Officer (CMO Track)</option>
                        <option value="CFO">Chief Financial Officer (CFO Track)</option>
                        <option value="HERMES_OPERATOR">Hermes AI Kernel Operator (Operator Track)</option>
                      </select>
                    </div>

                    {inviteError && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
                        {inviteError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={creatingCandidate}
                      className="w-full py-3 rounded-xl bg-purple-500 hover:bg-purple-400 text-black font-semibold text-xs font-mono uppercase tracking-wider transition-all disabled:opacity-50"
                    >
                      {creatingCandidate ? "GENERANDO INVITACIÓN..." : "CREAR & GENERAR ENLACE MÁGICO"}
                    </button>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ─── SHARE COURSE / DELEGATE ADMINISTRATION MODAL (DEAL ROOM STYLE) ─── */}
        <AnimatePresence>
          {showShareModal && trackToShare && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative w-full max-w-xl bg-[#0C0C10] border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Compartir Administración del Curso</h3>
                      <p className="text-xs text-zinc-400 font-mono">
                        {trackToShare.name} ({trackToShare.code})
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="p-1 rounded-lg text-zinc-500 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {/* Owner & Exclusivity Banner */}
                <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">Titular / Autor Exclusivo</span>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{trackToShare.creatorName}</span>
                      <span className="text-zinc-500 font-normal font-mono">({trackToShare.createdBy})</span>
                    </div>
                  </div>
                  {trackToShare.isFounderExclusive && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#D4A853]/10 text-[#D4A853] border border-[#D4A853]/30">
                      👑 Founder Protected
                    </span>
                  )}
                </div>

                {/* Delegated Collaborators List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                      Co-Administradores &amp; Instructores Delegados ({trackToShare.sharedWith.length})
                    </h4>
                    <span className="text-[10px] text-zinc-500">Aislamiento estilo Deal Room</span>
                  </div>

                  {trackToShare.sharedWith.length === 0 ? (
                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-center text-xs text-zinc-500">
                      Este curso es privado y exclusivo. Ningún colaborador externo tiene acceso administrativo a sus métricas o evaluaciones.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {trackToShare.sharedWith.map((collab) => (
                        <div
                          key={collab.email}
                          className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5"
                        >
                          <div>
                            <div className="text-xs font-semibold text-white">{collab.email}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">
                              Rol: <strong className="text-purple-300">{collab.role}</strong> · Asignado: {new Date(collab.addedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRevokeShare(trackToShare.id, collab.email)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                            title="Revocar acceso"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form to delegate new collaborator */}
                <form onSubmit={handleShareTrack} className="p-4 rounded-2xl bg-zinc-950/60 border border-white/10 space-y-4">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-purple-400" />
                    Asignar Nuevo Co-Administrador o Instructor
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="space-y-1">
                      <label className="text-zinc-400">Correo Electrónico</label>
                      <input
                        type="email"
                        required
                        placeholder="colaborador@inmobiliaria.com"
                        value={shareEmail}
                        onChange={(e) => setShareEmail(e.target.value)}
                        className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-zinc-400">Nivel de Acceso / Rol</label>
                      <select
                        value={shareRole}
                        onChange={(e) => setShareRole(e.target.value as any)}
                        className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="CO_ADMIN">👑 Co-Admin (Invitar &amp; Calificar)</option>
                        <option value="INSTRUCTOR">🎓 Instructor (Revisar Exámenes)</option>
                        <option value="VIEWER">👁️ Viewer (Solo Lectura de Alumnos)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-black font-semibold text-xs font-mono uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Conceder Acceso al Curso
                  </button>
                </form>

                <p className="text-[10px] text-zinc-600 text-center">
                  Al delegar acceso, el colaborador verá este track en su consola de Academy bajo la pestaña "Compartidos Conmigo".
                </p>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
