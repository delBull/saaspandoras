import postgres from 'postgres';

const DATABASE_URL_STAGING = "postgresql://neondb_owner:REMOVED_ROTATE_PASSWORD@ep-cool-feather-ambh76vv-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function main() {
  console.log("Connecting to Staging Database...");
  const sql = postgres(DATABASE_URL_STAGING, { ssl: { rejectUnauthorized: false } });
  
  try {
    // 1. Fetch current project 2 config
    const [project] = await sql`
      SELECT id, slug, w2e_config
      FROM projects
      WHERE id = 2
    `;

    if (!project) {
      console.error("Project ID 2 not found!");
      return;
    }

    console.log("Current project config found.");
    
    // Parse w2e_config
    const config = typeof project.w2e_config === 'string' 
      ? JSON.parse(project.w2e_config) 
      : project.w2e_config;

    // 2. Modify phases
    // We only want 2 phases:
    // - Phase 1: "Fundador" (id: community), allocation: 10
    // - Phase 2: "Estratégico" (id: public), allocation: 99990
    config.phases = [
      {
        id: "community",
        name: "Fundador",
        type: "amount",
        limit: 0.005,
        isActive: true,
        startDate: "2026-03-31",
        tokenPrice: 0.0005,
        description: "Acceso exclusivo para early adopters con descuento especial.",
        tokenAllocation: 10
      },
      {
        id: "public",
        name: "Estratégico",
        type: "amount",
        limit: 15,
        isActive: true,
        startDate: "2026-04-01",
        tokenPrice: 0.00075,
        description: "Abierto al público general al precio de lista.",
        tokenAllocation: 99990
      }
    ];

    // 3. Update in DB
    const [updatedProject] = await sql`
      UPDATE projects
      SET w2e_config = ${JSON.stringify(config)}
      WHERE id = 2
      RETURNING id, slug, w2e_config
    `;

    console.log("Successfully updated project 2 config in Staging DB!");
    console.log("Updated w2e_config:", JSON.stringify(updatedProject.w2e_config, null, 2));

  } catch (error) {
    console.error("Error updating Staging DB:", error);
  } finally {
    await sql.end();
  }
}

main();
