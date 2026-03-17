import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { gamificationEngine, EventType } from "@pandoras/gamification";
import { db } from "~/db";
import { courses, courseEnrollments } from "~/db/schema";
import { eq, and, sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';

// POST /api/education/courses/[courseId]/complete
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

    // Check enrollment
    const [enrollment] = await db
      .select()
      .from(courseEnrollments)
      .where(and(
        eq(courseEnrollments.userId, walletAddress),
        eq(courseEnrollments.courseId, courseId)
      ));

    if (!enrollment) {
      return NextResponse.json({ message: "No estás inscrito en este curso" }, { status: 400 });
    }

    if (enrollment.status === 'completed') {
      return NextResponse.json({
        message: "Ya completaste este curso anteriormente",
        alreadyCompleted: true,
        courseId,
      });
    }

    // Mark as completed
    await db
      .update(courseEnrollments)
      .set({
        status: 'completed',
        progressPct: 100,
        completedAt: new Date(),
      })
      .where(eq(courseEnrollments.id, enrollment.id));

    // Recalculate completion rate for the course
    const statsRows = await db
      .select({
        total: sql<number>`count(*)`,
        completed: sql<number>`count(*) filter (where status = 'completed')`,
      })
      .from(courseEnrollments)
      .where(eq(courseEnrollments.courseId, courseId));

    const total = Number(statsRows[0]?.total ?? 0);
    const completed = Number(statsRows[0]?.completed ?? 0);
    const newRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    await db
      .update(courses)
      .set({ completionRate: newRate })
      .where(eq(courses.id, courseId));

    // Fire gamification event with actual course rewards
    try {
      await gamificationEngine.trackEvent(
        walletAddress,
        EventType.COURSE_COMPLETED,
        {
          courseId,
          courseName: course.title,
          completedAt: new Date().toISOString(),
          xpReward: course.xpReward,
          creditsReward: course.creditsReward,
        }
      );
      console.log(`✅ COURSE_COMPLETED event for ${walletAddress}: +${course.xpReward} XP, +${course.creditsReward} Credits`);
    } catch (gamificationError) {
      console.warn('⚠️ Failed to track COURSE_COMPLETED event:', gamificationError);
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
            event: 'course_completed',
            metadata: {
              courseId,
              courseName: course.title,
              xpReward: course.xpReward,
              creditsReward: course.creditsReward,
            }
          }),
          signal: AbortSignal.timeout(5000),
        });
        console.log(`📡 Notified Edge API: COURSE_COMPLETED for ${walletAddress}`);
      } catch (edgeError) {
        console.warn('⚠️ Failed to notify Edge API on course completion:', edgeError);
      }
    }

    return NextResponse.json({
      success: true,
      courseId,
      message: "¡Curso completado exitosamente!",
      xpAwarded: course.xpReward,
      creditsAwarded: course.creditsReward,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error completing course:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
