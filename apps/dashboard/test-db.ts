import { db } from "./src/db";
import { projects } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  const [project] = await db.select().from(projects).where(eq(projects.slug, 'snarai'));
  console.log("Current Extra Config:", JSON.stringify(project.extraConfig, null, 2));

  const extraConfig = (project.extraConfig as any) || {};
  if (!extraConfig.resourceHub) {
    extraConfig.resourceHub = {};
  }
  if (!extraConfig.resourceHub.markdownDocs) {
    extraConfig.resourceHub.markdownDocs = {
      dossier_es: "# S'Narai Dossier Ejecutivo\n\nEste documento contiene la información oficial del proyecto...",
      dossier_en: "# S'Narai Executive Dossier\n\nThis document contains official project information...",
      one_pager_es: "# S'Narai One Pager\n\nResumen rápido...",
      one_pager_en: "# S'Narai One Pager\n\nQuick overview...",
      deck_es: "# Deck Overview\n\nPresentación visual de S'Narai...",
      deck_en: "# Deck Overview\n\nVisual presentation of S'Narai..."
    };
  } else {
    // Fill empty ones
    if (!extraConfig.resourceHub.markdownDocs.dossier_es) extraConfig.resourceHub.markdownDocs.dossier_es = "# S'Narai Dossier Ejecutivo\n\nEste documento contiene la información oficial del proyecto...";
    if (!extraConfig.resourceHub.markdownDocs.dossier_en) extraConfig.resourceHub.markdownDocs.dossier_en = "# S'Narai Executive Dossier\n\nThis document contains official project information...";
    if (!extraConfig.resourceHub.markdownDocs.deck_es) extraConfig.resourceHub.markdownDocs.deck_es = "# Deck Overview\n\nPresentación visual de S'Narai...";
    if (!extraConfig.resourceHub.markdownDocs.one_pager_es) extraConfig.resourceHub.markdownDocs.one_pager_es = "# S'Narai One Pager\n\nResumen rápido...";
  }

  await db.update(projects).set({ extraConfig }).where(eq(projects.id, project.id));
  console.log("Updated successfully!");
  process.exit(0);
}

run();
