import { NextResponse } from "next/server";
import { db } from "~/db";
import { sql } from "drizzle-orm";

// ⚠️ EXPLICITAMENTE USAR Node.js RUNTIME para APIs que usan PostgreSQL
export const runtime = "nodejs";
import { projects as projectsSchema } from "~/db/schema";
import { projectApiSchema } from "@/lib/project-schema-api";
import { getAuth, isAdmin } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import slugify from "slugify";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { session } = await getAuth(await headers());
  const userIsAdmin = await isAdmin(session?.userId);

  if (!userIsAdmin) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const projectId = Number(id);

  if (isNaN(projectId)) {
    return NextResponse.json({ message: "ID de proyecto inválido" }, { status: 400 });
  }

  try {
    const body: unknown = await request.json();
    const url = new URL(request.url);

    // Check if this is a request for featured functionality
    if (url.pathname.includes('/featured')) {
      console.log('🔄 Main API: Redirecting to featured API for project:', projectId);

      // Re-export the featured API functionality here to avoid conflicts
      const { featured, featuredButtonText } = body as { featured?: boolean; featuredButtonText?: string };

      const updateData: { featured?: boolean; featuredButtonText?: string } = {};
      if (typeof featured === 'boolean') {
        updateData.featured = featured;
      }
      if (featuredButtonText !== undefined) {
        updateData.featuredButtonText = featuredButtonText;
      }

      // Verificar que el proyecto existe
      const existingProject = await db.query.projects.findFirst({
        where: eq(projectsSchema.id, projectId),
      });

      if (!existingProject) {
        return NextResponse.json({ message: "Proyecto no encontrado" }, { status: 404 });
      }

      // Actualizar featured status - simplified query
      console.log('🔄 Main API: Executing featured update for project:', projectId);
      console.log('🔄 Main API: Update data:', updateData);

      // First, let's check what columns actually exist in the database
      try {
        const columnCheck = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'featured_button_text'`);
        console.log('🔄 Main API: Column check result:', columnCheck);
      } catch (columnError) {
        console.error('🔄 Main API: Column check failed:', columnError);
      }

      // Use Drizzle ORM syntax correctly - only return columns that definitely exist
      const [updatedProject] = await db
        .update(projectsSchema)
        .set(updateData)
        .where(eq(projectsSchema.id, projectId))
        .returning({
          id: projectsSchema.id,
          title: projectsSchema.title,
          slug: projectsSchema.slug,
          featured: projectsSchema.featured,
          status: projectsSchema.status
        });

      console.log('🔄 Main API: Drizzle result:', updatedProject);

      return NextResponse.json(updatedProject, { status: 200 });
    }

    // For PATCH, we only allow status updates for now
    if (typeof body !== 'object' || body === null || !('status' in body)) {
      return NextResponse.json(
        { message: "Solo se permite actualizar el estado del proyecto" },
        { status: 400 }
      );
    }

    const { status } = body as { status: string | number | boolean };
    const statusString = String(status);

    // Validar que el status sea válido
    const validStatuses = ['pending', 'approved', 'live', 'completed', 'rejected'];
    if (!validStatuses.includes(statusString)) {
      return NextResponse.json({ message: "Estado inválido" }, { status: 400 });
    }

    // Verificar que el proyecto existe
    const existingProject = await db.query.projects.findFirst({
      where: eq(projectsSchema.id, projectId),
    });

    if (!existingProject) {
      return NextResponse.json({ message: "Proyecto no encontrado" }, { status: 404 });
    }

    // Actualizar solo el status del proyecto
    const [updatedProject] = await db
      .update(projectsSchema)
      .set({ status: statusString as "pending" | "approved" | "live" | "completed" | "rejected" })
      .where(eq(projectsSchema.id, projectId))
      .returning();

    return NextResponse.json(updatedProject, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar el proyecto:", error);
    return NextResponse.json(
      { message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { session } = await getAuth(await headers());
  const userIsAdmin = await isAdmin(session?.userId);

  if (!userIsAdmin) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const projectId = Number(id);

  if (isNaN(projectId)) {
    return NextResponse.json({ message: "ID de proyecto inválido" }, { status: 400 });
  }

  try {
    const body: unknown = await request.json();
    // Los admins pueden tener un schema menos estricto si es necesario,
    // pero por ahora usamos el mismo para consistencia.
    const parsedData = projectApiSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json(
        { message: "Datos inválidos", errors: parsedData.error.flatten() },
        { status: 400 }
      );
    }

    const { title } = parsedData.data;
    const data = parsedData.data;

    // Verificar que el proyecto existe
    const existingProject = await db.query.projects.findFirst({
      where: eq(projectsSchema.id, projectId),
    });

    if (!existingProject) {
      return NextResponse.json({ message: "Proyecto no encontrado" }, { status: 404 });
    }

    // Generar un nuevo slug si cambió el título
    let slug = slugify(title, { lower: true, strict: true });
    if (slug !== existingProject.slug) {
      const existingSlug = await db.query.projects.findFirst({
        where: eq(projectsSchema.slug, slug),
      });
      if (existingSlug && existingSlug.id !== projectId) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    // Actualizar el proyecto en la base de datos
    const [updatedProject] = await db
      .update(projectsSchema)
      .set({
        // --- Sección 1: Strings / Enums ---
        title: data.title,
        description: data.description,
        slug: slug,
        tagline: data.tagline ?? null,
        businessCategory: data.businessCategory ?? 'other',
        logoUrl: data.logoUrl ?? null,
        coverPhotoUrl: data.coverPhotoUrl ?? null,
        videoPitch: data.videoPitch ?? null,

        // --- Sección 2: Strings ---
        website: data.website ?? null,
        whitepaperUrl: data.whitepaperUrl ?? null,
        twitterUrl: data.twitterUrl ?? null,
        discordUrl: data.discordUrl ?? null,
        telegramUrl: data.telegramUrl ?? null,
        linkedinUrl: data.linkedinUrl ?? null,

        // --- Sección 3: ¡LA CLAVE! Híbrido de Números y Strings ---

        // Campos DECIMAL (decimal, numeric) -> van como STRING
        targetAmount: data.targetAmount.toString(), // Convertir a string
        totalValuationUsd: data.totalValuationUsd?.toString() ?? null, // Convertir a string
        tokenPriceUsd: data.tokenPriceUsd?.toString() ?? null, // Convertir a string

        // Campos INTEGER (integer) -> van como NUMBER
        totalTokens: data.totalTokens ?? null, // Dejar como número
        tokensOffered: data.tokensOffered ?? null, // Dejar como número

        // Campos VARCHAR/TEXT -> van como STRING
        tokenType: data.tokenType ?? 'erc20',
        estimatedApy: data.estimatedApy ?? null,
        yieldSource: data.yieldSource ?? 'other',
        lockupPeriod: data.lockupPeriod ?? null,
        fundUsage: data.fundUsage ?? null,

        // --- Sección 4: JSONB (como Objetos/Arrays) y Strings ---
        teamMembers: data.teamMembers ?? [], // Como Array
        advisors: data.advisors ?? [], // Como Array
        tokenDistribution: data.tokenDistribution ?? {}, // Como Objeto
        contractAddress: data.contractAddress ?? null,
        treasuryAddress: data.treasuryAddress ?? null,

        // --- Sección 5: Strings / Text ---
        legalStatus: data.legalStatus ?? null,
        valuationDocumentUrl: data.valuationDocumentUrl ?? null,
        fiduciaryEntity: data.fiduciaryEntity ?? null,
        dueDiligenceReportUrl: data.dueDiligenceReportUrl ?? null,

        // --- Sección 6: Booleans ---
        isMintable: data.isMintable ?? false,
        isMutable: data.isMutable ?? false,
        updateAuthorityAddress: data.updateAuthorityAddress ?? null,

        // --- Sección 7: Strings y Booleans ---
        applicantName: data.applicantName ?? null,
        applicantPosition: data.applicantPosition ?? null,
        applicantEmail: data.applicantEmail ?? null,
        applicantPhone: data.applicantPhone ?? null,
        verificationAgreement: data.verificationAgreement,

        // Mantener el status existente, a menos que se especifique cambiarlo
        status: existingProject.status,
      })
      .where(eq(projectsSchema.id, projectId))
      .returning();

    return NextResponse.json(updatedProject, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar el proyecto:", error);
    return NextResponse.json(
      { message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { session } = await getAuth(await headers());
  const userIsAdmin = await isAdmin(session?.userId);

  if (!userIsAdmin) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const projectId = Number(id);

  if (isNaN(projectId)) {
    return NextResponse.json({ message: "ID de proyecto inválido" }, { status: 400 });
  }

  try {
    // Verificar que el proyecto existe
    const existingProject = await db.query.projects.findFirst({
      where: eq(projectsSchema.id, projectId),
    });

    if (!existingProject) {
      return NextResponse.json({ message: "Proyecto no encontrado" }, { status: 404 });
    }

    // Eliminar el proyecto de la base de datos
    await db
      .delete(projectsSchema)
      .where(eq(projectsSchema.id, projectId));

    return NextResponse.json({ message: "Proyecto eliminado exitosamente" }, { status: 200 });
  } catch (error) {
    console.error("Error al eliminar el proyecto:", error);
    return NextResponse.json(
      { message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
