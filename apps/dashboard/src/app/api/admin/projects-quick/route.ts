import { NextResponse } from "next/server";
import { db } from "~/db";

// ✨ ENDPOINT SIMPLIFICADO PARA ADMIN - MINIMAL VALIDATIONS
export const runtime = "nodejs";
import { projects as projectsSchema } from "@/db/schema";
import { getAuth, isAdmin } from "@/lib/auth";
import { headers } from "next/headers";
import slugify from "slugify";

export async function POST(request: Request) {
  try {
    // Admin check - minimal validation
    const { session } = await getAuth(await headers());
    const userIsAdmin = await isAdmin(session?.address ?? session?.userId);

    if (!userIsAdmin) {
      console.log('❌ Admin Quick API: Access denied');
      return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    // Parse data with minimal validation
    const body: unknown = await request.json();

    // Basic validation only - accept any data structure from admin
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    }

    // Interface for admin data (trust admin input)
    interface AdminProjectData {
      title?: string;
      description?: string;
      tagline?: string;
      businessCategory?: string;
      logoUrl?: string;
      coverPhotoUrl?: string;
      videoPitch?: string;
      website?: string;
      whitepaperUrl?: string;
      twitterUrl?: string;
      discordUrl?: string;
      telegramUrl?: string;
      linkedinUrl?: string;
      targetAmount?: number | string;
      totalValuationUsd?: number | string;
      tokenType?: string;
      totalTokens?: number | string;
      tokensOffered?: number | string;
      tokenPriceUsd?: number | string;
      estimatedApy?: string | number;
      yieldSource?: string;
      lockupPeriod?: string;
      fundUsage?: string;
      teamMembers?: unknown;
      advisors?: unknown;
      tokenDistribution?: unknown;
      contractAddress?: string;
      treasuryAddress?: string;
      legalStatus?: string;
      valuationDocumentUrl?: string;
      fiduciaryEntity?: string;
      dueDiligenceReportUrl?: string;
      isMintable?: boolean;
      isMutable?: boolean;
      updateAuthorityAddress?: string;
      applicantName?: string;
      applicantPosition?: string;
      applicantEmail?: string;
      applicantPhone?: string;
      applicantWalletAddress?: string;
      verificationAgreement?: boolean;
    }

    const data = body as Partial<AdminProjectData>;

    // Filter out any unwanted fields that might cause issues
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      // Filter out problematic fields
      if (['id', 'createdAt', 'updatedAt', 'created_at', 'updated_at'].includes(key)) {
        return acc;
      }
      // Type assertion needed for unknown -> specific type mapping in reduce
      acc[key as keyof AdminProjectData] = value as any;
      return acc;
    }, {} as Partial<AdminProjectData>);

    console.log('📨 Admin Quick API: Raw request data keys:', Object.keys(body));
    console.log('🧹 Admin Quick API: Cleaned data keys:', Object.keys(cleanData));
    console.log('👑 Admin Quick API: Creating project for admin:', session?.address?.substring(0, 10) + '...');

    // Minimal required fields
    if (!cleanData.title || !cleanData.description) {
      return NextResponse.json({
        message: "Título y descripción requeridos"
      }, { status: 400 });
    }

    // Generate slug
    let slug = slugify(cleanData.title, { lower: true, strict: true });
    const existingProject = await db.query.projects.findFirst({
      where: (projects, { eq }) => eq(projects.slug, slug),
    });
    if (existingProject) {
      slug = `${slug}-${Date.now()}`;
    }

    // Prepare data for insertion - convert to strings as needed
    // For admin, trust input and assign defaults for enum fields
    const preparedData = {
      title: cleanData.title,
      description: cleanData.description,
      slug: slug,
      tagline: cleanData.tagline ?? null,
      businessCategory: (cleanData.businessCategory as "other" | "residential_real_estate" | "commercial_real_estate" | "tech_startup" | "renewable_energy" | "art_collectibles" | "intellectual_property") ?? "other",
      logoUrl: cleanData.logoUrl ?? null,
      coverPhotoUrl: cleanData.coverPhotoUrl ?? null,
      videoPitch: cleanData.videoPitch ?? null,
      website: cleanData.website ?? null,
      whitepaperUrl: cleanData.whitepaperUrl ?? null,
      twitterUrl: cleanData.twitterUrl ?? null,
      discordUrl: cleanData.discordUrl ?? null,
      telegramUrl: cleanData.telegramUrl ?? null,
      linkedinUrl: cleanData.linkedinUrl ?? null,

      // Convert to strings for decimals
      targetAmount: cleanData.targetAmount?.toString() ?? "1",
      totalValuationUsd: cleanData.totalValuationUsd?.toString() ?? null,
      tokenPriceUsd: cleanData.tokenPriceUsd?.toString() ?? null,

      // Numbers stay as numbers
      totalTokens: typeof cleanData.totalTokens === 'string' ? parseInt(cleanData.totalTokens) : cleanData.totalTokens ?? null,
      tokensOffered: typeof cleanData.tokensOffered === 'string' ? parseInt(cleanData.tokensOffered) : cleanData.tokensOffered ?? null,

      tokenType: (cleanData.tokenType as "erc20" | "erc721" | "erc1155") ?? "erc20",
      estimatedApy: cleanData.estimatedApy?.toString() ?? null,
      yieldSource: (cleanData.yieldSource as "other" | "rental_income" | "capital_appreciation" | "dividends" | "royalties") ?? "other",
      lockupPeriod: cleanData.lockupPeriod ?? null,
      fundUsage: cleanData.fundUsage ?? null,

      // Keep as objects/arrays for JSONB
      teamMembers: Array.isArray(cleanData.teamMembers) ? cleanData.teamMembers : [],
      advisors: Array.isArray(cleanData.advisors) ? cleanData.advisors : [],
      tokenDistribution: typeof cleanData.tokenDistribution === 'object' ? cleanData.tokenDistribution : {},

      contractAddress: cleanData.contractAddress ?? null,
      treasuryAddress: cleanData.treasuryAddress ?? null,
      legalStatus: cleanData.legalStatus ?? null,
      valuationDocumentUrl: cleanData.valuationDocumentUrl ?? null,
      fiduciaryEntity: cleanData.fiduciaryEntity ?? null,
      dueDiligenceReportUrl: cleanData.dueDiligenceReportUrl ?? null,

      isMintable: Boolean(cleanData.isMintable ?? false),
      isMutable: Boolean(cleanData.isMutable ?? false),
      updateAuthorityAddress: cleanData.updateAuthorityAddress ?? (session?.address ?? session?.userId) ?? null,

      applicantName: cleanData.applicantName ?? 'Admin Created',
      applicantPosition: cleanData.applicantPosition ?? null,
      applicantEmail: cleanData.applicantEmail ?? null,
      applicantPhone: cleanData.applicantPhone ?? null,
      applicantWalletAddress: (session?.address ?? session?.userId)?.toLowerCase() ?? 'unknown',
      verificationAgreement: Boolean(cleanData.verificationAgreement ?? true),

      // Admin creates draft projects by default (for review)
      featured: false,
      status: "draft" as const,
    };

    console.log('📝 Admin Quick API: Prepared data:', preparedData);

    // Insert without heavy schema validation - type assertion for admin interface
    const [newProject] = await db
      .insert(projectsSchema)
      .values(preparedData)
      .returning();

    console.log('✅ Admin Quick API: Project created successfully:', newProject?.id ?? 'unknown');
    return NextResponse.json(newProject, { status: 201 });

  } catch (error) {
    console.error('❌ Admin Quick API Error:', error);

    // Check for quota issues
    if (error instanceof Error && (
      error.message.includes('quota') ||
      error.message.includes('limit') ||
      error.message.includes('exceeded')
    )) {
      return NextResponse.json({
        message: "Database quota exceeded",
        error: "Your database plan has reached its data transfer limit. Please upgrade your plan or contact support.",
        quotaExceeded: true
      }, { status: 503 });
    }

    return NextResponse.json({
      message: "Error interno del servidor",
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
