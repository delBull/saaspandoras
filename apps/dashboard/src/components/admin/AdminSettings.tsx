"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@saasfly/ui/input";
import { Button } from "@/components/ui/button";

import {
  Trash2,
  PlusCircle,
  Loader2,
  Pencil,
  Activity,
  Power,
  Building2,
  Users,
  Key,
  Settings,
  Info,
  MessageCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  PieChart,
  Landmark,
  Target,
  TrendingUp
} from "lucide-react";
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
  const [showGuideModal, setShowGuideModal] = useState(false);


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
      {/* --- AGORA ARCHITECTURE GUIDE SECTION --- */}
      <div className="border-t-2 border-zinc-700/50 pt-8 mt-8">
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Landmark className="w-6 h-6 text-lime-400" />
              <div>
                <h3 className="text-xl font-bold text-white">AGORA Infrastructure Guide</h3>
                <p className="text-sm text-gray-400">Transfer of Power: Understanding the Engine Rules</p>
              </div>
            </div>
            <Button
              onClick={() => setShowGuideModal(true)}
              className="bg-zinc-800 hover:bg-zinc-700 text-white flex items-center gap-2"
            >
              <HelpCircle className="w-4 h-4" />
              Visual Guide
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-800 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-lime-400" />
                Treasury Policy
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Define secondary buyback rules and capital allocation.
              </p>
              <div className="pt-2">
                <label htmlFor="buyback-ratio" className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Buyback Allocation Ratio (%)</label>
                <div className="flex gap-2">
                  <Input
                    id="buyback-ratio"
                    type="number"
                    step="0.05"
                    min="0"
                    max="1.0"
                    placeholder="1.0 (100%)"
                    className="bg-zinc-900 border-zinc-700 h-8 text-xs text-lime-400"
                    defaultValue="1.0"
                  />
                  <Button size="sm" className="h-8 text-[10px] bg-zinc-700 hover:bg-zinc-600">Save</Button>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Recommended: 0.2-0.5 for stability.</p>
              </div>
            </div>
            <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-800">
              <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-lime-400" />
                Settlement Guard
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Rules-based atomic trades. No AMM slippage. ROFR intervenes when market price drops below NAV baseline.
              </p>
            </div>
            <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-800">
              <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-lime-400" />
                Timelock Discipline
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Parameter changes (Fees, Ratios) are delayed by 6-72 hours. This prevents "flash-adjustment" attacks.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- ARCHITECTURE GUIDE MODAL --- */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Landmark className="w-8 h-8 text-lime-400" />
                  AGORA Architecture: Visual Flow
                </h2>
                <Button variant="ghost" onClick={() => setShowGuideModal(false)} className="text-gray-400 hover:text-white">✕</Button>
              </div>

              <div className="space-y-12">
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 py-8">
                  <div className="flex flex-col items-center gap-4 text-center group">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center group-hover:border-lime-400 transition-colors">
                      <Users className="w-8 h-8 text-lime-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">LISTING</div>
                      <div className="text-[10px] text-gray-500 uppercase">Input</div>
                    </div>
                  </div>
                  <ArrowRight className="hidden md:block w-6 h-6 text-zinc-700" />
                  <div className="flex flex-col items-center gap-4 text-center group">
                    <div className="w-20 h-20 rounded-2xl bg-zinc-800 border-2 border-lime-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(163,230,53,0.1)] group-hover:border-lime-400 transition-colors">
                      <Settings className="w-10 h-10 text-lime-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white uppercase">Settlement Engine</div>
                      <div className="text-[10px] text-gray-500 uppercase">Atomic Validation</div>
                    </div>
                  </div>
                  <ArrowRight className="hidden md:block w-6 h-6 text-zinc-700" />
                  <div className="flex flex-col items-center gap-4 text-center group">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center group-hover:border-lime-400 transition-colors">
                      <Building2 className="w-8 h-8 text-lime-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white uppercase">Treasury / NAV</div>
                      <div className="text-[10px] text-gray-500 uppercase">Stability</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-zinc-950/50 rounded-xl p-6 border border-zinc-800">
                  <div className="space-y-4">
                    <h5 className="text-lime-400 font-bold text-sm uppercase tracking-widest">Economic Logic</h5>
                    <ul className="space-y-4">
                      <li className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-lime-400 shrink-0">1</div>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          <strong>NAV Calculation:</strong> Net Asset Value = Treasury / Supply. This is the "Truth" price of the platform.
                        </p>
                      </li>
                      <li className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-lime-400 shrink-0">2</div>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          <strong>Buyback (ROFR):</strong> If a Listing price is &lt; NAV, the protocol can exercise its Right of First Refusal to stabilize the market.
                        </p>
                      </li>
                      <li className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-lime-400 shrink-0">3</div>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          <strong>Early Exit:</strong> Users can sell back directly to Treasury, but pay a penalty (default 15%) to discourage bank runs.
                        </p>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h5 className="text-red-400 font-bold text-sm uppercase tracking-widest">Operational Safety</h5>
                    <div className="space-y-4">
                      <div className="p-4 bg-red-950/10 border border-red-900/20 rounded-lg">
                        <div className="text-xs font-bold text-red-400 mb-1">GLOBAL KILL-SWITCH</div>
                        <p className="text-[11px] text-gray-400">
                          Immmediate pause. Bypasses 6h delay. Use ONLY in case of exploit or extreme volatility.
                        </p>
                      </div>
                      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <div className="text-xs font-bold text-white mb-1">LOCK ORDERING</div>
                        <p className="text-[11px] text-gray-400">
                          To prevent deadlocks, the engine always locks artifacts in strict order: [Listing] then [Artifact].
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-lime-400/5 border border-lime-400/20 rounded-xl p-6">
                  <h5 className="text-lime-400 font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Strategic Roadmap: Policy Transition
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        PHASE 1: FUNDING (Initial)
                      </div>
                      <p className="text-[11px] text-gray-400 pl-4 border-l border-zinc-800">
                        Buyback Ratio is 0%. The protocol focuses on treasury growth. Market operates within bands but without protocol intervention.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                        PHASE 2: DEFENSE (Active)
                      </div>
                      <p className="text-[11px] text-gray-400 pl-4 border-l border-zinc-800">
                        Governance increases Ratio &gt; 0%. ROFR becomes active. Protocol automatedly defends the floor based on NAV.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500 italic">
                    "AGORA is not just a marketplace; it is an economic buffer system designed to protect long-term value."
                  </p>
                </div>
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => setShowGuideModal(false)}
                    className="bg-lime-500 hover:bg-lime-600 text-zinc-900 font-bold px-8"
                  >
                    Understood
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <div className="mt-4 p-4 bg-zinc-900/80 rounded border border-red-900/30 mb-4">
                <h4 className="text-sm font-bold text-red-400 flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4" />
                  Institutional Emergency Playbook
                </h4>
                <ul className="text-xs text-gray-400 space-y-2 list-disc pl-4">
                  <li><strong>Market Exploit:</strong> Activate Global Pause immediately. It bypasses governance delays.</li>
                  <li><strong>Oracle Failure:</strong> If NAV drifts unexpectedly, pause relevant protocol configs.</li>
                  <li><strong>Liquidity Crunch:</strong> Check Buyback Pools; if empty, settlements will fail automatically.</li>
                  <li><strong>Reactivation:</strong> Settlement unpausing ALWAYS requires a 6h Governance Delay.</li>
                </ul>
              </div>
              <div className="flex gap-2 text-xs text-yellow-400">
                <span>🔒 Super Admin Only</span>
                <span>•</span>
                <span>⚠️ High Risk Area</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                href="/admin/operations"
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-lg"
              >
                <Settings className="w-4 h-4" />
                Monitor Systems
              </Link>
              <Button
                onClick={async () => {
                  if (confirm("⚠️ CRITICAL ACTION: Are you sure you want to PAUSE ALL Agora protocols? This will stop all settlements globally.")) {
                    try {
                      const res = await fetch("/api/v1/admin/agora/emergency/pause-all", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ confirmed: true })
                      });
                      const data = await res.json();
                      if (data.success) toast.success(data.message);
                      else toast.error(data.error);
                    } catch (e) {
                      toast.error("Failed to activate kill-switch");
                    }
                  }
                }}
                className="px-6 py-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg hover:shadow-red-600/50 uppercase tracking-wider"
              >
                <Power className="w-5 h-5 fill-white" />
                Global Kill-Switch
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* --- TELEGRAM BRIDGE CONTROL LINK --- */}
      <div className="border-t-2 border-zinc-700/50 pt-8 mt-8">
        <div className="bg-gradient-to-r from-blue-950/20 to-indigo-950/20 border-2 border-blue-900/50 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                <MessageCircle className="w-6 h-6 text-blue-400" />
                Telegram Bridge Control
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Kill-switches, economy config, observabilidad y playbooks del Telegram bridge.
              </p>
              <div className="flex gap-2 text-xs text-yellow-400">
                <span>🔒 Super Admin Only</span>
                <span>•</span>
                <span>💬 Telegram Integration</span>
              </div>
            </div>
            <Link
              href="/admin/telegram-bridge"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-lg hover:shadow-blue-900/50"
            >
              <MessageCircle className="w-4 h-4" />
              Open Bridge Control
            </Link>
          </div>
        </div>
      </div>

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
                className={`p-4 rounded-lg border ${tenant.isActive
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
                  onChange={(e) => setSelectedTenant({ ...selectedTenant, name: e.target.value })}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>

              <div>
                <label htmlFor="tenant-description" className="text-sm text-gray-400 block mb-1">Descripción</label>
                <Input
                  id="tenant-description"
                  value={selectedTenant.description || ""}
                  onChange={(e) => setSelectedTenant({ ...selectedTenant, description: e.target.value })}
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
                  onChange={(e) => setEditConfig({ ...editConfig, nftContracts: e.target.value })}
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
                  onChange={(e) => setEditConfig({ ...editConfig, requiredRoles: e.target.value })}
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
                  onChange={(e) => setEditConfig({ ...editConfig, whitelistedAddresses: e.target.value })}
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

