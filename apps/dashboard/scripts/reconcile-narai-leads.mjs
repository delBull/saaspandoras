import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from the dashboard directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_ALERTS || process.env.DISCORD_WEBHOOK_WHATSAPP_LEADS;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

const DRY_RUN = process.env.DRY_RUN !== 'false'; // Default to dry run for safety
const SHOULD_NOTIFY = process.env.NOTIFY === 'true';

const HIGH_INTENT_KEYWORDS = [
  'full_unit', 'full unit', 'departamento completo', 'adquirir departamento', 
  'unidad completa', 'departamento', 'unidad', 'inversionista', 'investor', 
  'narai gold', 'full units'
];

async function notifyDiscord(lead, project) {
  if (!DISCORD_WEBHOOK) {
    console.warn('⚠️ No Discord webhook configured, skipping notification.');
    return;
  }

  const tags = lead.metadata?.tags || [];
  const tagsText = tags.length > 0 ? `\n🏷️ **Etiquetas**: ${tags.join(', ')}` : '';
  const title = "🔥 **LEAD RECONCILIADO (HOT) DETECTADO**";

  const notificationText = `
${title}

👤 **Nombre**: ${lead.name || lead.email?.split('@')[0] || 'Anónimo'}
📧 **Email**: ${lead.email || 'N/A'}
📱 **WhatsApp**: ${lead.phone_number || 'No provisto'}
🎯 **Intención**: ${lead.intent?.toUpperCase()}
📊 **Score**: ${lead.score || 0}/100
⚖️ **Prioridad**: ${lead.priority_score || 0}${tagsText}
🚀 **Proyecto**: ${project.title}

🔗 **Ver Lead**: /admin/dashboard?tab=marketing&subtab=growth-os
`.trim();

  try {
    const response = await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: "Growth OS Alert (Backfill)",
          description: notificationText,
          color: 16744192, // Orange
          timestamp: new Date().toISOString()
        }],
        username: 'Pandoras Growth Bot'
      }),
    });

    if (response.ok) {
      console.log(`✅ AI: Notification sent for ${lead.email}`);
    } else {
      console.error(`❌ AI: Discord fail for ${lead.email}: ${response.status}`);
    }
  } catch (err) {
    console.error(`❌ AI: Notification error:`, err.message);
  }
}

async function reconcile() {
  console.log(`🚀 Starting Lead Reconciliation... (DRY_RUN: ${DRY_RUN}, NOTIFY: ${SHOULD_NOTIFY})`);

  try {
    // 1. Get All Projects to debug
    const allProjects = await sql`SELECT id, title, slug FROM projects`;
    console.log(`📡 All Projects:`, allProjects);

    const [project] = await sql`SELECT id, title, slug FROM projects WHERE slug ILIKE '%narai%' OR title ILIKE '%narai%' LIMIT 1`;
    if (!project) {
      console.error('❌ Project Narai not found');
      return;
    }
    console.log(`🎯 Target Project: ${project.title} (ID: ${project.id})`);

    // 2. Debug: Check latest leads global
    const latestGlobal = await sql`SELECT id, project_id, email, name, created_at FROM marketing_leads ORDER BY created_at DESC LIMIT 10`;
    console.log(`🔍 [Debug] Latest Global Leads:`, latestGlobal);

    const counts = await sql`SELECT project_id, COUNT(*) as count FROM marketing_leads GROUP BY project_id`;
    console.log(`🔍 [Debug] Leads per Project:`, counts);

    // 2. Get recent leads (last 30 days) from ANY project that looks like Narai
    const leads = await sql`
      SELECT * FROM marketing_leads 
      WHERE (
        project_id = ${project.id} 
        OR project_id IN (1, 3) AND (origin ILIKE '%narai%' OR metadata::text ILIKE '%narai%')
      )
      AND created_at > NOW() - INTERVAL '30 days'
      AND is_deleted = false
    `;

    console.log(`📊 Found ${leads.length} candidate leads for Narai reconciliation.`);

    let reconciledCount = 0;
    let movedCount = 0;

    for (const lead of leads) {
      const metadataStr = JSON.stringify(lead.metadata || {}).toLowerCase();
      const originStr = (lead.origin || '').toLowerCase();
      const nameStr = (lead.name || '').toLowerCase();
      
      const isNarai = originStr.includes('narai') || metadataStr.includes('narai');
      const shouldMove = isNarai && lead.project_id !== project.id;
      
      const isHighIntent = HIGH_INTENT_KEYWORDS.some(k => metadataStr.includes(k) || nameStr.includes(k));
      const alreadyHot = lead.status === 'hot' || lead.intent === 'invest';

      if (shouldMove || (isHighIntent && !alreadyHot)) {
        console.log(`✨ Reconciling Lead: ${lead.email || lead.id} (${lead.name || 'Anonymous'})`);
        if (shouldMove) console.log(`   📦 Moving Project ID: ${lead.project_id} -> ${project.id}`);
        
        let newMetadata = { ...(lead.metadata || {}) };
        if (!newMetadata.tags) newMetadata.tags = [];
        if (!newMetadata.tags.includes('B2C_FULL_UNIT')) {
          newMetadata.tags.push('B2C_FULL_UNIT');
        }

        if (DRY_RUN) {
          console.log(`   [DRY RUN] Status: hot, Intent: invest, Score: 100, ProjectID: ${project.id}`);
        } else {
          await sql`
            UPDATE marketing_leads 
            SET 
              project_id = ${project.id},
              status = 'hot', 
              intent = 'invest', 
              score = 100, 
              metadata = ${newMetadata}, 
              updated_at = NOW()
            WHERE id = ${lead.id}
          `;
          console.log(`   ✅ Reconciled in DB`);
          
          if (SHOULD_NOTIFY) {
            await notifyDiscord({ ...lead, status: 'hot', intent: 'invest', score: 100, metadata: newMetadata }, project);
          }
        }
        reconciledCount++;
        if (shouldMove) movedCount++;
      }
    }

    console.log(`\n🎉 Reconciliation finished.`);
    console.log(`   - Total processed: ${leads.length}`);
    console.log(`   - Total reconciled: ${reconciledCount}`);
    console.log(`   - Total moved between projects: ${movedCount}`);

  } catch (err) {
    console.error('❌ Fatal error during reconciliation:', err);
  } finally {
    await sql.end();
  }
}

reconcile();
