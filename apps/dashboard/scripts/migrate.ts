import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { SNARAI_SOUL } from '@/lib/hermes/soul/snarai-soul';

async function run() {
  await db.update(projects)
    .set({
      identityPack: {
        tenantId: 'snarai',
        agentName: SNARAI_SOUL.agentName,
        persona: SNARAI_SOUL.persona,
        voice: SNARAI_SOUL.voice,
        tone: SNARAI_SOUL.tone,
        languagePolicy: SNARAI_SOUL.languagePolicy,
        claimsPolicy: SNARAI_SOUL.claimsPolicy,
        escalationPolicy: SNARAI_SOUL.escalationPolicy,
        fallbackResponse: SNARAI_SOUL.fallbackResponse,
        canonicalUrls: SNARAI_SOUL.canonicalUrls
      },
      tenantRuntimeConfig: {
        rwaManifest: {
          vertical: "RWA",
          capabilities: [
            "rwa.portal",
            "rwa.payments",
            "rwa.governance",
            "rwa.ipfs_evidence",
            "hermes.rwa_intelligence",
            "nft.certificates"
          ],
          defaults: {
            chain: "BASE",
            currency: "USD"
          },
          integrations: {}
        },
        brandConfig: {
          name: "S'Narai",
          logo: "https://snarai.aztecaz.xyz/logo.png",
          color: "#10b981",
          background: "#0f172a"
        },
        legalProfile: {
          agreementTemplateName: "SNARAI_AGREEMENT_TEMPLATE"
        }
      }
    })
    .where(eq(projects.slug, 'snarai'));
  console.log("Migrated S'Narai to identityPack and tenantRuntimeConfig in DB.");
  process.exit(0);
}

run().catch(console.error);
