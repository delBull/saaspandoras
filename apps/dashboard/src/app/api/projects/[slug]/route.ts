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

    // Use the working pattern but with all fields needed
    const projectResult = await db.execute(sql`
      SELECT
        "id",
        "title",
        "slug",
        "description",
        "status",
        "video_pitch",
        "cover_photo_url",
        "logo_url",
        "tagline",
        "business_category",
        "target_amount",
        "raised_amount",
        "website",
        "twitter_url",
        "discord_url",
        "telegram_url",
        "linkedin_url",
        "whitepaper_url",
        "total_valuation_usd",
        "token_type",
        "total_tokens",
        "tokens_offered",
        "token_price_usd",
        "estimated_apy",
        "yield_source",
        "lockup_period",
        "fund_usage",
        "team_members",
        "advisors",
        "token_distribution",
        "contract_address",
        "contract_address" as "contractAddress",
        "license_contract_address" as "licenseContractAddress",
        "utility_contract_address" as "utilityContractAddress",
        "governor_contract_address" as "governorContractAddress",
        "treasury_address" as "treasuryAddress",
        "loom_contract_address" as "loomContractAddress",
        "deployment_status" as "deploymentStatus",
        "chain_id" as "chainId",
        "legal_status",
        "valuation_document_url",
        "fiduciary_entity",
        "due_diligence_report_url",
        "is_mintable",
        "is_mutable",
        "update_authority_address",
        "chain_id" as "chainId",
        "applicant_name",
        "applicant_position",
        "applicant_email",
        "applicant_phone",
        "applicant_wallet_address",
        "verification_agreement",
        "protoclMecanism",
        "artefactUtility",
        "worktoearnMecanism",
        "integrationPlan",
        "monetizationModel",
        "adquireStrategy",
        "mitigationPlan",
        "recurring_rewards",
        "integration_details",
        "legal_entity_help",
        "image_url",
        "socials",
        "returns_paid",
        "featured",
        "featured_button_text",
        "w2e_config" as "w2eConfig",
        "created_at"
      FROM "projects"
      WHERE "slug" = ${slug}
      LIMIT 1
    `);

    if (projectResult.length > 0) {
      const project = projectResult[0] as unknown as ProjectData;
      console.log('✅ API: Project found in database');

      return NextResponse.json(project);
    }

    console.log('⚠️ API: Project not found for slug:', slug);
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  } catch (error) {
    console.error('❌ API: Error fetching project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
