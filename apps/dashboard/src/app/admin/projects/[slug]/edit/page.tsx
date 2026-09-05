import { notFound } from "next/navigation";
import { db } from "~/db";
import { projects as projectsSchema } from "~/db/schema";
import { eq } from "drizzle-orm";
import { MultiStepForm } from "./multi-step-form";

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;

  try {
    // For now, allow access and let client-side handle authentication
    // This avoids server-side rendering issues with ThirdWeb auth

    let project = null;
    if (slug !== "new") {
      // Logic to support both Slug and ID (legacy links)
      const numericId = Number(slug);
      const isId = !isNaN(numericId);

      // Build the query
      // Note: We can't conditionally add .where() easily in method chaining without variable assignment
      // so we branch.

      const columns = {
        id: projectsSchema.id,
        title: projectsSchema.title,
        slug: projectsSchema.slug,
        logoUrl: projectsSchema.logoUrl,
        coverPhotoUrl: projectsSchema.coverPhotoUrl,
        tagline: projectsSchema.tagline,
        description: projectsSchema.description,
        businessCategory: projectsSchema.businessCategory,
        videoPitch: projectsSchema.videoPitch,
        website: projectsSchema.website,
        whitepaperUrl: projectsSchema.whitepaperUrl,
        twitterUrl: projectsSchema.twitterUrl,
        discordUrl: projectsSchema.discordUrl,
        telegramUrl: projectsSchema.telegramUrl,
        linkedinUrl: projectsSchema.linkedinUrl,
        targetAmount: projectsSchema.targetAmount,
        totalValuationUsd: projectsSchema.totalValuationUsd,
        tokenType: projectsSchema.tokenType,
        totalTokens: projectsSchema.totalTokens,
        tokensOffered: projectsSchema.tokensOffered,
        tokenPriceUsd: projectsSchema.tokenPriceUsd,
        estimatedApy: projectsSchema.estimatedApy,
        yieldSource: projectsSchema.yieldSource,
        lockupPeriod: projectsSchema.lockupPeriod,
        fundUsage: projectsSchema.fundUsage,
        teamMembers: projectsSchema.teamMembers,
        advisors: projectsSchema.advisors,
        tokenDistribution: projectsSchema.tokenDistribution,
        contractAddress: projectsSchema.contractAddress,
        treasuryAddress: projectsSchema.treasuryAddress,
        legalStatus: projectsSchema.legalStatus,
        valuationDocumentUrl: projectsSchema.valuationDocumentUrl,
        fiduciaryEntity: projectsSchema.fiduciaryEntity,
        dueDiligenceReportUrl: projectsSchema.dueDiligenceReportUrl,
        isMintable: projectsSchema.isMintable,
        isMutable: projectsSchema.isMutable,
        updateAuthorityAddress: projectsSchema.updateAuthorityAddress,
        applicantName: projectsSchema.applicantName,
        applicantPosition: projectsSchema.applicantPosition,
        applicantEmail: projectsSchema.applicantEmail,
        applicantPhone: projectsSchema.applicantPhone,
        applicantWalletAddress: projectsSchema.applicantWalletAddress,
        verificationAgreement: projectsSchema.verificationAgreement,
        imageUrl: projectsSchema.imageUrl,
        socials: projectsSchema.socials,
        raisedAmount: projectsSchema.raisedAmount,
        returnsPaid: projectsSchema.returnsPaid,
        status: projectsSchema.status,
        // featured: projectsSchema.featured,
        // featuredButtonText: projectsSchema.featuredButtonText,
        createdAt: projectsSchema.createdAt,
      };

      let result;

      if (isId) {
        result = await db
          .select(columns)
          .from(projectsSchema)
          .where(eq(projectsSchema.id, numericId))
          .limit(1);
      } else {
        result = await db
          .select(columns)
          .from(projectsSchema)
          .where(eq(projectsSchema.slug, slug))
          .limit(1);
      }

      project = result[0] ?? null;
      if (!project) {
        // Fallback: Check if it's a numeric ID passed in the slug position? 
        // Likely not needed if we enforce slugs. But to be safe:
        notFound();
      }
    }

    return (
      <MultiStepForm
        project={project}
        isEdit={!!project}
        apiEndpoint={project ? `/api/admin/projects/${project.id}` : "/api/admin/projects"}
        isPublic={false}
      />
    );
  } catch (error) {
    console.error(error);
    notFound();
  }
}
