"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useShortlinkEvents } from "@/components/hooks/useShortlinkEvents";
import { ShortlinkKPIs } from "@/components/analytics/shortlink-kpis";
import { clicksByDay, clicksBySource, clicksByDevice, devicesAsPercentages } from "@/components/analytics/shortlink-stats";
import { ClicksLineChart } from "@/components/analytics/charts/line-clicks";
import { SourcesBarChart } from "@/components/analytics/charts/bar-sources";
import { DevicePieChart } from "@/components/analytics/charts/pie-devices";
import { ShortlinksManager } from "./ShortlinksManager";

interface Shortlink {
  id: number;
  slug: string;
  destinationUrl: string;
  title: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  fullUrl: string;
}

interface ShortlinkEvent {
  id: number;
  slug: string;
  ip: string;
  userAgent: string;
  referer: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  deviceType: string;
  browser: string;
  country: string;
  createdAt: string;
}

export function ShortlinksAnalyticsTab() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'management' | 'overview'>('analytics');
  const { events: wEvents, loading: wLoading, error: wError } = useShortlinkEvents("w");

  const [shortlinks, setShortlinks] = useState<Shortlink[]>([]);
  const [allEvents, setAllEvents] = useState<ShortlinkEvent[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(false);

  // Load shortlinks and all events for overview
  const loadOverviewData = async () => {
    setOverviewLoading(true);
    try {
      // Load shortlinks
      const shortlinksRes = await fetch('/api/admin/shortlinks?include_inactive=true');
      if (shortlinksRes.ok) {
        const shortlinksData = await shortlinksRes.json();
        setShortlinks(shortlinksData.data || []);
      }

      // Load all events (across all shortlinks)
      const eventsRes = await fetch('/api/admin/analytics/shortlinks'); // Without slug filter
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setAllEvents(eventsData.events || []);
      }
    } catch (error) {
      console.error('Error loading overview data:', error);
    } finally {
      setOverviewLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'overview') {
      loadOverviewData();
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Sistema de Shortlinks</h2>
          <p className="text-gray-400 text-sm">
            Analytics y gestión completa de enlaces personalizados
          </p>
        </div>
        {/*
        <Link
          href="/admin/analytics/shortlinks"
          className="px-4 py-2 bg-fuchsia-900 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
        >
          📊 Ver Dashboard Completo
        </Link>
          */}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-zinc-800/50 rounded-lg p-1 border border-zinc-700">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'analytics'
              ? 'bg-fuchsia-900 text-white'
              : 'text-gray-300 hover:text-white hover:bg-zinc-700/50'
          }`}
        >
          📊 Analytics
        </button>
        <button
          onClick={() => setActiveTab('management')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'management'
              ? 'bg-fuchsia-900 text-white'
              : 'text-gray-300 hover:text-white hover:bg-zinc-700/50'
          }`}
        >
          🔗 Gestión
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-fuchsia-900 text-white'
              : 'text-gray-300 hover:text-white hover:bg-zinc-700/50'
          }`}
        >
          📈 Rendimiento
        </button>
      </div>

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <AnalyticsContent events={wEvents} allEvents={allEvents} loading={wLoading} loadingAll={overviewLoading} error={wError} />
      )}

      {/* Management Tab */}
      {activeTab === 'management' && (
        <div className="bg-transparent rounded-lg overflow-hidden">
          <ShortlinksManager />
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <OverviewContent
          shortlinks={shortlinks}
          allEvents={allEvents}
          loading={overviewLoading}
        />
      )}
    </div>
  );
}

function OverviewContent({ shortlinks, allEvents, loading }: any) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-zinc-200 rounded w-1/3"></div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-200 rounded"></div>
          ))}
        </div>
        <div className="h-64 bg-zinc-200 rounded"></div>
      </div>
    );
  }

  // Calcular métricas globales
  const totalClicks = allEvents.length;
  const activeShortlinks = shortlinks.filter((s: Shortlink) => s.isActive).length;
  const totalShortlinks = shortlinks.length;

  // Group events by shortlink
  const shortlinkStats = shortlinks.map((shortlink: Shortlink) => {
    const events = allEvents.filter((e: ShortlinkEvent) => e.slug === shortlink.slug);
    return {
      ...shortlink,
      clicks: events.length,
      lastClick: events.length > 0 ? new Date(Math.max(...events.map((e: ShortlinkEvent) => new Date(e.createdAt).getTime()))) : null,
    };
  }).sort((a: any, b: any) => b.clicks - a.clicks);

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <div className="rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-2">Analytics Global de Shortlinks</h3>
        <p className="text-gray-400 text-sm">
          Métricas consolidadas de todos los shortlinks activos
        </p>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
          <div className="text-2xl font-bold text-white">{totalClicks}</div>
          <div className="text-sm text-gray-400">Clics Totales</div>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
          <div className="text-2xl font-bold text-white">{activeShortlinks}</div>
          <div className="text-sm text-gray-400">Shortlinks Activos</div>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
          <div className="text-2xl font-bold text-white">{totalShortlinks}</div>
          <div className="text-sm text-gray-400">Total Shortlinks</div>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
          <div className="text-2xl font-bold text-white">
            {totalClicks > 0 ? Math.round(totalClicks / totalShortlinks) : 0}
          </div>
          <div className="text-sm text-gray-400">Clics Promedio</div>
        </div>
      </div>

      {/* Top Performing Shortlinks */}
      <div className="rounded-lg ">
        <div className="p-4 border-b border-zinc-700">
          <h4 className="font-semibold text-white">Top Performing Shortlinks</h4>
        </div>
        <div className="p-4 space-y-3">
          {shortlinkStats.slice(0, 5).map((stat: any, index: number) => (
            <a
              key={stat.id}
              href={`/admin/analytics/shortlinks?slug=${stat.slug}`}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-700/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-white">/{stat.slug}</div>
                  <div className="text-xs text-gray-400">
                    {stat.lastClick ? new Date(stat.lastClick).toLocaleDateString() : 'Sin actividad'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-white">{stat.clicks}</div>
                <div className="text-xs text-gray-400">clics</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Sistema Status */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <div>
            <h3 className="font-medium text-green-500">Sistema de Shortlinks Activo</h3>
            <p className="text-gray-400 text-sm">
              {activeShortlinks} shortlinks activos • {totalClicks} clics totales • Funcionando correctamente
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsContent({ events: wEvents, allEvents, loading, loadingAll, error }: any) {
  const useEvents = allEvents && allEvents.length > 0 ? allEvents : wEvents;

  if (loading || loadingAll) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-zinc-200 rounded w-1/3"></div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-200 rounded"></div>
          ))}
        </div>
        <div className="h-96 bg-zinc-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <h3 className="text-lg font-medium text-red-800">Error al cargar analytics</h3>
        <p className="text-red-600 mt-2">{error}</p>
      </div>
    );
  }

  // Calcular datos para gráficos
  const dataClicks = clicksByDay(useEvents);
  const dataSources = clicksBySource(useEvents);
  const dataDevices = devicesAsPercentages(clicksByDevice(useEvents));

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-2">Analytics Global de Todos los Shortlinks</h3>
        <p className="text-gray-400 text-sm">
          Métricas consolidadas de todo el sistema de shortlinks
        </p>
      </div>

      {/* KPIs */}
      <ShortlinkKPIs events={useEvents} />

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de líneas - Clics por día */}
        <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-200">Clics por Día</h3>
            <p className="text-xs text-gray-400">Tendencia temporal</p>
          </div>
          <ClicksLineChart data={dataClicks} />
        </div>

        {/* Gráfico de barras - Fuentes UTM */}
        <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-200">Fuentes UTM</h3>
            <p className="text-xs text-gray-400">Performance por canal</p>
          </div>
          <SourcesBarChart data={dataSources} />
        </div>

        {/* Gráfico de pastel - Dispositivos */}
        <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-200">Dispositivos</h3>
            <p className="text-xs text-gray-400">Mobile vs Desktop</p>
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
              {useEvents.length} eventos registrados • Analytics de todos los shortlinks
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
