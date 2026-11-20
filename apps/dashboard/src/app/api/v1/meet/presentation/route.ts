import { NextRequest, NextResponse } from "next/server";
import { db } from "@saasfly/db-core";
import { meetings, meetingPresentationState } from "@saasfly/db-core";
import { and, eq } from "@saasfly/db-core";
import { resolveDealPublicId } from "@/lib/meet/deal-context";
import { getDeck } from "@/lib/nexus/deck-repository";
import { findPresentation, isKnownPresentation } from "@/lib/nexus/presentations-catalog";
import { isMeetingHost, resolveRoomActor } from "@/lib/meet/room-credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 🏛️ ARCHITECTURE NOTE: Presentación inyectada en Sovereign Meet
 * =============================================================
 * Estado compartido del deck dentro de la sala (host-controlled):
 *
 *   GET  /api/v1/meet/presentation?meetingId=<uuid>
 *     Lectura pública POR DISEÑO: devuelve solo { presentationId, open, slide }.
 *     El deck (`/pitch/<slug>`) es contenido público: no hay PII ni autoridad aquí.
 *     Se usa para que los participantes sigan el slide del host (polling corto).
 *
 *   POST /api/v1/meet/presentation   { ref, open?, slide? }
 *     Solo el HOST del meeting puede mutar el estado. La identidad se resuelve con
 *     `resolveRoomActor` (sesión Nexus o joinRef firmado), nunca del body.
 *
 * Persistencia: `meetings.presentation_open` / `meetings.presentation_slide`.
 */

const MAX_SLIDE_INDEX = 200;

function stateOf(input: {
  presentationId: string | null;
  status: string;
  dealRoomId?: string | null;
  open?: boolean;
  slide?: number;
}) {
  return {
    presentationId: input.presentationId,
    open: input.open ?? false,
    slide: input.slide ?? 0,
    status: input.status,
    // El deck puede resolver su link de Deal Room sin hardcodear nada.
    dealRoomId: input.dealRoomId ?? null,
  };
}

/** Estado del deck (tabla adoptada). Devuelve null si todavía no hay fila. */
async function readDeckState(meetingId: string) {
  const [state] = await db
    .select({
      presentationOpen: meetingPresentationState.presentationOpen,
      slideIndex: meetingPresentationState.slideIndex,
    })
    .from(meetingPresentationState)
    .where(eq(meetingPresentationState.meetingId, meetingId))
    .limit(1);
  return state ?? null;
}

