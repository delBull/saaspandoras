import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
// import { gamificationEngine, EventType } from "@pandoras/gamification"; // TODO: usar para eventos

// Simulación de base de datos de cursos - en producción vendría de DB
const COURSES_DATA = [
  {
    id: "defi-basics",
    title: "Fundamentos de DeFi",
    description: "Aprende los conceptos básicos de las finanzas descentralizadas en Blockchain",
    category: "DeFi",
    difficulty: "Beginner",
    duration: "2 horas",
    points: 100,
    prerequisites: [], // curso debe completarse antes
    modules: [
      {
        id: "module-1",
        title: "Introducción a DeFi",
        completed: false,
        type: "video",
        duration: "15 min"
      },
      {
        id: "module-2",
        title: "Lending & Borrowing",
        completed: false,
        type: "video",
        duration: "20 min"
      },
      {
        id: "quiz-defi-basics",
        title: "Quiz: Fundamentos DeFi",
        completed: false,
        type: "quiz",
        duration: "10 min",
        passing_score: 70,
        questions: [
          {
            question: "¿Qué significa DeFi?",
            options: [
              "Decentralized Finance",
              "Digital Finance Exchange",
              "Decentralized Facebook Integration",
              "Direct Finance Investment"
            ],
            correct_answer: 0
          }
        ]
      }
    ],
    skills_covered: ["Lending", "Borrowing", "Yield Farming"],
    instructor: "Pandora's Team",
    enrolled_students: 1247,
    completion_rate: 68
  },
  {
    id: "nft-strategies",
    title: "Estrategias NFTs Avanzadas",
    description: "Domina el mundo de los NFTs: desde creación hasta flippeo profesional",
    category: "NFTs",
    difficulty: "Advanced",
    duration: "4 horas",
    points: 150,
    prerequisites: [], // no prerequisites por ahora
    modules: [],
    skills_covered: ["NFT Creation", "Market Analysis", "Flipping"],
    instructor: "NFT Expert",
    enrolled_students: 892,
    completion_rate: 45
  },
  {
    id: "web3-security",
    title: "Seguridad Web3 Essentials",
    description: "Protege tus activos: wallets, privadas keys y mejores prácticas",
    category: "Security",
    difficulty: "Intermediate",
    duration: "3 horas",
    points: 125,
    prerequisites: [],
    modules: [],
    skills_covered: ["Wallet Security", "Private Keys", "Scam Prevention"],
    instructor: "Security Specialist",
    enrolled_students: 1563,
    completion_rate: 72
  }
];

// GET - Listar todos los cursos disponibles
export async function GET(_request: Request) {
  try {
    const { session } = await getAuth(await headers());
    const walletAddress = session?.address;

    if (!walletAddress) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    // En producción, aquí consultaríamos la DB y el progreso del usuario
    // Por ahora, devolvemos los cursos con status genérico
    const courses = COURSES_DATA.map(course => ({
      ...course,
      // Simulate some users having started courses
      user_progress: Math.random() > 0.7 ? "in_progress" : "not_started",
      progress_percentage: Math.random() > 0.7 ? Math.floor(Math.random() * 100) : 0
    }));

    return NextResponse.json({
      courses: courses,
      total: courses.length,
      user_wallet: walletAddress
    });

  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

// POST - Crear nuevo curso (solo admin)
export async function POST(_request: Request) {
  try {
    const { session } = await getAuth(await headers());

    // Verificar permisos de admin
    if (!session?.address) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    // Aquí irían las validaciones de admin...
    // Por ahora asumimos que es admin

    const body = await _request.json() as {
      title: string;
      description: string;
      category: string;
      difficulty: string;
      duration: string;
      points: number;
      prerequisites?: string[];
    };

    // Validaciones básicas
    if (!body.title || !body.description) {
      return NextResponse.json({ message: "Título y descripción requeridos" }, { status: 400 });
    }

    // En producción, guardar en DB
    const newCourse = {
      id: `course-${Date.now()}`, // temporal
      ...body,
      modules: [],
      skills_covered: [],
      instructor: "Pandora's Team",
      enrolled_students: 0,
      completion_rate: 0
    };

    return NextResponse.json({
      success: true,
      course: newCourse,
      message: "Curso creado exitosamente"
    });

  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
