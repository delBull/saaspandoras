import { NextResponse } from "next/server";
//
import { db } from "~/db";




// 
// // const db = drizzle(client, { schema: { projects: projectsSchema } });

// ⚠️ EXPLICITAMENTE USAR Node.js RUNTIME para APIs que usan PostgreSQL
export const runtime = "nodejs";
import { projects as projectsSchema } from "@/db/schema";
import { projectApiSchema } from "@/lib/project-schema-api";
import { getAuth, isAdmin } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import slugify from "slugify";
import { sanitizeLogData, validateRequestBody } from "@/lib/security-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { session } = await getAuth(await headers());

  // Check if user is admin using either userId or address
  const userIsAdmin = await isAdmin(session?.userId) ||
                     await isAdmin(session?.address);

  if (!userIsAdmin) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const projectId = Number(id);

  if (isNaN(projectId)) {
    return NextResponse.json({ message: "ID de proyecto inválido" }, { status: 400 });
  }

  try {
    console.log('🔍 GET: Fetching project with ID:', projectId);

    // Obtener el proyecto específico
    const project = await db.query.projects.findFirst({
      where: eq(projectsSchema.id, projectId),
      columns: {
        // Basic info
        id: true,
        title: true,
        description: true,
        slug: true,
        tagline: true,
        businessCategory: true,
        targetAmount: true,
        status: true,
        createdAt: true,

        // URLs and links
        website: true,
        whitepaperUrl: true,
        twitterUrl: true,
        discordUrl: true,
        telegramUrl: true,
        linkedinUrl: true,
        logoUrl: true,
        coverPhotoUrl: true,
        videoPitch: true,

        // Due diligence
        valuationDocumentUrl: true,
        dueDiligenceReportUrl: true,
        legalStatus: true,
        fiduciaryEntity: true,

        // Applicant info
        applicantName: true,
        applicantEmail: true,
        applicantPhone: true,
        applicantWalletAddress: true,

        // Featured status
        featured: true,
        featuredButtonText: true,

        // Financial info
        totalValuationUsd: true,
        tokenPriceUsd: true,
        totalTokens: true,
        tokensOffered: true,
        tokenType: true,
        estimatedApy: true,
        yieldSource: true,
        lockupPeriod: true,
        fundUsage: true,

        // Team and distribution
        teamMembers: true,
        advisors: true,
        tokenDistribution: true,
        contractAddress: true,
        treasuryAddress: true,

        // Technical
        isMintable: true,
        isMutable: true,
        updateAuthorityAddress: true,
        applicantPosition: true,
        verificationAgreement: true,

        // Note: Additional fields from extended schema are not currently defined in the database schema
      }
    });

    if (!project) {
      console.log('🔍 GET: Project not found:', projectId);
      return NextResponse.json({ message: "Proyecto no encontrado" }, { status: 404 });
    }

    console.log('🔍 GET: Project found:', project.title);
    return NextResponse.json(project);
  } catch (error) {
    console.error("🔍 GET: Error al obtener el proyecto:", error);
    return NextResponse.json(
      { message: "Error interno del servidor.", error: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { session } = await getAuth(await headers());

  // Check if user is admin using either userId or address
  const userIsAdmin = await isAdmin(session?.userId) ||
                     await isAdmin(session?.address);

  if (!userIsAdmin) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const projectId = Number(id);

  if (isNaN(projectId)) {
    return NextResponse.json({ message: "ID de proyecto inválido" }, { status: 400 });
  }

  try {
    console.log('🔄 PATCH: Starting project status update for ID:', projectId);

    const body: unknown = await request.json();

    // Validación inmediata del body
    const validation = validateRequestBody(body);
    if (!validation.isValid) {
      return NextResponse.json({ message: validation.error }, { status: 400 });
    }

    console.log('🔄 PATCH: Request body:', sanitizeLogData(body));

    // For PATCH, we only allow status updates for now
    if (typeof body !== 'object' || body === null || !('status' in body)) {
      console.log('🔄 PATCH: Invalid body structure');
      return NextResponse.json(
        { message: "Solo se permite actualizar el estado del proyecto" },
        { status: 400 }
      );
    }

    const { status } = body as { status: string | number | boolean };
    const statusString = String(status);
    console.log('🔄 PATCH: Status to update:', statusString);

    // Validar que el status sea válido (debe coincidir con el ENUM de la base de datos)
    const validStatuses = ['pending', 'approved', 'live', 'completed', 'rejected'];
    if (!validStatuses.includes(statusString)) {
      console.log('🔄 PATCH: Invalid status value:', statusString);
      return NextResponse.json({ message: "Estado inválido" }, { status: 400 });
    }

    // Verificar que el proyecto existe y obtener información completa
    console.log('🔄 PATCH: Checking if project exists...');
    const existingProject = await db.query.projects.findFirst({
      where: eq(projectsSchema.id, projectId),
      columns: {
        id: true,
        status: true,
        title: true,
        businessCategory: true,
        targetAmount: true,
        applicantWalletAddress: true,
      }
    });

    if (!existingProject) {
      console.log('🔄 PATCH: Project not found:', projectId);
      return NextResponse.json({ message: "Proyecto no encontrado" }, { status: 404 });
    }

    console.log('🔄 PATCH: Existing project status:', existingProject.status);
    console.log('🔄 PATCH: Updating project status...');

    // Actualizar solo el status del proyecto
    await db
      .update(projectsSchema)
      .set({ status: statusString as "pending" | "approved" | "live" | "completed" | "rejected" | "incomplete" })
      .where(eq(projectsSchema.id, projectId));

    // 🎮 TRIGGER EVENTO DE APROBACIÓN DE PROYECTO si el status cambió a "approved"
    if (existingProject.status !== "approved" && statusString === "approved") {
      const adminWallet = (session?.address ?? session?.userId)?.toLowerCase();
      const applicantWallet = existingProject.applicantWalletAddress?.toLowerCase();

      console.log('✅ Project approved! Triggering gamification events...');
      console.log('🎮 Admin wallet:', adminWallet?.substring(0, 6) + '...');
      console.log('🎮 Applicant wallet:', applicantWallet?.substring(0, 6) + '...');

      // Evento de aprobación para el applicant usando el evento correcto
      if (applicantWallet) {
        try {
          // Importar dinámicamente para evitar problemas de dependencias circulares
          const { trackGamificationEvent } = await import('@/lib/gamification/service');

          await trackGamificationEvent(
            applicantWallet,
            'project_application_approved', // Evento correcto para aprobación (100 puntos)
            {
              projectId: projectId.toString(),
              projectTitle: existingProject.title ?? 'Proyecto Aprobado',
              businessCategory: existingProject.businessCategory ?? 'other',
              targetAmount: existingProject.targetAmount?.toString() ?? '0',
              approvedBy: adminWallet,
              approvalType: 'admin_approval',
              approvalDate: new Date().toISOString()
            }
          );
          console.log('✅ PROJECT APPROVAL event tracked for applicant (100 points earned!)');
        } catch (gamificationError) {
          console.warn('⚠️ Failed to track PROJECT APPROVAL for applicant:', gamificationError);
          // No bloquear el flujo si falla la gamificación
        }
      }

      // Nota: Para el admin podríamos agregar puntos por revisión, pero por ahora nos enfocamos en el applicant
      // En futuras fases podemos crear eventos específicos para admins
    }

    console.log('🔄 PATCH: Update successful for project:', projectId);
    return NextResponse.json({ message: "Status actualizado exitosamente" }, { status: 200 });
  } catch (error) {
    console.error("🔄 PATCH: Error al actualizar el proyecto:", error);
    return NextResponse.json(
      { message: "Error interno del servidor.", error: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { session } = await getAuth(await headers());

  // Check if user is admin using either userId or address
  const userIsAdmin = await isAdmin(session?.userId) ||
                     await isAdmin(session?.address);

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
      columns: {
        id: true,
        slug: true,
        status: true,
      }
    });

    if (!existingProject) {
      return NextResponse.json({ message: "Proyecto no encontrado" }, { status: 404 });
    }

    // Generar un nuevo slug si cambió el título
    let slug = slugify(title, { lower: true, strict: true });
    if (slug !== existingProject.slug) {
      const existingSlugCheck = await db.query.projects.findFirst({
        where: eq(projectsSchema.slug, slug),
        columns: {
          id: true,
        }
      });
      if (existingSlugCheck && existingSlugCheck.id !== projectId) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    // Actualizar el proyecto en la base de datos
    await db
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
      .where(eq(projectsSchema.id, projectId));

    return NextResponse.json({ message: "Proyecto actualizado exitosamente" }, { status: 200 });
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

  // Check if user is admin using either userId or address
  const userIsAdmin = await isAdmin(session?.userId) ||
                     await isAdmin(session?.address);

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
      columns: {
        id: true,
      }
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
