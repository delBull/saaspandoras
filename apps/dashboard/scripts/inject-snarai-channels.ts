import { db } from '../src/db';
import { projects } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const slug = 'snarai';
  console.log(`[Inject Channels] Injecting config for tenant: ${slug}`);

  const maxRetries = 3;
  let project = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const rows = await db.select().from(projects).where(eq(projects.slug, slug)).limit(1);
      project = rows[0];
      break;
    } catch (e: any) {
      if (e.code === 'ECONNRESET') {
        console.log(`[Inject] ECONNRESET on attempt ${i + 1}, retrying...`);
        await new Promise(r => setTimeout(r, 1000));
      } else {
        throw e;
      }
    }
  }

  if (!project) {
    console.error(`Project ${slug} not found in DB!`);
    process.exit(1);
  }

  // Tokens to inject (using the valid ones from .env or placeholders if missing)
  const tgToken = process.env.TELEGRAM_BOT_TOKEN || process.env.HERMES_TELEGRAM_BOT_TOKEN || 'mock_telegram_token';
  const waToken = process.env.WHATSAPP_ACCESS_TOKEN || 'mock_whatsapp_token';
  const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || 'mock_whatsapp_phone_id';

  const config = (project.tenantRuntimeConfig as any) || {};
  if (!config.secrets) config.secrets = {};

  config.secrets.telegramBotToken = tgToken;
  config.secrets.whatsappToken = waToken;
  config.secrets.whatsappPhoneId = waPhoneId;

  // Update DB
  for (let i = 0; i < maxRetries; i++) {
    try {
      await db.update(projects).set({ tenantRuntimeConfig: config }).where(eq(projects.slug, slug));
      break;
    } catch (e: any) {
      if (e.code === 'ECONNRESET') {
        console.log(`[Inject Update] ECONNRESET on attempt ${i + 1}, retrying...`);
        await new Promise(r => setTimeout(r, 1000));
      } else {
        throw e;
      }
    }
  }
  
  console.log(`[Success] Channel config injected into S'Narai!`);
  console.log(`- Telegram Token: ${tgToken.substring(0, 5)}...`);
  console.log(`- WhatsApp Token: ${waToken.substring(0, 5)}...`);
  console.log(`- WhatsApp Phone ID: ${waPhoneId}`);

  process.exit(0);
}

main().catch(console.error);
