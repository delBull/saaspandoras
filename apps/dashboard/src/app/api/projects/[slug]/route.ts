import { NextResponse } from "next/server";
import { db } from "~/db";
import { sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';

// Type for project data - Updated with new optimized fields
interface ProjectData {
  id: number | string;
  title: string;
  slug: string;
  logo_url?: string | null;
  cover_photo_url?: string | null;
  tagline?: string | null;
  description: string;
  business_category?: string | null;
  video_pitch?: string | null;
  website?: string | null;
  whitepaper_url?: string | null;
  twitter_url?: string | null;
  discord_url?: string | null;
  telegram_url?: string | null;
  linkedin_url?: string | null;
  target_amount?: string | number | null;
  total_valuation_usd?: string | number | null;
  token_type?: string | null;
  total_tokens?: string | number | null;
  tokens_offered?: string | number | null;
  token_price_usd?: string | number | null;
  estimated_apy?: string | null;
  yield_source?: string | null;
  lockup_period?: string | null;
  fund_usage?: string | null;
  team_members?: string | null;
  advisors?: string | null;
  token_distribution?: string | null;
  contract_address?: string | null;
  treasury_address?: string | null;
  legal_status?: string | null;
  valuation_document_url?: string | null;
  fiduciary_entity?: string | null;
  due_diligence_report_url?: string | null;
  is_mintable?: boolean | null;
  is_mutable?: boolean | null;
  update_authority_address?: string | null;
  applicant_name?: string | null;
  applicant_position?: string | null;
  applicant_email?: string | null;
  applicant_phone?: string | null;
  applicant_wallet_address?: string | null;
  verification_agreement?: boolean | null;
  // New optimized fields
  protoclMecanism?: string | null;
  artefactUtility?: string | null;
  worktoearnMecanism?: string | null;
  integrationPlan?: boolean | null;
  monetizationModel?: string | null;
  adquireStrategy?: string | null;
  mitigationPlan?: string | null;
  recurring_rewards?: string | null;
  integration_details?: string | null;
  legal_entity_help?: boolean | null;
  image_url?: string | null;
  socials?: string | null;
  raised_amount?: string | number | null;
  returns_paid?: string | number | null;
  status: string;
  featured?: boolean | null;
  featured_button_text?: string | null;
  created_at?: string | Date | null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    console.log('🔍 API: Fetching project with slug:', slug);

    const projectResult = await db.query.projects.findFirst({
      where: (projects, { eq }) => eq(projects.slug, slug)
    });

    if (projectResult) {
      console.log('✅ API: Project found:', (projectResult as any).title);

      try {
        // Map Drizzle ORM's camelCase to the snake_case expected by frontend ProjectData interface
        const mappedProject = {
          ...projectResult,
          logo_url: projectResult.logoUrl,
          cover_photo_url: projectResult.coverPhotoUrl,
          business_category: projectResult.businessCategory,
          video_pitch: projectResult.videoPitch,
          whitepaper_url: projectResult.whitepaperUrl,
          twitter_url: projectResult.twitterUrl,
          discord_url: projectResult.discordUrl,
          telegram_url: projectResult.telegramUrl,
          linkedin_url: projectResult.linkedinUrl,
          target_amount: projectResult.targetAmount,
          total_valuation_usd: projectResult.totalValuationUsd,
          token_type: projectResult.tokenType,
          total_tokens: projectResult.totalTokens,
          tokens_offered: projectResult.tokensOffered,
          token_price_usd: projectResult.tokenPriceUsd,
          estimated_apy: projectResult.estimatedApy,
          yield_source: projectResult.yieldSource,
          lockup_period: projectResult.lockupPeriod,
          fund_usage: projectResult.fundUsage,
          team_members: projectResult.teamMembers,
          token_distribution: projectResult.tokenDistribution,
          contract_address: projectResult.contractAddress,
          legal_status: projectResult.legalStatus,
          valuation_document_url: projectResult.valuationDocumentUrl,
          fiduciary_entity: projectResult.fiduciaryEntity,
          due_diligence_report_url: projectResult.dueDiligenceReportUrl,
          is_mintable: projectResult.isMintable,
          is_mutable: projectResult.isMutable,
          update_authority_address: projectResult.updateAuthorityAddress,
          applicant_name: projectResult.applicantName,
          applicant_position: projectResult.applicantPosition,
          applicant_email: projectResult.applicantEmail,
          applicant_phone: projectResult.applicantPhone,
          applicant_wallet_address: projectResult.applicantWalletAddress,
          verification_agreement: projectResult.verificationAgreement,
          integration_details: projectResult.integrationDetails,
          legal_entity_help: projectResult.legalEntityHelp,
          image_url: projectResult.imageUrl,
          raised_amount: projectResult.raisedAmount,
          returns_paid: projectResult.returnsPaid,
          featured_button_text: projectResult.featuredButtonText,
          created_at: projectResult.createdAt,
          w2eConfig: projectResult.w2eConfig,

          // Technical / Governance Addresses
          registryContractAddress: (projectResult as any).registryContractAddress ?? null,
          governorContractAddress: (projectResult as any).governorContractAddress ?? (projectResult as any).votingContractAddress ?? null,
          tokenContractAddress: (projectResult as any).contractAddress ?? null,
          timelockContractAddress: (projectResult as any).loomContractAddress ?? null,

          // V2 Protocol Fields
          protocol_version: (projectResult as any).protocolVersion
            ?? ((projectResult.w2eConfig as any)?.artifacts?.length > 0 ? 2 : 1),
          artifacts: (projectResult as any).artifacts ?? (projectResult.w2eConfig as any)?.artifacts ?? [],
          pageLayoutType: (() => {
            const raw = (projectResult as any).pageLayoutType ?? (projectResult.w2eConfig as any)?.pageLayoutType ?? 'Access';
            // Capitalize first letter to match ProtocolLayoutType
            return (raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()) as any;
          })(),
        };

        return NextResponse.json(mappedProject);
      } catch (mappingError) {
        console.error('❌ API: Error mapping project data:', mappingError);
        return NextResponse.json({ error: 'Data mapping error', details: String(mappingError) }, { status: 500 });
      }
    }

    console.log('⚠️ API: Project not found for slug:', slug);
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  } catch (error) {
    console.error('❌ API: Error fetching project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
