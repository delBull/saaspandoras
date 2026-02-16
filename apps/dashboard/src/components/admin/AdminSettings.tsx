"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@saasfly/ui/input";
import { Button } from "@/components/ui/button";

import { Trash2, PlusCircle, Loader2, Pencil, Activity, Power, Building2, Users, Key, Settings, Info } from "lucide-react";
import { SUPER_ADMIN_WALLET } from "@/lib/constants";
import Link from "next/link";

interface Admin {
  id: number;
  walletAddress?: string;
  wallet_address?: string;
  alias?: string | null;
  role: string;
}

interface Tenant {
  id: string;
  name: string;
  description: string | null;
  config: {
    nftContracts: Array<{ address: string; chainId: number; minBalance: number }>;
    minTokenBalance: string;
    requiredRoles: string[];
    whitelistedAddresses: string[];
  };
  isActive: boolean;
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

      {/* --- MULTI-TENANT CONFIGURATION SECTION --- */}
      <MultiTenantSection />
    </div>
  );
}

// ============================================
// INFO TOOLTIP COMPONENT
// ============================================
function InfoTooltip({ content }: { content: string }) {
  const [show, setShow] = useState(false);
  
  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="ml-1 w-4 h-4 rounded-full bg-zinc-600 hover:bg-zinc-500 text-white text-xs flex items-center justify-center"
      >
        i
      </button>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-zinc-800 border border-zinc-600 rounded-lg text-xs text-gray-300 shadow-xl">
          {content}
        </div>
      )}
    </div>
  );
}

