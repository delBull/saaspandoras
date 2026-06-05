import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { projects } from "../src/db/schema";
import * as schema from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no encontrada en el entorno.");
  }

  const client = postgres(process.env.DATABASE_URL);
  const db = drizzle(client, { schema });

  console.log("Conectando a DB para actualizar S'Narai...");

  const phaseDynamicsUrl = "https://dash.pandoras.finance/legal/phase-dynamics/snarai";

  const existingProject = await db.query.projects.findFirst({
    where: eq(projects.slug, "snarai")
  });

  if (!existingProject) {
    console.log("No se encontró el proyecto S'Narai.");
    process.exit(1);
  }

  const currentLegalConfig = existingProject.legalConfig || {};
  const updatedLegalConfig = {
    ...currentLegalConfig,
    phaseDynamicsUrl: phaseDynamicsUrl,
    agreementUrl: "https://dash.pandoras.finance/legal/agreement/snarai",
    riskUrl: "https://dash.pandoras.finance/legal/risk-disclosure/snarai"
  };

  await db
    .update(projects)
    .set({ legalConfig: updatedLegalConfig })
    .where(eq(projects.slug, "snarai"));

  console.log("✅ Configuración legal actualizada para S'Narai.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error actualizando la BD:", err);
  process.exit(1);
});
