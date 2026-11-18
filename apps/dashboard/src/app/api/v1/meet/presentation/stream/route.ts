import { NextRequest } from "next/server";
import { db } from "@saasfly/db-core";
import { meetings } from "@saasfly/db-core";
import { eq } from "@saasfly/db-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * 🏛️ ARCHITECTURE NOTE: Push del estado de la presentación (SSE)
 * =============================================================
 * `GET /api/v1/meet/presentation/stream?meetingId=<uuid>`
 *
 * Server-Sent Events: el servidor empuja el estado del deck cuando cambia, en vez
 * de que N clientes pregunten. La fuente de verdad sigue siendo la DB
 * (`meetings.presentation_open/slide`), por lo que funciona con varias instancias
 * sin estado compartido en memoria.
 *
 * Límites honestos:
 *   - La detección del cambio es un sondeo del lado SERVIDOR cada segundo
 *     (no es LISTEN/NOTIFY ni WebSocket): latencia ~1s, no instantánea.
 *   - La conexión se cierra a los ~50s y el `EventSource` del cliente reconecta.
 *   - Solo expone estado del deck (contenido público). No hay PII ni autoridad.
 */

const POLL_INTERVAL_MS = 1000;
const MAX_STREAM_MS = 50_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readState(meetingId: string) {
  const [meeting] = await db
    .select({
      presentationId: meetings.presentationId,
      presentationOpen: meetings.presentationOpen,
      presentationSlide: meetings.presentationSlide,
      status: meetings.status,
    })
    .from(meetings)
    .where(eq(meetings.id, meetingId))
    .limit(1);

  if (!meeting) return null;
  return {
    presentationId: meeting.presentationId,
    open: meeting.presentationOpen,
    slide: meeting.presentationSlide,
    status: meeting.status,
  };
}

export async function GET(req: NextRequest) {
  const meetingId = new URL(req.url).searchParams.get("meetingId");
  if (!meetingId || !/^[0-9a-fA-F-]{36}$/.test(meetingId)) {
    return new Response(JSON.stringify({ error: "meetingId inválido", code: "INVALID_MEETING_ID" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const startedAt = Date.now();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      let lastPayload = "";

      const send = (payload: string) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      };

      req.signal.addEventListener("abort", () => {
        closed = true;
        try {
          controller.close();
        } catch {
          // ya cerrado
        }
      });

      try {
        while (!closed && Date.now() - startedAt < MAX_STREAM_MS) {
          const state = await readState(meetingId);
          if (!state) {
            send(JSON.stringify({ error: "MEETING_NOT_FOUND", code: "MEETING_NOT_FOUND" }));
            break;
          }
          const payload = JSON.stringify(state);
          if (payload !== lastPayload) {
            lastPayload = payload;
            send(payload);
          }
          await sleep(POLL_INTERVAL_MS);
        }
      } catch (error) {
        console.error("[MeetPresentationStream] error:", error);
      } finally {
        if (!closed) {
          try {
            controller.close();
          } catch {
            // el cliente ya se fue
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
