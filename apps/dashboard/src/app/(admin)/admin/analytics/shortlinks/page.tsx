"use client";

import { useState } from "react";
import { useShortlinkEvents } from "@/components/hooks/useShortlinkEvents";
import { ShortlinkKPIs } from "@/components/analytics/shortlink-kpis";
import { ShortlinkTable } from "@/components/analytics/shortlink-table";
import { DateRangePicker } from "@/components/analytics/date-range";
import { clicksByDay, clicksBySource, clicksByDevice, devicesAsPercentages } from "@/components/analytics/shortlink-stats";
import { ClicksLineChart } from "@/components/analytics/charts/line-clicks";
import { SourcesBarChart } from "@/components/analytics/charts/bar-sources";
import { DevicePieChart } from "@/components/analytics/charts/pie-devices";

export default function ShortlinkAnalyticsPage() {
  const { events, loading, error } = useShortlinkEvents("w");

  // Estado para filtros
  const [dateRange, setDateRange] = useState<
    { from: Date; to: Date } | undefined
  >();

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="text-lg font-medium text-red-800">Error de conexión</h3>
          <p className="text-red-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  // Calcular datos para gráficos
  const dataClicks = clicksByDay(events);
  const dataSources = clicksBySource(events);
  const dataDevices = devicesAsPercentages(clicksByDevice(events));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Analytics del Shortlink /w</h1>
            <p className="text-gray-600 mt-2">
              Monitor de tráfico y conversión del enlace WhatsApp bot
            </p>
          </div>

          {/* Selector de fecha avanzado */}
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {/* KPIs */}
      <ShortlinkKPIs events={events} dateRange={dateRange} />

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de líneas - Clics por día */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Clics por Día</h3>
            <p className="text-sm text-gray-600">Tendencia temporal de accesos</p>
          </div>
          <ClicksLineChart data={dataClicks} />
        </div>

        {/* Gráfico de barras - Fuentes UTM */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Fuentes UTM</h3>
            <p className="text-sm text-gray-600">Performance por canal</p>
          </div>
          <SourcesBarChart data={dataSources} />
        </div>

        {/* Gráfico de pastel - Dispositivos */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Dispositivos</h3>
            <p className="text-sm text-gray-600">Mobile vs Desktop</p>
          </div>
          <DevicePieChart data={dataDevices} />
        </div>
      </div>

      {/* Estado del sistema */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <div>
            <h3 className="font-medium text-green-500">Sistema operativo</h3>
            <p className="text-gray-300 text-sm">
              {events.length} eventos registrados • Dashboard completo con gráficos
            </p>
          </div>
        </div>
      </div>

      {/* Tabla de eventos */}
      <div className="dark:bg-neutral-900 rounded-xl border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Todos los Eventos</h2>
          <p className="text-gray-600 text-sm mt-1">
            Historial completo de clics en el shortlink
          </p>
        </div>
        <div className="p-6">
          <ShortlinkTable data={events} />
        </div>
      </div>
    </div>
  );
}
