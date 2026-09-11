"use client";

import { useEffect, useState } from "react";
import { Bot, Plus, Trash2, Key, Check, Copy, ExternalLink, ShieldAlert, Lock, Eye } from "lucide-react";
import { motion } from "framer-motion";

export function CognitiveAgentsManager({ canManage = true }: { canManage?: boolean }) {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [agentId, setAgentId] = useState("");
  const [name, setName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  // Modal state
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [newAgentId, setNewAgentId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const getAuthHeaders = (): HeadersInit => {
    const token = typeof window !== "undefined" ? localStorage.getItem("pandoras_nexus_token") : null;
    return token
      ? { "Content-Type": "application/json", "x-nexus-token": token, Authorization: `Bearer ${token}` }
      : { "Content-Type": "application/json" };
  };

  const loadAgents = async () => {
    try {
      const res = await fetch("/api/nexus/agents/list", {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setAgents(data.agents);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/nexus/agents/create", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ agentId: agentId.trim(), name: name.trim(), walletAddress: walletAddress.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setNewSecret(data.plainSecret);
        setNewAgentId(data.agent.agentId);
        setAgentId("");
        setName("");
        setWalletAddress("");
        loadAgents();
      } else {
        setMessage({ type: "error", text: data.error || "Error al crear agente" });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Error de conexión" });
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!canManage) return;
    if (!confirm(`¿Estás seguro de revocar permanentemente el acceso del agente ${id}? Esta acción cortará su conexión al Hub.`)) return;

    try {
      const res = await fetch("/api/nexus/agents/revoke", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ agentId: id }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        await loadAgents();
        setMessage({ type: "success", text: `Agente ${id} revocado exitosamente.` });
      } else {
        setMessage({ type: "error", text: data.error || "Error al revocar agente" });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Error de conexión" });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Nuevo Agente Form o Banner de Monitoreo */}
      {canManage ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-xl"
        >
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Bot className="w-4 h-4 text-emerald-400" />
            Registrar Nuevo Agente (Zero-Trust Hub)
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">ID Único (e.g. dev-alex)</label>
                <input
                  type="text"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  placeholder="bot-analytics"
                  className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Nombre Descriptivo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Agent Name"
                  className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Wallet Address (EIP-191)</label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !agentId || !name}
              className="w-full sm:w-auto bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl px-5 py-2.5 text-emerald-300 transition-all disabled:opacity-40 font-medium text-xs flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {loading ? "Generando credenciales..." : "Registrar & Generar Secreto"}
            </button>
          </form>
        </motion.div>
      ) : (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <Bot className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-300 flex items-center gap-2">
                Modo Monitoreo de Agentes Cognitivos
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  READ-ONLY
                </span>
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Tienes visibilidad operacional de los agentes activos y telemetría de red. La provisión de nuevas credenciales y revocación requiere rol Administrador.
              </p>
            </div>
          </div>
          <Eye className="w-4 h-4 text-zinc-500 hidden sm:block" />
        </div>
      )}

      {/* Secret Modal */}
      {newSecret && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500" />
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            ¡Credenciales Generadas!
          </h2>
          <p className="text-sm text-zinc-300 mb-6">
            Copia este código y envíaselo a tu desarrollador. 
            <strong className="text-red-400 block mt-1">NUNCA VOLVEREMOS A MOSTRAR EL AGENT_SECRET.</strong> 
            Ha sido encriptado con bcrypt en la base de datos.
          </p>

          <div className="relative bg-[#0d0d12] border border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-300 overflow-x-auto">
            <button
              onClick={() => copyToClipboard(`AGENT_ID="${newAgentId}"\nAGENT_SECRET="${newSecret}"`)}
              className="absolute top-3 right-3 p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
              title="Copiar credenciales"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <pre className="whitespace-pre-wrap pr-10">
{`# 1. Instala el SDK en tu proyecto
npm install @pandorasbox6/a2a-client

# 2. Configura las variables de entorno
AGENT_ID="${newAgentId}"
AGENT_SECRET="${newSecret}"

# 3. Inicializa el Cliente
import { A2AClient } from '@pandorasbox6/a2a-client';

const client = new A2AClient({
  agentId: process.env.AGENT_ID,
  agentSecret: process.env.AGENT_SECRET,
  privateKey: process.env.PRIVATE_KEY // La llave de la wallet
});`}
            </pre>
          </div>
          
          <div className="mt-4 flex justify-end">
             <button
              onClick={() => { setNewSecret(null); setNewAgentId(null); }}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs transition-colors"
            >
              Ya lo he guardado
            </button>
          </div>
        </motion.div>
      )}

      {/* Lista de Agentes */}
      <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800/50 flex justify-between items-center">
          <h3 className="font-medium text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-zinc-400" />
            Agentes Registrados
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-800/20 text-zinc-400 text-xs uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Agent ID</th>
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">Wallet (EIP-191)</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-sm">
              {agents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-zinc-500">
                    No hay agentes registrados
                  </td>
                </tr>
              ) : (
                agents.map((agent) => (
                  <tr key={agent.agentId} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-5 py-4 text-white font-mono text-xs">{agent.agentId}</td>
                    <td className="px-5 py-4 text-zinc-300">{agent.name}</td>
                    <td className="px-5 py-4 text-zinc-400 font-mono text-[10px]">
                      {agent.walletAddress || "N/A"}
                    </td>
                    <td className="px-5 py-4">
                      {agent.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/20">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          ACTIVO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] border border-red-500/20">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                          REVOCADO
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {canManage ? (
                        agent.isActive && (
                          <button
                            onClick={() => handleRevoke(agent.agentId)}
                            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Revocar acceso"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )
                      ) : (
                        <span className="text-[10px] font-mono text-zinc-500 inline-flex items-center gap-1">
                          <Lock className="w-3 h-3 text-zinc-600" /> Solo Lectura
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
