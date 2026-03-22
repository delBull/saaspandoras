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
import { eq, and } from "drizzle-orm";
import slugify from "slugify";
import { sanitizeLogData, validateRequestBody } from "@/lib/security-utils";
import { IntegrationKeyService } from "@/lib/integrations/auth";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { session } = await getAuth(await headers());

  // Check if user is admin using either userId or address
  const userIsAdmin = await isAdmin(session?.userId) ||
    await isAdmin(session?.address);

  if (!userIsAdmin) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const { slug } = await params;

  // Try to parse as ID, if fails, treat as slug
  const projectId = Number(slug);
  const isId = !isNaN(projectId);

  try {
    console.log(`🔍 GET: Fetching project with ${isId ? 'ID' : 'Slug'}:`, slug);

    let project;

    // Column selection object (reused)
    const columns = {
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
      allowedDomains: true,
      discordWebhookUrl: true,

      // Note: Additional fields from extended schema are not currently defined in the database schema
    };

    if (isId) {
      project = await db.query.projects.findFirst({
        where: and(eq(projectsSchema.id, projectId), eq(projectsSchema.isDeleted, false)),
        columns: columns
      });
    } else {
      project = await db.query.projects.findFirst({
        where: and(eq(projectsSchema.slug, slug), eq(projectsSchema.isDeleted, false)), // Use slug here
        columns: columns
      });
    }

    if (!project) {
      console.log('🔍 GET: Project not found:', slug);
      return NextResponse.json({ message: "Proyecto no encontrado" }, { status: 404 });
    }

    console.log('🔍 GET: Project found:', (project as any).title);
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

  const { slug } = await params;
  const projectId = Number(slug);

  if (isNaN(projectId)) {
    return NextResponse.json({ message: "ID de proyecto inválido" }, { status: 400 });
  }

  try {
    console.log('🔄 PATCH: Starting project update for ID:', projectId);

    const body: any = await request.json();

    // Validación inmediata del body
    const validation = validateRequestBody(body);
    if (!validation.isValid) {
      return NextResponse.json({ message: validation.error }, { status: 400 });
    }

    console.log('🔄 PATCH: Request body:', sanitizeLogData(body));

    // Verificar que el proyecto existe
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
      return NextResponse.json({ message: "Proyecto no encontrado" }, { status: 404 });
    }

    // --- AUTHENTICATION & AUTHORIZATION ---
    const userWallet = (session?.address ?? session?.userId)?.toLowerCase();
    const isAdminUser = userIsAdmin;
    const isOwner = userWallet && existingProject.applicantWalletAddress?.toLowerCase() === userWallet;

    if (!isAdminUser && !isOwner) {
      return NextResponse.json({ message: "No autorizado para editar este proyecto" }, { status: 403 });
    }

    // Case 1: Simple Status Update (Admin Only)
    if (body.status && !body.isBasicEdit) {
      if (!isAdminUser) {
        return NextResponse.json({ message: "Solo admins pueden cambiar el estado" }, { status: 403 });
      }

      const { status } = body;
      const statusString = String(status);
      const validStatuses = ['pending', 'approved', 'live', 'completed', 'rejected', 'incomplete'];

      if (!validStatuses.includes(statusString)) {
        return NextResponse.json({ message: "Estado inválido" }, { status: 400 });
      }

      await db
        .update(projectsSchema)
        .set({ status: statusString as any })
        .where(eq(projectsSchema.id, projectId));

      // ... gamification logic for approval ...
      if (existingProject.status !== "approved" && statusString === "approved") {
        try {
          const { trackGamificationEvent } = await import('@/lib/gamification/service');
          await trackGamificationEvent(
            existingProject.applicantWalletAddress!.toLowerCase(),
            'project_application_approved',
            { projectId: projectId.toString(), projectTitle: existingProject.title ?? 'Proyecto' }
          );
        } catch (e) { console.warn('Gamification error:', e); }
      }

      return NextResponse.json({ message: "Status actualizado" }, { status: 200 });
    }

    // Case 2: Basic Metadata Edit (Owner or Admin)
    if (body.isBasicEdit) {
      const updates: any = {};
      if (body.title) updates.title = body.title;
      if (body.tagline !== undefined) updates.tagline = body.tagline;
      if (body.description) updates.description = body.description;
      if (body.logoUrl !== undefined) updates.logoUrl = body.logoUrl;
      if (body.coverPhotoUrl !== undefined) updates.coverPhotoUrl = body.coverPhotoUrl;
      if (body.allowedDomains !== undefined) updates.allowedDomains = body.allowedDomains;
      if (body.discordWebhookUrl !== undefined) updates.discordWebhookUrl = body.discordWebhookUrl;

      // Optional: generate new slug if title changed
      if (body.title && body.title !== existingProject.title) {
        try {
          updates.slug = slugify(body.title, { lower: true, strict: true });
        } catch (slugErr) {
          console.error('❌ Slugify error:', slugErr);
          // Fallback to a simple slug if complex characters fail
          updates.slug = body.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
        }
      }

      if (Object.keys(updates).length === 0) {
        return NextResponse.json({ message: "Sin cambios detectados" }, { status: 400 });
      }

      await db
        .update(projectsSchema)
        .set(updates)
        .where(eq(projectsSchema.id, projectId));

      // --- AUTOMATIC API KEY GENERATION ---
      // If allowedDomains were updated (External Project integration start)
      if (body.allowedDomains && Array.isArray(body.allowedDomains) && body.allowedDomains.length > 0) {
        try {
          console.log(`🔑 Automatically ensuring API Key for project ${projectId} due to domain update...`);
          await IntegrationKeyService.ensureKeyForProject(projectId, 'production', `Client: ${existingProject.title}`);
        } catch (keyErr) {
          console.error('❌ Failed to auto-generate API Key:', keyErr);
        }
      }

      return NextResponse.json({ message: "Propiedades básicas actualizadas" }, { status: 200 });
    }

    return NextResponse.json({ message: "Operación no reconocida" }, { status: 400 });

  } catch (error) {
    console.error("🔄 PATCH Error:", error);
    return NextResponse.json({ message: "Error interno", error: String(error) }, { status: 500 });
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

  const { slug } = await params;
  const projectId = Number(slug);

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

  const { slug } = await params;
  const projectId = Number(slug);

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

    // Soft-delete: Marcar como eliminado en lugar de borrar físicamente
    // Esto evita errores de integridad referencial y permite auditoría
    await db
      .update(projectsSchema)
      .set({ isDeleted: true })
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
