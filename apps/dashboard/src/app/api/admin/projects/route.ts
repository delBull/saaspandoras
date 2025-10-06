/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { NextResponse } from "next/server";
import { db } from "~/db";

// ⚠️ EXPLICITAMENTE USAR Node.js RUNTIME para APIs que usan PostgreSQL
export const runtime = "nodejs";
import { projects as projectsSchema } from "~/db/schema";
import { sql } from "drizzle-orm";
import { projectApiSchema } from "@/lib/project-schema-api";
import { getAuth, isAdmin } from "@/lib/auth";
import { headers } from "next/headers";
import slugify from "slugify";

export async function GET(_request: Request) {
  try {
    console.log('🔍 Admin API: Starting GET request...');

    // TEMPORAL: Skip auth for debugging
    console.log('🔍 Admin API: ⚠️ TEMPORAL: Skipping auth for debugging');

    console.log('🔍 Admin API: Fetching projects from database...');

    // Test simple query first
    try {
      const testQuery = await db.execute(sql`SELECT COUNT(*) as count FROM projects`);
      console.log('✅ Admin API: Database connection test passed, projects count:', testQuery[0]);
    } catch (dbError) {
      console.error('❌ Admin API: Database connection failed:', dbError);
      return NextResponse.json(
        { message: "Database connection failed", error: dbError instanceof Error ? dbError.message : 'Unknown DB error' },
        { status: 500 }
      );
    }

    // Try simple query first
    try {
      const projectsData = await db.query.projects.findMany({
        orderBy: (projects, { desc }) => desc(projects.createdAt),
      });
      console.log(`📊 Admin API: Found ${projectsData.length} projects`);
      console.log('📊 Admin API: Projects data:', projectsData.slice(0, 2)); // Log first 2 projects

      return NextResponse.json(projectsData);
    } catch (queryError) {
      console.error('❌ Admin API: Query failed, trying simpler query:', queryError);

      // Try even simpler query
      try {
        const simpleProjects = await db.execute(sql`SELECT id, title, status FROM projects ORDER BY created_at DESC`);
        console.log(`📊 Admin API: Simple query found ${simpleProjects.length} projects`);
        return NextResponse.json(simpleProjects);
      } catch (simpleError) {
        console.error('❌ Admin API: Even simple query failed:', simpleError);
        return NextResponse.json(
          { message: "Query failed", error: simpleError instanceof Error ? simpleError.message : 'Unknown query error' },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("💥 Admin API: Critical error:", error);
    console.error("💥 Admin API: Error stack:", error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { message: "Error interno del servidor", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { session } = await getAuth(await headers());
  const userIsAdmin = await isAdmin(session?.userId);

  if (!userIsAdmin) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
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


    // Generar un slug único
    let slug = slugify(title, { lower: true, strict: true });
    const existingProject = await db.query.projects.findFirst({
      where: (projects, { eq }) => eq(projects.slug, slug),
    });
    if (existingProject) {
      slug = `${slug}-${Date.now()}`;
    }

    // Get creator information for better project tracking
    const creatorWallet = session?.userId ?? 'system';
    const creatorInfo = await db.execute(sql`
      SELECT "name", "email" FROM "User" WHERE "walletAddress" = ${creatorWallet}
    `);
    const creatorName = creatorInfo[0] ? String((creatorInfo[0] as Record<string, unknown>).name) : 'Unknown';

    console.log(`🏗️ Project created by: ${creatorWallet} (${creatorName})`);

    // Insertar en la base de datos con estado 'approved' and creator tracking
    const [newProject] = await db
      .insert(projectsSchema)
      // .values() espera un ARRAY de objetos
      .values({
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
        applicantWalletAddress: creatorWallet.toLowerCase(), // 🔥 Normalizada a lowercase para consistencia
        verificationAgreement: data.verificationAgreement,

        // --- Campo de Estado: String (Enum) ---
        status: "approved",
      })
      .returning();

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("Error al crear el proyecto (admin):", error);
    return NextResponse.json(
      { message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
