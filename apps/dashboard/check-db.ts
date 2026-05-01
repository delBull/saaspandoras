import { db } from "./src/db";
import { purchases } from "./src/db/schema";
import { eq, and } from "drizzle-orm";

async function checkPurchases() {
  const wallet = "0x00c9f7EE6d1808C09B61E561Af6c787060BFE7C9";
  console.log("Checking purchases for:", wallet);
  
  const results = await db.query.purchases.findMany({
    where: eq(purchases.userId, wallet.toLowerCase())
  });

  console.log("Results (lowercase):", JSON.stringify(results, null, 2));

  const resultsOriginal = await db.query.purchases.findMany({
    where: eq(purchases.userId, wallet)
  });
  console.log("Results (original):", JSON.stringify(resultsOriginal, null, 2));
  
  process.exit(0);
}

checkPurchases();
