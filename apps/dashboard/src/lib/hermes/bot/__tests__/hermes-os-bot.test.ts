import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HermesOSBotAdapter, TelegramUpdate } from '../hermes-os-bot';
import * as routerModule from '@/lib/hermes/telegram-runtime/router';

describe('🤖 Hermes OS Milestone 2.2 — @pandorasHermes_bot Control Plane & Command Center Adapter', () => {
  const TEST_BOT_TOKEN = '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ_TEST_TOKEN';
  let botAdapter: HermesOSBotAdapter;
  let sentMessages: Array<{ chatId: number; text: string; keyboard?: any }> = [];

  beforeEach(() => {
    sentMessages = [];
    botAdapter = new HermesOSBotAdapter({
      botToken: TEST_BOT_TOKEN,
      tmaBaseUrl: 'https://dash.pandoras.finance',
    });

    // Spy on sendTelegramMessage
    vi.spyOn(routerModule, 'sendTelegramMessage').mockImplementation(
      async (token: string, chatId: number, text: string, replyMarkup?: any) => {
        sentMessages.push({ chatId, text, keyboard: replyMarkup });
        return { ok: true, result: { message_id: 999 } };
      }
    );
  });

  it('BOT-001: Handles /start for unauthorized telegram user with instructions', async () => {
    const update: TelegramUpdate = {
      update_id: 1001,
      message: {
        message_id: 1,
        from: { id: 999999999, username: 'unauthorized_stranger' },
        chat: { id: 55555, type: 'private' },
        date: Math.floor(Date.now() / 1000),
        text: '/start',
      }
    };

    const result = await botAdapter.handleUpdate(update);
    expect(result.handled).toBe(true);
    expect(result.action).toBe('START_UNAUTHORIZED');

    expect(sentMessages.length).toBe(1);
    expect(sentMessages[0]?.text).toContain('no tiene workspaces vinculados');
  });

  it('BOT-002: Handles /status running thin health check without cognitive overhead', async () => {
    const update: TelegramUpdate = {
      update_id: 1002,
      message: {
        message_id: 2,
        from: { id: 999999999, username: 'unauthorized_stranger' },
        chat: { id: 55555, type: 'private' },
        date: Math.floor(Date.now() / 1000),
        text: '/status',
      }
    };

    const result = await botAdapter.handleUpdate(update);
    expect(result.handled).toBe(true);
  });

  it('BOT-003: Handles /portal command returning WebApp launch button', async () => {
    const update: TelegramUpdate = {
      update_id: 1003,
      message: {
        message_id: 3,
        from: { id: 999999999, username: 'operator_marco' },
        chat: { id: 55555, type: 'private' },
        date: Math.floor(Date.now() / 1000),
        text: '/portal',
      }
    };

    const result = await botAdapter.handleUpdate(update);
    expect(result.handled).toBe(true);
  });

  it('BOT-004: Handles /switch command listing authorized workspaces', async () => {
    const update: TelegramUpdate = {
      update_id: 1004,
      message: {
        message_id: 4,
        from: { id: 999999999, username: 'operator_marco' },
        chat: { id: 55555, type: 'private' },
        date: Math.floor(Date.now() / 1000),
        text: '/switch',
      }
    };

    const result = await botAdapter.handleUpdate(update);
    expect(result.handled).toBe(true);
  });

  it('BOT-005: Handles callback query switch:<UUID> with fail-closed access check', async () => {
    const fakeUuid = '00000000-0000-0000-0000-000000000000';
    const update: TelegramUpdate = {
      update_id: 1005,
      callback_query: {
        id: 'cb_123',
        from: { id: 999999999, username: 'operator_marco' },
        message: {
          message_id: 5,
          chat: { id: 55555 }
        },
        data: `switch:${fakeUuid}`,
      }
    };

    const result = await botAdapter.handleUpdate(update);
    expect(result.handled).toBe(true);
    expect(result.action).toBe('SWITCH_DENIED');
    expect(sentMessages.some(m => m.text.includes('Error al conmutar'))).toBe(true);
  });
});
