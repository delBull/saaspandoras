import postgres from 'postgres';

const DATABASE_URL_LOCAL = "postgresql://Marco@localhost:5432/pandoras_local";

async function main() {
  console.log("Connecting to Local Database...");
  const sql = postgres(DATABASE_URL_LOCAL);
  
  try {
    const [project] = await sql`
      SELECT id, slug, w2e_config
      FROM projects
      WHERE id = 2
    `;

    if (!project) {
      console.log("Project ID 2 not found in Local DB.");
      return;
    }

    console.log("Project 2 config found in Local DB.");
    const config = typeof project.w2e_config === 'string' 
      ? JSON.parse(project.w2e_config) 
      : project.w2e_config;

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

    await sql`
      UPDATE projects
      SET w2e_config = ${JSON.stringify(config)}
      WHERE id = 2
    `;

    console.log("Successfully updated project 2 config in Local DB!");

  } catch (error) {
    console.error("Local DB might not be running or not accessible:", error.message);
  } finally {
    await sql.end();
  }
}

main();
