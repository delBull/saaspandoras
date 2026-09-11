/**
 * 🤖 Hermes Telegram Webhook Registration & Diagnostics Tool
 * scripts/register-telegram-webhook.ts
 *
 * Checks getWebhookInfo from Telegram Bot API and sets/updates the webhook URL
 * with secret_token matching TELEGRAM_WEBHOOK_SECRET.
 *
 * Usage:
 *   bun run scripts/register-telegram-webhook.ts
 *   bun run scripts/register-telegram-webhook.ts --url https://dash.pandoras.finance/api/hermes/bot/webhook
 *   bun run scripts/register-telegram-webhook.ts --info-only
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.production' });
dotenv.config({ path: '.env' });

const botToken = process.env.HERMES_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

const args = process.argv.slice(2);
const infoOnly = args.includes('--info-only');
const isRemote = args.includes('--remote');
const secretArgIdx = args.indexOf('--secret');
const bearerSecret = (secretArgIdx !== -1 && args[secretArgIdx + 1])
  ? String(args[secretArgIdx + 1])
  : (process.env.ADMIN_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET || process.env.CRON_SECRET);

const urlArgIdx = args.indexOf('--url');
const targetUrl: string = (urlArgIdx !== -1 && args[urlArgIdx + 1])
  ? String(args[urlArgIdx + 1])
  : (process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/api/hermes/bot/webhook`
      : 'https://dash.pandoras.finance/api/hermes/bot/webhook');

async function main() {
  console.log('--- 🤖 Hermes Telegram Webhook Inspector ---');

  if (isRemote) {
    const baseEndpoint = process.env.NEXT_PUBLIC_APP_URL || 'https://dash.pandoras.finance';
    console.log(`🌐 Registering remotely via Next.js endpoint: ${baseEndpoint}/api/hermes/bot/webhook/register`);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (bearerSecret) {
      headers['Authorization'] = `Bearer ${bearerSecret}`;
      headers['x-admin-secret'] = bearerSecret;
    }
    const res = await fetch(`${baseEndpoint}/api/hermes/bot/webhook/register`, {
      method: 'POST',
      headers,
    });
    const data = await res.json() as any;
    if (!res.ok || !data?.ok) {
      console.error('❌ Remote registration failed:', data);
      process.exit(1);
    }
    console.log('✅ Remote registration succeeded:', data);
    return;
  }

  if (!botToken) {
    console.error('❌ Error: HERMES_TELEGRAM_BOT_TOKEN or TELEGRAM_BOT_TOKEN is not set in environment.');
    process.exit(1);
  }

  // 1. Check current Webhook info
  console.log('📡 Querying getWebhookInfo from api.telegram.org...');
  const infoRes = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
  const infoData = await infoRes.json() as any;

  if (!infoData?.ok) {
    console.error('❌ Telegram API error:', infoData);
    process.exit(1);
  }

  console.log('Current Telegram Webhook Configuration:');
  console.log(`  • URL: ${infoData.result?.url || '(none)'}`);
  console.log(`  • Has Custom Certificate: ${infoData.result?.has_custom_certificate}`);
  console.log(`  • Pending Updates: ${infoData.result?.pending_update_count}`);
  console.log(`  • Has Secret Token: ${infoData.result?.has_custom_certificate !== undefined ? 'Checked' : 'N/A'}`);
  if (infoData.result?.last_error_date) {
    console.log(`  • Last Error Date: ${new Date(infoData.result.last_error_date * 1000).toISOString()}`);
    console.log(`  • Last Error Message: ${infoData.result.last_error_message}`);
  }
  if (infoData.result?.last_synchronization_error_date) {
    console.log(`  • Last Sync Error: ${new Date(infoData.result.last_synchronization_error_date * 1000).toISOString()}`);
  }

  if (infoOnly) {
    console.log('\n✅ Info-only inspection completed.');
    return;
  }

  if (!webhookSecret) {
    console.warn('\n⚠️ TELEGRAM_WEBHOOK_SECRET is not configured in environment!');
    console.warn('Telegram webhook requests without secret_token will be rejected in production with 401.');
  }

  console.log(`\n🔗 Registering Webhook to: ${targetUrl}`);
  if (webhookSecret) {
    console.log('🔒 Attaching secret_token to ensure X-Telegram-Bot-Api-Secret-Token is sent on each request.');
  }

  const queryParams = new URLSearchParams();
  queryParams.set('url', targetUrl);
  queryParams.set('allowed_updates', JSON.stringify(['message', 'edited_message', 'callback_query']));
  if (webhookSecret) {
    queryParams.set('secret_token', webhookSecret);
  }

  const setRes = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook?${queryParams.toString()}`);
  const setData = await setRes.json() as any;

  if (!setData?.ok) {
    console.error('❌ setWebhook failed:', setData);
    process.exit(1);
  }

  console.log(`✅ setWebhook successful! Description: ${setData.description}`);

  // Verification check
  const verifyRes = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
  const verifyData = await verifyRes.json() as any;
  console.log('\nVerified Status:');
  console.log(`  • Active URL: ${verifyData.result?.url}`);
  console.log(`  • Pending Updates: ${verifyData.result?.pending_update_count}`);
  console.log('🚀 Hermes Telegram Bot Webhook is now synchronized and authenticated!');
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
