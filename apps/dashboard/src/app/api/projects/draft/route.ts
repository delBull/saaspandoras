import { NextResponse } from "next/server";
import { db } from "~/db";
import { sql } from "drizzle-orm";

// ⚠️ EXPLICITAMENTE USAR Node.js RUNTIME para APIs que usan PostgreSQL
export const runtime = "nodejs";
import { projects as projectsSchema } from "@/db/schema";
import { projectApiSchema } from "@/lib/project-schema-api";
import { getAuth } from "@/lib/auth";
import { headers, cookies } from "next/headers";
import slugify from "slugify";


export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsedData = projectApiSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json(
        { message: "Datos inválidos", errors: parsedData.error.flatten() },
        { status: 400 }
      );
    }

    // Obtener wallet address del usuario conectado usando headers de Thirdweb
    const headersList = await headers();
    const { session } = await getAuth(headersList);

    // Intentar múltiples fuentes para obtener la wallet address (mejorado)
    let applicantWalletAddress =
      session?.address ??  // Usar session.address en lugar de session.address
      session?.address ??
      headersList.get('x-thirdweb-address') ??
      headersList.get('x-wallet-address') ??
      headersList.get('x-user-address') ??
      null;

    // Si no se encontró en las fuentes anteriores, intentar cookies
    if (!applicantWalletAddress) {
      try {
        const cookieStore = await cookies();
        applicantWalletAddress = cookieStore.get('wallet-address')?.value ??
                                cookieStore.get('thirdweb:wallet-address')?.value ??
                                null;
      } catch (cookieError) {
        console.warn('Failed to read cookies:', cookieError);
      }
    }

    // Si aún no se encontró, buscar en cualquier cookie que contenga wallet address
    if (!applicantWalletAddress) {
      try {
        const cookieStore = await cookies();
        const allCookies = cookieStore.getAll();

        const walletCookie = allCookies.find(cookie =>
          cookie.name.includes('wallet') &&
          cookie.name.includes('address') &&
          cookie.value &&
          cookie.value.startsWith('0x') &&
          cookie.value.length === 42
        );

        if (walletCookie) {
          applicantWalletAddress = walletCookie.value;
        }
      } catch (cookieError) {
        console.warn('Failed to search wallet cookies:', cookieError);
      }
    }

    console.log('🔍 DRAFT API: Wallet sources check:', {
      sessionUserId: session?.address?.substring(0, 10) + '...',
      sessionAddress: session?.address?.substring(0, 10) + '...',
      thirdwebHeader: headersList.get('x-thirdweb-address')?.substring(0, 10) + '...',
      walletHeader: headersList.get('x-wallet-address')?.substring(0, 10) + '...',
      userHeader: headersList.get('x-user-address')?.substring(0, 10) + '...',
      finalWallet: applicantWalletAddress?.substring(0, 10) + '...',
      hasSession: !!session,
      sessionDetails: session ? {
        hasUserId: !!session.address,
        hasAddress: !!session.address,
        userId: session.address?.substring(0, 10) + '...',
        address: session.address?.substring(0, 10) + '...'
      } : null
    });

    // Generar un slug único
    let slug = slugify(parsedData.data.title, { lower: true, strict: true });
    const existingProject = await db.query.projects.findFirst({
      where: (projects, { eq }) => eq(projects.slug, slug),
    });
    if (existingProject) {
      slug = `${slug}-${Date.now()}`;
    }

    // Insertar en la base de datos CON STATUS 'draft'
    const [newProject] = await db
      .insert(projectsSchema)
      .values({
        // --- Sección 1: Strings / Enums ---
        title: parsedData.data.title,
        description: parsedData.data.description,
        slug: slug,
        tagline: parsedData.data.tagline ?? null,
        businessCategory: parsedData.data.businessCategory ?? 'other',
        logoUrl: parsedData.data.logoUrl ?? null,
        coverPhotoUrl: parsedData.data.coverPhotoUrl ?? null,
        videoPitch: parsedData.data.videoPitch ?? null,

        // --- Sección 2: Strings ---
        website: parsedData.data.website ?? null,
        whitepaperUrl: parsedData.data.whitepaperUrl ?? null,
        twitterUrl: parsedData.data.twitterUrl ?? null,
        discordUrl: parsedData.data.discordUrl ?? null,
        telegramUrl: parsedData.data.telegramUrl ?? null,
        linkedinUrl: parsedData.data.linkedinUrl ?? null,

        // --- Sección 3: ¡LA CLAVE! Híbrido de Números y Strings ---
        targetAmount: parsedData.data.targetAmount.toString(), // Convertir a string
        totalValuationUsd: parsedData.data.totalValuationUsd?.toString() ?? null, // Convertir a string
        tokenPriceUsd: parsedData.data.tokenPriceUsd?.toString() ?? null, // Convertir a string

        totalTokens: parsedData.data.totalTokens ?? null, // Dejar como número
        tokensOffered: parsedData.data.tokensOffered ?? null, // Dejar como número

        tokenType: parsedData.data.tokenType ?? 'erc20',
        estimatedApy: parsedData.data.estimatedApy ?? null,
        yieldSource: parsedData.data.yieldSource ?? 'other',
        lockupPeriod: parsedData.data.lockupPeriod ?? null,
        fundUsage: parsedData.data.fundUsage ?? null,

        // --- Sección 4: JSONB (como Objetos/Arrays) y Strings ---
        teamMembers: parsedData.data.teamMembers ?? [], // Como Array
        advisors: parsedData.data.advisors ?? [], // Como Array
        tokenDistribution: parsedData.data.tokenDistribution ?? {}, // Como Objeto
        contractAddress: parsedData.data.contractAddress ?? null,
        treasuryAddress: parsedData.data.treasuryAddress ?? null,

        // --- Sección 5: Strings / Text ---
        legalStatus: parsedData.data.legalStatus ?? null,
        valuationDocumentUrl: parsedData.data.valuationDocumentUrl ?? null,
        fiduciaryEntity: parsedData.data.fiduciaryEntity ?? null,
        dueDiligenceReportUrl: parsedData.data.dueDiligenceReportUrl ?? null,

        // --- Sección 6: Booleans ---
        isMintable: parsedData.data.isMintable ?? false,
        isMutable: parsedData.data.isMutable ?? false,
        updateAuthorityAddress: parsedData.data.updateAuthorityAddress ?? null,

        // --- Sección 7: Strings y Booleans ---
        applicantName: parsedData.data.applicantName ?? null,
        applicantPosition: parsedData.data.applicantPosition ?? null,
        applicantEmail: parsedData.data.applicantEmail ?? null,
        applicantPhone: parsedData.data.applicantPhone ?? null,
        applicantWalletAddress: applicantWalletAddress,
        verificationAgreement: parsedData.data.verificationAgreement,

        // --- Campo de Estado: String (Enum) ---
        status: "draft", // FORZAR COMO DRAFT PARA GUARDAR BORRADORES
      })
      .returning();

    console.log('✅ Project saved with applicantWalletAddress:', newProject?.applicantWalletAddress);

    // Ensure applicantWalletAddress is properly saved (defensive programming)
    if (applicantWalletAddress && newProject && newProject.applicantWalletAddress !== applicantWalletAddress) {
      console.warn('⚠️ Wallet address mismatch detected, updating project...');
      try {
        await db.execute(sql`
          UPDATE projects
          SET applicant_wallet_address = ${applicantWalletAddress}
          WHERE id = ${newProject.id}
        `);
        console.log('✅ Fixed wallet address for project:', newProject.id);
      } catch (fixError) {
        console.error('❌ Failed to fix wallet address:', fixError);
      }
    }

    // TEMPORARY FIX: Correct existing project with missing data
    // This is a one-time fix for the existing "BlockBunny" project
    try {
      const existingProjectsWithIssues = await db.execute(sql`
        SELECT id, title, applicant_wallet_address, target_amount, raised_amount, slug, status
        FROM projects
        WHERE applicant_wallet_address IS NULL OR applicant_wallet_address = '' OR target_amount IS NULL OR raised_amount IS NULL
      `);

      if (existingProjectsWithIssues.length > 0) {
        console.log('🔧 Found projects with missing data:', existingProjectsWithIssues.length);

        for (const project of existingProjectsWithIssues) {
          // For the BlockBunny project, ensure all required data is present
          if (project.title === 'BlockBunny' && applicantWalletAddress) {
            await db.execute(sql`
              UPDATE projects
              SET applicant_wallet_address = COALESCE(applicant_wallet_address, ${applicantWalletAddress}),
                  applicant_name = COALESCE(applicant_name, ${applicantWalletAddress}),
                  target_amount = COALESCE(target_amount, '1000000.00'),
                  raised_amount = COALESCE(raised_amount, '0.00'),
                  slug = COALESCE(slug, 'blockbunny'),
                  status = COALESCE(status, 'approved')
              WHERE id = ${project.id}
            `);
            console.log('✅ Fixed BlockBunny project data for project:', project.id);
          }
        }
      }
    } catch (fixError) {
      console.error('❌ Failed to fix existing projects:', fixError);
    }

    // Update user role to 'applicant' if they have projects now
    if (applicantWalletAddress) {
      try {
        // Check if user has any projects (including this new one)
        const userProjects = await db.query.projects.findMany({
          where: (projects, { eq }) => eq(projects.applicantWalletAddress, applicantWalletAddress),
        });

        // If user has projects and is not admin, they should be 'applicant'
        if (userProjects.length > 0) {
          console.log('🔄 User role will be calculated as applicant for wallet:', applicantWalletAddress);
          // Note: The role is calculated dynamically in /api/profile, so no need to store it in DB
          // The frontend will get the updated role on next profile fetch
        }
      } catch (roleError) {
        console.error('⚠️ Error checking user role:', roleError);
        // Don't fail the project creation if role check fails
      }
    }

    // 🎯 GAMIFICATION: Otorgar puntos por aplicación de proyecto (+50 tokens)
    if (applicantWalletAddress) {
      try {
        // Importar dinámicamente para evitar problemas de dependencias circulares
        const { trackGamificationEvent } = await import('@/lib/gamification/service');

        await trackGamificationEvent(
          applicantWalletAddress,
          'project_application_submitted',
          {
            projectId: newProject?.id?.toString() ?? 'unknown',
            projectTitle: parsedData.data.title,
            businessCategory: parsedData.data.businessCategory,
            targetAmount: parsedData.data.targetAmount,
            isPublicApplication: true,
            submissionType: 'utility_form_draft'
          }
        );

        console.log(`🎉 Gamification event tracked for ${applicantWalletAddress}: +50 points for project application`);
      } catch (gamificationError) {
        console.warn('⚠️ Failed to track project application gamification event:', gamificationError);
        // No fallamos la creación del proyecto si falla la gamificación
      }

      // 🎯 UPDATE REFERRAL PROGRESS: Actualizar progreso de referidos cuando aplican proyecto
      try {
        const { GamificationService } = await import('@/lib/gamification/service');
        await GamificationService.checkReferralProgressForAchievements(applicantWalletAddress);
        console.log(`✅ Referral progress updated for project application: ${applicantWalletAddress.slice(0, 6)}...`);
      } catch (referralError) {
        console.warn('⚠️ Failed to update referral progress for project application:', referralError);
        // No bloquear la creación del proyecto si falla la actualización de referidos
      }
    }

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("Error al guardar el borrador del proyecto:", error);

    // Check if it's a quota issue - More comprehensive check
    if (error instanceof Error && (
      error.message.includes('quota') ||
      error.message.includes('limit') ||
      error.message.includes('exceeded') ||
      error.message.includes('rate limit') ||
      error.message.includes('too many') ||
      error.message.includes('connection pool') ||
      error.message.includes('timeout')
    )) {
      return NextResponse.json({
        message: "Database quota exceeded",
        error: "Your database plan has reached its data transfer limit. Please upgrade your plan or contact support.",
        quotaExceeded: true
      }, { status: 503 }); // Service Unavailable
    }

    return NextResponse.json(
      {
        message: "Error interno del servidor.",
      },
      { status: 500 }
    );
  }
}
