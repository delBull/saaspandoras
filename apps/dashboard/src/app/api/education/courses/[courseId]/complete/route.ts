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

    const { courseId } = await params;

    if (!courseId) {
      return NextResponse.json({ message: "ID de curso requerido" }, { status: 400 });
    }

    // Simular verificación del curso existe
    const validCourses = ["defi-basics", "nft-strategies", "web3-security"];
    if (!validCourses.includes(courseId)) {
      return NextResponse.json({ message: "Curso no encontrado" }, { status: 404 });
    }

    // Verificar si el usuario completó todos los modulos (simulado)
    const body = await request.json() as {
      completionData?: {
        modulesCompleted: number;
        totalModules: number;
        quizPassed: boolean;
        finalScore?: number;
      };
    };

    const { completionData } = body;

    // Validar completion data básica
    if (!completionData) {
      return NextResponse.json({
        message: "Datos de completitud requeridos",
        required: {
          modulesCompleted: 0,
          totalModules: 0,
          quizPassed: true,
          finalScore: 0
        }
      }, { status: 400 });
    }

    // Verificar que el usuario realmente completó el curso
    if (!completionData.quizPassed) {
      return NextResponse.json({
        message: "Debes pasar el quiz para completar el curso",
        status: "quiz_failed"
      }, { status: 400 });
    }

    if (completionData.modulesCompleted < completionData.totalModules) {
      return NextResponse.json({
        message: `Completa todos los módulos (${completionData.modulesCompleted}/${completionData.totalModules})`,
        status: "modules_incomplete"
      }, { status: 400 });
    }

    // ✅ TODO: Verificar no haya completado este curso antes (anti-duplicado)

    // Trigger evento principal: COMPLETACIÓN DE CURSO = +100 puntos
    let pointsAwarded = 100; // Default points

    // Personalizar puntos basado en dificultad del curso
    const coursePoints = {
      "defi-basics": 100,
      "web3-security": 125,
      "nft-strategies": 150
    };

    if (coursePoints[courseId as keyof typeof coursePoints]) {
      pointsAwarded = coursePoints[courseId as keyof typeof coursePoints];
    }

    try {
      await gamificationEngine.trackEvent(
        walletAddress,
        EventType.PROJECT_APPLICATION_SUBMITTED, // Reutilizando evento existente
        {
          eventSubtype: 'course_completed',
          courseId: courseId,
          courseName: courseId.replace(/-/g, ' '),
          completedAt: new Date().toISOString(),
          completionScore: completionData.finalScore,
          modulesCompleted: completionData.modulesCompleted,
          totalModules: completionData.totalModules,
          quizPassed: completionData.quizPassed,
          completionBonus: pointsAwarded
        }
      );
      console.log(`🏆 Course completed event tracked for ${walletAddress}: +${pointsAwarded} points`);
    } catch (gamificationError) {
      console.warn('⚠️ Failed to track course completion event:', gamificationError);
      // IMPORTANTE: No fallar por gamification ya que preferimos que pierda puntos que se bloquee completamente
    }

    return NextResponse.json({
      success: true,
      courseId: courseId,
      message: "¡Curso completado exitosamente! 🎉",
      pointsAwarded: pointsAwarded,
      achievements: [
        {
          name: "Aprendiz Avanzado",
          description: `Completaste el curso: ${courseId.replace(/-/g, ' ')}`,
          points: pointsAwarded
        }
      ],
      nextCourses: [
        // Sugerir próximos cursos basados en dificultad
        courseId === "defi-basics" ? "web3-security" : null,
        courseId === "web3-security" ? "nft-strategies" : null
      ].filter(Boolean),
      completionData: completionData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error completing course:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
