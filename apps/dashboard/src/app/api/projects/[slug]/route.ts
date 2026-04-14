import { NextResponse } from "next/server";
import { db } from "~/db";
import { sql } from "drizzle-orm";
import { harmonizeProject } from "@/lib/projects/harmonizer";

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

    const dbStartTime = Date.now();
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
      console.log(`🗄️ [API] DB query resolved in ${Date.now() - dbStartTime}ms`);
    } catch (ormError) {
      console.warn('⚠️ [API] ORM Error (legacy data?), trying raw SQL in ' + (Date.now() - dbStartTime) + 'ms', ormError);
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

        // Use the Centralized Harmonizer for all technical fields
        const harmonizedProject = harmonizeProject(projectResult);

        // Map Drizzle ORM's camelCase to the snake_case expected by frontend ProjectData interface
        // but now enriched by the harmonizer's logic (chain_id, treasury_address, etc.)
        const mappedProject = {
          ...harmonizedProject,
          logo_url: resolveIpfs(harmonizedProject.logoUrl || (projectResult as any).logo_url) || null,
          cover_photo_url: resolveIpfs(harmonizedProject.coverPhotoUrl || (projectResult as any).cover_photo_url) || null,
          tagline: harmonizedProject.tagline || null,
          description: harmonizedProject.description || '',
          business_category: harmonizedProject.businessCategory || null,
          video_pitch: harmonizedProject.videoPitch || (projectResult as any).video_url || null,
          website: harmonizedProject.website || null,
          whitepaper_url: harmonizedProject.whitepaperUrl || null,
          twitter_url: harmonizedProject.twitterUrl || null,
          discord_url: harmonizedProject.discordUrl || null,
          telegram_url: harmonizedProject.telegramUrl || null,
          linkedin_url: harmonizedProject.linkedinUrl || null,
          target_amount: harmonizedProject.targetAmount || "0.00",
          total_valuation_usd: harmonizedProject.totalValuationUsd || null,
          token_type: harmonizedProject.tokenType || 'erc20',
          total_tokens: harmonizedProject.totalTokens || null,
          tokens_offered: harmonizedProject.tokensOffered || null,
          token_price_usd: harmonizedProject.tokenPriceUsd || null,
          estimated_apy: harmonizedProject.estimatedApy || null,
          yield_source: harmonizedProject.yieldSource || null,
          lockup_period: harmonizedProject.lockupPeriod || null,
          fund_usage: harmonizedProject.fundUsage || null,
          team_members: projectResult.teamMembers ? (typeof projectResult.teamMembers === 'string' ? projectResult.teamMembers : JSON.stringify(projectResult.teamMembers)) : null,
          advisors: projectResult.advisors ? (typeof projectResult.advisors === 'string' ? projectResult.advisors : JSON.stringify(projectResult.advisors)) : null,
          token_distribution: projectResult.tokenDistribution || null,
          
          // Technical Addresses (Now from Harmonizer)
          contract_address: harmonizedProject.contractAddress,
          licenseContractAddress: harmonizedProject.licenseContractAddress,
          treasury_address: harmonizedProject.treasuryAddress,
          
          legal_status: harmonizedProject.legalStatus || null,
          valuation_document_url: harmonizedProject.valuationDocumentUrl || null,
          fiduciary_entity: harmonizedProject.fiduciaryEntity || null,
          due_diligence_report_url: harmonizedProject.dueDiligenceReportUrl || null,
          is_mintable: harmonizedProject.isMintable ?? false,
          is_mutable: harmonizedProject.isMutable ?? false,
          update_authority_address: harmonizedProject.updateAuthorityAddress || null,
          applicant_name: harmonizedProject.applicantName || null,
          applicant_position: harmonizedProject.applicantPosition || null,
          applicant_email: harmonizedProject.applicantEmail || null,
          applicant_phone: harmonizedProject.applicantPhone || null,
          applicant_wallet_address: harmonizedProject.applicantWalletAddress || null,
          verification_agreement: harmonizedProject.verificationAgreement ?? false,
          integration_details: harmonizedProject.integrationDetails || null,
          legal_entity_help: harmonizedProject.legalEntityHelp ?? false,
          image_url: harmonizedProject.imageUrl || null,
          raised_amount: harmonizedProject.raisedAmount || "0.00",
          returns_paid: harmonizedProject.returnsPaid || "0.00",
          featured_button_text: harmonizedProject.featuredButtonText || null,
          
          protoclMecanism: harmonizedProject.protoclMecanism || null,
          artefactUtility: harmonizedProject.artefactUtility || null,
          worktoearnMecanism: harmonizedProject.worktoearnMecanism || null,
          monetizationModel: harmonizedProject.monetizationModel || null,
          adquireStrategy: harmonizedProject.adquireStrategy || null,
          mitigationPlan: harmonizedProject.mitigationPlan || null,
          recurring_rewards: harmonizedProject.recurringRewards || null,
          
          created_at: harmonizedProject.createdAt || null,
          
          // Network & Version (Already harmonized)
          protocol_version: harmonizedProject.protocolVersion,
          chainId: harmonizedProject.chainId,
          chain_id: harmonizedProject.chain_id,
          pageLayoutType: harmonizedProject.pageLayoutType
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
