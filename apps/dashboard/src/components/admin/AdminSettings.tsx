"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@saasfly/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, PlusCircle, Loader2, Pencil } from "lucide-react";
import { SUPER_ADMIN_WALLET } from "@/lib/constants";

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

export function AdminSettings({ initialAdmins }: AdminSettingsProps) {
  // Get wallet address from localStorage (same as dashboard page)
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const sessionData = localStorage.getItem('wallet-session');
        console.log('🔍 AdminSettings: wallet-session data:', sessionData);
        if (sessionData) {
          const parsedSession = JSON.parse(sessionData) as { address?: string };
          const address = parsedSession.address?.toLowerCase() ?? null;
          console.log('🔍 AdminSettings: parsed wallet address:', address);
          setWalletAddress(address);
        } else {
          console.log('🔍 AdminSettings: no wallet-session data found');
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

    // Debug logging for super admin filtering
    if (!isValid) {
      console.log('🔍 AdminSettings: Filtering out admin:', {
        id: admin.id,
        walletAddr: walletAddr,
        isSuperAdmin: walletAddr.toLowerCase() === SUPER_ADMIN_WALLET.toLowerCase(),
        reason: admin.id === 999 ? 'id: 999' :
                walletAddr.toLowerCase() === SUPER_ADMIN_WALLET.toLowerCase() ? 'super admin wallet' :
                'invalid wallet'
      });
    }

    return isValid;
  });
  const [admins, setAdmins] = useState<Admin[]>(validAdmins);
  const [newAddress, setNewAddress] = useState("");
  const [newAlias, setNewAlias] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingAliasId, setEditingAliasId] = useState<number | null>(null);
  const [editingAliasValue, setEditingAliasValue] = useState("");

  const handleAddAdmin = async () => {
    console.log('🔍 AdminSettings: handleAddAdmin called, walletAddress:', walletAddress);

    if (!/^0x[a-fA-F0-9]{40}$/.test(newAddress)) {
      toast.error("Por favor, introduce una dirección de wallet válida.");
      return;
    }

    if (!walletAddress) {
      console.log('❌ AdminSettings: No wallet address available');
      toast.error("No se pudo obtener la dirección de tu wallet. Conecta tu wallet primero.");
      return;
    }

    console.log('✅ AdminSettings: Making API call with wallet address:', walletAddress);
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
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-semibold text-white">{admin.alias ?? 'Sin alias'}</div>
                      <div className="font-mono text-xs text-gray-400 truncate max-w-xs">{getWalletAddress(admin)}</div>
                    </div>
                    {editingAliasId === admin.id ? (
                      <div className="flex items-center gap-2 ml-auto">
                        <Input
                          type="text"
                          value={editingAliasValue}
                          onChange={(e) => setEditingAliasValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleUpdateAlias()}
                          className="w-32 h-8 text-sm bg-zinc-700 border-zinc-600"
                          placeholder="Alias..."
                          maxLength={100}
                        />
                        <Button size="sm" variant="outline" onClick={handleUpdateAlias} className="h-8 px-2">
                          ✓
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancelEditAlias} className="h-8 px-2 text-gray-400">
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartEditAlias(admin)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                        title="Editar alias"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                {/* Verificación de seguridad en la UI: no mostrar el botón de borrar para el Super Admin */}
                {getWalletAddress(admin).toLowerCase() !== SUPER_ADMIN_WALLET && (
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteAdmin(admin.id)} className="ml-2">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
