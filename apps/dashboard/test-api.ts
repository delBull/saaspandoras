import { db } from "./src/db";
import { projects } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const slug = "escuela-libre-digital";
  console.log("Fetching", slug);
  const projectResult = await db.query.projects.findFirst({
    where: eq(projects.slug, slug)
  });
  if (!projectResult) { console.log("Not found"); return; }
  
  try {
        const resolveIpfs = (url: any) => {
          if (typeof url === 'string' && url.startsWith('ipfs://')) {
            return url.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
          }
          return url;
        };

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
          w2eConfig: projectResult.w2eConfig || {},
          registryContractAddress: (projectResult as any).registryContractAddress || (projectResult as any).registry_contract_address || null,
          governorContractAddress: (projectResult as any).governorContractAddress || (projectResult as any).votingContractAddress || 
                                 (projectResult as any).governor_contract_address || (projectResult as any).voting_contract_address || null,
          tokenContractAddress: (projectResult as any).contractAddress || (projectResult as any).contract_address || null,
          timelockContractAddress: (projectResult as any).loomContractAddress || (projectResult as any).loom_contract_address || null,
          protocol_version: (() => {
            if ((projectResult as any).protocolVersion) return Number((projectResult as any).protocolVersion);
            const artifacts = (projectResult as any).artifacts || (projectResult.w2eConfig as any)?.artifacts;
            return (Array.isArray(artifacts) && artifacts.length > 0) ? 2 : 1;
          })(),
          artifacts: Array.isArray((projectResult as any).artifacts)
            ? (projectResult as any).artifacts
            : Array.isArray((projectResult.w2eConfig as any)?.artifacts)
              ? (projectResult.w2eConfig as any).artifacts
              : [],
          pageLayoutType: (() => {
            const raw = (projectResult as any).pageLayoutType || (projectResult.w2eConfig as any)?.pageLayoutType || 'Access';
            if (typeof raw !== 'string') return 'Access';
            return (raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()) as any;
          })(),
        };

        JSON.stringify(mappedProject);
        console.log("Success stringify");
  } catch (e) {
      console.error("Mapping error:", e);
  }
  process.exit(0);
}
main();
