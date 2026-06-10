import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_STAGING
});

async function run() {
  try {
    // 1. Add missing columns to projects
    console.log('Adding extra_config...');
    await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS extra_config jsonb DEFAULT '{}'::jsonb NOT NULL`);
    
    console.log('Adding allowance_controller_address...');
    await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS allowance_controller_address varchar(255)`);

    // 2. Run the 0006 migration
    const sql = fs.readFileSync(path.join(process.cwd(), 'drizzle/0006_modern_war_machine.sql'), 'utf-8');
    const statements = sql.split('--> statement-breakpoint').filter(s => s.trim().length > 0);
    
    for (const statement of statements) {
      try {
        console.log('Executing:', statement.trim().substring(0, 50) + '...');
        await pool.query(statement);
        console.log('✅ Success');
      } catch (e: any) {
        if (e.message.includes('already exists')) {
          console.log('⚠️ Already exists (Skipping)');
        } else {
          console.error('❌ Error:', e.message);
        }
      }
    }
    
    // 3. Inject Hub Docs into S'Narai extra_config on Staging!
    const res = await pool.query(`SELECT id, extra_config FROM projects WHERE slug = 'snarai'`);
    if (res.rows.length > 0) {
      const project = res.rows[0];
      const resourceHub = {
        documents: [
          { title: 'Private Dossier', url: 'https://snarai.aztecaz.xyz/docs/Narai_Private_Dossier.pdf', desc: 'Resumen estratégico del proyecto' },
          { title: 'One Pager (ES)', url: 'https://snarai.aztecaz.xyz/docs/One_Pager_Fundador_ES.pdf', desc: 'Resumen para inversores' },
          { title: 'Deck Overview', url: 'https://snarai.aztecaz.xyz/docs/deck_overview.pdf', desc: 'Presentación ejecutiva' }
        ],
        community: [
          { label: 'Portal', url: 'https://snarai.aztecaz.xyz/portal', type: 'channel' },
          { label: 'Telegram', url: 'https://t.me/+SNaraiChannel', type: 'chat' }
        ]
      };
      
      const extraConfig = project.extra_config || {};
      extraConfig.resourceHub = resourceHub;
      
      await pool.query(`UPDATE projects SET extra_config = $1 WHERE slug = 'snarai'`, [extraConfig]);
      console.log('✅ Injected Resource Hub docs for S\'Narai on STAGING DB');
    }
    
  } catch (error) {
    console.error('Failed to run migration:', error);
  } finally {
    await pool.end();
  }
}

run();
