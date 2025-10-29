'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import { Button } from '@saasfly/ui/button';
import {
  Database,
  Activity,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { AnimatedBackground } from "@/components/apply/AnimatedBackground";

interface DatabaseStats {
  timestamp: string;
  database_health: {
    status: string;
    connection_type: string;
    migration_status: string;
  };
  tables_overview: {
    total_tables: number;
    expected_tables: string[];
    actual_tables: string[];
    missing_tables: string[];
  };
  system_diagnosis: {
    connection_ok: boolean;
    migrations_needed: boolean;
    data_population_needed: boolean;
    message: string;
  };
  next_steps: string[];
  current_tables_data: Record<string, {
    count: number;
    has_data: boolean;
    sample_data: any[];
    columns: string[];
    error?: string;
  }>;
  server_info: {
    timestamp: string;
    environment: string;
    debug_logs_enabled: boolean;
  };
}

const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Force dynamic rendering - this page uses API calls
export const dynamic = 'force-dynamic';

export default function DatabaseDebugPage() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(`Cargando datos de ${new Date().toLocaleTimeString()}...`);

      console.log('🌐 FetchData called at:', new Date().toISOString());

      const response = await fetch('/api/debug/database');
      console.log('📡 Response status:', response.status);

      const result = await response.json();
      console.log('📦 Received data:', result);

      if (result.success) {
        setStats(result.data);
        setLastUpdated(new Date());
        setError(null);
        console.log('✅ Data loaded successfully!');
      } else {
        throw new Error(result.message || 'API returned error');
      }
    } catch (err) {
      console.error('❌ Error fetching database stats:', err);
      setError(err instanceof Error ? `Error: ${err.message}` : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-x-0 min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
      <AnimatedBackground />

      <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-6">
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al perfil
              </Button>
            </Link>
          </div>

          <div className="text-center">
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full mb-6"
            >
              <Database className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">Database Monitor</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent">
                Monitor de
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-blue-400 to-blue-600 bg-clip-text text-transparent">
                Sistema Pandora's
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-zinc-400 max-w-4xl mx-auto mb-8 leading-relaxed">
              Panel de control en tiempo real del sistema de gamificación.
              <span className="text-blue-400 font-semibold"> Monitorea métricas y rendimiento</span>
            </p>

            <div className="flex justify-center gap-4">
              <Button onClick={fetchData} disabled={loading} className="bg-blue-600 hover:bg-blue-500">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refrescar ahora
              </Button>
              {lastUpdated && (
                <div className="flex items-center gap-2 text-sm text-gray-400 px-3 py-2 bg-zinc-800/50 rounded-lg">
                  <Clock className="w-4 h-4" />
                  Última actualización: {lastUpdated.toLocaleTimeString('es-ES')}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Status and Health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              stats?.database_health?.status === 'connected'
                ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}>
              {stats?.database_health?.status === 'connected' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {stats?.database_health?.connection_type} - {
                stats?.database_health?.status === 'connected' ? 'Conectado' : 'Desconectado'
              }
            </div>
            {error && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full text-sm font-medium text-red-400">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
        </motion.div>

        {/* System Diagnosis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <Card className="bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-orange-400">
                <AlertCircle className="w-5 h-5" />
                Diagnóstico del Sistema
              </CardTitle>
              <CardDescription className="text-zinc-400">
                {stats?.system_diagnosis.message}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className={`p-3 rounded-lg border ${
                    stats?.system_diagnosis.connection_ok
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-red-500 bg-red-500/10'
                  }`}>
                    <div className="text-sm font-medium">
                      {stats?.system_diagnosis.connection_ok ? '✅' : '❌'} Conexión a DB
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg border ${
                    !stats?.system_diagnosis.migrations_needed
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-yellow-500 bg-yellow-500/10'
                  }`}>
                    <div className="text-sm font-medium">
                      {stats?.system_diagnosis.migrations_needed ? '⚠️' : '✅'} Migraciones
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg border ${
                    !stats?.system_diagnosis.data_population_needed
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-orange-500 bg-orange-500/10'
                  }`}>
                    <div className="text-sm font-medium">
                      {stats?.system_diagnosis.data_population_needed ? '📝' : '✅'} Datos
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-white">Próximos pasos recomendados:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-zinc-400">
                    {stats?.next_steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tables Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"
        >
          {/* Tables Status */}
          <Card className="bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-blue-400">
                <Database className="w-5 h-5" />
                Estado de Tablas
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Tablas existentes vs esperadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg">
                  <span className="text-white">Total de tablas</span>
                  <span className="text-blue-400 font-bold">{stats?.tables_overview.total_tables || 0}</span>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-white">Tablas existentes:</h4>
                  <div className="flex flex-wrap gap-2">
                    {stats?.tables_overview.actual_tables.slice(0, 6).map((table, index) => (
                      <span key={index} className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/30">
                        {table}
                      </span>
                    ))}
                    {(stats?.tables_overview.actual_tables.length || 0) > 6 && (
                      <span className="px-2 py-1 bg-zinc-500/20 text-zinc-400 text-xs rounded border border-zinc-500/30">
                        +{(stats?.tables_overview.actual_tables.length || 0) - 6} más
                      </span>
                    )}
                  </div>
                </div>
                {(stats?.tables_overview.missing_tables?.length || 0) > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-orange-400">Tablas faltantes:</h4>
                    <div className="flex flex-wrap gap-2">
                      {stats?.tables_overview.missing_tables?.map((table, index) => (
                        <span key={index} className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded border border-red-500/30">
                          {table}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Server Info */}
          <Card className="bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-green-400">
                <Activity className="w-5 h-5" />
                Información del Servidor
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Estado del servidor y configuración
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2">
                  <span className="text-zinc-400">Entorno:</span>
                  <span className={`px-2 py-1 text-xs rounded border ${
                    stats?.server_info.environment === 'production'
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  }`}>
                    {stats?.server_info.environment || 'desconocido'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2">
                  <span className="text-zinc-400">Debug activado:</span>
                  <span className={`px-2 py-1 text-xs rounded border ${
                    stats?.server_info.debug_logs_enabled
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                  }`}>
                    {stats?.server_info.debug_logs_enabled ? 'Sí' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2">
                  <span className="text-zinc-400">Última consulta:</span>
                  <span className="text-white text-sm">
                    {stats?.server_info.timestamp
                      ? formatTimestamp(stats.server_info.timestamp)
                      : 'Nunca'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tables Detail View */}
        {stats?.current_tables_data && Object.keys(stats.current_tables_data).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <Card className="bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-purple-400">
                  <BarChart3 className="w-5 h-5" />
                  Detalle de Tablas
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Información detallada de cada tabla existente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {Object.entries(stats.current_tables_data).map(([tableName, tableInfo]: [string, any]) => (
                    <div key={tableName} className="border border-zinc-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Database className="w-4 h-4 text-blue-400" />
                          <h4 className="text-white font-semibold">{tableName}</h4>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${
                            tableInfo.has_data
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {tableInfo.count} registros
                          </span>
                          {tableInfo.error && (
                            <span className="text-red-400 text-xs">
                              Error en consulta
                            </span>
                          )}
                        </div>
                      </div>

                      {tableInfo.columns && tableInfo.columns.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs text-zinc-400 mb-1">Columnas:</div>
                          <div className="flex flex-wrap gap-1">
                            {tableInfo.columns.slice(0, 8).map((col: string, index: number) => (
                              <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded border border-blue-500/30">
                                {col}
                              </span>
                            ))}
                            {tableInfo.columns.length > 8 && (
                              <span className="px-2 py-1 bg-zinc-500/20 text-zinc-400 text-xs rounded border border-zinc-500/30">
                                +{tableInfo.columns.length - 8} más
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {tableInfo.sample_data && tableInfo.sample_data.length > 0 && (
                        <div>
                          <div className="text-xs text-zinc-400 mb-1">Muestra de datos:</div>
                          <div className="bg-zinc-800/50 rounded p-2 text-xs font-mono overflow-x-auto">
                            <pre className="text-green-400">
                              {JSON.stringify(tableInfo.sample_data[0], null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="text-center mt-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-full text-sm text-gray-400">
            <Database className="w-4 h-4" />
            Página actualizada automáticamente cada 30 segundos
          </div>
        </motion.div>
      </div>
    </div>
  );
}
