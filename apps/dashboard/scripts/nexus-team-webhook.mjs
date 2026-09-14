#!/usr/bin/env node
/**
 * 🔧 Nexus Team Bot — Webhook Registration & Diagnostic Script
 * apps/dashboard/scripts/nexus-team-webhook.mjs
 *
 * Usage:
 *   node apps/dashboard/scripts/nexus-team-webhook.mjs register
 *   node apps/dashboard/scripts/nexus-team-webhook.mjs info
 *   node apps/dashboard/scripts/nexus-team-webhook.mjs delete
 *
 * The script reads from .env.local automatically.
 * Never commit this script's output to version control.
 *
 * SECURITY: Requires TELEGRAM_TEAM_BOT_TOKEN and TELEGRAM_TEAM_WEBHOOK_SECRET.
 * NEXT_PUBLIC_APP_URL must be set to the deployed Railway/Next.js URL.
 */

import { readFileSync } from 'fs';
import { resolve, join } from 'path';

// --- Load .env.local manually (no dotenv dependency needed) ---
function loadEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx < 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const rawVal = trimmed.slice(eqIdx + 1).trim();
      const val = rawVal.replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // .env.local is optional in CI
  }
}

const scriptDir = resolve(new URL(import.meta.url).pathname, '../../');
loadEnvFile(join(scriptDir, '.env.local'));
loadEnvFile(join(scriptDir, '.env'));

// --- Config ---
const BOT_TOKEN = process.env.TELEGRAM_TEAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.TELEGRAM_TEAM_WEBHOOK_SECRET;
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
const WEBHOOK_PATH = '/api/integrations/telegram/team';

// --- Guards ---
if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_TEAM_BOT_TOKEN is not set in .env.local');
  process.exit(1);
}

const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function apiCall(method, body = {}) {
  const res = await fetch(`${API_BASE}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return json;
}

// --- Commands ---
async function register() {
  if (!APP_URL) {
    console.error('❌ NEXT_PUBLIC_APP_URL is not set. Cannot register webhook without the public URL.');
    process.exit(1);
  }
  if (!WEBHOOK_SECRET) {
    console.error('❌ TELEGRAM_TEAM_WEBHOOK_SECRET is not set.');
    process.exit(1);
  }

  const webhookUrl = `${APP_URL}${WEBHOOK_PATH}`;
  console.log(`🔗 Registering webhook: ${webhookUrl}`);

  const result = await apiCall('setWebhook', {
    url: webhookUrl,
    secret_token: WEBHOOK_SECRET,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: false,
  });

  if (result.ok) {
    console.log('✅ Webhook registered successfully.');
    console.log(`   URL:           ${webhookUrl}`);
    console.log(`   Secret set:    yes`);
    console.log(`   Description:   ${result.description}`);
  } else {
    console.error('❌ Webhook registration failed:', result);
    process.exit(1);
  }
}

async function info() {
  const result = await apiCall('getWebhookInfo');
  if (result.ok) {
    const w = result.result;
    console.log('📡 Webhook Info for @nexusPandoras_bot:');
    console.log(`   URL:              ${w.url || '(not set)'}`);
    console.log(`   Has secret token: ${w.has_custom_certificate ? 'yes' : (w.url ? 'check manually' : 'n/a')}`);
    console.log(`   Pending updates:  ${w.pending_update_count}`);
    console.log(`   Last error:       ${w.last_error_message || 'none'}`);
    console.log(`   Last error date:  ${w.last_error_date ? new Date(w.last_error_date * 1000).toISOString() : 'none'}`);
    console.log(`   Max connections:  ${w.max_connections ?? 40}`);
    console.log(`   Allowed updates:  ${(w.allowed_updates || ['all']).join(', ')}`);
  } else {
    console.error('❌ Failed to fetch webhook info:', result);
    process.exit(1);
  }
}

async function deleteWebhook() {
  const result = await apiCall('deleteWebhook', { drop_pending_updates: false });
  if (result.ok) {
    console.log('🗑️  Webhook deleted. Bot will revert to polling mode.');
  } else {
    console.error('❌ Failed to delete webhook:', result);
    process.exit(1);
  }
}

// --- Dispatcher ---
const command = process.argv[2];
switch (command) {
  case 'register':
    await register();
    break;
  case 'info':
    await info();
    break;
  case 'delete':
    await deleteWebhook();
    break;
  default:
    console.log('Usage: node nexus-team-webhook.mjs <register|info|delete>');
    process.exit(0);
}
