import type { ShortlinkEvent } from "@/db/schema";
import { format } from "date-fns";

// Agrupar clics por día
export function clicksByDay(events: ShortlinkEvent[]) {
  const map = new Map();

  events.forEach(event => {
    const day = format(new Date(event.createdAt), "yyyy-MM-dd");
    map.set(day, (map.get(day) || 0) + 1);
  });

  // Convertir a array ordenado
  return Array.from(map.entries())
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());
}

// Agrupar por fuente UTM
export function clicksBySource(events: ShortlinkEvent[]) {
  const map = new Map();

  events.forEach(event => {
    const source = event.utmSource || "desconocido";
    map.set(source, (map.get(source) || 0) + 1);
  });

  // Convertir a array ordenado por cantidad
  return Array.from(map.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
}

// Agrupar por dispositivo
export function clicksByDevice(events: ShortlinkEvent[]) {
  const map = new Map();

  events.forEach(event => {
    const device = event.deviceType || "desconocido";
    map.set(device, (map.get(device) || 0) + 1);
  });

  return Array.from(map.entries())
    .map(([device, count]) => ({ device, count }))
    .sort((a, b) => b.count - a.count);
}

// Calcular dispositivos en porcentajes para pie chart
export function devicesAsPercentages(devicesData: { device: string; count: number }[]) {
  const total = devicesData.reduce((sum, item) => sum + item.count, 0);

  return devicesData.map(item => ({
    ...item,
    percentage: Math.round((item.count / total) * 100)
  }));
}
