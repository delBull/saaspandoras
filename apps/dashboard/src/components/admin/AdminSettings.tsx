"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@saasfly/ui/input";
import { Button } from "@/components/ui/button";

import { Trash2, PlusCircle, Loader2, Pencil, Activity, Power } from "lucide-react";
import { SUPER_ADMIN_WALLET } from "@/lib/constants";
import Link from "next/link";

interface Admin {
  id: number;
  walletAddress?: string;
  wallet_address?: string;
  alias?: string | null;
  role: string;
}

interface AdminSettingsProps {
  initialAdmins: Admin[];
}

// Helper function to get wallet address safely
const getWalletAddress = (admin: Admin): string => {
  return admin.walletAddress ?? admin.wallet_address ?? 'N/A';
};

// Helper function to truncate wallet addresses for mobile
const truncateWallet = (address: string, length = 6) => {
  if (address.length <= 2 * length + 2) return address;
  return `${address.slice(0, length)}...${address.slice(-length)}`;
};

export function AdminSettings({ initialAdmins }: AdminSettingsProps) {
  // Get wallet address from localStorage (same as dashboard page)
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const sessionData = localStorage.getItem('wallet-session');
        if (sessionData) {
          const parsedSession = JSON.parse(sessionData) as { address?: string };
          const address = parsedSession.address?.toLowerCase() ?? null;
          setWalletAddress(address);
        }
      } catch (e) {
        console.warn('Error getting wallet address for AdminSettings:', e);
      }
    }
  }, []);

  // Filter out admins without wallet address and system admins (id: 999 or super admin wallet)
  const validAdmins = initialAdmins.filter(admin => {
    const walletAddr = getWalletAddress(admin);
    const isValid = walletAddr !== 'N/A' &&
      admin.id !== 999 &&
      walletAddr.toLowerCase() !== SUPER_ADMIN_WALLET.toLowerCase();
    return isValid;
  });

  const [admins, setAdmins] = useState<Admin[]>(validAdmins);
  const [newAddress, setNewAddress] = useState("");
  const [newAlias, setNewAlias] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingAliasId, setEditingAliasId] = useState<number | null>(null);
  const [editingAliasValue, setEditingAliasValue] = useState("");



  const handleAddAdmin = async () => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(newAddress)) {
      toast.error("Por favor, introduce una dirección de wallet válida.");
      return;
    }

    if (!walletAddress) {
      toast.error("No se pudo obtener la dirección de tu wallet. Conecta tu wallet primero.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/administrators", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'x-thirdweb-address': walletAddress,
          'x-wallet-address': walletAddress,
          'x-user-address': walletAddress,
        },
        body: JSON.stringify({ walletAddress: newAddress, alias: newAlias.trim() || null }),
      });

      if (!response.ok) {
        const errorData = await response.json() as { message?: string };
        throw new Error(errorData.message ?? "No se pudo añadir el administrador.");
      }

      const newAdmin = await response.json() as Admin;
      setAdmins([...admins, newAdmin]);
      setNewAddress("");
      setNewAlias("");
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

    if (!walletAddress) {
      toast.error("No se pudo obtener la dirección de tu wallet. Conecta tu wallet primero.");
      return;
    }

    try {
      const response = await fetch(`/api/admin/administrators/${id.toString()}`, {
        method: "DELETE",
        headers: {
          'x-thirdweb-address': walletAddress,
          'x-wallet-address': walletAddress,
          'x-user-address': walletAddress,
        },
      });

      if (!response.ok) {
        const errorData = await response.json() as { message?: string };
        throw new Error(errorData.message ?? "No se pudo eliminar el administrador.");
      }

      setAdmins(admins.filter(admin => admin.id !== id));
      toast.success("Administrador eliminado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error.");
    }
  };

  const handleStartEditAlias = (admin: Admin) => {
    setEditingAliasId(admin.id);
    setEditingAliasValue(admin.alias ?? "");
  };

  const handleCancelEditAlias = () => {
    setEditingAliasId(null);
    setEditingAliasValue("");
  };

  const handleUpdateAlias = async () => {
    if (editingAliasId === null) return;

    if (!walletAddress) {
      toast.error("No se pudo obtener la dirección de tu wallet. Conecta tu wallet primero.");
      return;
    }

    try {
      const response = await fetch(`/api/admin/administrators/${editingAliasId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          'x-thirdweb-address': walletAddress,
          'x-wallet-address': walletAddress,
          'x-user-address': walletAddress,
        },
        body: JSON.stringify({ alias: editingAliasValue.trim() || null }),
      });

      if (!response.ok) {
        const errorData = await response.json() as { message?: string };
        throw new Error(errorData.message ?? "No se pudo actualizar el alias.");
      }

      const updatedAdmin = await response.json() as Admin;
      setAdmins(admins.map(admin => admin.id === editingAliasId ? updatedAdmin : admin));
      toast.success("Alias actualizado.");
      handleCancelEditAlias();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error.");
    }
  };

  return (
    <div className="space-y-8">
      {/* --- ADMIN MANAGEMENT SECTION --- */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Añadir Nuevo Administrador</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
            <Input
              type="text"
              placeholder="Dirección de Wallet (0x...)"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="bg-zinc-800 border-zinc-700 sm:col-span-1"
            />
            <Input
              type="text"
              placeholder="Alias (opcional)"
              value={newAlias}
              onChange={(e) => setNewAlias(e.target.value)}
              className="bg-zinc-800 border-zinc-700 sm:col-span-1"
              maxLength={100}
            />
            <Button onClick={handleAddAdmin} disabled={isLoading} className="bg-lime-500 hover:bg-lime-600 text-zinc-900 sm:col-span-1">
              {isLoading ? <Loader2 className="animate-spin" /> : <PlusCircle className="w-4 h-4 mr-2" />}
              Añadir
            </Button>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Administradores Actuales</h3>
          <ul className="mt-2 space-y-2">
            {admins.map((admin) => (
              <li key={admin.id} className="p-3 bg-zinc-800/50 rounded-md border border-zinc-700">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-white truncate">{admin.alias ?? 'Sin alias'}</div>
                        <div className="font-mono text-xs text-gray-400 truncate">
                          {truncateWallet(getWalletAddress(admin), 6)}
                        </div>
                      </div>
                      {editingAliasId === admin.id ? (
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          <Input
                            type="text"
                            value={editingAliasValue}
                            onChange={(e) => setEditingAliasValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateAlias()}
                            className="w-24 sm:w-32 h-8 text-xs sm:text-sm bg-zinc-700 border-zinc-600"
                            placeholder="Alias..."
                            maxLength={100}
                          />
                          <Button size="sm" variant="outline" onClick={handleUpdateAlias} className="h-8 px-1 sm:px-2">
                            ✓
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleCancelEditAlias} className="h-8 px-1 sm:px-2 text-gray-400">
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartEditAlias(admin)}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-white flex-shrink-0"
                          title="Editar alias"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {/* Verificación de seguridad en la UI: no mostrar el botón de borrar para el Super Admin */}
                  {getWalletAddress(admin).toLowerCase() !== SUPER_ADMIN_WALLET && (
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteAdmin(admin.id)} className="flex-shrink-0 px-2 sm:px-3 text-xs sm:text-sm">
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-0" />
                      <span className="hidden sm:inline">Borrar</span>
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* --- OPERATIONS CONTROL LINK --- */}
      <div className="border-t-2 border-zinc-700/50 pt-8 mt-8">
        <div className="bg-gradient-to-r from-red-950/20 to-orange-950/20 border-2 border-red-900/50 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                <Activity className="w-6 h-6 text-red-400" />
                Operations Control
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Emergency controls, system monitoring, and infrastructure management.
              </p>
              <div className="flex gap-2 text-xs text-yellow-400">
                <span>🔒 Super Admin Only</span>
                <span>•</span>
                <span>⚠️ High Risk Area</span>
              </div>
            </div>
            <Link
              href="/admin/operations"
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-lg hover:shadow-red-900/50"
            >
              <Power className="w-4 h-4" />
              Access Operations
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
