import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.staging' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    const res = await pool.query(`SELECT id, extra_config FROM projects WHERE slug = 'snarai'`);
    if (res.rows.length === 0) {
      console.log('Project not found');
      return;
    }
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
    console.log('✅ Injected Resource Hub docs for S\'Narai into extra_config');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

run();
