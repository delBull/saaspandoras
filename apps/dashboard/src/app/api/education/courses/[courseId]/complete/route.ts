import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { gamificationEngine, EventType } from "@pandoras/gamification";

// POST /api/education/courses/[courseId]/complete
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

    // Simular verificación del curso existe y está iniciado
    const validCourses = ["defi-basics", "nft-strategies", "web3-security"];
    if (!validCourses.includes(courseId)) {
      return NextResponse.json({ message: "Curso no encontrado" }, { status: 404 });
    }

    // Trigger evento de completar curso: +100 puntos
    try {
      await gamificationEngine.trackEvent(
        walletAddress,
        EventType.COURSE_COMPLETED, // ✅ Evento específico para completar cursos
        {
          courseId: courseId,
          courseName: courseId.replace(/-/g, ' '),
          completedAt: new Date().toISOString(),
          completionBonus: 100
        }
      );
      console.log(`✅ Course completed event tracked for ${walletAddress}: +100 points`);
    } catch (gamificationError) {
      console.warn('⚠️ Failed to track course completion event:', gamificationError);
      // No fallamos por esto, solo loggeamos
    }

    return NextResponse.json({
      success: true,
      courseId: courseId,
      message: "Curso completado exitosamente",
      pointsAwarded: 100,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error completing course:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
