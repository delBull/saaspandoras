import { db } from './src/db';
import { marketingLeads } from './src/db/schema';

const baseLeadData = {
  userId: null,
  projectId: 12,
  email: "test@example.com",
  name: null,
  phoneNumber: null,
  walletAddress: null,
  fingerprint: null,
  identityHash: "123",
  origin: null,
  intent: 'explore' as any,
  consent: true,
  metadata: {},
  status: 'active' as any,
  score: 50,
  updatedAt: new Date(),
};

const query = db.insert(marketingLeads)
  .values({
    ...baseLeadData,
    createdAt: new Date(),
  })
  .onConflictDoUpdate({
    target: [marketingLeads.projectId, marketingLeads.email],
    set: baseLeadData
  })
  .toSQL();

console.log("SQL:", query.sql);
console.log("PARAMS:", query.params);
