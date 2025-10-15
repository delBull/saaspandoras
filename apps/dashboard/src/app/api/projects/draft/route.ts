import { NextResponse } from "next/server";
import { db } from "~/db";
import { sql } from "drizzle-orm";

// ⚠️ EXPLICITAMENTE USAR Node.js RUNTIME para APIs que usan PostgreSQL
export const runtime = "nodejs";
import { projects as projectsSchema } from "@/db/schema";
import { projectApiSchema } from "@/lib/project-schema-api";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import slugify from "slugify";

// TEMPORARY ENDPOINT TO FIX AND INSPECT EXISTING PROJECTS
export async function GET() {
  try {
    console.log('🔧 TEMPORARY FIX: Starting comprehensive project data correction...');

    // First, let's see all projects and their current state
    const allProjects = await db.execute(sql`
      SELECT id, title, applicant_wallet_address, target_amount, raised_amount, slug, status, description, business_category, created_at
      FROM projects
      ORDER BY created_at DESC
    `);

    console.log('🔍 ALL PROJECTS INSPECTION:', allProjects);

    // Find projects with missing or incomplete data
    const projectsWithIssues = await db.execute(sql`
      SELECT id, title, applicant_wallet_address, target_amount, raised_amount, slug, status, description, business_category
      FROM projects
      WHERE applicant_wallet_address IS NULL OR applicant_wallet_address = ''
         OR target_amount IS NULL OR target_amount = ''
         OR raised_amount IS NULL OR raised_amount = ''
         OR slug IS NULL OR slug = ''
    `);

    console.log('🔧 Found projects with issues:', projectsWithIssues.length);

    if (projectsWithIssues.length === 0) {
      return NextResponse.json({
        message: 'No projects need fixing',
        fixed: 0,
        allProjects: allProjects,
        projectsWithIssues: projectsWithIssues
      });
    }

    let fixedCount = 0;

    for (const project of projectsWithIssues) {
      // For BlockBunny project, ensure all required data is present
      if (project.title === 'BlockBunny') {
        const correctWalletAddress = '0x121a897f0f5a9b7c44756f40bdb2c8e87d2834fa'; // User's wallet

        await db.execute(sql`
          UPDATE projects
          SET applicant_wallet_address = COALESCE(applicant_wallet_address, ${correctWalletAddress}),
              target_amount = COALESCE(target_amount, '1000000.00'),
              raised_amount = COALESCE(raised_amount, '0.00'),
              slug = COALESCE(slug, 'blockbunny'),
              status = COALESCE(status, 'approved'),
              description = COALESCE(description, 'BlockBunny es un casino enfocado en la comunidad web3'),
              business_category = COALESCE(business_category, 'tech_startup')
          WHERE id = ${project.id}
        `);

        console.log('✅ Fixed BlockBunny project:', project.id, 'with complete data');
        fixedCount++;
      }
    }

    // Get updated project list after fixes
    const updatedProjects = await db.execute(sql`
      SELECT id, title, applicant_wallet_address, target_amount, raised_amount, slug, status, description, business_category, created_at
      FROM projects
      ORDER BY created_at DESC
    `);

    return NextResponse.json({
      message: `Fixed ${fixedCount} projects with complete data correction`,
      totalFound: projectsWithIssues.length,
      fixed: fixedCount,
      beforeFix: allProjects,
      afterFix: updatedProjects
    });

  } catch (error) {
    console.error('❌ Error in temporary fix endpoint:', error);
    return NextResponse.json(
      { message: 'Error fixing projects', error: String(error) },
      { status: 500 }
    );
  }
}

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

    // Intentar múltiples fuentes para obtener la wallet address
    const applicantWalletAddress =
      session?.userId ??
      headersList.get('x-thirdweb-address') ??
      headersList.get('x-wallet-address') ??
      headersList.get('x-user-address') ??
      null;

    console.log('🔍 DRAFT API: Wallet sources check:', {
      sessionUserId: session?.userId?.substring(0, 10) + '...',
      thirdwebHeader: headersList.get('x-thirdweb-address')?.substring(0, 10) + '...',
      walletHeader: headersList.get('x-wallet-address')?.substring(0, 10) + '...',
      userHeader: headersList.get('x-user-address')?.substring(0, 10) + '...',
      finalWallet: applicantWalletAddress?.substring(0, 10) + '...'
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

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("Error al guardar el borrador del proyecto:", error);
    return NextResponse.json(
      {
        message: "Error interno del servidor.",
      },
      { status: 500 }
    );
  }
}
