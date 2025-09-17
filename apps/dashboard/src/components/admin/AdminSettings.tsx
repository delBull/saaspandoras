"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@saasfly/ui/input";
import { Button } from "@saasfly/ui/button";
import { Trash2, PlusCircle, Loader2 } from "lucide-react";
import { SUPER_ADMIN_WALLET } from "@/lib/constants";

interface Admin {
  id: number;
  walletAddress: string;
  role: string;
}

interface AdminSettingsProps {
  initialAdmins: Admin[];
}

export function AdminSettings({ initialAdmins }: AdminSettingsProps) {
  const [admins, setAdmins] = useState<Admin[]>(initialAdmins);
  const [newAddress, setNewAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddAdmin = async () => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(newAddress)) {
      toast.error("Por favor, introduce una dirección de wallet válida.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/administrators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: newAddress }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "No se pudo añadir el administrador.");
      }

      const newAdmin = await response.json() as Admin;
      setAdmins([...admins, newAdmin]);
      setNewAddress("");
      toast.success("Administrador añadido exitosamente.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAdmin = async (id: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar a este administrador?")) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/administrators/${id.toString()}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "No se pudo eliminar el administrador.");
      }

      setAdmins(admins.filter(admin => admin.id !== id));
      toast.success("Administrador eliminado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">Añadir Nuevo Administrador</h3>
        <div className="flex gap-2 mt-2">
          <Input
            type="text"
            placeholder="0x..."
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            className="bg-zinc-800 border-zinc-700"
          />
          <Button onClick={handleAddAdmin} disabled={isLoading} className="bg-lime-500 hover:bg-lime-600 text-zinc-900">
            {isLoading ? <Loader2 className="animate-spin" /> : <PlusCircle className="w-4 h-4 mr-2" />}
            Añadir
          </Button>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white">Administradores Actuales</h3>
        <ul className="mt-2 space-y-2">
          {admins.map((admin) => (
            <li key={admin.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-md border border-zinc-700">
              <div className="font-mono text-sm text-gray-300">{admin.walletAddress}</div>
              {/* Verificación de seguridad en la UI: no mostrar el botón de borrar para el Super Admin */}
              {admin.walletAddress.toLowerCase() !== SUPER_ADMIN_WALLET && (
                <Button variant="destructive" size="sm" onClick={() => handleDeleteAdmin(admin.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}