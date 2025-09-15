import { NextResponse } from "next/server";
import { db } from "~/db";
import { projects } from "~/db/schema";
import { z } from "zod";
import slugify from "slugify";

// Zod para validación de datos de entrada
const applySchema = z.object({
  projectName: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  website: z.string().url("URL del sitio web inválida."),
  contactEmail: z.string().email("Email de contacto inválido."),
  description: z.string().min(50, "La descripción debe tener al menos 50 caracteres."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = applySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Datos inválidos", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { projectName, website, description, contactEmail } = validation.data;

    // Crear un 'slug' único para la URL del proyecto
    const projectSlug = slugify(projectName, { lower: true, strict: true });

    // Insertar en la base de datos
    const newProject = await db
      .insert(projects)
      .values({
        title: projectName,
        slug: projectSlug,
        website: website,
        description: description,
        socials: { email: contactEmail }, // Guardamos el email en el JSON de sociales
        status: "pending", // El estado inicial siempre es 'pending'
      })
      .returning();

    return NextResponse.json({ message: "Aplicación recibida con éxito", project: newProject[0] }, { status: 201 });
  } catch (error) {
    console.error("Error al crear la aplicación del proyecto:", error);
    return NextResponse.json({ message: "Error interno del servidor." }, { status: 500 });
  }
}