export async function GET(req: NextRequest) {
  const meetingId = new URL(req.url).searchParams.get("meetingId");
  if (!meetingId || !/^[0-9a-fA-F-]{36}$/.test(meetingId)) {
    return NextResponse.json({ error: "meetingId inválido", code: "INVALID_MEETING_ID" }, { status: 400 });
  }

  try {
    const [meeting] = await db
      .select({
        presentationId: meetings.presentationId,
        status: meetings.status,
        dealRoomId: meetings.dealRoomId,
      })
      .from(meetings)
      .where(eq(meetings.id, meetingId))
      .limit(1);

    if (!meeting) {
      return NextResponse.json({ error: "Reunión no encontrada", code: "MEETING_NOT_FOUND" }, { status: 404 });
    }

    // El link del Deal Room se resuelve server-side (nada hardcodeado en el deck).
    const deckState = await readDeckState(meetingId);
    const dealPublicId = await resolveDealPublicId(meeting.dealRoomId);

    // Guión/meta del deck desde el CMS. Si no está sembrado, la sala usa el
    // guión versionado en el catálogo (fallback explícito, nunca inventado).
    let deck: {
      title: string;
      slug: string;
      guardrails: string[];
      script: Array<{ slide: string; title: string; notes: string[]; minutes?: number }>;
      targetMinutes: number;
    } | null = null;
    if (meeting.presentationId) {
      const document = await getDeck(meeting.presentationId);
      if (document) {
        deck = {
          title: document.title,
          slug: document.slug,
          guardrails: document.guardrails,
          targetMinutes: document.targetMinutes,
          script: document.slides.map((slide) => ({
            slide: slide.id,
            title: slide.title,
            notes: slide.notes,
            minutes: slide.minutes,
          })),
        };
      }
    }

    return NextResponse.json({
      ...stateOf({
        presentationId: meeting.presentationId,
        status: meeting.status,
        dealRoomId: meeting.dealRoomId,
        open: deckState?.presentationOpen ?? false,
        slide: deckState?.slideIndex ?? 0,
      }),
      dealPublicId,
      deck,
    });
  } catch (error) {
    console.error("[MeetPresentation] GET error:", error);
    return NextResponse.json({ error: "Error interno", code: "INTERNAL" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: { ref?: unknown; meetingId?: unknown; open?: unknown; slide?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido", code: "INVALID_BODY" }, { status: 400 });
  }

  const hasOpen = typeof body.open === "boolean";
  const hasSlide = body.slide !== undefined && body.slide !== null;
  if (!hasOpen && !hasSlide) {
    return NextResponse.json({ error: "Nada que actualizar", code: "NOTHING_TO_UPDATE" }, { status: 400 });
  }

  let slideIndex: number | null = null;
  if (hasSlide) {
    const parsed = Number(body.slide);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > MAX_SLIDE_INDEX) {
      return NextResponse.json({ error: "slide fuera de rango", code: "INVALID_SLIDE" }, { status: 400 });
    }
    slideIndex = parsed;
  }

  try {
    const { actor, error } = await resolveRoomActor(req.headers, body.ref, body.meetingId);
    if (error || !actor) {
      const failure = error ?? { status: 401, code: "UNAUTHORIZED", message: "No autorizado" };
      return NextResponse.json({ error: failure.message, code: failure.code }, { status: failure.status });
    }

    const [meeting] = await db
      .select()
      .from(meetings)
      .where(
        actor.orgId
          ? and(eq(meetings.id, actor.meetingId), eq(meetings.canonicalOrgId, actor.orgId))
          : eq(meetings.id, actor.meetingId)
      )
      .limit(1);

    if (!meeting) {
      return NextResponse.json({ error: "Reunión no encontrada", code: "MEETING_NOT_FOUND" }, { status: 404 });
    }

    if (!isMeetingHost(meeting, actor.actorCollaboratorId)) {
      return NextResponse.json(
        { error: "Solo el host controla la presentación", code: "HOST_ONLY" },
        { status: 403 }
      );
    }

    if (meeting.status === "cancelled" || meeting.status === "ended") {
      return NextResponse.json({ error: "La reunión no está activa", code: "MEETING_NOT_ACTIVE" }, { status: 409 });
    }

    if (!meeting.presentationId || !isKnownPresentation(meeting.presentationId)) {
      return NextResponse.json(
        { error: "Esta reunión no tiene una presentación válida asociada", code: "NO_PRESENTATION" },
        { status: 409 }
      );
    }

    // El servidor también acota: un estado viejo no puede dejar el deck en un
    // slide que no existe. Se usa el deck de la DB (fuente de verdad) y el catálogo
    // solo como respaldo; así no hay drift si el deck crece antes que el catálogo.
    const dbDeck = await getDeck(meeting.presentationId);
    const catalog = findPresentation(meeting.presentationId);
    const maxSlide = Math.max((dbDeck?.slides.length ?? catalog?.script.length ?? 1) - 1, 0);

    const current = await readDeckState(meeting.id);
    const nextOpen = hasOpen ? (body.open as boolean) : current?.presentationOpen ?? false;
    const requestedSlide = slideIndex !== null ? slideIndex : current?.slideIndex ?? 0;
    const nextSlide = Math.min(Math.max(requestedSlide, 0), maxSlide);

    const [saved] = await db
      .insert(meetingPresentationState)
      .values({
        meetingId: meeting.id,
        presentationId: meeting.presentationId,
        slideIndex: nextSlide,
        presentationOpen: nextOpen,
        updatedBy: actor.actorCollaboratorId,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: meetingPresentationState.meetingId,
        set: {
          presentationId: meeting.presentationId,
          slideIndex: nextSlide,
          presentationOpen: nextOpen,
          updatedBy: actor.actorCollaboratorId,
          updatedAt: new Date(),
        },
      })
      .returning({
        slideIndex: meetingPresentationState.slideIndex,
        presentationOpen: meetingPresentationState.presentationOpen,
      });

    if (!saved) {
      return NextResponse.json({ error: "No se pudo actualizar", code: "UPDATE_FAILED" }, { status: 500 });
    }

    return NextResponse.json({
      ...stateOf({
        presentationId: meeting.presentationId,
        status: meeting.status,
        dealRoomId: meeting.dealRoomId,
        open: saved.presentationOpen,
        slide: saved.slideIndex,
      }),
      dealPublicId: await resolveDealPublicId(meeting.dealRoomId),
    });
  } catch (error) {
    console.error("[MeetPresentation] POST error:", error);
    return NextResponse.json({ error: "Error interno", code: "INTERNAL" }, { status: 500 });
  }
}
