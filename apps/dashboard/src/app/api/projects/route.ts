import { NextResponse } from "next/server";
import { db } from "~/db";
import { projects } from "~/db/schema";
import { inArray, desc, ne, and, eq } from "drizzle-orm";

export const dynamic = 'force-dynamic'; // Asegura que la ruta sea siempre dinámica

export async function GET() {
  try {
    console.log('🔍 Public API: Starting GET request...');

    // Test database connection first - handle quota exceeded gracefully
    try {
      await db.select({ test: projects.id }).from(projects).limit(1);
      console.log('✅ Public API: Database connection test passed');
    } catch (dbError) {
      console.error('❌ Public API: Database connection failed:', dbError);

      // Check if it's a quota issue
      if (dbError instanceof Error && dbError.message.includes('quota')) {
        return NextResponse.json(
          {
            message: "Database quota exceeded",
            error: "Your database plan has reached its data transfer limit. Please upgrade your plan or contact support.",
            quotaExceeded: true
          },
          { status: 503 } // Service Unavailable
        );
      }

      return NextResponse.json(
        { message: "Database connection failed", error: dbError instanceof Error ? dbError.message : 'Unknown DB error' },
        { status: 500 }
      );
    }

    console.log('🔍 Public API: Fetching projects from database...');

    // Use Drizzle ORM query builder for proper field mapping
    try {
      console.log('🔍 Public API: Executing Drizzle query with proper field mapping...');

      const projectsData = await db
        .select({
          id: projects.id,
          title: projects.title,
          description: projects.description,
          status: projects.status,
          createdAt: projects.createdAt,
          businessCategory: projects.businessCategory,
          logoUrl: projects.logoUrl,
          coverPhotoUrl: projects.coverPhotoUrl,
          applicantWalletAddress: projects.applicantWalletAddress,
          targetAmount: projects.targetAmount,
          raisedAmount: projects.raisedAmount,
          slug: projects.slug,
          applicantName: projects.applicantName,
          applicantEmail: projects.applicantEmail,
          applicantPhone: projects.applicantPhone,
          featured: projects.featured,
          tagline: projects.tagline,
          website: projects.website,
          whitepaperUrl: projects.whitepaperUrl,
          twitterUrl: projects.twitterUrl,
          discordUrl: projects.discordUrl,
          telegramUrl: projects.telegramUrl,
          linkedinUrl: projects.linkedinUrl,
          videoPitch: projects.videoPitch,
          teamMembers: projects.teamMembers,
          advisors: projects.advisors,
          tokenDistribution: projects.tokenDistribution,
          contractAddress: projects.contractAddress,
          treasuryAddress: projects.treasuryAddress,
          legalStatus: projects.legalStatus,
          valuationDocumentUrl: projects.valuationDocumentUrl,
          fiduciaryEntity: projects.fiduciaryEntity,
          dueDiligenceReportUrl: projects.dueDiligenceReportUrl,
          tokenType: projects.tokenType,
          totalTokens: projects.totalTokens,
          tokensOffered: projects.tokensOffered,
          tokenPriceUsd: projects.tokenPriceUsd,
          estimatedApy: projects.estimatedApy,
          yieldSource: projects.yieldSource,
          lockupPeriod: projects.lockupPeriod,
          fundUsage: projects.fundUsage,
          isMintable: projects.isMintable,
          isMutable: projects.isMutable,
          updateAuthorityAddress: projects.updateAuthorityAddress,
          verificationAgreement: projects.verificationAgreement,
          totalValuationUsd: projects.totalValuationUsd,
          applicantPosition: projects.applicantPosition,
          imageUrl: projects.imageUrl,
          socials: projects.socials,
          returnsPaid: projects.returnsPaid,
          featuredButtonText: projects.featuredButtonText
        })
        .from(projects)
        .where(
          and(
            inArray(projects.status, ['pending', 'approved', 'live', 'completed']),
            ne(projects.businessCategory, 'infrastructure'), // Exclude NFT Passes/System contracts
            eq(projects.isDeleted, false)
          )
        )
        .orderBy(desc(projects.createdAt));

      console.log(`📊 Public API: Found ${projectsData.length} projects with Drizzle query`);

      if (projectsData.length > 0) {
        const firstProject = projectsData[0];
        console.log('📊 Public API: First project sample:', {
          id: firstProject?.id,
          title: firstProject?.title,
          applicantWalletAddress: firstProject?.applicantWalletAddress,
          status: firstProject?.status
        });

        // Enhanced debugging for wallet addresses
        console.log('📊 Public API: WALLET ADDRESSES DEBUG:', {
          totalProjects: projectsData.length,
          projectsWithWallet: projectsData.filter(p => p.applicantWalletAddress).length,
          projectsWithoutWallet: projectsData.filter(p => !p.applicantWalletAddress).length,
          sampleWallets: projectsData.slice(0, 3).map(p => ({
            id: p.id,
            title: p.title,
            wallet: p.applicantWalletAddress,
            walletLower: p.applicantWalletAddress?.toLowerCase()
          }))
        });
      }

      return NextResponse.json(projectsData);
    } catch (queryError) {
      console.error('❌ Public API: Drizzle query failed:', queryError);

      // Try basic diagnostic query
      try {
        const basicQuery = await db.select({ test: projects.id }).from(projects).limit(1);
        console.log('📊 Public API: Basic Drizzle query works:', basicQuery.length);

        return NextResponse.json({
          message: "Database connection works but projects query failed",
          basicQueryWorks: basicQuery.length > 0,
          error: queryError instanceof Error ? queryError.message : 'Unknown error'
        });
      } catch (basicError) {
        console.error('❌ Public API: Even basic Drizzle query failed:', basicError);
        return NextResponse.json(
          {
            message: "Database connection failed",
            error: basicError instanceof Error ? basicError.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("💥 Public API: Critical error:", error);
    console.error("💥 Public API: Error stack:", error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { message: "Error interno del servidor", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}