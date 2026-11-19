"use client";

import { useEffect, useRef } from "react";

/**
 * 🌐 LobbyGlobe — globo de puntos con arcos y avión en vuelo
 * =========================================================
 * Efecto original (no copiado de ninguna librería de pago): canvas 2D, sin dependencias.
 * Está inspirado en la interacción “globo + avión” que usa Aceternity, pero la matemática
 * y el dibujo son propios.
 *
 * Reglas de rendimiento y accesibilidad:
 * - Se pausa cuando la pestaña no está visible (`visibilitychange`).
 * - Respeta `prefers-reduced-motion`: dibuja un cuadro estático, sin rotación ni avión.
 * - Escala por `devicePixelRatio` y se re-mide con `ResizeObserver`.
 * - Si no hay contexto 2D, no rompe: simplemente no dibuja.
 */

export interface GeoPoint {
  lat: number;
  lon: number;
}

interface LobbyGlobeProps {
  className?: string;
  /** Ubicación del invitado (si concedió permiso). Dibuja su ruta al destino. */
  origin?: GeoPoint | null;
  /** Punto de destino (sede del anfitrión / del deck). */
  destination?: GeoPoint | null;
}

interface Dot {
  lat: number;
  lon: number;
  highlight: boolean;
}

interface Arc {
  from: [number, number]; // [lat, lon]
  to: [number, number];
  lift: number; // cuánto se separa del globo
  color: string;
  delay: number;
}

const DOTS: Dot[] = (() => {
  const list: Dot[] = [];
  for (let lat = -80; lat <= 80; lat += 10) {
    const circumferenceFactor = Math.cos((lat * Math.PI) / 180);
    const step = circumferenceFactor > 0.6 ? 8 : 12;
    for (let lon = 0; lon < 360; lon += step) {
      // Algunos puntos “de ciudad” con acento, distribuidos de forma determinista.
      const highlight = (lat === 20 || lat === -10) && lon % 48 === 0;
      list.push({ lat, lon, highlight });
    }
  }
  return list;
})();

const DEFAULT_DESTINATION: GeoPoint = { lat: 19.4326, lon: -99.1332 }; // CDMX

/** Construye los arcos: si hay ubicación real, la ruta sale de ahí. */
function buildArcs(origin?: GeoPoint | null, destination?: GeoPoint | null): Arc[] {
  const to = destination ?? DEFAULT_DESTINATION;

  if (origin && Number.isFinite(origin.lat) && Number.isFinite(origin.lon)) {
    const sameSpot =
      Math.abs(origin.lat - to.lat) < 0.5 && Math.abs(origin.lon - to.lon) < 0.5;

    return [
      {
        from: [origin.lat, origin.lon],
        to: [to.lat, to.lon],
        lift: sameSpot ? 0.18 : 0.34,
        color: "163,230,53",
        delay: 0,
      },
      // Arco secundario para dar profundidad (destino → foco secundario)
      {
        from: [to.lat, to.lon],
        to: [40.4168, -3.7038],
        lift: 0.2,
        color: "168,85,247",
        delay: 1.6,
      },
    ];
  }

  return DEFAULT_ARCS;
}

const DEFAULT_ARCS: Arc[] = [
  { from: [19.4, -99.1], to: [40.4, -3.7], lift: 0.32, color: "163,230,53", delay: 0 },
  { from: [19.4, -99.1], to: [25.7, -80.2], lift: 0.22, color: "168,85,247", delay: 1.4 },
  { from: [34.05, -118.2], to: [19.4, -99.1], lift: 0.26, color: "163,230,53", delay: 2.6 },
];

function toVector(lat: number, lon: number, rotate: number) {
  const phi = (lat * Math.PI) / 180;
  const lambda = (lon * Math.PI) / 180 + rotate;
  return {
    x: Math.cos(phi) * Math.sin(lambda),
    y: Math.sin(phi),
    z: Math.cos(phi) * Math.cos(lambda),
  };
}

/** Vector unitario (sin rotación) de un punto lat/lon. */
function unit(lat: number, lon: number) {
  const phi = (lat * Math.PI) / 180;
  const lambda = (lon * Math.PI) / 180;
  return {
    x: Math.cos(phi) * Math.cos(lambda),
    y: Math.sin(phi),
    z: Math.cos(phi) * Math.sin(lambda),
  };
}

/**
 * Punto del arco a una fracción `t`: interpola en 3D entre origen y destino,
 * normaliza (para seguir la esfera) y lo separa del globo con una elevación
 * senoidal, que es lo que da el efecto de “vuelo”.
 */
function arcPoint(arc: Arc, t: number) {
  const a = unit(arc.from[0], arc.from[1]);
  const b = unit(arc.to[0], arc.to[1]);

  const x = a.x * (1 - t) + b.x * t;
  const y = a.y * (1 - t) + b.y * t;
  const z = a.z * (1 - t) + b.z * t;
  const length = Math.sqrt(x * x + y * y + z * z) || 1;

  const lift = 1 + arc.lift * Math.sin(Math.PI * t);
  return { x: (x / length) * lift, y: (y / length) * lift, z: (z / length) * lift };
}

