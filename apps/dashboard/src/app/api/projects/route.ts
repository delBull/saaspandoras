import { NextResponse } from "next/server";
import { db } from "~/db";
import { projects as projectsSchema } from "~/db/schema";
import { inArray } from "drizzle-orm";

export const dynamic = 'force-dynamic'; // Asegura que la ruta sea siempre dinámica

export async function GET() {
  try {
    // Obtiene proyectos que están pendientes, aprobados o en vivo para la vista pública
    const projects = await db.query.projects.findMany({
      where: inArray(projectsSchema.status, ["pending", "approved", "live", "completed"]),
      orderBy: (projects, { desc }) => [desc(projects.createdAt)],
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}