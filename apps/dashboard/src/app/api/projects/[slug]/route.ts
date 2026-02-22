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

    let projectResult: any;

    try {
      projectResult = await db.query.projects.findFirst({
        where: (projects, { eq }) => eq(projects.slug, slug)
      });
    } catch (ormError) {
      console.warn('⚠️ API: ORM Error (legacy data?), trying raw SQL:', ormError);
      const { sql } = await import('drizzle-orm');
      const rawRes = await db.execute(sql`SELECT * FROM projects WHERE slug = ${slug} LIMIT 1`);
      if (rawRes && rawRes.length > 0) {
        projectResult = rawRes[0];
      }
    }

    if (projectResult) {
      console.log('✅ API: Project found:', (projectResult as any).title);
      console.log('📊 API: Project keys:', Object.keys(projectResult));

      try {
        const resolveIpfs = (url: any) => {
          if (typeof url === 'string' && url.startsWith('ipfs://')) {
            return url.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
          }
          return url;
        };

        // Safely parse w2eConfig if it's a string
        let parsedW2eConfig = projectResult.w2eConfig || {};
        if (typeof parsedW2eConfig === 'string') {
          try {
            parsedW2eConfig = JSON.parse(parsedW2eConfig);
          } catch (e) {
            console.warn('⚠️ API: Failed to parse w2eConfig string', e);
          }
        }

        // Map Drizzle ORM's camelCase to the snake_case expected by frontend ProjectData interface
        const mappedProject = {
          ...projectResult,
          id: projectResult.id ? Number(projectResult.id) : (projectResult as any).id,
          logo_url: resolveIpfs(projectResult.logoUrl || (projectResult as any).logo_url) || null,
          cover_photo_url: resolveIpfs(projectResult.coverPhotoUrl || (projectResult as any).cover_photo_url) || null,
          business_category: projectResult.businessCategory || null,
          video_pitch: projectResult.videoPitch || null,
          whitepaper_url: projectResult.whitepaperUrl || null,
          twitter_url: projectResult.twitterUrl || null,
          discord_url: projectResult.discordUrl || null,
          telegram_url: projectResult.telegramUrl || null,
          linkedin_url: projectResult.linkedinUrl || null,
          target_amount: projectResult.targetAmount || null,
          total_valuation_usd: projectResult.totalValuationUsd || null,
          token_type: projectResult.tokenType || null,
          total_tokens: projectResult.totalTokens || null,
          tokens_offered: projectResult.tokensOffered || null,
          token_price_usd: projectResult.tokenPriceUsd || null,
          estimated_apy: projectResult.estimatedApy || null,
          yield_source: projectResult.yieldSource || null,
          lockup_period: projectResult.lockupPeriod || null,
          fund_usage: projectResult.fundUsage || null,
          team_members: projectResult.teamMembers || [],
          token_distribution: projectResult.tokenDistribution || null,
          contract_address: projectResult.contractAddress || null,
          legal_status: projectResult.legalStatus || null,
          valuation_document_url: projectResult.valuationDocumentUrl || null,
          fiduciary_entity: projectResult.fiduciaryEntity || null,
          due_diligence_report_url: projectResult.dueDiligenceReportUrl || null,
          is_mintable: projectResult.isMintable || false,
          is_mutable: projectResult.isMutable || false,
          update_authority_address: projectResult.updateAuthorityAddress || null,
          applicant_name: projectResult.applicantName || null,
          applicant_position: projectResult.applicantPosition || null,
          applicant_email: projectResult.applicantEmail || null,
          applicant_phone: projectResult.applicantPhone || null,
          applicant_wallet_address: projectResult.applicantWalletAddress || null,
          verification_agreement: projectResult.verificationAgreement || false,
          integration_details: projectResult.integrationDetails || null,
          legal_entity_help: projectResult.legalEntityHelp || false,
          image_url: projectResult.imageUrl || null,
          raised_amount: projectResult.raisedAmount || "0.00",
          returns_paid: projectResult.returnsPaid || "0.00",
          featured_button_text: projectResult.featuredButtonText || null,
          created_at: projectResult.createdAt || null,
          w2eConfig: parsedW2eConfig,

          // Technical / Governance Addresses (with snake_case fallbacks)
          registryContractAddress: (projectResult as any).registryContractAddress || (projectResult as any).registry_contract_address || null,
          governorContractAddress: (projectResult as any).governorContractAddress || (projectResult as any).votingContractAddress ||
            (projectResult as any).governor_contract_address || (projectResult as any).voting_contract_address || null,
          tokenContractAddress: (projectResult as any).contractAddress || (projectResult as any).contract_address || null,
          timelockContractAddress: (projectResult as any).loomContractAddress || (projectResult as any).loom_contract_address || null,

          // V2 Protocol Fields with extreme safety
          protocol_version: (() => {
            if ((projectResult as any).protocolVersion) return Number((projectResult as any).protocolVersion);
            const artifacts = (projectResult as any).artifacts || parsedW2eConfig?.artifacts;
            return (Array.isArray(artifacts) && artifacts.length > 0) ? 2 : 1;
          })(),
          artifacts: Array.isArray((projectResult as any).artifacts)
            ? (projectResult as any).artifacts
            : Array.isArray(parsedW2eConfig?.artifacts)
              ? parsedW2eConfig.artifacts
              : [],
          pageLayoutType: (() => {
            const raw = (projectResult as any).pageLayoutType || parsedW2eConfig?.pageLayoutType || 'Access';
            if (typeof raw !== 'string') return 'Access';
            // Capitalize first letter to match ProtocolLayoutType
            return (raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()) as any;
          })(),
        };

        // Serialize manually to handle potential BigInts from database numeric fields
        const safeJson = JSON.stringify(mappedProject, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value
        );

        return new NextResponse(safeJson, {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
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
