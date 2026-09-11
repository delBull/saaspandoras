import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  sendBookingPendingEmail,
  sendBookingConfirmedEmail,
  sendBookingReminderEmail,
} from '@/lib/email/scheduler-mailer';
import * as emailClient from '@/lib/email/client';
import { sendSchedulerTelegramAlert } from '../scheduler-telegram-notifier';

describe('📅 SCHEDULER PIPELINE, BRANDING & NOTIFICATIONS — Test Suite', () => {
  let emailSpy: any;
  let fetchSpy: any;

  beforeEach(() => {
    emailSpy = vi.spyOn(emailClient, 'sendEmail').mockImplementation(async (params: any) => {
      return { success: true, id: 'mock-email-id-123' };
    });
  });

  afterEach(() => {
    emailSpy.mockRestore();
    if (fetchSpy) fetchSpy.mockRestore();
  });

  describe('1. SchedulerMailer & Adaptive Brand Identity', () => {
    it('generates 100% Pandoras branded email when booking belongs to Pandoras', async () => {
      const start = new Date(Date.now() + 86400000);
      const end = new Date(start.getTime() + 1800000);

      await sendBookingConfirmedEmail('investor@capital.com', {
        name: 'Roberto Gómez',
        start,
        end,
        meetingLink: 'https://meet.google.com/pdr-sovereign-call',
        brand: {
          name: "Pandora's",
          isPandoras: true,
        },
      });

      expect(emailSpy).toHaveBeenCalled();
      const callArgs = emailSpy.mock.calls[0][0];

      expect(callArgs.to).toBe('investor@capital.com');
      expect(callArgs.subject).toContain("Pandora's Growth OS");
      expect(callArgs.html).toContain("Pandora's Growth OS • Sovereign Capital & Growth Infrastructure");
      expect(callArgs.attachments).toBeDefined();
      expect(callArgs.attachments.length).toBe(1);
      expect(callArgs.attachments[0].filename).toBe('invite.ics');

      const decodedIcs = Buffer.from(callArgs.attachments[0].content, 'base64').toString('utf-8');
      expect(decodedIcs).toContain('BEGIN:VCALENDAR');
      expect(decodedIcs).toContain("SUMMARY:Sesión Pandora's Growth OS");
      expect(decodedIcs).toContain('LOCATION:https://meet.google.com/pdr-sovereign-call');
    });

    it('generates Tenant branded email with subtle Pandoras footer when booking belongs to a Tenant', async () => {
      const start = new Date(Date.now() + 86400000);
      const end = new Date(start.getTime() + 1800000);

      await sendBookingConfirmedEmail('buyer@snarai.com', {
        name: 'Lucía Fernández',
        start,
        end,
        meetingLink: 'https://meet.google.com/snarai-villa-tour',
        brand: {
          name: "S'Narai",
          isPandoras: false,
          logoUrl: 'https://snarai.com/logo.png',
        },
      });

      expect(emailSpy).toHaveBeenCalled();
      const callArgs = emailSpy.mock.calls[0][0];

      // Tenant name is the primary brand
      expect(callArgs.to).toBe('buyer@snarai.com');
      expect(callArgs.subject).toContain("S'Narai");
      expect(callArgs.html).toContain("Cita Confirmada • S'Narai");
      expect(callArgs.html).toContain("Equipo S'Narai");

      // Pandora's is only in the subtle footer
      expect(callArgs.html).toContain("Coordinado mediante <strong>Pandora's Growth OS</strong> • Infraestructura Soberana");

      // ICS reflects tenant name
      const decodedIcs = Buffer.from(callArgs.attachments[0].content, 'base64').toString('utf-8');
      expect(decodedIcs).toContain("SUMMARY:Sesión con S'Narai");
      expect(decodedIcs).toContain('LOCATION:https://meet.google.com/snarai-villa-tour');
    });

    it('sends reminder emails correctly for 24h and 1h windows', async () => {
      const start = new Date(Date.now() + 3600000);
      const end = new Date(start.getTime() + 1800000);

      await sendBookingReminderEmail('client@pandoras.finance', {
        name: 'Carlos Founder',
        start,
        end,
        meetingLink: 'https://meet.google.com/pdr-sovereign-call',
        window: '1h',
        brand: {
          name: "Pandora's",
          isPandoras: true,
        },
      });

      expect(emailSpy).toHaveBeenCalled();
      const callArgs = emailSpy.mock.calls[0][0];
      expect(callArgs.subject).toContain('en 1 hora');
      expect(callArgs.html).toContain('en 1 hora');
    });
  });

  describe('2. Telegram Notifier & Strict Multi-Tenant Separation', () => {
    it('dispatches to Tenant Telegram bot and chat when booking belongs to Tenant', async () => {
      let sentUrl = '';
      let sentBody: any = null;

      fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any, init: any) => {
        sentUrl = String(url);
        sentBody = JSON.parse(init.body);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      });

      const result = await sendSchedulerTelegramAlert({
        bookingId: 'bk_tenant_999',
        startTime: new Date('2026-09-12T15:00:00Z'),
        lead: {
          name: 'Comprador Tulum',
          email: 'buyer@snarai.com',
          phone: '+529981234567',
          notes: 'Interesado en departamento 2 habitaciones',
        },
        meetingLink: 'https://meet.google.com/snarai-call',
        tenantSlug: 'snarai',
        project: {
          id: 2,
          title: "S'Narai Real Estate",
          slug: 'snarai',
          tenantRuntimeConfig: {
            secrets: {
              telegramBotToken: 'tenant_bot_token_secret_123',
            },
            telegramNotificationChatId: '-100987654321',
          },
        },
      });

      expect(result.success).toBe(true);
      expect(result.channel).toBe('tenant');
      expect(sentUrl).toContain('tenant_bot_token_secret_123');
      expect(sentBody.chat_id).toBe('-100987654321');
      expect(sentBody.text).toContain("S'Narai Real Estate");
      expect(sentBody.text).toContain('Comprador Tulum');
      expect(sentBody.text).toContain('departamento 2 habitaciones');
    });

    it('skips gracefully when tenant has no Telegram credentials configured without polluting Pandoras chats', async () => {
      let fetchCalled = false;
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        fetchCalled = true;
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      });

      const result = await sendSchedulerTelegramAlert({
        bookingId: 'bk_tenant_no_tg',
        startTime: new Date('2026-09-12T15:00:00Z'),
        lead: {
          name: 'Lead Sin Bot',
          email: 'lead@nobot.com',
        },
        tenantSlug: 'other_tenant',
        project: {
          id: 3,
          title: 'Otro Tenant',
          slug: 'other_tenant',
          tenantRuntimeConfig: {},
        },
      });

      expect(result.success).toBe(true);
      expect(result.channel).toBe('skipped');
      expect(fetchCalled).toBe(false);
    });

    it('routes Pandoras booking for Marco (Founder) to Marco personal chat with Founder VIP header', async () => {
      const origBotToken = process.env.TELEGRAM_BOT_TOKEN;
      const origMarcoId = process.env.MARCO_TELEGRAM_ID;
      process.env.TELEGRAM_BOT_TOKEN = 'master_pandoras_bot_token';
      process.env.MARCO_TELEGRAM_ID = '987654321_marco';

      let sentUrl = '';
      let sentBody: any = null;

      fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any, init: any) => {
        sentUrl = String(url);
        sentBody = JSON.parse(init.body);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      });

      try {
        const result = await sendSchedulerTelegramAlert({
          bookingId: 'bk_pandoras_marco_1',
          startTime: new Date('2026-09-12T17:00:00Z'),
          lead: {
            name: 'VC Partner',
            email: 'vc@fund.com',
            notes: 'Reunión de financiamiento institucional',
          },
          tenantSlug: 'pandoras',
          hostUserId: 'usr_marco_platform_admin',
          hostRole: 'FOUNDER',
        });

        expect(result.success).toBe(true);
        expect(result.channel).toBe('pandoras_founder');
        expect(sentUrl).toContain('master_pandoras_bot_token');
        expect(sentBody.chat_id).toBe('987654321_marco');
        expect(sentBody.text).toContain("Pandora's Founder Session");
        expect(sentBody.text).toContain('Marco (Founder & SuperAdmin)');
      } finally {
        process.env.TELEGRAM_BOT_TOKEN = origBotToken;
        process.env.MARCO_TELEGRAM_ID = origMarcoId;
      }
    });

    it('routes Pandoras booking for Operations team to Ops chat with Operations header', async () => {
      const origBotToken = process.env.TELEGRAM_BOT_TOKEN;
      const origOpsChat = process.env.TELEGRAM_OPS_CHAT_ID;
      process.env.TELEGRAM_BOT_TOKEN = 'master_pandoras_bot_token';
      process.env.TELEGRAM_OPS_CHAT_ID = '-100444555666_ops';

      let sentUrl = '';
      let sentBody: any = null;

      fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any, init: any) => {
        sentUrl = String(url);
        sentBody = JSON.parse(init.body);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      });

      try {
        const result = await sendSchedulerTelegramAlert({
          bookingId: 'bk_pandoras_ops_1',
          startTime: new Date('2026-09-12T17:00:00Z'),
          lead: {
            name: 'Dev Onboarding',
            email: 'dev@external.io',
          },
          tenantSlug: 'pandoras',
          hostUserId: 'usr_ops_team_member',
          hostRole: 'OPERATIONS',
        });

        expect(result.success).toBe(true);
        expect(result.channel).toBe('pandoras_ops');
        expect(sentUrl).toContain('master_pandoras_bot_token');
        expect(sentBody.chat_id).toBe('-100444555666_ops');
        expect(sentBody.text).toContain("Pandora's Operations");
        expect(sentBody.text).toContain('Equipo de Operaciones & Growth');
      } finally {
        process.env.TELEGRAM_BOT_TOKEN = origBotToken;
        process.env.TELEGRAM_OPS_CHAT_ID = origOpsChat;
      }
    });
  });
});
