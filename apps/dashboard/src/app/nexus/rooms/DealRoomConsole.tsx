"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Handshake,
  Plus,
  X,
  Check,
  PenLine,
  Activity,
  Clock,
  FileText,
  FileSignature,
  Link2,
  Mail,
  Trash2,
  Copy,
  ChevronRight,
  Eye,
  Scale,
  ShieldCheck,
  XCircle,
  Ban,
  Download,
  GraduationCap,
  ExternalLink,
} from "lucide-react";
import { NEXUS_TASKS, taskTitle } from "@/lib/nexus-tasks";

interface Section {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  content: string;
}

interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail?: string | null;
}

interface Signer {
  id: string;
  email: string;
  status: "PENDING" | "MAGIC_SENT" | "VIEWED" | "SIGNED";
  signedAt?: string | null;
  signatureName?: string | null;
  wallet?: string | null;
}

interface Room {
  id: string;
  publicId: string;
  title: string;
  kind: "PROPOSAL" | "AGREEMENT" | "CONTRACT" | "AMENDMENT" | "CHARTER";
  counterparty: string;
  relation: string;
  company: string;
  status: "DRAFT" | "PROPOSAL_SENT" | "REVIEW" | "ACCEPTED" | "SIGNED" | "EXECUTING" | "EXECUTED" | "CANCELLED";
  summary?: string | null;
  taskRef?: string | null;
  openSign?: boolean | null;
  nextRoomId?: string | null;
  enteredIntoForceAt?: string | null;
  createdAt: string;
  updatedAt: string;
  sections: Section[];
  audit: AuditEvent[];
  signers: Signer[];
  // NDA Engine
  ndaEnabled?: boolean | null;
  ndaPhase?: string | null;
  ndaVersion?: string | null;
}

const KINDS: Room["kind"][] = ["PROPOSAL", "AGREEMENT", "CONTRACT", "AMENDMENT", "CHARTER"];
const KIND_LABEL: Record<Room["kind"], string> = {
  PROPOSAL: "Propuesta de Colaboración",
  AGREEMENT: "Acuerdo",
  CONTRACT: "Contrato",
  AMENDMENT: "Enmienda",
  CHARTER: "Documento Fundacional",
};
const KIND_BADGE: Record<Room["kind"], string> = {
  PROPOSAL: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  AGREEMENT: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  CONTRACT: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  AMENDMENT: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  CHARTER: "border-stone-500/30 bg-stone-500/10 text-stone-200",
};
const STATUS_LABEL: Record<Room["status"], string> = {
  DRAFT: "Borrador",
  PROPOSAL_SENT: "Propuesta Enviada",
  REVIEW: "En Revisión",
  ACCEPTED: "Aceptada",
  SIGNED: "Firmada",
  EXECUTING: "En Ejecución",
  EXECUTED: "Ejecutada",
  CANCELLED: "Cancelada",
};
const STATUS_ACCENT: Record<Room["status"], string> = {
  DRAFT: "border-zinc-500/20 bg-zinc-500/10 text-zinc-300",
  PROPOSAL_SENT: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  REVIEW: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  ACCEPTED: "border-violet-500/20 bg-violet-500/10 text-violet-300",
  SIGNED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  EXECUTING: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
  EXECUTED: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  CANCELLED: "border-red-500/20 bg-red-500/10 text-red-300",
};
const STATUS_ORDER: Room["status"][] = ["DRAFT", "PROPOSAL_SENT", "REVIEW", "ACCEPTED", "SIGNED", "EXECUTING", "EXECUTED", "CANCELLED"];
const SIGNER_LABEL: Record<Signer["status"], string> = {
  PENDING: "Pendiente",
  MAGIC_SENT: "Magic link enviado",
  VIEWED: "Visto",
  SIGNED: "Firmado",
};

const shortAt = (iso: string) =>
  new Date(iso).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

function nextStep(room: Room): { label: string; status: Room["status"] } | null {
  if (room.nextRoomId) return null; // If already chained/converted, hide next local step

  switch (room.status) {
    case "DRAFT":
      return { label: "Enviar Propuesta", status: "PROPOSAL_SENT" };
    case "PROPOSAL_SENT":
      return { label: "Iniciar Revisión", status: "REVIEW" };
    case "REVIEW":
      return { label: "Aceptar Propuesta", status: "ACCEPTED" };
    case "ACCEPTED":
      return { label: "Solicitar Firma", status: "ACCEPTED" };
    case "SIGNED":
      return { label: "Iniciar Ejecución", status: "EXECUTING" };
    case "EXECUTING":
      return { label: "Marcar Ejecutado", status: "EXECUTED" };
    default:
      return null;
  }
}

