import { db } from "./src/db";
import { projects } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const result = await db.query.projects.findFirst({
    where: eq(projects.slug, "escuela-libre-digital")
  });
  console.log(result ? "Found project with addresses:" : "Not found in DB");
  if (result) {
    console.log({
      gov: result.governorContractAddress,
      voting: result.votingContractAddress,
      registry: result.registryContractAddress,
      artifacts: result.artifacts || (result.w2eConfig as any)?.artifacts
    });
  }
  process.exit(0);
}
main();
