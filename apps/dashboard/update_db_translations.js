const { Pool } = require('@neondatabase/serverless');

async function updateBriefings() {
  const client = new Pool({
    connectionString: "postgresql://neondb_owner:npg_xvI24njyield@ep-spring-mountain-awqc41zk-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  const translations = {
    "thesis": {
      title_en: "Our Investment Thesis",
      blocks_en: [
        {
          "data": {
            "title": "THESIS AND ASYMMETRIC GROWTH",
            "pretitle": "RIVIERA NAYARIT",
            "description": "Why S'Narai is positioned in Mexico's highest appreciation corridor."
          },
          "type": "hero"
        },
        {
          "data": {
            "text": "Bucerías is undergoing a transition towards luxury. With an annual appreciation of **12% to 15%** and short-term rental occupancy exceeding **70%**, the scarcity of premium land guarantees appreciation.\n\nOur thesis is based on acquiring in the **Golden Zone** before the peak market.",
            "title": "CONCENTRATED DEMAND"
          },
          "type": "sixty_seconds"
        },
        {
          "data": {
            "steps": [
              {
                "step": "01",
                "text": "Structured capital funding at stage zero.",
                "title": "Early Acquisition"
              },
              {
                "step": "02",
                "text": "High-margin hotel operations and tax optimization.",
                "title": "Condo-Hotel Development"
              },
              {
                "step": "03",
                "text": "Combination of operational profits and underlying capital growth.",
                "title": "Yield and Appreciation"
              }
            ],
            "title": "VALUE MECHANICS"
          },
          "type": "journey"
        },
        {
          "data": {
            "text": "Enter our Resource Hub.",
            "title": "READ THE FULL DOSSIER"
          },
          "type": "next_steps"
        }
      ]
    },
    "developers": {
      title_en: "Project Development (Infrastructure)",
      blocks_en: [
        {
          "data": {
            "title": "PANDORAS GROWTH OS",
            "pretitle": "BLOCKCHAIN TECHNOLOGY",
            "description": "Discover how Pandoras powers S'Narai with institutional infrastructure."
          },
          "type": "hero"
        },
        {
          "data": {
            "text": "Pandoras provides the **Growth OS Engine**: Smart Contracts, Tokenomics, Telegram App, and administrative panels.\n\nWe enable real estate developers to raise capital 3x faster without losing control of their asset.",
            "title": "THE ENGINE BEHIND THE ASSET"
          },
          "type": "sixty_seconds"
        },
        {
          "data": {
            "list": [
              {
                "text": "Security audits and global compatibility.",
                "title": "Smart Contracts"
              },
              {
                "text": "Contracts with official legal validity in Mexico.",
                "title": "Legal Compliance (NOM-151)"
              },
              {
                "text": "Pro-rata profit distribution in 1-click.",
                "title": "Payout Distribution"
              }
            ],
            "title": "OUR TECH STACK"
          },
          "type": "principles"
        },
        {
          "data": {
            "text": "Schedule a call with the Pandoras team.",
            "title": "USE OUR STACK"
          },
          "type": "next_steps"
        }
      ]
    },
    "realtors": {
      title_en: "Commercialize Developments (Partners)",
      blocks_en: [
        {
          "data": {
            "title": "WEALTH PARTNERS PROGRAM",
            "pretitle": "SALES NETWORK",
            "description": "Market S'Narai to your high-net-worth clients and secure on-chain commissions."
          },
          "type": "hero"
        },
        {
          "data": {
            "text": "Offer your clients exposure to premium real estate without the headache of deeds or mortgages.\n\nS'Narai allows you to earn a **10% guaranteed commission** programmatically through our Smart Contracts.",
            "title": "A UNIQUE SALES TOOL"
          },
          "type": "sixty_seconds"
        },
        {
          "data": {
            "steps": [
              {
                "step": "01",
                "text": "We verify your profile as a Wealth Partner.",
                "title": "Approval"
              },
              {
                "step": "02",
                "text": "You obtain a referral link tied to your wallet.",
                "title": "Link Generation"
              },
              {
                "step": "03",
                "text": "Your clients invest, you receive your commissions automatically in USDC.",
                "title": "On-Chain Commissions"
              }
            ],
            "title": "YOUR COMMERCIAL ROUTE"
          },
          "type": "journey"
        },
        {
          "data": {
            "text": "Register today in our Mission Control.",
            "title": "APPLY AS A PARTNER"
          },
          "type": "next_steps"
        }
      ]
    },
    "participate": {
      title_en: "I Want to Participate (Investors)",
      blocks_en: [
        {
          "data": {
            "title": "STRATEGIC PARTICIPATION",
            "pretitle": "EXCLUSIVE ACCESS",
            "description": "Access a real estate yield protocol in the Golden Zone of Bucerías."
          },
          "type": "hero"
        },
        {
          "data": {
            "text": "S'Narai is not a timeshare or traditional fractional ownership. It is a **Digital Participation Protocol** backed by a $100M MXN asset.\n\nYou obtain certificates (CPs) that grant you rights to operational profits and free nights at the hotel.",
            "title": "THE PROJECT IN 60 SECONDS"
          },
          "type": "sixty_seconds"
        },
        {
          "data": {
            "list": [
              {
                "text": "Positions starting from $500 USD with global liquidity readiness.",
                "title": "Capital Efficiency"
              },
              {
                "text": "Smart distribution based on real hotel occupancy.",
                "title": "Operational Yields"
              },
              {
                "text": "No notaries, no individual trusts, pure digital infrastructure.",
                "title": "Zero Legal Friction"
              }
            ],
            "title": "COMPETITIVE ADVANTAGES"
          },
          "type": "principles"
        },
        {
          "data": {
            "text": "Request your preferential access before the phase closes.",
            "title": "JOIN THE FOUNDER PHASE"
          },
          "type": "next_steps"
        }
      ]
    }
  };

  try {
    console.log("Connected to Neon DB. Updating translations...");
    
    for (const [slug, data] of Object.entries(translations)) {
      const query = `
        UPDATE project_briefings
        SET title_en = $1, blocks_en = $2::jsonb
        WHERE slug = $3
      `;
      await client.query(query, [data.title_en, JSON.stringify(data.blocks_en), slug]);
      console.log(`Updated ${slug}`);
    }
    
    console.log("All translations updated successfully.");
  } catch (error) {
    console.error("Update failed:", error);
  } finally {
    await client.end();
  }
}

updateBriefings();