// ============================================
// MULTI-TENANT CONFIGURATION COMPONENT
// ============================================
function MultiTenantSection() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  
  // Form state for new tenant
  const [newTenantId, setNewTenantId] = useState("");
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantDescription, setNewTenantDescription] = useState("");
  const [tenantSearchQuery, setTenantSearchQuery] = useState("");
  const [showTenantSuggestions, setShowTenantSuggestions] = useState(false);
  
  // Filtered tenants based on search
  const filteredTenants = tenants.filter(t => 
    t.id.toLowerCase().includes(tenantSearchQuery.toLowerCase()) ||
    t.name.toLowerCase().includes(tenantSearchQuery.toLowerCase())
  );
  
  // Handle selecting a tenant from the list
  const handleSelectTenant = (tenant: Tenant) => {
    setNewTenantId(tenant.id);
    setNewTenantName(tenant.name);
    setNewTenantDescription(tenant.description || "");
    setTenantSearchQuery(tenant.name);
    setShowTenantSuggestions(false);
  };
  
  // Handle typing in the search field
  const handleTenantSearchChange = (value: string) => {
    setTenantSearchQuery(value);
    setShowTenantSuggestions(true);
    // Also update the form fields if we find a match
    const matchedTenant = tenants.find(t => t.id === value || t.name.toLowerCase() === value.toLowerCase());
    if (matchedTenant) {
      setNewTenantId(matchedTenant.id);
      setNewTenantName(matchedTenant.name);
      setNewTenantDescription(matchedTenant.description || "");
    } else {
      // It's a new tenant, keep the ID from input
      setNewTenantId(value.toLowerCase().replace(/\s+/g, '-'));
    }
  };
  
  // Form state for editing
  const [editConfig, setEditConfig] = useState<{
    nftContracts: string;
    requiredRoles: string;
    whitelistedAddresses: string;
  }>({
    nftContracts: "[]",
    requiredRoles: "[]",
    whitelistedAddresses: "[]"
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await fetch("/api/admin/tenants", {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTenants(data.tenants || []);
      }
    } catch (error) {
      console.error("Error fetching tenants:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTenant = async () => {
    if (!newTenantId || !newTenantName) {
      toast.error("Tenant ID y nombre son requeridos");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newTenantId.toLowerCase().replace(/\s+/g, '-'),
          name: newTenantName,
          description: newTenantDescription,
          config: {
            nftContracts: [],
            minTokenBalance: "0",
            requiredRoles: [],
            whitelistedAddresses: []
          }
        })
      });

      if (response.ok) {
        toast.success("Tenant creado exitosamente");
        fetchTenants();
        setNewTenantId("");
        setNewTenantName("");
        setNewTenantDescription("");
        setTenantSearchQuery("");
      } else {
        const err = await response.json();
        toast.error(err.message || "Error al crear tenant");
      }
    } catch (error) {
      toast.error("Error al crear tenant");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setEditConfig({
      nftContracts: JSON.stringify(tenant.config.nftContracts || [], null, 2),
      requiredRoles: JSON.stringify(tenant.config.requiredRoles || [], null, 2),
      whitelistedAddresses: JSON.stringify(tenant.config.whitelistedAddresses || [], null, 2)
    });
  };

  const handleSaveTenant = async () => {
    if (!selectedTenant) return;

    setIsSaving(true);
    try {
      let parsedNFTContracts = [];
      let parsedRoles = [];
      let parsedWhitelist = [];

      try {
        parsedNFTContracts = JSON.parse(editConfig.nftContracts);
        parsedRoles = JSON.parse(editConfig.requiredRoles);
        parsedWhitelist = JSON.parse(editConfig.whitelistedAddresses);
      } catch (e) {
        toast.error("JSON inválido en algunos campos");
        setIsSaving(false);
        return;
      }

      const response = await fetch(`/api/admin/tenants/${selectedTenant.id}`, {
        method: "PATCH",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedTenant.name,
          description: selectedTenant.description,
          config: {
            nftContracts: parsedNFTContracts,
            minTokenBalance: selectedTenant.config.minTokenBalance,
            requiredRoles: parsedRoles,
            whitelistedAddresses: parsedWhitelist
          },
          isActive: selectedTenant.isActive
        })
      });

      if (response.ok) {
        toast.success("Tenant actualizado");
        fetchTenants();
        setSelectedTenant(null);
      } else {
        toast.error("Error al actualizar tenant");
      }
    } catch (error) {
      toast.error("Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (tenant: Tenant) => {
    try {
      await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !tenant.isActive })
      });
      fetchTenants();
    } catch (error) {
      toast.error("Error al cambiar estado");
    }
  };

  if (isLoading) {
    return (
      <div className="border-t-2 border-zinc-700/50 pt-8 mt-8">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-lime-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="border-t-2 border-zinc-700/50 pt-8 mt-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Building2 className="w-6 h-6 text-lime-400" />
        <div>
          <h3 className="text-xl font-bold text-white">Multi-Tenant Configuration</h3>
          <p className="text-sm text-gray-400">Gestiona tenants, roles y reglas de acceso</p>
        </div>
      </div>

      {/* Create New Tenant Form with Autocomplete */}
      <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <PlusCircle className="w-4 h-4" />
          Crear Nuevo Tenant
          <InfoTooltip content="Un tenant representa una DAO, proyecto o comunidad separada. Cada tenant puede tener sus propias reglas de acceso basadas en NFTs, roles y direcciones whitelisteadas." />
        </h4>
        
        {/* Search/Select Existing or Create New */}
        <div className="relative mb-3">
          <label htmlFor="tenant-search" className="text-xs text-gray-400 block mb-1">Buscar tenant existente o crear nuevo</label>
          <Input
            id="tenant-search"
            placeholder="Escribe para buscar tenants existentes..."
            value={tenantSearchQuery}
            onChange={(e) => handleTenantSearchChange(e.target.value)}
            onFocus={() => setShowTenantSuggestions(true)}
            onBlur={() => setTimeout(() => setShowTenantSuggestions(false), 200)}
            className="bg-zinc-900 border-zinc-700"
          />
          {/* Autocomplete Suggestions */}
          {showTenantSuggestions && filteredTenants.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
              {filteredTenants.map((tenant) => (
                <button
                  key={tenant.id}
                  type="button"
                  onClick={() => handleSelectTenant(tenant)}
                  className="w-full px-3 py-2 text-left hover:bg-zinc-700 flex items-center justify-between border-b border-zinc-700 last:border-0"
                >
                  <div>
                    <span className="text-white font-medium">{tenant.name}</span>
                    <span className="text-gray-400 text-xs ml-2">({tenant.id})</span>
                  </div>
                  <span className={`text-xs ${tenant.isActive ? 'text-lime-400' : 'text-gray-500'}`}>
                    {tenant.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Tenant Details */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Input
              placeholder="Tenant ID (ej: mi-dao)"
              value={newTenantId}
              onChange={(e) => setNewTenantId(e.target.value)}
              className="bg-zinc-900 border-zinc-700"
            />
            <p className="text-xs text-gray-500 mt-1">ID único (sin espacios)</p>
          </div>
          <Input
            placeholder="Nombre del Tenant"
            value={newTenantName}
            onChange={(e) => setNewTenantName(e.target.value)}
            className="bg-zinc-900 border-zinc-700"
          />
          <Input
            placeholder="Descripción (opcional)"
            value={newTenantDescription}
            onChange={(e) => setNewTenantDescription(e.target.value)}
            className="bg-zinc-900 border-zinc-700"
          />
          <Button 
            onClick={handleCreateTenant} 
            disabled={isSaving || !newTenantId || !newTenantName}
            className="bg-lime-500 hover:bg-lime-600 text-zinc-900 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear"}
          </Button>
        </div>
      </div>

      {/* Existing Tenants List */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-400">Tenants Existentes</h4>
        {tenants.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay tenants configurados</p>
        ) : (
          <div className="grid gap-3">
            {tenants.map((tenant) => (
              <div 
                key={tenant.id}
                className={`p-4 rounded-lg border ${
                  tenant.isActive 
                    ? "bg-zinc-800/50 border-zinc-700" 
                    : "bg-zinc-900/50 border-zinc-800 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${tenant.isActive ? "bg-lime-500" : "bg-gray-500"}`} />
                    <div>
                      <h5 className="font-semibold text-white">{tenant.name}</h5>
                      <p className="text-xs text-gray-400">{tenant.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditTenant(tenant)}
                      className="border-zinc-600 hover:bg-zinc-700"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={tenant.isActive ? "destructive" : "default"}
                      onClick={() => handleToggleActive(tenant)}
                      className={tenant.isActive ? "" : "bg-lime-500 hover:bg-lime-600"}
                    >
                      {tenant.isActive ? "Desactivar" : "Activar"}
                    </Button>
                  </div>
                </div>
                
                {/* Quick Info */}
                <div className="mt-3 flex gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Key className="w-3 h-3" />
                    {tenant.config.nftContracts?.length || 0} NFT contracts
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {tenant.config.requiredRoles?.length || 0} roles
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {tenant.config.whitelistedAddresses?.length || 0} whitelisted
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {selectedTenant && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Editar: {selectedTenant.name}</h3>
              <Button variant="ghost" onClick={() => setSelectedTenant(null)}>✕</Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="tenant-name" className="text-sm text-gray-400 block mb-1">Nombre</label>
                <Input
                  id="tenant-name"
                  value={selectedTenant.name}
                  onChange={(e) => setSelectedTenant({...selectedTenant, name: e.target.value})}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>

              <div>
                <label htmlFor="tenant-description" className="text-sm text-gray-400 block mb-1">Descripción</label>
                <Input
                  id="tenant-description"
                  value={selectedTenant.description || ""}
                  onChange={(e) => setSelectedTenant({...selectedTenant, description: e.target.value})}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>

              <div>
                <label htmlFor="nft-contracts" className="text-sm text-gray-400 flex items-center gap-1 mb-1">
                  NFT Contracts
                  <InfoTooltip content="Direcciones de contratos NFT que dan acceso. Formato: [{'address': '0x...', 'chainId': 11155111, 'minBalance': 1}]" />
                </label>
                <textarea
                  id="nft-contracts"
                  value={editConfig.nftContracts}
                  onChange={(e) => setEditConfig({...editConfig, nftContracts: e.target.value})}
                  className="w-full h-24 bg-zinc-800 border border-zinc-700 rounded p-2 text-sm font-mono text-lime-400"
                  aria-label="NFT Contracts JSON"
                  placeholder='[{"address": "0x...", "chainId": 11155111, "minBalance": 1}]'
                />
              </div>

              <div>
                <label htmlFor="required-roles" className="text-sm text-gray-400 flex items-center gap-1 mb-1">
                  Required Roles
                  <InfoTooltip content="Roles requeridos para acceder. Los usuarios con estos roles en la tabla tenant_users tendrán acceso automático." />
                </label>
                <textarea
                  id="required-roles"
                  value={editConfig.requiredRoles}
                  onChange={(e) => setEditConfig({...editConfig, requiredRoles: e.target.value})}
                  className="w-full h-20 bg-zinc-800 border border-zinc-700 rounded p-2 text-sm font-mono text-lime-400"
                  aria-label="Required Roles JSON"
                  placeholder='["admin", "member", "contributor"]'
                />
              </div>

              <div>
                <label htmlFor="whitelist-addresses" className="text-sm text-gray-400 flex items-center gap-1 mb-1">
                  Whitelisted Addresses
                  <InfoTooltip content="Direcciones de wallet que tendrán acceso sin importar NFTs o roles. Formato: ['0x1234...', '0xabcd...']" />
                </label>
                <textarea
                  id="whitelist-addresses"
                  value={editConfig.whitelistedAddresses}
                  onChange={(e) => setEditConfig({...editConfig, whitelistedAddresses: e.target.value})}
                  className="w-full h-20 bg-zinc-800 border border-zinc-700 rounded p-2 text-sm font-mono text-lime-400"
                  aria-label="Whitelisted Addresses JSON"
                  placeholder='["0x1234...", "0xabcd..."]'
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedTenant(null)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveTenant}
                  disabled={isSaving}
                  className="bg-lime-500 hover:bg-lime-600 text-zinc-900"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Cambios"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

