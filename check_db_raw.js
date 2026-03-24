require('dotenv').config();
const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL, { 
  ssl: { rejectUnauthorized: false },
  connect_timeout: 10,
  prepare: false
});

async function checkSchema() {
  try {
    console.log('🔍 Querying information_schema for projects table...');
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'projects'
      ORDER BY ordinal_position;
    `;
    
    console.log('📊 Column list found in DB:');
    columns.forEach(c => console.log(` - ${c.column_name} (${c.data_type})`));
    
    const missingNewFields = [
      'protocl_mecanism', 
      'artefact_utility', 
      'worktoearn_mecanism', 
      'monetization_model', 
      'adquire_strategy', 
      'mitigation_plan'
    ].filter(field => !columns.find(c => c.column_name === field));

    if (missingNewFields.length > 0) {
      console.log('\n❌ MISSING COLUMNS DETECTED:', missingNewFields.join(', '));
    } else {
      console.log('\n✅ All targeted conversational fields exist in the DB.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('💥 Error:', error.message);
    process.exit(1);
  }
}

checkSchema();
