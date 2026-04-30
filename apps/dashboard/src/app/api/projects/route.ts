import { NextResponse } from "next/server";
import { db } from "~/db";
import { projects } from "~/db/schema";
import { inArray, desc, ne, and, eq, or } from "drizzle-orm";
import { getAuth, isAdmin } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { session } = await getAuth(await headers());
    const userWallet = session?.address?.toLowerCase();
    const userIsAdmin = userWallet ? await isAdmin(userWallet) : false;

    console.log('🔍 Projects API: Request from', userWallet || 'Public');

    try {
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
          featuredButtonText: projects.featuredButtonText,
          protoclMecanism: projects.protoclMecanism,
          artefactUtility: projects.artefactUtility,
          worktoearnMecanism: projects.worktoearnMecanism,
          monetizationModel: projects.monetizationModel,
          adquireStrategy: projects.adquireStrategy,
          legalConfig: projects.legalConfig
        })
        .from(projects)
        .where(
          and(
            eq(projects.isDeleted, false),
            ne(projects.businessCategory, 'infrastructure'),
            or(
              userIsAdmin ? eq(projects.isDeleted, false) : undefined,
              userWallet ? eq(projects.applicantWalletAddress, userWallet) : undefined,
              inArray(projects.status, ['approved', 'live', 'completed'])
            )
          )
        )
        .orderBy(desc(projects.createdAt));

      // REDACTION: Redact sensitive info if not admin and not owner
      const sanitizedProjects = projectsData.map(p => {
        const isOwner = userWallet && p.applicantWalletAddress?.toLowerCase() === userWallet;
        const canSeeDetails = userIsAdmin || isOwner;

        if (canSeeDetails) return p;

        return {
          ...p,
          applicantEmail: null,
          applicantPhone: null,
          applicantName: p.applicantName ? `${p.applicantName.split(' ')[0]}...` : null,
          treasuryAddress: p.treasuryAddress ? `${p.treasuryAddress.substring(0, 6)}...${p.treasuryAddress.slice(-4)}` : null,
        };
      });

      return NextResponse.json(sanitizedProjects);
    } catch (queryError) {
      console.error('❌ Projects API: Query failed:', queryError);
      return NextResponse.json({ message: "Error al consultar proyectos" }, { status: 500 });
    }
  } catch (error) {
    console.error("💥 Projects API: Critical error:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}