import { db } from '../src/db';
import { hermesKnowledge } from '../src/db/schema';

async function main() {
  console.log("Injecting policies for S'Narai...");
  
  const policies = [
    {
      id: crypto.randomUUID(),
      organizationId: 'snarai',
      dimension: 'policy',
      key: 'tone_of_voice',
      content: 'Be extremely polite, formal, and professional. Always refer to the user with respect. Do not use slang or overly casual language.',
      status: 'ACTIVE',
      sourceReference: 'system_default',
      version: 1
    },
    {
      id: crypto.randomUUID(),
      organizationId: 'snarai',
      dimension: 'policy',
      key: 'banned_topics',
      content: 'Do not discuss token price speculation, guarantee ROI, or mention other crypto projects. Do not give financial advice.',
      status: 'ACTIVE',
      sourceReference: 'system_default',
      version: 1
    },
    {
      id: crypto.randomUUID(),
      organizationId: 'snarai',
      dimension: 'policy',
      key: 'escalation_rules',
      content: 'Escalate to human if the user asks for specific financial advice, expresses frustration, or requests to buy tokens via OTC.',
      status: 'ACTIVE',
      sourceReference: 'system_default',
      version: 1
    },
    {
      id: crypto.randomUUID(),
      organizationId: 'snarai',
      dimension: 'policy',
      key: 'safety_level',
      content: 'STRICT',
      status: 'ACTIVE',
      sourceReference: 'system_default',
      version: 1
    }
  ];

  for (const p of policies) {
    await db.insert(hermesKnowledge).values(p as any).onConflictDoNothing();
  }
  
  console.log("Done.");
  process.exit(0);
}

main().catch(console.error);
