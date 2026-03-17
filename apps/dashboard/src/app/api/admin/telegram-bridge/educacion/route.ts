import { NextResponse } from "next/server";
import { getAuth, isAdmin } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "~/db";
import { courses } from "~/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = 'force-dynamic';

const EDGE_API_URL = process.env.NEXT_PUBLIC_PANDORAS_EDGE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '';
const EDGE_KEY = process.env.PANDORA_CORE_KEY ?? '';

/**
 * GET /api/admin/telegram-bridge/educacion
 * Returns the list of active courses for the Telegram bot to render as inline buttons.
 * Also returns per-user enrollment if ?telegramId=xxx is passed.
 */
export async function GET(request: Request) {
  try {
    const { session } = await getAuth(await headers());
    if (!session?.address || !await isAdmin(session.address)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const telegramId = searchParams.get('telegramId');

    // Fetch active courses from local DB
    const activeCourses = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        category: courses.category,
        difficulty: courses.difficulty,
        duration: courses.duration,
        xpReward: courses.xpReward,
        creditsReward: courses.creditsReward,
        enrolledCount: courses.enrolledCount,
        completionRate: courses.completionRate,
        moduleCount: courses.modules,
        skillsCovered: courses.skillsCovered,
      })
      .from(courses)
      .where(eq(courses.isActive, true))
      .orderBy(courses.orderIndex);

    // Optionally fetch user's gamification stats from Edge API
    let userStats = null;
    if (telegramId && EDGE_API_URL && EDGE_KEY) {
      try {
        const edgeRes = await fetch(`${EDGE_API_URL}/gamification/user/${telegramId}`, {
          headers: { Authorization: `Bearer ${EDGE_KEY}` },
          signal: AbortSignal.timeout(5000),
        });
        if (edgeRes.ok) {
          userStats = await edgeRes.json();
        }
      } catch {
        // Non-blocking — user stats are supplemental
      }
    }

    // Format courses for the Telegram bot response
    const formatted = activeCourses.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description.substring(0, 200) + (c.description.length > 200 ? '…' : ''),
      category: c.category,
      difficulty: c.difficulty,
      duration: c.duration,
      xpReward: c.xpReward,
      creditsReward: c.creditsReward,
      enrolledCount: c.enrolledCount,
      completionRate: c.completionRate,
      moduleCount: Array.isArray(c.moduleCount) ? (c.moduleCount as unknown[]).length : 0,
      skills: (c.skillsCovered as string[] ?? []).slice(0, 4),
      // Deep link to course on web platform
      deepLink: `https://staging.dash.pandoras.finance/education/course/${c.id}`,
    }));

    return NextResponse.json({
      courses: formatted,
      total: formatted.length,
      userStats,
    });

  } catch (error) {
    console.error('[Telegram Education Bridge GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/telegram-bridge/educacion
 * Handles course actions from the Telegram bot:
 * { telegramId, courseId, action: 'start' | 'complete' | 'info' }
 * Proxies to the Edge API gamification engine.
 */
export async function POST(request: Request) {
  try {
    // Allow both admin calls and internal bot calls (with EDGE_KEY in header)
    const incomingKey = request.headers.get('x-pandora-key') ?? request.headers.get('authorization')?.replace('Bearer ', '');
    const isInternalCall = incomingKey === EDGE_KEY;

    if (!isInternalCall) {
      const { session } = await getAuth(await headers());
      if (!session?.address || !await isAdmin(session.address)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.json() as {
      telegramId?: string;
      walletAddress?: string;
      courseId: string;
      action: 'start' | 'complete' | 'info';
    };

    if (!body.courseId || !body.action) {
      return NextResponse.json({ error: 'courseId and action required' }, { status: 400 });
    }

    // Fetch course from DB to verify it exists
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, body.courseId));

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (body.action === 'info') {
      return NextResponse.json({
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          duration: course.duration,
          xpReward: course.xpReward,
          creditsReward: course.creditsReward,
          moduleCount: (course.modules as unknown[]).length,
          skills: (course.skillsCovered as string[]).slice(0, 5),
          deepLink: `https://staging.dash.pandoras.finance/education/course/${course.id}`,
        }
      });
    }

    // For start/complete: proxy to Edge API gamification engine
    if (!EDGE_API_URL || !EDGE_KEY) {
      return NextResponse.json({
        error: 'Edge API not configured',
        hint: 'Set NEXT_PUBLIC_PANDORAS_EDGE_URL and PANDORA_CORE_KEY'
      }, { status: 503 });
    }

    const edgeEndpoint = body.action === 'start'
      ? `/gamification/course/start`
      : `/gamification/course/complete`;

    const edgeRes = await fetch(`${EDGE_API_URL}${edgeEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${EDGE_KEY}`,
      },
      body: JSON.stringify({
        telegramId: body.telegramId,
        walletAddress: body.walletAddress,
        courseId: body.courseId,
        courseName: course.title,
        xpReward: course.xpReward,
        creditsReward: course.creditsReward,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!edgeRes.ok) {
      const errText = await edgeRes.text();
      console.error('[Telegram Education Bridge] Edge API error:', errText);
      return NextResponse.json({
        success: false,
        message: 'Edge API call failed — gamification event not recorded',
        edgeStatus: edgeRes.status,
      }, { status: 502 });
    }

    const edgeData = await edgeRes.json();

    return NextResponse.json({
      success: true,
      action: body.action,
      courseId: body.courseId,
      xpAwarded: body.action === 'complete' ? course.xpReward : Math.round(course.xpReward * 0.1),
      creditsAwarded: body.action === 'complete' ? course.creditsReward : 0,
      edgeResponse: edgeData,
    });

  } catch (error) {
    console.error('[Telegram Education Bridge POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
