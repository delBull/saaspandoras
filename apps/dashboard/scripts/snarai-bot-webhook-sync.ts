/**
 * Sync S'Narai bot webhook config into the DB (project slug: snarai).
 *
 * Mirrors what /api/v1/projects/[projectId]/bot/register does, for use after a
 * BotFather token rotation + manual setWebhook (keeps DB consistent).
 *
 * Run:
 *   TELEGRAM_SNARAI_BOT_TOKEN=<token> \
 *   TELEGRAM_SNARAI_WEBHOOK_SECRET=<secret> \
 *   npx tsx scripts/snarai-bot-webhook-sync.ts
 */

import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.production' });

import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

const TOKEN = process.env.TELEGRAM_SNARAI_BOT_TOKEN;
const SECRET = process.env.TELEGRAM_SNARAI_WEBHOOK_SECRET;
const USERNAME = 'snaraiassit_bot';

async function main() {
  if (!TOKEN) {
    console.error('❌ TELEGRAM_SNARAI_BOT_TOKEN is required (env var).');
    process.exit(1);
  }
  if (!SECRET) {
    console.error('❌ TELEGRAM_SNARAI_WEBHOOK_SECRET is required (env var).');
    process.exit(1);
  }

  const { db } = await import('../src/db');
  const { projects } = await import('../src/db/schema');
  const { eq } = await import('drizzle-orm');

  const [project] = await db.select().from(projects).where(eq(projects.slug, 'snarai')).limit(1);
  if (!project) {
    console.error('❌ Project with slug "snarai" not found.');
    process.exit(1);
  }

  const config = (project.w2eConfig as any) || {};
  const newConfig = {
    ...config,
    aiBotUrl: `https://t.me/${USERNAME}`,
    botConfig: {
      ...config.botConfig,
      telegramToken: TOKEN,
      telegramUsername: USERNAME,
      webhookSecret: SECRET,
      enabled: true,
    },
  };

  await db.update(projects).set({ w2eConfig: newConfig }).where(eq(projects.slug, 'snarai'));

  console.log('✅ S\'Narai w2eConfig.botConfig synced (projectId=' + project.id + ')');
  console.log('   username:', USERNAME);
  console.log('   enabled:', true);
  console.log('   webhookSecret:', SECRET.slice(0, 8) + '…');
  console.log('   token set:', TOKEN.slice(0, 8) + '…');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ Sync failed:', e);
    process.exit(1);
  });
