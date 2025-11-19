"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Users, MessageSquare, Download, Filter, RefreshCw } from "lucide-react";

interface WhatsAppLead {
  id: number;
  user_phone: string;
  step: number;
  status: string;
  answers: Record<string, any>;
  applicant_name: string;
  applicant_email: string;
  created_at: string;
  updated_at: string;
}

interface LeadsStats {
  total: number;
  pending: number;
  approved: number;
  completed: number;
}

export default function WhatsAppLeadsTab() {
  const [leads, setLeads] = useState<WhatsAppLead[]>([]);
  const [stats, setStats] = useState<LeadsStats>({ total: 0, pending: 0, approved: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [updatingLeadId, setUpdatingLeadId] = useState<number | null>(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/whatsapp-preapply');
      const data = await response.json();
      setLeads(data.leads || []);
      setStats({
        total: data.total || 0,
        pending: data.pending || 0,
        approved: data.approved || 0,
        completed: data.completed || 0,
      });
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: number, newStatus: string) => {
    try {
      setUpdatingLeadId(leadId);
      const response = await fetch(`/api/admin/whatsapp-preapply/${leadId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Refresh leads data
        fetchLeads();
      } else {
        console.error('Failed to update lead status');
        alert('Error al actualizar el status del lead');
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
      alert('Error de conexión al actualizar lead');
    } finally {
      setUpdatingLeadId(null);
    }
  };

  const exportToCSV = () => {
    const csvHeaders = ['ID', 'Teléfono', 'Nombre', 'Email', 'Status', 'Paso', 'Fecha Creación', 'Último Update'];
    const csvData = leads.map(lead => [
      lead.id,
      lead.user_phone,
      lead.applicant_name || '',
      lead.applicant_email || '',
      lead.status,
      lead.step,
      new Date(lead.created_at).toLocaleString(),
      new Date(lead.updated_at).toLocaleString(),
    ]);

    const csvContent = [csvHeaders, ...csvData].map(row =>
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `whatsapp-leads-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400';
      case 'rejected': return 'text-red-400';
      case 'pending': return 'text-yellow-400';
      case 'completed': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'completed': return <MessageSquare className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (filter === "all") return true;
    return lead.status === filter;
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  return (
    <div className="space-y-6">
      {/* Estadísticas Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-400">{stats.total}</p>
              <p className="text-xs text-zinc-400">Total Leads</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
              <p className="text-xs text-zinc-400">Pendientes</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
              <p className="text-xs text-zinc-400">Aprobados</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <MessageSquare className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-400">{stats.completed}</p>
              <p className="text-xs text-zinc-400">Completados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <button
            onClick={fetchLeads}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:border-blue-500 outline-none"
            >
              <option value="all">Todos los Status</option>
              <option value="pending">Pendientes</option>
              <option value="approved">Aprobados</option>
              <option value="completed">Completados</option>
              <option value="rejected">Rechazados</option>
            </select>
          </div>
        </div>

        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Leads Table */}
      <div className="bg-zinc-800/30 border border-zinc-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-300">ID</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-300">Teléfono</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-300">Nombre</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-300">Email</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-300">Status</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-300">Paso</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-300">Fecha</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-300">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-zinc-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Cargando leads...
                    </div>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-zinc-400">
                    {filter === "all" ? "No hay leads aún" : `No hay leads con status "${filter}"`}
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3 text-zinc-300 font-mono">{lead.id}</td>
                    <td className="px-4 py-3 text-zinc-300">
                      {lead.user_phone ?
                        lead.user_phone.replace(/^(\+\d{2})\d+(\d{4})$/, '$1****$2') :
                        '-'}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {lead.applicant_name || "-"}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {lead.applicant_email || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className={`flex items-center gap-2 ${getStatusColor(lead.status)}`}>
                        {getStatusIcon(lead.status)}
                        {lead.status}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {lead.step}/8
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {lead.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateLeadStatus(lead.id, 'approved')}
                              disabled={updatingLeadId === lead.id}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors disabled:opacity-50"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => updateLeadStatus(lead.id, 'rejected')}
                              disabled={updatingLeadId === lead.id}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors disabled:opacity-50"
                            >
                              Rechazar
                            </button>
                          </>
                        )}

                        {lead.status === 'approved' && (
                          <button
                            onClick={() => updateLeadStatus(lead.id, 'completed')}
                            disabled={updatingLeadId === lead.id}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors disabled:opacity-50"
                          >
                            Completar
                          </button>
                        )}

                        {lead.status === 'completed' && (
                          <span className="px-3 py-1 bg-gray-600 text-white text-xs rounded">
                            Finalizado
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Footer */}
      <div className="text-xs text-zinc-500 bg-zinc-800/30 border border-zinc-700 rounded-lg p-3">
        <p><strong>📱 WhatsApp Leads:</strong> Leads filtered by 8 critical questions → Protocol validation → Ready for application form</p>
      </div>
    </div>
  );
}
