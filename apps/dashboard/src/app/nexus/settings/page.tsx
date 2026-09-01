"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Plus, Trash2, Copy, Check, ExternalLink } from "lucide-react";

interface Collaborator {
  id: number;
  name: string;
  email: string;
  expiresAt: string;
  lastAccessAt?: string | null;
  createdAt: string;
}

export default function NexusSettingsPage() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const loadCollaborators = async () => {
    try {
      const res = await fetch("/api/nexus/collaborators/list");
      const data = await res.json();
      if (res.ok && data.ok) {
        setCollaborators(data.collaborators);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadCollaborators();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/nexus/collaborators/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setMessage({ type: "success", text: `Magic link enviado a ${email}` });
        setName("");
        setEmail("");
        await loadCollaborators();
      } else {
        setMessage({ type: "error", text: data.error || "Error al enviar invitación" });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Error de conexión" });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (email: string) => {
    if (!confirm(`¿Eliminar a ${email} de los colaboradores?`)) return;

    try {
      const res = await fetch(`/api/nexus/collaborators/remove?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        await loadCollaborators();
        setMessage({ type: "success", text: "Colaborador eliminado" });
      } else {
        setMessage({ type: "error", text: data.error || "Error al eliminar" });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Error de conexión" });
    }
  };

  const copyMagicLink = (email: string) => {
    const token = `nx_collab_${email}`; // Placeholder - en prod se generaría uno nuevo
    const link = `${window.location.origin}/nexus/rooms?collaborator=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedId(Date.now());
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <main className="min-h-screen bg-[#08080A] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <a
            href="/nexus/rooms"
            className="p-2 bg-zinc-900 rounded-xl border border-zinc-800 hover:bg-zinc-800 transition-colors"
          >
            <ExternalLink className="w-5 h-5 text-zinc-400" />
          </a>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Nexus Settings</h1>
            <p className="text-zinc-500 text-sm">Gestión de Colaboradores</p>
          </div>
        </div>

        {/* Formulario de invitación */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-amber-400" />
            Invitar Colaborador
          </h2>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="juan@example.com"
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !name || !email}
              className="w-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl px-4 py-3 text-amber-200 transition-all disabled:opacity-40 font-medium flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {loading ? "Enviando..." : "Enviar Magic Link"}
            </button>
          </form>

          {message && (
            <div
              className={`mt-4 p-3 rounded-xl text-sm ${
                message.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                  : "bg-rose-500/10 border border-rose-500/20 text-rose-300"
              }`}
            >
              {message.text}
            </div>
          )}
        </motion.div>

        {/* Lista de colaboradores */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Colaboradores Activos</h2>

          {collaborators.length === 0 ? (
            <p className="text-zinc-500 text-sm py-8 text-center">
              No hay colaboradores activos. Invita a alguien usando el formulario de arriba.
            </p>
          ) : (
            <div className="space-y-3">
              {collaborators.map((collab) => (
                <div
                  key={collab.id}
                  className="flex items-center justify-between p-4 bg-zinc-800/30 border border-zinc-700/50 rounded-xl"
                >
                  <div className="flex-1">
                    <p className="text-white font-medium">{collab.name}</p>
                    <p className="text-zinc-400 text-xs">{collab.email}</p>
                    <p className="text-zinc-500 text-[10px] mt-1">
                      Expira: {new Date(collab.expiresAt).toLocaleDateString()}
                      {collab.lastAccessAt && (
                        <span className="ml-2">
                          · Último acceso: {new Date(collab.lastAccessAt).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyMagicLink(collab.email)}
                      className="p-2 bg-zinc-700/50 hover:bg-zinc-600/50 rounded-lg transition-colors"
                      title="Copiar enlace mágico"
                    >
                      {copiedId === collab.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-zinc-400" />
                      )}
                    </button>
                    <button
                      onClick={() => handleRemove(collab.email)}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors"
                      title="Eliminar colaborador"
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Info */}
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4">
          <p className="text-amber-200/80 text-xs leading-relaxed">
            <strong className="text-amber-200">Nota:</strong> Los colaboradores solo tienen acceso al Nexus (Transaction Rooms).
            No pueden acceder a la sección privada de libros ni a otras áreas restringidas.
            El magic link expira a las 24 horas de ser generado.
          </p>
        </div>
      </div>
    </main>
  );
}
