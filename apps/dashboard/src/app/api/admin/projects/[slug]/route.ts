import { NextResponse } from "next/server";
//
import { db } from "~/db";




// 
// // const db = drizzle(client, { schema: { projects: projectsSchema } });

// ⚠️ EXPLICITAMENTE USAR Node.js RUNTIME para APIs que usan PostgreSQL
export const runtime = "nodejs";
// 🔧 Allow large JSON bodies (rich text descriptions can exceed the default 1MB)
export const maxDuration = 30;
// Next.js App Router: increase body size limit for this route
export const dynamic = 'force-dynamic';
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
  const userIsAdmin = await isAdmin(session?.address) ||
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

      // Conversational Form Fields
      protoclMecanism: true,
      artefactUtility: true,
      worktoearnMecanism: true,
      monetizationModel: true,
      adquireStrategy: true,
      mitigationPlan: true,
      legalStatusDetails: true,
      protocolVersion: true,
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
  const userIsAdmin = await isAdmin(session?.address) ||
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
    const userWallet = (session?.address)?.toLowerCase();
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
      if (body.logoUrl !== undefined) {
        updates.logoUrl = body.logoUrl;
        updates.imageUrl = body.logoUrl; // Sync legacy field
      }
      if (body.coverPhotoUrl !== undefined) updates.coverPhotoUrl = body.coverPhotoUrl;
      if (body.allowedDomains !== undefined) updates.allowedDomains = body.allowedDomains;
      if (body.discordWebhookUrl !== undefined) updates.discordWebhookUrl = body.discordWebhookUrl;

      // Extended fields from new edit tabs
      if (body.applicantName !== undefined) updates.applicantName = body.applicantName;
      if (body.protoclMecanism !== undefined) updates.protoclMecanism = body.protoclMecanism;
      if (body.artefactUtility !== undefined) updates.artefactUtility = body.artefactUtility;
      if (body.worktoearnMecanism !== undefined) updates.worktoearnMecanism = body.worktoearnMecanism;
      if (body.monetizationModel !== undefined) updates.monetizationModel = body.monetizationModel;
      if (body.adquireStrategy !== undefined) updates.adquireStrategy = body.adquireStrategy;
      if (body.legalStatus !== undefined) updates.legalStatus = body.legalStatus;
      if (body.w2eConfig !== undefined) updates.w2eConfig = body.w2eConfig;
      if (body.protocolVersion !== undefined) updates.protocolVersion = Number(body.protocolVersion);

      // Optional: generate new slug if title changed
      if (body.title && body.title !== existingProject.title) {
        try {
          updates.slug = slugify(body.title, { lower: true, strict: true });
        } catch (slugErr) {
          console.error('❌ Slugify error:', slugErr);
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
      if (body.allowedDomains && Array.isArray(body.allowedDomains) && body.allowedDomains.length > 0) {
        try {
          console.log(`🔑 Automatically ensuring API Key for project ${projectId} due to domain update...`);
          await IntegrationKeyService.ensureKeyForProject(projectId, 'production', `Client: ${existingProject.title}`);
        } catch (keyErr) {
          console.error('❌ Failed to auto-generate API Key:', keyErr);
        }
      }

      return NextResponse.json({ message: "Propiedades actualizadas" }, { status: 200 });
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
  const userIsAdmin = await isAdmin(session?.address) ||
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

    // Preparar el objeto de actualización basado únicamente en lo enviado en el body
    // para evitar sobrescribir con null campos que no están en el formulario actual.
    const rawBody = body as any;
    const updateSet: any = {
      updatedAt: new Date(),
    };

    // Mapeo selectivo: solo si la llave existe en el body original
    // Sección 1
    if ('title' in rawBody) {
      updateSet.title = data.title;
      updateSet.slug = slug;
    }
    if ('description' in rawBody) updateSet.description = data.description;
    if ('tagline' in rawBody) updateSet.tagline = data.tagline ?? null;
    if ('businessCategory' in rawBody) updateSet.businessCategory = data.businessCategory ?? 'other';
    if ('logoUrl' in rawBody) updateSet.logoUrl = data.logoUrl ?? null;
    if ('coverPhotoUrl' in rawBody) updateSet.coverPhotoUrl = data.coverPhotoUrl ?? null;
    if ('videoPitch' in rawBody) updateSet.videoPitch = data.videoPitch ?? null;

    // Sección 2
    if ('website' in rawBody) updateSet.website = data.website ?? null;
    if ('whitepaperUrl' in rawBody) updateSet.whitepaperUrl = data.whitepaperUrl ?? null;
    if ('twitterUrl' in rawBody) updateSet.twitterUrl = data.twitterUrl ?? null;
    if ('discordUrl' in rawBody) updateSet.discordUrl = data.discordUrl ?? null;
    if ('telegramUrl' in rawBody) updateSet.telegramUrl = data.telegramUrl ?? null;
    if ('linkedinUrl' in rawBody) updateSet.linkedinUrl = data.linkedinUrl ?? null;

    // Sección 3: Tokenomics (Decimals as Strings)
    if ('targetAmount' in rawBody) updateSet.targetAmount = data.targetAmount.toString();
    if ('totalValuationUsd' in rawBody) updateSet.totalValuationUsd = data.totalValuationUsd?.toString() ?? null;
    if ('tokenPriceUsd' in rawBody) updateSet.tokenPriceUsd = data.tokenPriceUsd?.toString() ?? null;

    // Integers as Numbers
    if ('totalTokens' in rawBody) updateSet.totalTokens = data.totalTokens ?? null;
    if ('tokensOffered' in rawBody) updateSet.tokensOffered = data.tokensOffered ?? null;

    // Standard Varchars
    if ('tokenType' in rawBody) updateSet.tokenType = data.tokenType ?? 'erc20';
    if ('estimatedApy' in rawBody) updateSet.estimatedApy = data.estimatedApy ?? null;
    if ('yieldSource' in rawBody) updateSet.yieldSource = data.yieldSource ?? 'other';
    if ('lockupPeriod' in rawBody) updateSet.lockupPeriod = data.lockupPeriod ?? null;
    if ('fundUsage' in rawBody) updateSet.fundUsage = data.fundUsage ?? null;

    // Sección 4: JSONB
    if ('teamMembers' in rawBody) updateSet.teamMembers = data.teamMembers ?? [];
    if ('advisors' in rawBody) updateSet.advisors = data.advisors ?? [];
    if ('tokenDistribution' in rawBody) updateSet.tokenDistribution = data.tokenDistribution ?? {};
    if ('contractAddress' in rawBody) updateSet.contractAddress = data.contractAddress ?? null;
    if ('treasuryAddress' in rawBody) updateSet.treasuryAddress = data.treasuryAddress ?? null;

    // Sección 5: Strings / Text
    if ('legalStatus' in rawBody) updateSet.legalStatus = data.legalStatus ?? null;
    if ('valuationDocumentUrl' in rawBody) updateSet.valuationDocumentUrl = data.valuationDocumentUrl ?? null;
    if ('fiduciaryEntity' in rawBody) updateSet.fiduciaryEntity = data.fiduciaryEntity ?? null;
    if ('dueDiligenceReportUrl' in rawBody) updateSet.dueDiligenceReportUrl = data.dueDiligenceReportUrl ?? null;

    // Sección 6: Booleans
    if ('isMintable' in rawBody) updateSet.isMintable = data.isMintable ?? false;
    if ('isMutable' in rawBody) updateSet.isMutable = data.isMutable ?? false;
    if ('updateAuthorityAddress' in rawBody) updateSet.updateAuthorityAddress = data.updateAuthorityAddress ?? null;

    // Sección 7: Applicant info
    if ('applicantName' in rawBody) updateSet.applicantName = data.applicantName ?? null;
    if ('applicantPosition' in rawBody) updateSet.applicantPosition = data.applicantPosition ?? null;
    if ('applicantEmail' in rawBody) updateSet.applicantEmail = data.applicantEmail ?? null;
    if ('applicantPhone' in rawBody) updateSet.applicantPhone = data.applicantPhone ?? null;
    if ('verificationAgreement' in rawBody) updateSet.verificationAgreement = data.verificationAgreement;

    // Sección 8: Conversational fields
    if ('protoclMecanism' in rawBody) updateSet.protoclMecanism = data.protoclMecanism ?? null;
    if ('artefactUtility' in rawBody) updateSet.artefactUtility = data.artefactUtility ?? null;
    if ('worktoearnMecanism' in rawBody) updateSet.worktoearnMecanism = data.worktoearnMecanism ?? null;
    if ('monetizationModel' in rawBody) updateSet.monetizationModel = data.monetizationModel ?? null;
    if ('adquireStrategy' in rawBody) updateSet.adquireStrategy = data.adquireStrategy ?? null;
    if ('mitigationPlan' in rawBody) updateSet.mitigationPlan = data.mitigationPlan ?? null;

    // Actualizar el proyecto en la base de datos (MERGE strategy)
    await db
      .update(projectsSchema)
      .set(updateSet)
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
  const userIsAdmin = await isAdmin(session?.address) ||
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