export function LobbyGlobe({ className = "", origin = null, destination = null }: LobbyGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let start = performance.now();
    let visible = true;
    const arcs = buildArcs(origin, destination);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(rect.width, 1);
      height = Math.max(rect.height, 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now: number) => {
      const elapsed = (now - start) / 1000;
      const rotate = reduceMotion ? 0.6 : elapsed * 0.16;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width, height) * 0.34;

      // Halo del globo
      const glow = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.7);
      glow.addColorStop(0, "rgba(163,230,53,0.10)");
      glow.addColorStop(0.55, "rgba(139,92,246,0.06)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // Puntos del globo (los del frente más grandes y brillantes)
      for (const dot of DOTS) {
        const v = toVector(dot.lat, dot.lon, rotate);
        const perspective = 0.72 + 0.28 * ((v.z + 1) / 2);
        const x = cx + v.x * radius * perspective;
        const y = cy - v.y * radius * perspective;
        const depth = (v.z + 1) / 2; // 0 atrás, 1 al frente
        const size = (dot.highlight ? 2.4 : 1.35) * (0.6 + 0.9 * depth);
        const alpha = 0.08 + 0.55 * depth;

        ctx.beginPath();
        ctx.fillStyle = dot.highlight
          ? `rgba(216,180,254,${0.18 + 0.6 * depth})`
          : `rgba(163,230,53,${alpha})`;
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Arcos de vuelo
      for (const arc of arcs) {
        const points: Array<{ x: number; y: number; z: number }> = [];
        for (let i = 0; i <= 48; i += 1) {
          const t = i / 48;
          const p = arcPoint(arc, t);
          // Rotación del arco junto con el globo
          const cos = Math.cos(rotate);
          const sin = Math.sin(rotate);
          const rx = p.x * cos + p.z * sin;
          const rz = -p.x * sin + p.z * cos;
          const perspective = 0.72 + 0.28 * ((rz + 1) / 2);
          points.push({
            x: cx + rx * radius * perspective,
            y: cy - p.y * radius * perspective,
            z: rz,
          });
        }

        ctx.save();
        ctx.beginPath();
        points.forEach((p, index) => (index === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.strokeStyle = `rgba(${arc.color},0.28)`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.lineDashOffset = reduceMotion ? 0 : -((elapsed + arc.delay) * 14) % 10;
        ctx.stroke();
        ctx.restore();

        // Avión viajando por el arco (solo si no hay reduced motion)
        if (!reduceMotion) {
          const t = ((elapsed + arc.delay) % 6) / 6;
          const idx = Math.min(Math.floor(t * 48), 47);
          const p = points[idx];
          const next = points[Math.min(idx + 1, 48)] ?? p;
          if (!p || !next) continue;
          const angle = Math.atan2(next.y - p.y, next.x - p.x);
          const visiblePlane = p.z > -0.35;

          if (visiblePlane) {
            // Estela
            ctx.beginPath();
            for (let i = Math.max(0, idx - 10); i <= idx; i += 1) {
              const q = points[i];
              if (!q) continue;
              if (i === Math.max(0, idx - 10)) ctx.moveTo(q.x, q.y);
              else ctx.lineTo(q.x, q.y);
            }
            ctx.strokeStyle = `rgba(${arc.color},0.55)`;
            ctx.lineWidth = 1.6;
            ctx.setLineDash([]);
            ctx.stroke();

            // Avión (triángulo orientado)
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(angle);
            ctx.fillStyle = "rgba(236,252,203,0.95)";
            ctx.beginPath();
            ctx.moveTo(6, 0);
            ctx.lineTo(-4, 3.2);
            ctx.lineTo(-2, 0);
            ctx.lineTo(-4, -3.2);
            ctx.closePath();
            ctx.fill();
            const planeGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 14);
            planeGlow.addColorStop(0, `rgba(${arc.color},0.35)`);
            planeGlow.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = planeGlow;
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      }

      if (!reduceMotion && visible) {
        rafRef.current = requestAnimationFrame(draw);
      }
    };

    resize();
    rafRef.current = requestAnimationFrame(draw);

    const observer = new ResizeObserver(() => {
      resize();
      if (reduceMotion) draw(performance.now());
    });
    observer.observe(canvas);

    const onVisibility = () => {
      visible = document.visibilityState === "visible";
      if (visible && !reduceMotion) {
        start = performance.now() - 1000; // retoma sin salto brusco
        rafRef.current = requestAnimationFrame(draw);
      } else if (!visible && rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [origin?.lat, origin?.lon, destination?.lat, destination?.lon]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none ${className}`}
    />
  );
}
