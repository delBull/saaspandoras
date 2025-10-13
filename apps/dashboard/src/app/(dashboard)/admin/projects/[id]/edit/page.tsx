import { notFound } from "next/navigation";
import { db } from "~/db";
import { projects as projectsSchema } from "~/db/schema";
import { eq } from "drizzle-orm";
import { MultiStepForm } from "./multi-step-form";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;

  try {
    // Temporarily disable admin check for testing
    // const { session } = await getAuth();
    // if (!await isAdmin(session?.userId)) notFound();

    let project = null;
    if (id !== "new") {
      const projectId = Number(id);
      if (isNaN(projectId)) notFound();

      const result = await db
        .select({
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
        })
        .from(projectsSchema)
        .where(eq(projectsSchema.id, projectId))
        .limit(1);

      project = result[0] ?? null;
      if (!project) {
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
