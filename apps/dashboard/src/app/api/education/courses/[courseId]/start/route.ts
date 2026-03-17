import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { gamificationEngine, EventType } from "@pandoras/gamification";
import { db } from "~/db";
import { courses, courseEnrollments } from "~/db/schema";
import { eq, and, sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';

// POST /api/education/courses/[courseId]/start
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { session } = await getAuth(await headers());
    const walletAddress = session?.address?.toLowerCase();

    if (!walletAddress) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { courseId } = await params;

    // Fetch course from DB
    const [course] = await db
      .select()
      .from(courses)
      .where(and(eq(courses.id, courseId), eq(courses.isActive, true)));

    if (!course) {
      return NextResponse.json({ message: "Curso no encontrado" }, { status: 404 });
    }

    // Check if already enrolled
    const [existing] = await db
      .select()
      .from(courseEnrollments)
      .where(and(
        eq(courseEnrollments.userId, walletAddress),
        eq(courseEnrollments.courseId, courseId)
      ));

    if (existing) {
      if (existing.status === 'completed') {
        return NextResponse.json({ message: "Ya completaste este curso", alreadyCompleted: true }, { status: 200 });
      }
      return NextResponse.json({
        success: true,
        courseId,
        message: "Ya estás inscrito en este curso",
        alreadyEnrolled: true,
        pointsAwarded: 0,
      });
    }

    // Create enrollment
    await db.insert(courseEnrollments).values({
      userId: walletAddress,
      courseId,
      status: 'in_progress',
      progressPct: 0,
    });

    // Increment enrolled count
    await db
      .update(courses)
      .set({ enrolledCount: sql`${courses.enrolledCount} + 1` })
      .where(eq(courses.id, courseId));

    // Fire gamification event
    try {
      await gamificationEngine.trackEvent(
        walletAddress,
        EventType.COURSE_STARTED,
        {
          courseId,
          courseName: course.title,
          startedAt: new Date().toISOString(),
          xpReward: Math.round(course.xpReward * 0.1),
        }
      );
    } catch (gamificationError) {
      console.warn('⚠️ Failed to track COURSE_STARTED event:', gamificationError);
    }

    // 2. Notify PANDORAS_EDGE_API (TMA sync)
    const EDGE_URL = process.env.NEXT_PUBLIC_PANDORAS_EDGE_URL || process.env.NEXT_PUBLIC_API_URL;
    const EDGE_KEY = process.env.PANDORA_CORE_KEY;

    if (EDGE_URL && EDGE_KEY) {
      try {
        await fetch(`${EDGE_URL}/gamification/record-by-wallet`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${EDGE_KEY}`
          },
          body: JSON.stringify({
            walletAddress,
            event: 'course_started',
            metadata: {
              courseId,
              courseName: course.title,
              xpReward: Math.round(course.xpReward * 0.1) // TMA can decide, but we pass hint
            }
          }),
          signal: AbortSignal.timeout(5000),
        });
        console.log(`📡 Notified Edge API: COURSE_STARTED for ${walletAddress}`);
      } catch (edgeError) {
        console.warn('⚠️ Failed to notify Edge API on course start:', edgeError);
      }
    }

    return NextResponse.json({
      success: true,
      courseId,
      message: "Curso iniciado exitosamente",
      pointsAwarded: Math.round(course.xpReward * 0.1), // 10% on start
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error starting course:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
