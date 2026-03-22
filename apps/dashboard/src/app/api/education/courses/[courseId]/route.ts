import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "~/db";
import { courses, courseEnrollments } from "~/db/schema";
import { eq, and, sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';

// GET /api/education/courses/[courseId] — single course detail + user enrollment
export async function GET(
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

    const [course] = await db
      .select()
      .from(courses)
      .where(and(
        eq(courses.id, courseId), 
        sql`${courses.isActive} = true OR ${courses.id} LIKE 'draft-%'`
      ));

    if (!course) {
      return NextResponse.json({ message: "Curso no encontrado" }, { status: 404 });
    }

    // Get dynamic stats for this course
    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        completed: sql<number>`count(*) filter (where status = 'completed')::int`,
      })
      .from(courseEnrollments)
      .where(eq(courseEnrollments.courseId, courseId));

    const enrolledCount = stats?.total ?? 0;
    const completedCount = stats?.completed ?? 0;
    const completionRate = enrolledCount > 0 
      ? Math.round((completedCount / enrolledCount) * 100) 
      : 0;

    // Get user's enrollment
    const [enrollment] = await db
      .select()
      .from(courseEnrollments)
      .where(and(
        eq(courseEnrollments.userId, walletAddress),
        eq(courseEnrollments.courseId, courseId)
      ));

    return NextResponse.json({
      course: {
        ...course,
        difficulty: course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1),
        points: course.xpReward,
        skills_covered: course.skillsCovered,
        enrolled_students: enrolledCount,
        completion_rate: completionRate,
      },
      enrollment: enrollment
        ? {
          status: enrollment.status,
          progressPct: enrollment.progressPct,
          startedAt: enrollment.startedAt,
          completedAt: enrollment.completedAt,
        }
        : null,
    });

  } catch (error) {
    console.error("Error fetching course detail:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
