const postgres = require('postgres');
const sql = postgres('postgresql://neondb_owner:npg_9lRfvsopJ2UM@ep-cool-feather-ambh76vv-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require');
async function run() {
  const [project] = await sql`SELECT w2e_config FROM projects WHERE id = 2`;
  const config = project.w2e_config;
  
  if (config.phases && config.phases.length > 0) {
    config.phases[0].tokenPrice = "0.00075";
  }
  
  await sql`
    UPDATE projects 
    SET w2e_config = ${sql.json(config)} 
    WHERE id = 2
  `;
  console.log('Fixed Phases');
  process.exit(0);
}
run();
