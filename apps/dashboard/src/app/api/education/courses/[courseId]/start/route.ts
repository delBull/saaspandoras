import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { gamificationEngine, EventType } from "@pandoras/gamification";

// POST /api/education/courses/[courseId]/start
export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { session } = await getAuth(await headers());
    const walletAddress = session?.address;

    if (!walletAddress) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { courseId } = await params; // Desestructuramos los params

    if (!courseId) {
      return NextResponse.json({ message: "ID de curso requerido" }, { status: 400 });
    }

    // Simular verificación del curso existe
    const validCourses = ["defi-basics", "nft-strategies", "web3-security"];
    if (!validCourses.includes(courseId)) {
      return NextResponse.json({ message: "Curso no encontrado" }, { status: 404 });
    }

    // Simular progreso del usuario (en producción vendría de DB)
    // Aquí verificar si el usuario ya está inscrito o no

    // Trigger evento de inicio de curso: +10 puntos
    try {
      await gamificationEngine.trackEvent(
        walletAddress,
        EventType.PROJECT_APPLICATION_SUBMITTED, // Reutilizando evento existente
        {
          eventSubtype: 'course_started',
          courseId: courseId,
          courseName: courseId.replace(/-/g, ' '),
          startedAt: new Date().toISOString(),
          startBonus: 10
        }
      );
      console.log(`✅ Course started event tracked for ${walletAddress}: +10 points`);
    } catch (gamificationError) {
      console.warn('⚠️ Failed to track course start event:', gamificationError);
      // No fallamos por esto, solo loggeamos
    }

    return NextResponse.json({
      success: true,
      courseId: courseId,
      message: "Curso iniciado exitosamente",
      pointsAwarded: 10,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error starting course:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
