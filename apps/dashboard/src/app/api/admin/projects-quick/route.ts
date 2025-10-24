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

    // Minimal required fields
    if (!data.title || !data.description) {
      return NextResponse.json({
        message: "Título y descripción requeridos"
      }, { status: 400 });
    }

    console.log('🚀 Admin Quick API: Creating project for admin:', session?.address?.substring(0, 10) + '...');

    // Generate slug
    let slug = slugify(data.title, { lower: true, strict: true });
    const existingProject = await db.query.projects.findFirst({
      where: (projects, { eq }) => eq(projects.slug, slug),
    });
    if (existingProject) {
      slug = `${slug}-${Date.now()}`;
    }

    // Prepare data for insertion - convert to strings as needed
    // For admin, trust input and assign defaults for enum fields
    const preparedData = {
      title: data.title,
      description: data.description,
      slug: slug,
      tagline: data.tagline ?? null,
      businessCategory: (data.businessCategory as "other" | "residential_real_estate" | "commercial_real_estate" | "tech_startup" | "renewable_energy" | "art_collectibles" | "intellectual_property") ?? "other",
      logoUrl: data.logoUrl ?? null,
      coverPhotoUrl: data.coverPhotoUrl ?? null,
      videoPitch: data.videoPitch ?? null,
      website: data.website ?? null,
      whitepaperUrl: data.whitepaperUrl ?? null,
      twitterUrl: data.twitterUrl ?? null,
      discordUrl: data.discordUrl ?? null,
      telegramUrl: data.telegramUrl ?? null,
      linkedinUrl: data.linkedinUrl ?? null,

      // Convert to strings for decimals
      targetAmount: data.targetAmount?.toString() ?? "1",
      totalValuationUsd: data.totalValuationUsd?.toString() ?? null,
      tokenPriceUsd: data.tokenPriceUsd?.toString() ?? null,

      // Numbers stay as numbers
      totalTokens: typeof data.totalTokens === 'string' ? parseInt(data.totalTokens) : data.totalTokens ?? null,
      tokensOffered: typeof data.tokensOffered === 'string' ? parseInt(data.tokensOffered) : data.tokensOffered ?? null,

      tokenType: (data.tokenType as "erc20" | "erc721" | "erc1155") ?? "erc20",
      estimatedApy: data.estimatedApy?.toString() ?? null,
      yieldSource: (data.yieldSource as "other" | "rental_income" | "capital_appreciation" | "dividends" | "royalties") ?? "other",
      lockupPeriod: data.lockupPeriod ?? null,
      fundUsage: data.fundUsage ?? null,

      // Keep as objects/arrays for JSONB
      teamMembers: Array.isArray(data.teamMembers) ? data.teamMembers : [],
      advisors: Array.isArray(data.advisors) ? data.advisors : [],
      tokenDistribution: typeof data.tokenDistribution === 'object' ? data.tokenDistribution : {},

      contractAddress: data.contractAddress ?? null,
      treasuryAddress: data.treasuryAddress ?? null,
      legalStatus: data.legalStatus ?? null,
      valuationDocumentUrl: data.valuationDocumentUrl ?? null,
      fiduciaryEntity: data.fiduciaryEntity ?? null,
      dueDiligenceReportUrl: data.dueDiligenceReportUrl ?? null,

      isMintable: Boolean(data.isMintable ?? false),
      isMutable: Boolean(data.isMutable ?? false),
      updateAuthorityAddress: data.updateAuthorityAddress ?? (session?.address ?? session?.userId) ?? null,

      applicantName: data.applicantName ?? 'Admin Created',
      applicantPosition: data.applicantPosition ?? null,
      applicantEmail: data.applicantEmail ?? null,
      applicantPhone: data.applicantPhone ?? null,
      applicantWalletAddress: (session?.address ?? session?.userId)?.toLowerCase() ?? 'unknown' as string,
      verificationAgreement: Boolean(data.verificationAgreement ?? true),

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
