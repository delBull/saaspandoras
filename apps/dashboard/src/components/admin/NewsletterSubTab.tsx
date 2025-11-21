'use client';

import { useState, useEffect } from 'react';

interface EmailMetrics {
  timeRange: string;
  total: number;
  delivered: number;
  bounced: number;
  opened: number;
  clicked: number;
  deliveryRate: string;
  openRate: string;
  clickRate: string;
  byType: Record<string, {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  }>;
  updated: string;
}

interface NewsletterMetrics {
  status: string;
  email?: EmailMetrics;
  whatsapp?: any;
  timeRange: string;
  timestamp: string;
  message?: string;
}

export default function NewsletterSubTab() {
  const [metrics, setMetrics] = useState<NewsletterMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [resendConfigured, setResendConfigured] = useState(false);

  const fetchMetrics = async (range: '24h' | '7d' | '30d') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/marketing/metrics?range=${range}`);
      const data = await response.json();
      setMetrics(data);
      setResendConfigured(data.status !== 'no_resend_integration');
    } catch (error) {
      console.error('Error fetching newsletter metrics:', error);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(timeRange);
  }, [timeRange]);

  const TypeLabels = {
    creator_welcome: '📧 Creator Welcome',
    founders: '🎯 Founders Program',
    utility: '🔧 Utility Protocol',
    other: '📝 Other'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">📧 Newsletter Performance</h3>
        <div className="flex gap-2">
          {(['24h', '7d', '30d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {!resendConfigured && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="text-yellow-400">⚠️</div>
            <div>
              <h4 className="font-medium text-yellow-400">Resend Integration Not Configured</h4>
              <p className="text-sm text-yellow-200 mt-1">
                Para ver métricas reales de emails, configura <code>RESEND_API_KEY</code> en tu entorno.
                Actualmente solo se muestran métricas simuladas.
              </p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
        </div>
      ) : metrics?.email ? (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
              <div className="text-2xl font-bold text-purple-400">{metrics.email.total}</div>
              <div className="text-sm text-zinc-400">Total Enviados</div>
              <div className="text-xs text-zinc-500 mt-1">{timeRange}</div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
              <div className="text-2xl font-bold text-green-400">{metrics.email.delivered}</div>
              <div className="text-sm text-zinc-400">Entregados</div>
              <div className="text-xs text-green-300 mt-1">{metrics.email.deliveryRate}%</div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
              <div className="text-2xl font-bold text-blue-400">{metrics.email.opened}</div>
              <div className="text-sm text-zinc-400">Abiertos</div>
              <div className="text-xs text-blue-300 mt-1">{metrics.email.openRate}%</div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
              <div className="text-2xl font-bold text-orange-400">{metrics.email.clicked}</div>
              <div className="text-sm text-zinc-400">Clics</div>
              <div className="text-xs text-orange-300 mt-1">{metrics.email.clickRate}%</div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
              <div className="text-2xl font-bold text-red-400">{metrics.email.bounced}</div>
              <div className="text-sm text-zinc-400">Rebotados</div>
              <div className="text-xs text-zinc-500 mt-1">Spam/Bloqueados</div>
            </div>
          </div>

          {/* Performance by Email Type */}
          <div className="bg-zinc-800/30 rounded-lg p-6">
            <h4 className="text-lg font-medium text-white mb-4">📊 Performance por Tipo de Email</h4>
            <div className="space-y-4">
              {Object.entries(metrics.email.byType).map(([type, stats]) => (
                <div key={type} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{TypeLabels[type as keyof typeof TypeLabels] || '📝 Other'}</span>
                    <span className="text-sm text-zinc-400">
                      {stats.sent} enviados
                    </span>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-green-400 font-medium">{stats.delivered}</div>
                      <div className="text-zinc-500">Entregados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-400 font-medium">{stats.opened}</div>
                      <div className="text-zinc-500">Abiertos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-orange-400 font-medium">{stats.clicked}</div>
                      <div className="text-zinc-500">Clicks</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-zinc-800/30 rounded-lg p-6">
            <h4 className="text-lg font-medium text-white mb-4">🕒 Actividad Reciente</h4>
            <div className="space-y-3">
              {metrics.email.total > 0 && (
                <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded border border-zinc-700">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm text-zinc-300">
                      Último envío exitoso
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {new Date(metrics.email.updated).toLocaleString('es-ES')}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded border border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-sm text-zinc-300">
                    Métricas actualizadas desde Resend
                  </span>
                </div>
                <span className="text-xs text-zinc-500">
                  {resendConfigured ? 'LIVE' : 'SIMULADO'}
                </span>
              </div>
            </div>
          </div>

          {/* API Status */}
          <div className="text-center text-xs text-zinc-500">
            Última actualización: {new Date(metrics.timestamp).toLocaleString('es-ES')}
            {resendConfigured && (
              <span className="text-green-400 ml-2">• API Resend conectada ✅</span>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium mb-2 text-red-400">Error cargando métricas</h3>
          <p className="text-zinc-500">
            {metrics?.message || 'No se pudo cargar la información de newsletter.'}
          </p>
          <button
            onClick={() => fetchMetrics(timeRange)}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}
