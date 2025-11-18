"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { ShortlinkEvent } from "@/db/schema";

interface ShortlinkTableProps {
  data: ShortlinkEvent[];
}

export function ShortlinkTable({ data }: ShortlinkTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay datos para mostrar
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3 font-medium text-gray-700">Fecha</th>
            <th className="text-left p-3 font-medium text-gray-700">IP</th>
            <th className="text-left p-3 font-medium text-gray-700">Dispositivo</th>
            <th className="text-left p-3 font-medium text-gray-700">Navegador</th>
            <th className="text-left p-3 font-medium text-gray-700">País</th>
            <th className="text-left p-3 font-medium text-gray-700">UTM Source</th>
            <th className="text-left p-3 font-medium text-gray-700">User Agent</th>
          </tr>
        </thead>
        <tbody>
          {data.map((event) => (
            <tr key={event.id} className="border-b hover:bg-gray-50">
              <td className="p-3 text-sm">
                {format(new Date(event.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
              </td>
              <td className="p-3 text-sm font-mono">{event.ip || "-"}</td>
              <td className="p-3 text-sm">{event.deviceType || "-"}</td>
              <td className="p-3 text-sm">{event.browser || "-"}</td>
              <td className="p-3 text-sm">{event.country || "-"}</td>
              <td className="p-3 text-sm">{event.utmSource || "-"}</td>
              <td className="p-3 text-sm max-w-xs truncate" title={event.userAgent || ""}>
                {event.userAgent ? event.userAgent.substring(0, 50) + "..." : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
