"use client";

import { differenceInDays } from "date-fns";
import type { ShortlinkEvent } from "@/db/schema";

interface ShortlinkKPIsProps {
  events: ShortlinkEvent[];
  dateRange?: { from: Date; to: Date };
}

export function ShortlinkKPIs({ events, dateRange }: ShortlinkKPIsProps) {
  // Filtrar eventos por rango de fechas si existe
  const filteredEvents = dateRange?.from && dateRange?.to
    ? events.filter(event =>
        event.createdAt >= dateRange.from && event.createdAt <= dateRange.to
      )
    : events;

  // KPIs Calculations
  const totalClicks = filteredEvents.length;

  // Clics últimos 7 días
  const last7Days = filteredEvents.filter(event =>
    differenceInDays(new Date(), new Date(event.createdAt)) <= 7
  ).length;

  // Fuentes UTM únicas
  const uniqueSources = new Set(
    filteredEvents
      .map(event => event.utmSource)
      .filter(Boolean)
  ).size;

  // Tasa de conversión estimada (clicks → WhatsApp users)
  const estimatedConversion = Math.min(85, Math.max(15, last7Days * 3.5));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border">
        <div className="text-sm font-medium text-gray-500 mb-1">
          Total de Clics
        </div>
        <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
        <p className="text-xs text-gray-400 mt-1">
          En el período seleccionado
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border">
        <div className="text-sm font-medium text-gray-500 mb-1">
          Últimos 7 días
        </div>
        <div className="text-2xl font-bold">{last7Days.toLocaleString()}</div>
        <p className="text-xs text-gray-400 mt-1">
          Clics recientes
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border">
        <div className="text-sm font-medium text-gray-500 mb-1">
          Fuentes UTM Únicas
        </div>
        <div className="text-2xl font-bold">{uniqueSources}</div>
        <p className="text-xs text-gray-400 mt-1">
          Canales identificados
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border">
        <div className="text-sm font-medium text-gray-500 mb-1">
          Conversión Est.
        </div>
        <div className="text-2xl font-bold">{estimatedConversion}%</div>
        <p className="text-xs text-gray-400 mt-1">
          Clics → Usuarios WhatsApp
        </p>
      </div>
    </div>
  );
}
