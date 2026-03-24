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

    const projectId = Number(slug);
    const isId = !isNaN(projectId);

    try {
      if (isId) {
        projectResult = await db.query.projects.findFirst({
          where: (projects, { eq, and }) => and(eq(projects.id, projectId), eq(projects.isDeleted, false))
        });
      } else {
        projectResult = await db.query.projects.findFirst({
          where: (projects, { eq, and }) => and(eq(projects.slug, slug), eq(projects.isDeleted, false))
        });
      }
    } catch (ormError) {
      console.warn('⚠️ API: ORM Error (legacy data?), trying raw SQL:', ormError);
      const { sql } = await import('drizzle-orm');
      if (isId) {
        const rawRes = await db.execute(sql`SELECT * FROM projects WHERE id = ${projectId} AND is_deleted = false LIMIT 1`);
        if (rawRes && rawRes.length > 0) projectResult = rawRes[0];
      } else {
        const rawRes = await db.execute(sql`SELECT * FROM projects WHERE slug = ${slug} AND is_deleted = false LIMIT 1`);
        if (rawRes && rawRes.length > 0) projectResult = rawRes[0];
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
          tagline: projectResult.tagline || (projectResult as any).tagline || null,
          description: projectResult.description || (projectResult as any).description || '',
          business_category: projectResult.businessCategory || (projectResult as any).business_category || null,
          video_pitch: projectResult.videoPitch || (projectResult as any).video_pitch || (projectResult as any).video_url || null,
          website: projectResult.website || (projectResult as any).website || null,
          whitepaper_url: projectResult.whitepaperUrl || (projectResult as any).whitepaper_url || null,
          twitter_url: projectResult.twitterUrl || (projectResult as any).twitter_url || null,
          discord_url: projectResult.discordUrl || (projectResult as any).discord_url || null,
          telegram_url: projectResult.telegramUrl || (projectResult as any).telegram_url || null,
          linkedin_url: projectResult.linkedinUrl || (projectResult as any).linkedin_url || null,
          target_amount: projectResult.targetAmount || (projectResult as any).target_amount || "0.00",
          total_valuation_usd: projectResult.totalValuationUsd || (projectResult as any).total_valuation_usd || null,
          token_type: projectResult.tokenType || (projectResult as any).token_type || 'erc20',
          total_tokens: projectResult.totalTokens || (projectResult as any).total_tokens || null,
          tokens_offered: projectResult.tokensOffered || (projectResult as any).tokens_offered || null,
          token_price_usd: projectResult.tokenPriceUsd || (projectResult as any).token_price_usd || null,
          estimated_apy: projectResult.estimatedApy || (projectResult as any).estimated_apy || null,
          yield_source: projectResult.yieldSource || (projectResult as any).yield_source || null,
          lockup_period: projectResult.lockupPeriod || (projectResult as any).lockup_period || null,
          fund_usage: projectResult.fundUsage || (projectResult as any).fund_usage || null,
          team_members: projectResult.teamMembers ? (typeof projectResult.teamMembers === 'string' ? projectResult.teamMembers : JSON.stringify(projectResult.teamMembers)) : null,
          advisors: projectResult.advisors ? (typeof projectResult.advisors === 'string' ? projectResult.advisors : JSON.stringify(projectResult.advisors)) : null,
          token_distribution: projectResult.tokenDistribution || null,
          contract_address: projectResult.contractAddress || (projectResult as any).contract_address || null,
          licenseContractAddress: projectResult.licenseContractAddress || (projectResult as any).license_contract_address || null,
          treasury_address: projectResult.treasuryAddress || (projectResult as any).treasury_address || null,
          legal_status: projectResult.legalStatus || (projectResult as any).legal_status || null,
          valuation_document_url: projectResult.valuationDocumentUrl || (projectResult as any).valuation_document_url || null,
          fiduciary_entity: projectResult.fiduciaryEntity || (projectResult as any).fiduciary_entity || null,
          due_diligence_report_url: projectResult.dueDiligenceReportUrl || (projectResult as any).due_diligence_report_url || null,
          is_mintable: projectResult.isMintable ?? (projectResult as any).is_mintable ?? false,
          is_mutable: projectResult.isMutable ?? (projectResult as any).is_mutable ?? false,
          update_authority_address: projectResult.updateAuthorityAddress || (projectResult as any).update_authority_address || null,
          applicant_name: projectResult.applicantName || (projectResult as any).applicant_name || null,
          applicant_position: projectResult.applicantPosition || (projectResult as any).applicant_position || null,
          applicant_email: projectResult.applicantEmail || (projectResult as any).applicant_email || null,
          applicant_phone: projectResult.applicantPhone || (projectResult as any).applicant_phone || null,
          applicant_wallet_address: projectResult.applicantWalletAddress || (projectResult as any).applicant_wallet_address || null,
          verification_agreement: projectResult.verificationAgreement ?? (projectResult as any).verification_agreement ?? false,
          integration_details: projectResult.integrationDetails || (projectResult as any).integration_details || null,
          legal_entity_help: projectResult.legalEntityHelp ?? (projectResult as any).legal_entity_help ?? false,
          image_url: projectResult.imageUrl || (projectResult as any).image_url || null,
          raised_amount: projectResult.raisedAmount || (projectResult as any).raised_amount || "0.00",
          returns_paid: projectResult.returnsPaid || (projectResult as any).returns_paid || "0.00",
          featured_button_text: projectResult.featuredButtonText || (projectResult as any).featured_button_text || null,
          
          // --- Mapeo de nuevos campos ---
          protoclMecanism: projectResult.protoclMecanism || (projectResult as any).protocl_mecanism || null,
          artefactUtility: projectResult.artefactUtility || (projectResult as any).artefact_utility || null,
          worktoearnMecanism: projectResult.worktoearnMecanism || (projectResult as any).worktoearn_mecanism || null,
          monetizationModel: projectResult.monetizationModel || (projectResult as any).monetization_model || null,
          adquireStrategy: projectResult.adquireStrategy || (projectResult as any).adquire_strategy || null,
          mitigationPlan: projectResult.mitigationPlan || (projectResult as any).mitigation_plan || null,
          recurring_rewards: projectResult.recurringRewards || (projectResult as any).recurring_rewards || null,
          
          created_at: projectResult.createdAt || (projectResult as any).created_at || null,
          w2eConfig: parsedW2eConfig,

          // Technical / Governance Addresses (with snake_case fallbacks)
          registryContractAddress: projectResult.registryContractAddress || (projectResult as any).registry_contract_address || null,
          governorContractAddress: projectResult.governorContractAddress || (projectResult as any).votingContractAddress ||
            (projectResult as any).governor_contract_address || (projectResult as any).voting_contract_address || null,
          tokenContractAddress: projectResult.contractAddress || (projectResult as any).contract_address || null,
          timelockContractAddress: projectResult.loomContractAddress || (projectResult as any).loom_contract_address || null,
          utilityContractAddress: projectResult.utilityContractAddress || (projectResult as any).utility_contract_address || null,

          // V2 Protocol Fields with extreme safety
          protocol_version: (() => {
            if (projectResult.protocolVersion) return Number(projectResult.protocolVersion);
            if ((projectResult as any).protocol_version) return Number((projectResult as any).protocol_version);
            const artifacts = projectResult.artifacts || (projectResult as any).artifacts || parsedW2eConfig?.artifacts;
            return (Array.isArray(artifacts) && artifacts.length > 0) ? 2 : 1;
          })(),
          artifacts: Array.isArray(projectResult.artifacts)
            ? projectResult.artifacts
            : Array.isArray((projectResult as any).artifacts)
              ? (projectResult as any).artifacts
              : Array.isArray(parsedW2eConfig?.artifacts)
                ? parsedW2eConfig.artifacts
                : [],
          pageLayoutType: (() => {
            const raw = projectResult.pageLayoutType || (projectResult as any).page_layout_type || parsedW2eConfig?.pageLayoutType || 'Access';
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