export default function DealRoomConsole() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<"sections" | "signers" | "audit">("sections");
  const [sectionId, setSectionId] = useState("01");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState("");
  const [showNewRoom, setShowNewRoom] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [nrTitle, setNrTitle] = useState("");
  const [nrKind, setNrKind] = useState<Room["kind"]>("PROPOSAL");
  const [nrCounterparty, setNrCounterparty] = useState("");
  const [nrRelation, setNrRelation] = useState("");
  const [nrCompany, setNrCompany] = useState("");
  const [nrSummary, setNrSummary] = useState("");
  const [nrNote, setNrNote] = useState("");
  const [nrSigners, setNrSigners] = useState("");
  const [nrTaskRef, setNrTaskRef] = useState("");
  const [nrOpenSign, setNrOpenSign] = useState(false);

  const [signersInput, setSignersInput] = useState("");
  const [sharing, setSharing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const apiUrl = (path: string) => {
    const unlock = new URLSearchParams(window.location.search).get("unlock");
    return unlock ? `${path}?unlock=${encodeURIComponent(unlock)}` : path;
  };

  const load = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/nexus/deals"), { cache: "no-store" });
      if (!res.ok) throw new Error("No autorizado");
      const data = await res.json();
      setRooms(data.rooms ?? []);
      setSelectedId((cur) => (cur && data.rooms.some((r: Room) => r.id === cur) ? cur : data.rooms[0]?.id ?? null));
    } catch (e: any) {
      setFlash(`✗ ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const organizedRooms = useMemo(() => {
    const filteredRooms = showArchived ? rooms : rooms.filter(r => r.status !== "CANCELLED");
    const rootRooms = filteredRooms.filter(r => !filteredRooms.some(parent => parent.nextRoomId === r.id));
    const list: (Room & { depth: number })[] = [];
    const visited = new Set<string>();

    const addTree = (room: Room, depth: number) => {
      if (visited.has(room.id)) return;
      visited.add(room.id);
      list.push({ ...room, depth });
      const children = filteredRooms.filter(r => r.id === room.nextRoomId);
      for (const child of children) {
        addTree(child, depth + 1);
      }
    };

    for (const root of rootRooms) {
      addTree(root, 0);
    }

    for (const room of filteredRooms) {
      if (!visited.has(room.id)) {
        list.push({ ...room, depth: 0 });
      }
    }

    return list;
  }, [rooms, showArchived]);

  const selected = useMemo(() => rooms.find((r) => r.id === selectedId) ?? null, [rooms, selectedId]);
  const activeSection = useMemo(
    () => selected?.sections.find((s) => s.id === sectionId) ?? null,
    [selected, sectionId]
  );
  const progressIndex = selected ? STATUS_ORDER.indexOf(selected.status) : 0;

  // Notificación interna: última firma/aceptación registrada en el room (visible en consola).
  const lastSignEvent = useMemo(() => {
    if (!selected) return null;
    const signs = selected.audit.filter((ev) => ev.action === "Signed" || ev.action === "Accepted");
    return signs[0] ?? null;
  }, [selected]);

  const flashMsg = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 4000);
  };

  const patch = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(apiUrl(`/api/nexus/deals/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "Error al actualizar");
    }
    const data = await res.json();
    setRooms((prev) => prev.map((r) => (r.id === data.room.id ? data.room : r)));
    return data.room as Room;
  };

  const startEdit = (sec: Section) => {
    setEditingId(sec.id);
    setDraftContent(sec.content);
  };

  const saveEdit = async () => {
    if (!selected || !editingId) return;
    try {
      await patch(selected.id, { sectionCode: editingId, content: draftContent });
      setEditingId(null);
      flashMsg("✓ Sección actualizada · audit event registrado");
    } catch (e: any) {
      flashMsg(`✗ ${e.message}`);
    }
  };

  const runAction = async () => {
    if (!selected) return;
    const step = nextStep(selected);
    if (!step) return;
    try {
      await patch(selected.id, { status: step.status });
      if (step.status === "ACCEPTED") setSectionId("09");
      flashMsg(`✓ ${step.label}`);
    } catch (e: any) {
      flashMsg(`✗ ${e.message}`);
    }
  };

  const addSection = async () => {
    if (!selected) return;
    try {
      const room = await patch(selected.id, { addSection: true });
      const added = room?.sections[room.sections.length - 1];
      if (added) {
        setSectionId(added.code);
        setEditingId(added.id);
        setDraftContent("");
      }
      flashMsg("✓ Sección agregada · edítala para darle contenido");
    } catch (e: any) {
      flashMsg(`✗ ${e.message}`);
    }
  };

  const deleteSection = async (secId: string) => {
    if (!selected || !confirm("¿Eliminar sección permanentemente?")) return;
    try {
      await patch(selected.id, { deleteSection: secId });
      setSectionId("01");
      flashMsg("✓ Sección eliminada");
    } catch (e: any) {
      flashMsg(`✗ ${e.message}`);
    }
  };

  const convertToAgreement = async () => {
    if (!selected) return;
    try {
      await patch(selected.id, { convertAgreement: true });
      setSectionId("01");
      flashMsg("✓ Convertida en Acuerdo Legal · cláusulas legales anexadas (REVIEW)");
    } catch (e: any) {
      flashMsg(`✗ ${e.message}`);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nrTitle.trim() || !nrCounterparty.trim()) return;
    const signers = nrSigners
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.includes("@"));
    try {
      const res = await fetch(apiUrl("/api/nexus/deals"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: nrTitle,
          kind: nrKind,
          counterparty: nrCounterparty,
          relation: nrRelation,
          company: nrCompany,
          summary: nrSummary,
          note: nrNote,
          taskRef: nrTaskRef,
          openSign: nrOpenSign,
          signers: signers.map((email) => ({ email })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Error al crear");
      }
      const data = await res.json();
      setRooms((prev) => [data.room, ...prev]);
      setSelectedId(data.room.id);
      setSectionId("01");
      setShowNewRoom(false);
      setNrCounterparty("");
      setNrRelation("");
      setNrCompany("");
      setNrSummary("");
      setNrNote("");
      setNrSigners("");
      setNrTaskRef("");
      setNrOpenSign(false);
      flashMsg(`✓ Deal Room ${data.room.publicId} creado · link público auto-generado`);
    } catch (e: any) {
      flashMsg(`✗ ${e.message}`);
    }
  };

  const addAndShare = async () => {
    if (!selected) return;
    const emails = signersInput.split(",").map((s) => s.trim()).filter((s) => s.includes("@"));
    if (emails.length === 0) return;
    setSharing(true);
    try {
      const res = await fetch(apiUrl(`/api/nexus/deals/${selected.id}/share`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al enviar");
      const okCount = data.results.filter((r: any) => r.ok).length;
      const added = data.addedCount ?? 0;
      flashMsg(`✓ ${okCount}/${emails.length} emails enviados${added ? ` · ${added} nuevo(s) agregado(s)` : ""}`);
      setSignersInput("");
      load();
    } catch (e: any) {
      flashMsg(`✗ ${e.message}`);
    } finally {
      setSharing(false);
    }
  };

  const resendSigner = async (email: string) => {
    if (!selected) return;
    setSharing(true);
    try {
      const res = await fetch(apiUrl(`/api/nexus/deals/${selected.id}/share`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: [email] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al reenviar");
      flashMsg(`✓ Magic link reenviado a ${email}`);
      load();
    } catch (e: any) {
      flashMsg(`✗ ${e.message}`);
    } finally {
      setSharing(false);
    }
  };

  const removeSigner = async (signerId: string) => {
    if (!selected) return;
    try {
      await patch(selected.id, { removeSignerId: signerId });
      flashMsg("✓ Signer eliminado");
    } catch (e: any) {
      flashMsg(`✗ ${e.message}`);
    }
  };

  const copyPublicLink = async () => {
    if (!selected) return;
    const url = `${window.location.origin}/deal/${selected.publicId}`;
    try {
      await navigator.clipboard.writeText(url);
      flashMsg(`✓ Link público copiado: ${selected.publicId}`);
    } catch {
      window.prompt("Copia el link:", url);
    }
  };

  const deleteRoom = async () => {
    if (!selected) return;
    setConfirmDelete(false);
    try {
      const res = await fetch(apiUrl(`/api/nexus/deals/${selected.id}`), { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      setRooms((prev) => prev.filter((r) => r.id !== selected.id));
      setSelectedId(null);
      flashMsg("✓ Deal Room eliminado");
    } catch (e: any) {
      flashMsg(`✗ ${e.message}`);
    }
  };

  const cancelRoom = async (notify: boolean) => {
    if (!selected) return;
    setConfirmCancel(false);
    try {
      await patch(selected.id, { status: "CANCELLED", notifyCancel: notify });
      flashMsg("✓ Trato cancelado" + (notify ? " · notificaciones enviadas" : ""));
    } catch (e: any) {
      flashMsg(`✗ ${e.message}`);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#08080A] flex items-center justify-center text-white font-sans">
        <div className="text-center">
          <div className="w-9 h-9 border-4 border-white/10 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <div className="text-sm text-white/50">Cargando Deal Room...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08080A] text-zinc-100 font-sans flex flex-col">
      {/* Header */}
      <header className="h-14 shrink-0 flex items-center justify-between px-4 md:px-6 bg-[#0C0C10] border-b border-white/10 font-mono">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 shrink-0">
            <Handshake className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-100 tracking-tight truncate">PANDORAS NEXUS · DEAL ROOM</span>
              <span className="px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[9px] tracking-widest">NIVEL 2</span>
            </div>
            <p className="text-[10px] text-zinc-500 truncate">TRANSACTION ROOMS · ADMINISTRACIÓN</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/deal/sign"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-[10px] font-mono transition-colors shadow-sm shadow-amber-500/10"
            title="Abrir Portal Funcional de Firmas Soberanas"
            target="_blank"
          >
            <FileSignature className="w-3.5 h-3.5 text-amber-400" />
            <span>PORTAL DE FIRMAS</span>
          </Link>
          <Link
            href="/deal/sovereign-esign"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 text-[10px] font-mono transition-colors"
            title="Sovereign On-Chain E-Sign & NOM-151 Protocol Specification"
            target="_blank"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ESPECIFICACIÓN</span>
          </Link>
          <Link
            href="/academy"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 text-[10px] font-mono transition-colors"
            title="Explorar Pandora's Academy & Certificaciones"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>ACADEMY HUB</span>
          </Link>
          <Link
            href="/nexus/settings"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700 text-[10px] font-mono transition-colors"
            title="Gestionar colaboradores del Nexus"
          >
            <span>SETTINGS</span>
          </Link>
          <span className="hidden lg:flex items-center gap-1.5 text-[10px] text-zinc-500">
            <Activity className="w-3 h-3 text-amber-300" />
            {rooms.length} ROOM{rooms.length !== 1 ? "S" : ""}
          </span>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <aside className="hidden md:flex w-72 shrink-0 flex-col border-r border-white/10 bg-[#0C0C10]">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-zinc-400">ROOMS</span>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                  showArchived 
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-300" 
                    : "border-white/10 text-zinc-500 hover:text-zinc-300"
                }`}
                title="Mostrar/Ocultar Archivados (Cancelados)"
              >
                {showArchived ? "OCULTAR ARCHIVO" : "VER ARCHIVO"}
              </button>
            </div>
            <button
              onClick={() => setShowNewRoom(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[9px] font-mono hover:bg-amber-500/20 transition-colors"
            >
              <Plus className="w-3 h-3" /> NUEVA ROOM
            </button>
          </div>

          {showNewRoom && (
            <form onSubmit={handleCreate} className="p-3 border-b border-white/10 space-y-2">
              <p className="text-[9px] font-mono uppercase tracking-wider text-amber-300">Nueva Transaction Room</p>
              <select
                value={nrKind}
                onChange={(e) => setNrKind(e.target.value as Room["kind"])}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-amber-500/40"
              >
                {KINDS.map((k) => (
                  <option key={k} value={k}>{KIND_LABEL[k]}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Contraparte (ej. Eduardo Garza)"
                value={nrCounterparty}
                onChange={(e) => setNrCounterparty(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40"
              />
              <input
                type="text"
                placeholder="Nombre del Trato / Acuerdo (ej. Inversión Serie A)"
                value={nrTitle}
                onChange={(e) => setNrTitle(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40"
              />
              <input
                type="text"
                placeholder="Relación (ej. Strategic Partner)"
                value={nrRelation}
                onChange={(e) => setNrRelation(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40"
              />
              <input
                type="text"
                placeholder="Compañía"
                value={nrCompany}
                onChange={(e) => setNrCompany(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40"
              />
              <input
                type="text"
                placeholder="Resumen (se muestra al firmante)"
                value={nrSummary}
                onChange={(e) => setNrSummary(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40"
              />
              <textarea
                placeholder="Nota inicial (Sección 01)..."
                value={nrNote}
                onChange={(e) => setNrNote(e.target.value)}
                rows={2}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40"
              />
              <input
                type="text"
                placeholder="Emails de signers (separados por coma)"
                value={nrSigners}
                onChange={(e) => setNrSigners(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40"
              />
              <label className="block">
                <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500">Tarea Operations vinculada · interno</span>
                <select
                  value={nrTaskRef}
                  onChange={(e) => setNrTaskRef(e.target.value)}
                  className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-amber-500/40"
                >
                  <option value="">Sin tarea vinculada</option>
                  {NEXUS_TASKS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.id} · {t.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border border-white/10 bg-black/40 cursor-pointer">
                <span className="text-[10px] text-zinc-400">Firma online (openSign) · sin email</span>
                <input
                  type="checkbox"
                  checked={nrOpenSign}
                  onChange={(e) => setNrOpenSign(e.target.checked)}
                  className="accent-amber-500"
                />
              </label>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowNewRoom(false)} className="px-2 py-1 rounded-md border border-white/10 text-[10px] text-zinc-400 hover:text-white transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-200 text-[10px] font-mono transition-colors">
                  Crear Room
                </button>
              </div>
            </form>
          )}

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {organizedRooms.length === 0 && (
              <p className="text-[10px] font-mono text-zinc-600 p-2">Sin Transaction Rooms. Crea la primera.</p>
            )}
            {organizedRooms.map((room) => {
              const active = room.id === selectedId;
              const signed = room.signers.filter((s) => s.status === "SIGNED").length;
              return (
                <div key={room.id} className="relative" style={{ marginLeft: `${room.depth * 1.5}rem` }}>
                  {room.depth > 0 && (
                    <div className="absolute -left-4 top-1/2 -mt-4 w-4 h-6 border-l border-b border-white/20 rounded-bl-xl" />
                  )}
                  <button
                    onClick={() => {
                      setSelectedId(room.id);
                      setSectionId("01");
                      setView("sections");
                      setEditingId(null);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      active ? "border-amber-500/40 bg-amber-500/[0.06]" : "border-white/10 bg-[#08080A] hover:border-white/25"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-zinc-100 truncate">{room.relation || room.counterparty}</span>
                      <ChevronRight className={`w-3 h-3 shrink-0 ${active ? "text-amber-300" : "text-zinc-600"}`} />
                    </div>
                    <p className="text-[9px] font-mono text-zinc-500 truncate mt-0.5">{room.counterparty} {room.company && `· ${room.company}`} · {room.publicId}</p>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider border ${KIND_BADGE[room.kind]}`}>
                        {room.kind}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider border ${STATUS_ACCENT[room.status]}`}>
                        {STATUS_LABEL[room.status]}
                      </span>
                      {room.signers.length > 0 && (
                        <span className="ml-auto text-[8px] font-mono text-zinc-600">{signed}/{room.signers.length} firmas</span>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Institutional Sovereign Sign Links */}
          <div className="p-3 border-t border-white/10 bg-black/40 space-y-1.5 font-mono text-[10px]">
            <Link
              href="/deal/sign"
              target="_blank"
              className="flex items-center justify-between p-2 rounded-lg bg-amber-500/[0.08] hover:bg-amber-500/15 border border-amber-500/30 text-amber-300 transition-colors"
            >
              <span className="flex items-center gap-1.5 font-semibold">
                <FileSignature className="w-3.5 h-3.5 text-amber-400" />
                <span>Portal de Firmas</span>
              </span>
              <span className="text-[8px] bg-amber-500/20 px-1 py-0.5 rounded text-amber-200">v1.0</span>
            </Link>

            <Link
              href="/deal/sovereign-esign"
              target="_blank"
              className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] text-zinc-400 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Protocolo & Whitepaper</span>
              </span>
              <ExternalLink className="w-3 h-3 text-zinc-600" />
            </Link>
          </div>
        </aside>

        {/* Detail */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-[11px] font-mono text-zinc-500">
              Selecciona o crea una Transaction Room.
            </div>
          ) : (
            <>
              {/* Mobile select + new */}
              <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 md:hidden">
                <select
                  value={selected.id}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-amber-500/40"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.counterparty}</option>
                  ))}
                </select>
                <button onClick={() => setShowNewRoom(true)} className="flex items-center gap-1 px-2 py-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px] font-mono">
                  <Plus className="w-3 h-3" /> NUEVA
                </button>
              </div>

              {/* Room header */}
              <div className="px-4 md:px-5 py-3 border-b border-white/10 bg-[#0C0C10]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider border ${KIND_BADGE[selected.kind]}`}>
                        {KIND_LABEL[selected.kind]}
                      </span>
                      <h4 className="text-sm font-semibold text-zinc-100 truncate">{selected.relation || selected.counterparty}</h4>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider border ${STATUS_ACCENT[selected.status]}`}>
                        {STATUS_LABEL[selected.status]}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-zinc-500 mt-1">
                      {selected.counterparty} {selected.company && `· ${selected.company}`} · ROOM <span className="text-amber-300">{selected.publicId}</span>
                      {selected.enteredIntoForceAt && (
                        <span className="text-emerald-400"> · EN VIGOR DESDE {shortAt(selected.enteredIntoForceAt)}</span>
                      )}
                    </p>
                    {selected.taskRef && (
                      <p className="flex items-center gap-1.5 mt-1 text-[9px] font-mono text-zinc-500">
                        <Link2 className="w-3 h-3 text-amber-300/70 shrink-0" />
                        TAREA OPERATIONS VINCULADA · <span className="text-amber-300">{selected.taskRef}</span>
                        {taskTitle(selected.taskRef) && <span className="text-zinc-400 truncate">· {taskTitle(selected.taskRef)}</span>}
                        <span className="text-zinc-600 whitespace-nowrap">(interno · no visible al firmante)</span>
                      </p>
                    )}
                    {selected.openSign && (
                      <p className="flex items-center gap-1.5 mt-1 text-[9px] font-mono text-zinc-500">
                        <FileSignature className="w-3 h-3 text-emerald-300/70" />
                        <span className="text-emerald-300">FIRMA ONLINE HABILITADA</span>
                        <span className="text-zinc-600">· cualquiera con el link puede firmar (nombre + wallet)</span>
                      </p>
                    )}
                    {selected.ndaEnabled && (
                      <p className="flex items-center gap-1.5 mt-1 text-[9px] font-mono text-zinc-500">
                        <ShieldCheck className="w-3 h-3 text-purple-300/70" />
                        <span className="text-purple-300">NDA {selected.ndaVersion ?? "v1.0"} ACTIVO</span>
                        <span className="text-zinc-600">· fase: {selected.ndaPhase ?? "after_proposal"} · bypass global por email</span>
                      </p>
                    )}
                    {lastSignEvent && (
                      <div className="mt-2 flex items-start gap-2 p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05]">
                        <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-mono text-emerald-300">
                            {lastSignEvent.actor} {lastSignEvent.action === "Accepted" ? "aceptó" : "firmó"} · {shortAt(lastSignEvent.at)}
                          </p>
                          {lastSignEvent.detail && <p className="text-[9px] text-zinc-500 mt-0.5">{lastSignEvent.detail}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => patch(selected.id, { openSign: !selected.openSign }).then(() => flashMsg(selected.openSign ? "Firma online desactivada" : "✓ Firma online habilitada · cualquier persona con el link puede firmar"))}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-[10px] font-mono transition-colors ${
                        selected.openSign
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                          : "border-white/10 bg-black/40 text-zinc-500 hover:text-white hover:border-white/25"
                      }`}
                      title="Habilitar/deshabilitar firma online (openSign)"
                    >
                      <FileSignature className="w-3 h-3" /> ONLINE
                    </button>
                    <button
                      onClick={() => patch(selected.id, { ndaEnabled: !selected.ndaEnabled, ndaPhase: selected.ndaPhase ?? "after_proposal" }).then(() => flashMsg(selected.ndaEnabled ? "NDA desactivado" : "✓ NDA activado · firmantes deben aceptar NDA antes del deal"))}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-[10px] font-mono transition-colors ${
                        selected.ndaEnabled
                          ? "border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
                          : "border-white/10 bg-black/40 text-zinc-500 hover:text-white hover:border-white/25"
                      }`}
                      title="Habilitar/deshabilitar NDA (Acuerdo de Confidencialidad)"
                    >
                      <ShieldCheck className="w-3 h-3" /> NDA
                    </button>
                    <button
                      onClick={copyPublicLink}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-[9px] font-mono text-amber-200 hover:bg-amber-500/20 transition-colors"
                    >
                      <Copy className="w-3 h-3" /> LINK PÚBLICO
                    </button>
                    {selected.ndaEnabled && (
                      <button
                        onClick={() => {
                          const url = new URL(`${window.location.origin}/nexus/print/${selected.publicId}/nda`);
                          const unlock = new URLSearchParams(window.location.search).get('unlock');
                          if (unlock) url.searchParams.set('unlock', unlock);
                          window.open(url.toString(), '_blank');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-purple-500/30 bg-purple-500/10 text-[9px] font-mono text-purple-200 hover:bg-purple-500/20 transition-colors"
                        title="Generar y descargar NDA (Firmado)"
                      >
                        <ShieldCheck className="w-3 h-3" /> DESCARGAR NDA
                      </button>
                    )}
                    {["SIGNED", "EXECUTING", "EXECUTED"].includes(selected.status) ? (
                      <button
                        onClick={() => {
                          const url = new URL(`${window.location.origin}/nexus/print/${selected.publicId}`);
                          const unlock = new URLSearchParams(window.location.search).get('unlock');
                          if (unlock) url.searchParams.set('unlock', unlock);
                          window.open(url.toString(), '_blank');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-[9px] font-mono text-emerald-200 hover:bg-emerald-500/20 transition-colors"
                        title="Generar y descargar PDF (Firmado)"
                      >
                        <Download className="w-3 h-3" /> DESCARGAR PDF
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const url = new URL(`${window.location.origin}/nexus/print/${selected.publicId}`);
                          const unlock = new URLSearchParams(window.location.search).get('unlock');
                          if (unlock) url.searchParams.set('unlock', unlock);
                          window.open(url.toString(), '_blank');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-[9px] font-mono text-amber-200 hover:bg-amber-500/20 transition-colors"
                        title="Generar y descargar PDF (Borrador)"
                      >
                        <Download className="w-3 h-3" /> DESCARGAR BORRADOR
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmCancel(true)}
                      className="p-2 text-zinc-500 hover:text-red-400 transition-colors rounded-md hover:bg-red-500/10"
                      title="Cancelar Negociación"
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="p-2 text-zinc-500 hover:text-rose-400 transition-colors rounded-md hover:bg-rose-500/10"
                      title="Eliminar Trato"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Stepper */}
                <div className="flex items-center gap-1 mt-3 overflow-x-auto pb-0.5">
                  {(() => {
                    const steps = selected.nextRoomId 
                      ? [...STATUS_ORDER.slice(0, STATUS_ORDER.indexOf("SIGNED") + 1), "CONTINUADO_EN_ACUERDO"]
                      : STATUS_ORDER;

                    return steps.map((s, i) => {
                      const isSpecial = s === "CONTINUADO_EN_ACUERDO";
                      const done = isSpecial ? true : i <= progressIndex;
                      const label = isSpecial ? "CONTINUADO" : STATUS_LABEL[s as Room["status"]];
                      
                      return (
                        <div key={s} className="flex items-center">
                          <div
                            className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[8px] font-mono uppercase tracking-wider whitespace-nowrap ${
                              done
                                ? isSpecial
                                  ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                                  : i === progressIndex
                                    ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                                    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                                : "border-white/10 bg-black/40 text-zinc-600"
                            }`}
                          >
                            {done && i < progressIndex && !isSpecial && <Check className="w-2.5 h-2.5" />}
                            {isSpecial && <Scale className="w-2.5 h-2.5" />}
                            {label}
                          </div>
                          {i < steps.length - 1 && <span className="w-2 h-px bg-white/10" />}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center justify-between gap-2 px-4 md:px-5 py-2 border-b border-white/10">
                <div className="flex items-center gap-1 overflow-x-auto">
                  <button
                    onClick={() => setView("sections")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-mono tracking-wider whitespace-nowrap transition-colors ${
                      view === "sections" ? "bg-amber-500/15 border border-amber-500/40 text-amber-200" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <FileText className="w-3 h-3" /> SECCIONES
                  </button>
                  <button
                    onClick={() => setView("signers")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-mono tracking-wider whitespace-nowrap transition-colors ${
                      view === "signers" ? "bg-amber-500/15 border border-amber-500/40 text-amber-200" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <FileSignature className="w-3 h-3" /> FIRMANTES ({selected.signers.length})
                  </button>
                  <button
                    onClick={() => setView("audit")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-mono tracking-wider whitespace-nowrap transition-colors ${
                      view === "audit" ? "bg-amber-500/15 border border-amber-500/40 text-amber-200" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Clock className="w-3 h-3" /> AUDIT ({selected.audit.length})
                  </button>
                </div>
                {view === "sections" && (
                  <>
                    {selected.kind === "PROPOSAL" && !selected.nextRoomId && (
                      <button
                        onClick={convertToAgreement}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/40 text-violet-200 text-[10px] font-mono tracking-wider transition-colors"
                      >
                        <Scale className="w-3 h-3" /> CONVERTIR EN ACUERDO LEGAL
                      </button>
                    )}
                    {selected.kind === "PROPOSAL" && selected.nextRoomId && (
                      <button
                        disabled
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 text-zinc-600 text-[10px] font-mono tracking-wider cursor-not-allowed"
                      >
                        <Scale className="w-3 h-3" /> CONVERTIDO A ACUERDO
                      </button>
                    )}
                    {!selected.nextRoomId && (
                      <button
                        onClick={addSection}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-[10px] font-mono tracking-wider transition-colors"
                      >
                        <Plus className="w-3 h-3" /> AGREGAR SECCIÓN
                      </button>
                    )}
                    {nextStep(selected) && (
                      <button
                        onClick={runAction}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider transition-colors bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200"
                      >
                        <Activity className="w-3 h-3" />
                        {nextStep(selected)!.label}
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 md:p-5">
                {view === "audit" && (
                  <div className="space-y-2">
                    {selected.audit.map((ev) => (
                      <div key={ev.id} className="flex items-start gap-3 p-3 rounded-xl border border-white/10 bg-[#0C0C10]">
                        <span className="flex items-center justify-center w-7 h-7 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-300 shrink-0">
                          <Clock className="w-3.5 h-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold text-zinc-100">{ev.action}</span>
                            <span className="text-[9px] font-mono text-zinc-600 whitespace-nowrap">{shortAt(ev.at)}</span>
                          </div>
                          {ev.detail && <p className="text-[10px] text-zinc-400 mt-0.5">{ev.detail}</p>}
                          <p className="text-[9px] font-mono text-amber-300/70 mt-1">actor: {ev.actor}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {view === "signers" && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl border border-white/10 bg-[#0C0C10]">
                      <p className="text-[10px] font-mono text-amber-300 uppercase tracking-widest mb-2">AGREGAR Y COMPARTIR</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="emails separados por coma"
                          value={signersInput}
                          onChange={(e) => setSignersInput(e.target.value)}
                          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40"
                        />
                        <button
                          onClick={addAndShare}
                          disabled={sharing || !signersInput.includes("@")}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-200 text-[10px] font-mono transition-colors disabled:opacity-50"
                        >
                          <Mail className="w-3 h-3" /> {sharing ? "ENVIANDO..." : "AGREGAR + ENVIAR"}
                        </button>
                      </div>
                      <p className="text-[9px] text-zinc-600 mt-1.5">
                        Al agregar un firmante se registra y se le envía su magic link automáticamente (Resend).
                        Solo estos emails pueden desbloquear el link público.
                      </p>
                    </div>

                    <div className="space-y-2">
                      {selected.signers.map((s) => (
                        <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-[#0C0C10]">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${s.status === "SIGNED" ? "bg-emerald-400" : s.status === "VIEWED" ? "bg-amber-400" : s.status === "MAGIC_SENT" ? "bg-blue-400" : "bg-zinc-600"}`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] text-zinc-100 truncate">{s.email}</p>
                            <p className="text-[9px] font-mono text-zinc-500">
                              {SIGNER_LABEL[s.status]}
                              {s.signatureName && ` · ${s.signatureName}`}
                              {s.wallet && ` · ${s.wallet.slice(0, 10)}…`}
                            </p>
                          </div>
                          {s.status !== "SIGNED" && (
                            <button
                              onClick={() => resendSigner(s.email)}
                              disabled={sharing}
                              title="Reenviar magic link"
                              className="flex items-center gap-1 px-2 py-1 rounded-md border border-white/10 text-[9px] text-zinc-400 hover:text-amber-300 hover:border-amber-500/30 transition-colors disabled:opacity-50"
                            >
                              <Mail className="w-3 h-3" /> REENVIAR
                            </button>
                          )}
                          {s.status === "MAGIC_SENT" && (
                            <button
                              onClick={() => window.open(`${window.location.origin}/deal/${selected.publicId}`, "_blank")}
                              className="flex items-center gap-1 px-2 py-1 rounded-md border border-white/10 text-[9px] text-zinc-400 hover:text-white transition-colors"
                            >
                              <Eye className="w-3 h-3" /> VER PÚBLICO
                            </button>
                          )}
                          <button onClick={() => removeSigner(s.id)} className="p-1 text-zinc-600 hover:text-rose-400 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {selected.signers.length === 0 && (
                        <p className="text-[10px] font-mono text-zinc-600 p-2">Sin firmantes registrados.</p>
                      )}
                    </div>
                  </div>
                )}

                {view === "sections" && (
                  <>
                    <div className="flex gap-1 overflow-x-auto pb-2 mb-3">
                      {selected.sections.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setSectionId(s.id);
                            setEditingId(null);
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-[9px] font-mono whitespace-nowrap transition-colors ${
                            sectionId === s.id
                              ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                              : "border-white/10 bg-black/40 text-zinc-400 hover:text-white"
                          }`}
                        >
                          <span className="text-zinc-600">{s.code}</span> {s.title}
                        </button>
                      ))}
                    </div>

                    {activeSection && (
                      <div className="rounded-2xl border border-white/10 bg-[#0C0C10] p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-[9px] font-mono text-amber-300/80 uppercase tracking-widest">SECCIÓN {activeSection.code} / {selected.sections.length}</p>
                            <h5 className="text-sm font-semibold text-zinc-100 mt-0.5">{activeSection.title}</h5>
                          </div>
                          {editingId === activeSection.id ? (
                            <div className="flex items-center gap-2">
                              <button onClick={() => setEditingId(null)} className="px-2 py-1 rounded-md border border-white/10 text-[10px] text-zinc-400 hover:text-white transition-colors">
                                Cancelar
                              </button>
                              <button onClick={saveEdit} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-200 text-[10px] font-mono transition-colors">
                                <Check className="w-3 h-3" /> Guardar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(activeSection)}
                              className="flex items-center gap-1 px-2 py-1 rounded-md border border-white/10 text-zinc-400 hover:text-amber-300 hover:border-amber-500/30 text-[10px] font-mono transition-colors"
                            >
                              <PenLine className="w-3 h-3" /> EDITAR
                            </button>
                          )}
                        </div>
                        {editingId === activeSection.id ? (
                          <textarea
                            value={draftContent}
                            onChange={(e) => setDraftContent(e.target.value)}
                            rows={Math.max(6, activeSection.content.split("\n").length + 1)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white leading-relaxed focus:outline-none focus:border-amber-500/40"
                          />
                        ) : (
                          <div className="space-y-1.5">
                            {activeSection.content.split("\n").filter(Boolean).map((line, i) => (
                              <p key={i} className="text-[11px] text-zinc-300 leading-relaxed">
                                <span className="text-zinc-600 font-mono mr-2">{String(i + 1).padStart(2, "0")}</span>
                                {line}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {confirmDelete && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-rose-500/20 bg-[#0C0C10] overflow-hidden"
          >
            <div className="h-1 bg-gradient-to-r from-amber-500 to-rose-500" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300">
                  <Handshake className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-widest text-amber-300">Pandora's Nexus · Transaction Room</p>
                  <h3 className="text-base font-semibold text-white">¿Eliminar Deal Room?</h3>
                </div>
              </div>

              <p className="text-[12px] text-zinc-300 leading-relaxed">
                Se eliminará permanentemente la propuesta de{' '}
                <span className="text-white font-semibold">{selected.counterparty}</span> ({selected.publicId}),
                incluyendo sus secciones, firmantes y todo su historial de auditoría.
              </p>
              <p className="text-[11px] text-rose-300 mt-2">Esta acción no se puede deshacer.</p>

              <div className="flex items-center justify-end gap-2 mt-6">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-4 py-2 rounded-lg border border-white/10 text-[11px] font-mono text-zinc-300 hover:text-white transition-colors"
                >
                  CANCELAR
                </button>
                <button
                  onClick={deleteRoom}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-[11px] font-mono transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  SÍ, ELIMINAR
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {confirmCancel && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-red-500/20 bg-[#0C0C10] overflow-hidden"
          >
            <div className="h-1 bg-gradient-to-r from-amber-500 to-red-500" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300">
                  <Ban className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-widest text-amber-300">Pandora's Nexus · Transaction Room</p>
                  <h3 className="text-base font-semibold text-white">¿Cancelar Documento?</h3>
                </div>
              </div>

              <p className="text-[12px] text-zinc-300 leading-relaxed mb-4">
                Se cancelará el documento de{' '}
                <span className="text-white font-semibold">{selected.counterparty}</span> ({selected.publicId}).
                Esto invalidará cualquier enlace mágico activo.
              </p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => cancelRoom(true)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 text-[11px] font-mono transition-colors"
                >
                  <Ban className="w-3.5 h-3.5" />
                  CANCELAR Y NOTIFICAR FIRMANTES
                </button>
                <button
                  onClick={() => cancelRoom(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-black/40 hover:bg-zinc-800/80 border border-white/10 text-zinc-400 hover:text-white text-[11px] font-mono transition-colors"
                >
                  <Ban className="w-3.5 h-3.5" />
                  CANCELAR SILENCIOSAMENTE
                </button>
                <button
                  onClick={() => setConfirmCancel(false)}
                  className="mt-2 text-[11px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  VOLVER
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {flash && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg border border-amber-500/30 bg-[#0C0C10] text-amber-200 text-[11px] font-mono shadow-[0_0_20px_rgba(245,158,11,0.15)]">
          {flash}
        </div>
      )}
    </main>
  );
}
