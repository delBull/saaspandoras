"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Users, MessageSquare, Download, Filter, RefreshCw } from "lucide-react";

interface WhatsAppLead {
  id: string; // UUID en el nuevo sistema
  user_phone: string;
  current_step?: number; // Cambiado de step a current_step
  status: string;
  applicant_name?: string; // Opcional en nuevo sistema
  applicant_email?: string; // Opcional en nuevo sistema
  created_at: string;
  updated_at: string;

  // Multi-Flow fields (nuevo sistema)
  flow_type?: string;
  priority_level?: string;
  session_id?: string;
  last_message?: string;
  session_started_at?: string; // Campo del nuevo sistema
}

interface MultiFlowStats {
  // Totales globales
  total: number;
  active: number;

  // Por flow type
  eight_q: {
    total: number;
    pending: number;
    approved: number;
    completed: number;
  };
  high_ticket: {
    total: number;
    scheduled: number;
    contacted: number;
  };
  utility: {
    total: number;
    pending: number;
    approved: number;
  };
  support: {
    total: number;
    escalated: number;
    resolved: number;
  };
  human: {
    total: number;
    active: number;
    resolved: number;
  };
  protocol_application?: {
    total: number;
    active: number;
    resolved?: number;
  };
}

export default function WhatsAppLeadsTab() {
  const [leads, setLeads] = useState<WhatsAppLead[]>([]);
  const [stats, setStats] = useState<MultiFlowStats>({
    total: 0,
    active: 0,
    eight_q: { total: 0, pending: 0, approved: 0, completed: 0 },
    high_ticket: { total: 0, scheduled: 0, contacted: 0 },
    utility: { total: 0, pending: 0, approved: 0 },
    support: { total: 0, escalated: 0, resolved: 0 },
    human: { total: 0, active: 0, resolved: 0 },
    protocol_application: { total: 0, active: 0, resolved: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [flowFilter, setFlowFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      // Nuevo endpoint multi-flow
      const response = await fetch('/api/admin/whatsapp/multi-flow');
      const data = await response.json();

      setLeads(data.leads || []);
      setStats(data.stats || stats);
    } catch (error) {
      console.error('Error fetching leads:', error);
      // Fallback al endpoint antiguo si falla el nuevo
      try {
        const fallbackResponse = await fetch('/api/admin/whatsapp-preapply');
        const fallbackData = await fallbackResponse.json();

        setLeads((fallbackData.leads || []).map((lead: any) => ({
          ...lead,
          flow_type: 'eight_q', // Mark as legacy eight_q
          priority_level: 'normal'
        })));

        setStats({
          total: fallbackData.total || 0,
          active: fallbackData.total || 0,
          eight_q: {
            total: fallbackData.total || 0,
            pending: fallbackData.pending || 0,
            approved: fallbackData.approved || 0,
            completed: fallbackData.completed || 0
          },
          high_ticket: { total: 0, scheduled: 0, contacted: 0 },
          utility: { total: 0, pending: 0, approved: 0 },
          support: { total: 0, escalated: 0, resolved: 0 },
          human: { total: 0, active: 0, resolved: 0 },
          protocol_application: { total: 0, active: 0, resolved: 0 }
        });
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      setUpdatingLeadId(leadId);
      const response = await fetch('/api/admin/whatsapp/multi-flow', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leadId, status: newStatus }),
      });

      if (response.ok) {
        // Refresh leads data
        fetchLeads();
        alert('Status actualizado correctamente');
      } else {
        const errorData = await response.json();
        console.error('Failed to update lead status:', errorData);
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
    const csvHeaders = ['ID', 'Teléfono', 'Nombre', 'Email', 'Status', 'Flujo', 'Prioridad', 'Paso', 'Último Mensaje', 'Fecha Creación', 'Último Update'];
    const csvData = leads.map(lead => [
      lead.id,
      lead.user_phone,
      lead.applicant_name || '',
      lead.applicant_email || '',
      lead.status,
      lead.flow_type || 'unknown',
      lead.priority_level || 'normal',
      lead.current_step || 0,
      lead.last_message || '',
      new Date(lead.created_at).toLocaleString(),
      new Date(lead.updated_at).toLocaleString(),
    ]);

    const csvContent = [csvHeaders, ...csvData].map(row =>
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `whatsapp-multi-flow-leads-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getFlowColor = (flowType?: string) => {
    switch (flowType) {
      case 'eight_q': return 'bg-cyan-500';
      case 'high_ticket': return 'bg-yellow-500';
      case 'utility': return 'bg-green-500';
      case 'support': return 'bg-red-500';
      case 'human': return 'bg-blue-500';
      case 'protocol_application': return 'bg-violet-500';
      case 'creator': return 'bg-indigo-500'; // New Creator Flow
      default: return 'bg-gray-500';
    }
  };

  const getFlowIcon = (flowType?: string) => {
    switch (flowType) {
      case 'eight_q': return '🔢';
      case 'high_ticket': return '💎';
      case 'utility': return '🚀';
      case 'support': return '🆘';
      case 'human': return '👨‍💼';
      case 'protocol_application': return '📜';
      case 'creator': return '🎨'; // New Creator Flow
      default: return '💬';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 border-red-400/20';
      case 'normal': return 'text-blue-400 border-blue-400/20';
      case 'support': return 'text-purple-400 border-purple-400/20';
      default: return 'text-gray-400 border-gray-400/20';
    }
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
    // Status filter
    const statusMatch = statusFilter === "all" || lead.status === statusFilter;

    // Flow filter
    const flowMatch = flowFilter === "all" || lead.flow_type === flowFilter;

    // Priority filter
    const priorityMatch = priorityFilter === "all" || lead.priority_level === priorityFilter;

    return statusMatch && flowMatch && priorityMatch;
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  return (
    <div className="space-y-6">
      {/* Estadísticas Multi-Flow Dashboard */}
      <div className="space-y-4">
        {/* Global Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">{stats.total}</p>
                <p className="text-xs text-zinc-400">Total Conversaciones</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-400">{stats.active}</p>
                <p className="text-xs text-zinc-400">Conversaciones Activas</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <Users className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-cyan-400">{stats.eight_q.total}</p>
                <p className="text-xs text-zinc-400">Flujo 8 Preguntas</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <MessageSquare className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">{stats.support.total + stats.human.total}</p>
                <p className="text-xs text-zinc-400">Soporte/Asistencia</p>
              </div>
            </div>
          </div>
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <MessageSquare className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">{stats.support.total + stats.human.total}</p>
                <p className="text-xs text-zinc-400">Soporte/Asistencia</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-500/20 rounded-lg">
                <Users className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-violet-400">{stats.protocol_application?.total || 0}</p>
                <p className="text-xs text-zinc-400">Protocol Leads</p>
              </div>
            </div>
          </div>
        </div>

        {/* Flow-specific Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
            <div className="text-center">
              <p className="text-lg font-bold text-green-400">{stats.eight_q.approved}</p>
              <p className="text-xs text-zinc-400">Eight_Q Aprobados</p>
            </div>
          </div>

          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
            <div className="text-center">
              <p className="text-lg font-bold text-yellow-400">{stats.high_ticket.total}</p>
              <p className="text-xs text-zinc-400">High Ticket</p>
            </div>
          </div>

          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
            <div className="text-center">
              <p className="text-lg font-bold text-red-400">{stats.support.escalated}</p>
              <p className="text-xs text-zinc-400">Soporte Escalado</p>
            </div>
          </div>

          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
            <div className="text-center">
              <p className="text-lg font-bold text-blue-400">{stats.human.active}</p>
              <p className="text-xs text-zinc-400">Agentes Activos</p>
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

          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-400" />

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:border-blue-500 outline-none"
            >
              <option value="all">Todos Status</option>
              <option value="pending">Pendientes</option>
              <option value="approved">Aprobados</option>
              <option value="completed">Completados</option>
              <option value="rejected">Rechazados</option>
            </select>

            {/* Flow Type Filter */}
            <select
              value={flowFilter}
              onChange={(e) => setFlowFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:border-blue-500 outline-none"
            >
              <option value="all">Todos Flujos</option>
              <option value="eight_q">8 Preguntas</option>
              <option value="high_ticket">High Ticket</option>
              <option value="utility">Utility</option>
              <option value="support">Soporte</option>
              <option value="human">Agentes</option>
              <option value="protocol_application">Protocol App</option>
              <option value="creator">Creator (Start)</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:border-blue-500 outline-none"
            >
              <option value="all">Todas Prioridades</option>
              <option value="high">Alta</option>
              <option value="normal">Normal</option>
              <option value="support">Soporte</option>
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
                <th className="px-4 py-3 text-left font-medium text-zinc-300">Flujo</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-300">Status</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-300">Prioridad</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-300">Paso</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-300">Último Mensaje</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-300">Fecha</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-300">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-zinc-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Cargando leads multi-flow...
                    </div>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-zinc-400">
                    {(
                      statusFilter === "all" &&
                      flowFilter === "all" &&
                      priorityFilter === "all"
                    ) ? "No hay leads aún" : "No hay leads que coincidan con los filtros"}
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
                      <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs border ${getPriorityColor(lead.priority_level)}`}>
                        <div className={`w-2 h-2 rounded-full ${getFlowColor(lead.flow_type)}`}></div>
                        <span>{lead.flow_type || 'unknown'}</span>
                        <span className="font-semibold">{getFlowIcon(lead.flow_type)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`flex items-center gap-2 ${getStatusColor(lead.status)}`}>
                        {getStatusIcon(lead.status)}
                        <span className="capitalize">{lead.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs border ${getPriorityColor(lead.priority_level)}`}>
                        <span className="capitalize">{lead.priority_level || 'normal'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {lead.flow_type === 'eight_q' ? `${(Number(lead.current_step) || 0) + 1}/8` :
                        lead.flow_type === 'high_ticket' ? `${(Number(lead.current_step) || 0) + 1}/3` :
                          lead.flow_type === 'support' ? 'Escalado' :
                            lead.flow_type === 'human' ? 'Agente' :
                              lead.flow_type === 'utility' ? 'Consultando' :
                                lead.flow_type === 'protocol_application' ? `${(Number(lead.current_step) || 0) + 1}/3` :
                                  '-'}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 max-w-xs truncate">
                      {lead.last_message || "Sin mensajes"}
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
                              ✓ Aprobar
                            </button>
                            <button
                              onClick={() => updateLeadStatus(lead.id, 'rejected')}
                              disabled={updatingLeadId === lead.id}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors disabled:opacity-50"
                            >
                              ✗ Rechazar
                            </button>
                          </>
                        )}

                        {lead.status === 'approved' && (
                          <button
                            onClick={() => updateLeadStatus(lead.id, 'completed')}
                            disabled={updatingLeadId === lead.id}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors disabled:opacity-50"
                          >
                            🎯 Completar
                          </button>
                        )}

                        {lead.status === 'completed' && (
                          <span className="px-3 py-1 bg-gray-600 text-white text-xs rounded">
                            ✅ Finalizado
                          </span>
                        )}

                        {lead.status === 'rejected' && (
                          <span className="px-3 py-1 bg-red-800 text-red-200 text-xs rounded">
                            🚫 Rechazado
                          </span>
                        )}

                        {/* Special actions for different flows */}
                        {lead.flow_type === 'support' && lead.status !== 'completed' && (
                          <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded">
                            🆘 Soporte
                          </span>
                        )}

                        {lead.flow_type === 'human' && (
                          <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded">
                            👨‍💼 Agente
                          </span>
                        )}

                        {lead.flow_type === 'protocol_application' && (
                          <span className="px-2 py-1 bg-violet-600 text-white text-xs rounded">
                            📜 Protocol
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

    </div>
  );
}
