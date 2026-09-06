import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ProjectSection9() {
  const { getValues } = useFormContext();
  const projectSlug = getValues("slug");

  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCollabId, setNewCollabId] = useState("");

  useEffect(() => {
    if (projectSlug) {
      fetchCollaborators();
    }
  }, [projectSlug]);

  const fetchCollaborators = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/internal/admin/projects/${projectSlug}/collaborators`);
      if (res.ok) {
        const json = await res.json();
        setCollaborators(json.data || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleAssign = async () => {
    if (!newCollabId) return;
    try {
      const res = await fetch(`/api/v1/internal/admin/projects/${projectSlug}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collaboratorId: Number(newCollabId) }),
      });
      if (res.ok) {
        setNewCollabId("");
        fetchCollaborators();
      } else {
        alert("Error al asignar colaborador");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemove = async (collabId: number) => {
    if (!confirm("¿Eliminar asignación?")) return;
    try {
      const res = await fetch(`/api/v1/internal/admin/projects/${projectSlug}/collaborators`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collaboratorId: collabId }),
      });
      if (res.ok) {
        fetchCollaborators();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-medium text-white mb-2">Asignación de Operadores (HITL)</h3>
        <p className="text-zinc-400 text-sm">
          Asigna colaboradores a este tenant para que reciban las escalaciones de Hermes AI y puedan chatear con los clientes vía Inbox.
        </p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-white mb-3">Colaboradores Asignados</h4>
        {loading ? (
          <p className="text-xs text-zinc-500">Cargando...</p>
        ) : collaborators.length === 0 ? (
          <p className="text-xs text-zinc-500">No hay operadores asignados.</p>
        ) : (
          <div className="space-y-2">
            {collaborators.map((c, i) => (
              <div key={i} className="flex items-center justify-between bg-zinc-800/30 p-2 rounded-md border border-zinc-700/50">
                <div>
                  <p className="text-sm font-medium text-white">{c.name}</p>
                  <p className="text-xs text-zinc-400">{c.email} (ID: {c.collaboratorId})</p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => handleRemove(c.collaboratorId)}>
                  Remover
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-zinc-800">
        <h4 className="text-sm font-medium text-white mb-3">Añadir Operador</h4>
        <div className="flex gap-2">
          <Input 
            placeholder="ID del Colaborador (ej. 1)" 
            value={newCollabId}
            onChange={(e) => setNewCollabId(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleAssign}>Asignar</Button>
        </div>
        <p className="text-xs text-zinc-500 mt-2">Busca el ID del colaborador en la tabla de nexus_collaborators o en /admin/users.</p>
      </div>
    </div>
  );
}
