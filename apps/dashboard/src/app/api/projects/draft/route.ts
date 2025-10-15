import { NextResponse } from "next/server";
import { db } from "~/db";

// ⚠️ EXPLICITAMENTE USAR Node.js RUNTIME para APIs que usan PostgreSQL
export const runtime = "nodejs";
import { projects as projectsSchema } from "@/db/schema";
import { projectApiSchema } from "@/lib/project-schema-api";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
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
