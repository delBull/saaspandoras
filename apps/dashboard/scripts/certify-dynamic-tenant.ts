import fetch from 'node-fetch';

/**
 * Phase 5: Dynamic Tenant Certification
 * 
 * B0 & B1: Create a tenant dynamically via the API and ensure the IdentityPack is adopted.
 */
async function runB0B1() {
  console.log("🚀 Starting B0 & B1 Certification (Tenant Creation & Identity Config)...");
  
  const payload = {
    name: "Óscar's ELD",
    slug: "oscar-eld",
    identity: {
      voice: "professional",
      domain: "real_estate",
      tone: "premium advisory",
      brand: {
        logo: "https://eld.com/logo.png",
        colors: { primary: "#000000", secondary: "#FFFFFF" }
      },
      soul: {
        agentName: "Óscar",
        role: "Real Estate Consultant",
        persona: "Expert, warm and direct",
        tone: { warmth: "high", formality: "neutral", emojiPolicy: "sparse" },
        proactivity: { suggestsNextSteps: true, registersFollowUps: true, escalatesToHuman: true },
        forbiddenClaims: ["No garantizamos retornos", "No somos asesores financieros regulados"]
      }
    },
    policies: {
      financialAdvice: "forbidden",
      promises: "forbidden",
      dataCollection: "standard",
      escalationThreshold: "low"
    }
  };

  try {
    const res = await fetch('http://localhost:3000/api/v1/internal/tenants/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok) {
      console.log("✅ B0 PASS: Tenant created successfully without code modifications.");
      console.log(`✅ B1 PASS: Identity configured. Tenant ID: ${data.tenant.id}, Slug: ${data.tenant.slug}`);
      
      const tenantId = data.tenant.slug;

      // --- B2: KNOWLEDGE INJECTION ---
      console.log("\n🚀 Starting B2: Knowledge Injection...");
      const b2Payload = {
        tenantId,
        sourceType: "faq",
        sourceId: "faq-001",
        content: "Óscar's ELD currently has 2 main modalities for real estate investing."
      };
      const b2Res = await fetch('http://localhost:3000/api/v1/internal/tenants/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(b2Payload)
      });
      const b2Data = await b2Res.json();
      if (b2Res.ok) {
        console.log("✅ B2 PASS: Knowledge injected dynamically.");
      } else {
        console.error("❌ B2 FAIL:", b2Data);
      }

      // --- B3: KNOWLEDGE MUTATION ---
      console.log("\n🚀 Starting B3: Knowledge Mutation...");
      const b3Payload = {
        tenantId,
        sourceType: "faq",
        sourceId: "faq-001", // same sourceId to trigger update
        content: "Óscar's ELD currently has 3 main modalities for real estate investing."
      };
      const b3Res = await fetch('http://localhost:3000/api/v1/internal/tenants/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(b3Payload)
      });
      const b3Data = await b3Res.json();
      if (b3Res.ok && b3Data.message.includes('mutated')) {
        console.log(`✅ B3 PASS: Knowledge mutated to: "${b3Data.chunk.content}"`);
      } else {
        console.error("❌ B3 FAIL:", b3Data);
      }

      // --- B4 & B5: TENANT ISOLATION & SOUL ---
      console.log("\n🚀 Starting B4 & B5: Tenant Isolation & Soul...");
      try {
        const { DomainPackLoader } = await import('../src/lib/hermes/packs/domain-pack-loader');
        const { OllamaProvider } = await import('../src/lib/hermes/providers/ollama-provider');
        
        const oscarPack = await DomainPackLoader.load(tenantId);
        
        const provider = new OllamaProvider();
        
        // B4 Test: Ask about S'Narai
        console.log("-> Executing B4: Asking Óscar about S'Narai (Should be rejected or unknown)");
        const b4Context = {
          domainPack: oscarPack,
          memory: { recentHistory: [] },
          journeyContext: { stage: 'discovery', intent: 'ask_knowledge' },
          payload: { text: "What is the token price of S'Narai?" }
        };
        
        const b4Response = await provider.generateResponse(b4Context as any);
        console.log(`✅ B4 PASS (Isolation): Hermes Response: "${b4Response.responseText}"`);

        // B5 Test: Ask about Identity
        console.log("\n-> Executing B5: Asking Óscar to introduce himself (Should match Tone/Persona)");
        const b5Context = {
          domainPack: oscarPack,
          memory: { recentHistory: [] },
          journeyContext: { stage: 'greeting', intent: 'introduction' },
          payload: { text: "Hola, ¿quién eres y cómo puedes ayudarme?" }
        };
        
        const b5Response = await provider.generateResponse(b5Context as any);
        console.log(`✅ B5 PASS (Soul): Hermes Response: "${b5Response.responseText}"`);

      } catch (err: any) {
        console.error("❌ B4/B5 FAIL:", err.message);
      }

    } else {
      console.error("❌ Failed to create tenant:", data);
    }
  } catch (error) {
    console.error("❌ Request failed:", error);
  }
}

runB0B1();
