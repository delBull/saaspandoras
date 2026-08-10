"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";

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
  kind: "PROPOSAL" | "AGREEMENT" | "CONTRACT" | "AMENDMENT";
  counterparty: string;
  relation: string;
  company: string;
  status: "DRAFT" | "PROPOSAL_SENT" | "REVIEW" | "ACCEPTED" | "SIGNED" | "EXECUTED";
  summary?: string | null;
  createdAt: string;
  updatedAt: string;
  sections: Section[];
  audit: AuditEvent[];
  signers: Signer[];
}

const KINDS: Room["kind"][] = ["PROPOSAL", "AGREEMENT", "CONTRACT", "AMENDMENT"];
const KIND_LABEL: Record<Room["kind"], string> = {
  PROPOSAL: "Propuesta de Colaboración",
  AGREEMENT: "Acuerdo",
  CONTRACT: "Contrato",
  AMENDMENT: "Enmienda",
};
const KIND_BADGE: Record<Room["kind"], string> = {
  PROPOSAL: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  AGREEMENT: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  CONTRACT: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  AMENDMENT: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};
const STATUS_LABEL: Record<Room["status"], string> = {
  DRAFT: "Borrador",
  PROPOSAL_SENT: "Propuesta Enviada",
  REVIEW: "En Revisión",
  ACCEPTED: "Aceptada",
  SIGNED: "Firmada",
  EXECUTED: "Ejecutada",
};
const STATUS_ACCENT: Record<Room["status"], string> = {
  DRAFT: "border-zinc-500/20 bg-zinc-500/10 text-zinc-300",
  PROPOSAL_SENT: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  REVIEW: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  ACCEPTED: "border-violet-500/20 bg-violet-500/10 text-violet-300",
  SIGNED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  EXECUTED: "border-amber-400/20 bg-amber-400/10 text-amber-200",
};
const STATUS_ORDER: Room["status"][] = ["DRAFT", "PROPOSAL_SENT", "REVIEW", "ACCEPTED", "SIGNED", "EXECUTED"];
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
  const [flash, setFlash] = useState<string | null>(null);

  const [nrKind, setNrKind] = useState<Room["kind"]>("PROPOSAL");
  const [nrCounterparty, setNrCounterparty] = useState("");
  const [nrRelation, setNrRelation] = useState("");
  const [nrCompany, setNrCompany] = useState("");
  const [nrSummary, setNrSummary] = useState("");
  const [nrNote, setNrNote] = useState("");
  const [nrSigners, setNrSigners] = useState("");

  const [signersInput, setSignersInput] = useState("");
  const [shareEmails, setShareEmails] = useState("");
  const [sharing, setSharing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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

  const selected = useMemo(() => rooms.find((r) => r.id === selectedId) ?? null, [rooms, selectedId]);
  const activeSection = useMemo(
    () => selected?.sections.find((s) => s.id === sectionId) ?? null,
    [selected, sectionId]
  );
  const progressIndex = selected ? STATUS_ORDER.indexOf(selected.status) : 0;

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nrCounterparty.trim()) return;
    const signers = nrSigners
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.includes("@"));
    try {
      const res = await fetch(apiUrl("/api/nexus/deals"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: nrKind,
          counterparty: nrCounterparty,
          relation: nrRelation,
          company: nrCompany,
          summary: nrSummary,
          note: nrNote,
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
      flashMsg(`✓ Deal Room ${data.room.publicId} creado · link público auto-generado`);
    } catch (e: any) {
      flashMsg(`✗ ${e.message}`);
    }
  };

  const addSigners = async () => {
    if (!selected) return;
    const emails = signersInput.split(",").map((s) => s.trim()).filter((s) => s.includes("@"));
    if (emails.length === 0) return;
    try {
      await patch(selected.id, { signers: emails.map((email) => ({ email })) });
      setSignersInput("");
      flashMsg(`✓ ${emails.length} signer${emails.length > 1 ? "s" : ""} agregado${emails.length > 1 ? "s" : ""}`);
    } catch (e: any) {
      flashMsg(`✗ ${e.message}`);
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

  const shareByEmail = async () => {
    if (!selected) return;
    const emails = shareEmails.split(",").map((s) => s.trim()).filter((s) => s.includes("@"));
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
      flashMsg(`✓ ${okCount}/${emails.length} emails enviados con magic link`);
      setShareEmails("");
      load();
    } catch (e: any) {
      flashMsg(`✗ ${e.message}`);
    } finally {
      setSharing(false);
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
        <div className="flex items-center gap-2 shrink-0">
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
            <span className="text-[10px] font-mono tracking-widest text-zinc-400">ROOMS</span>
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
            {rooms.length === 0 && (
              <p className="text-[10px] font-mono text-zinc-600 p-2">Sin Transaction Rooms. Crea la primera.</p>
            )}
            {rooms.map((room) => {
              const active = room.id === selectedId;
              const signed = room.signers.filter((s) => s.status === "SIGNED").length;
              return (
                <button
                  key={room.id}
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
                    <span className="text-[11px] font-semibold text-zinc-100 truncate">{room.counterparty}</span>
                    <ChevronRight className={`w-3 h-3 shrink-0 ${active ? "text-amber-300" : "text-zinc-600"}`} />
                  </div>
                  <p className="text-[9px] font-mono text-zinc-500 truncate mt-0.5">{room.relation} · {room.publicId}</p>
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
              );
            })}
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
                      <h4 className="text-sm font-semibold text-zinc-100 truncate">{selected.counterparty}</h4>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider border ${STATUS_ACCENT[selected.status]}`}>
                        {STATUS_LABEL[selected.status]}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-zinc-500 mt-1">
                      {selected.relation} · {selected.company} · ROOM <span className="text-amber-300">{selected.publicId}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyPublicLink}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px] font-mono hover:bg-amber-500/20 transition-colors"
                    >
                      <Copy className="w-3 h-3" /> LINK PÚBLICO
                    </button>
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="p-2 text-zinc-500 hover:text-rose-400 transition-colors rounded-md hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Stepper */}
                <div className="flex items-center gap-1 mt-3 overflow-x-auto pb-0.5">
                  {STATUS_ORDER.map((s, i) => {
                    const done = i <= progressIndex;
                    return (
                      <div key={s} className="flex items-center">
                        <div
                          className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[8px] font-mono uppercase tracking-wider whitespace-nowrap ${
                            done
                              ? i === progressIndex
                                ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                              : "border-white/10 bg-black/40 text-zinc-600"
                          }`}
                        >
                          {done && i < progressIndex && <Check className="w-2.5 h-2.5" />}
                          {STATUS_LABEL[s]}
                        </div>
                        {i < STATUS_ORDER.length - 1 && <span className="w-2 h-px bg-white/10" />}
                      </div>
                    );
                  })}
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
                  <button
                    onClick={runAction}
                    disabled={!nextStep(selected)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider transition-colors ${
                      nextStep(selected)
                        ? "bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200"
                        : "bg-white/5 border border-white/10 text-zinc-600 cursor-not-allowed"
                    }`}
                  >
                    <Activity className="w-3 h-3" />
                    {nextStep(selected) ? nextStep(selected)?.label : "COMPLETADA"}
                  </button>
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
                      <p className="text-[10px] font-mono text-amber-300 uppercase tracking-widest mb-2">AGREGAR FIRMANTES</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="emails separados por coma"
                          value={signersInput}
                          onChange={(e) => setSignersInput(e.target.value)}
                          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40"
                        />
                        <button
                          onClick={addSigners}
                          className="px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-200 text-[10px] font-mono transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[9px] text-zinc-600 mt-1.5">Solo estos emails pueden desbloquear el link público.</p>
                    </div>

                    <div className="p-4 rounded-2xl border border-white/10 bg-[#0C0C10]">
                      <p className="text-[10px] font-mono text-amber-300 uppercase tracking-widest mb-3">COMPARTIR POR EMAIL (RESEND)</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="emails separados por coma"
                          value={shareEmails}
                          onChange={(e) => setShareEmails(e.target.value)}
                          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40"
                        />
                        <button
                          onClick={shareByEmail}
                          disabled={sharing}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-200 text-[10px] font-mono transition-colors disabled:opacity-50"
                        >
                          <Mail className="w-3 h-3" /> {sharing ? "ENVIANDO..." : "ENVIAR"}
                        </button>
                      </div>
                      <p className="text-[9px] text-zinc-600 mt-1.5">
                        Envía el link público con <span className="text-emerald-300">magic link integrado</span> (acceso directo para firmar).
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
                            <p className="text-[9px] font-mono text-amber-300/80 uppercase tracking-widest">SECCIÓN {activeSection.code} / 09</p>
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

      {flash && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg border border-amber-500/30 bg-[#0C0C10] text-amber-200 text-[11px] font-mono shadow-[0_0_20px_rgba(245,158,11,0.15)]">
          {flash}
        </div>
      )}
    </main>
  );
}
