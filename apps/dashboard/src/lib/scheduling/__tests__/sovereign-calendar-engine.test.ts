import { describe, it, expect } from 'vitest';
import {
  SovereignCalendarEngine,
  SovereignCalendarConfig,
} from '../sovereign-calendar-engine';

describe('📅 SOVEREIGN CALENDAR ENGINE — Test Suite', () => {
  describe('1. Default Canonical Configuration & Resolution', () => {
    it('provides safe canonical defaults when no custom configuration is set', () => {
      const config = SovereignCalendarEngine.getDefaultConfig();

      expect(config.isActive).toBe(true);
      expect(config.timezone).toBe('America/Mexico_City');
      expect(config.durationMinutes).toBe(30);
      expect(config.bufferMinutes).toBe(15);
      expect(config.minAdvanceHours).toBe(24);
      expect(config.maxDaysInFuture).toBe(14);
      expect(config.availability.monday.enabled).toBe(true);
      expect(config.availability.saturday.enabled).toBe(false);
      expect(config.availability.sunday.enabled).toBe(false);
    });

    it('resolves config safely for tenant or platform admin host', async () => {
      const resolved = await SovereignCalendarEngine.resolveConfig({
        tenantSlug: 'pandoras',
      });

      expect(resolved).toBeDefined();
      expect(resolved.config).toBeDefined();
      expect(resolved.tenantSlug).toBe('pandoras');
      expect(typeof resolved.hostUserId).toBe('string');
      expect(resolved.hostUserId.length).toBeGreaterThan(0);
    });
  });

  describe('2. Dynamic Slot Calculation (Zero Pre-Seeding Dependency)', () => {
    it('generates candidate slots on-the-fly within allowed bounds and IANA timezone', async () => {
      const now = new Date();
      const fromDate = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 2 days ahead
      const toDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days ahead

      const slots = await SovereignCalendarEngine.calculateDynamicSlots({
        tenantSlug: 'pandoras',
        fromDate,
        toDate,
      });

      expect(Array.isArray(slots)).toBe(true);
      if (slots.length > 0 && slots[0]) {
        const first = slots[0];
        expect(first.startTime).toBeDefined();
        expect(first.endTime).toBeDefined();
        expect(first.formattedLocalTime).toBeDefined();
        expect(first.formattedLocalDate).toBeDefined();
        expect(first.durationMinutes).toBe(30);
        expect(first.timezone).toBe('America/Mexico_City');
        expect(new Date(first.startTime).getTime()).toBeLessThan(new Date(first.endTime).getTime());
      }
    });

    it('returns empty array when calendar is disabled', async () => {
      const disabledConfig: SovereignCalendarConfig = {
        ...SovereignCalendarEngine.getDefaultConfig(),
        isActive: false,
      };

      const slots = await SovereignCalendarEngine.calculateDynamicSlots({
        config: disabledConfig,
        tenantSlug: 'disabled_tenant',
      });

      expect(slots).toEqual([]);
    });

    it('respects weekend closures when disabled in config', async () => {
      const config = SovereignCalendarEngine.getDefaultConfig();
      expect(config.availability.saturday.enabled).toBe(false);
      expect(config.availability.sunday.enabled).toBe(false);

      const slots = await SovereignCalendarEngine.calculateDynamicSlots({
        config,
        tenantSlug: 'pandoras',
      });

      // Verify no Sunday slots are returned
      const hasSundaySlots = slots.some((s) => {
        const date = new Date(s.startTime);
        return date.getDay() === 0; // 0 = Sunday
      });

      expect(hasSundaySlots).toBe(false);
    });
  });

  describe('3. Atomic Hold & Conflict Hardening', () => {
    let testHost = 'usr_platform_admin_default';

    it('acquires an atomic hold for an available window', async () => {
      const { db } = await import('@/db');
      const user = await db.query.users.findFirst();
      if (user) testHost = user.id;

      const randMs = Math.floor(Math.random() * 1000000000) + 100000;
      const startTime = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000 + randMs);
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

      const result = await SovereignCalendarEngine.acquireAtomicHold({
        hostUserId: testHost,
        startTime,
        endTime,
        heldBy: 'lead1@empresa.com',
        holdMinutes: 15,
        idempotencyKey: 'idem_key_1',
      });

      expect(result.success).toBe(true);
      expect(result.holdId).toBeDefined();
      expect(result.expiresAt).toBeDefined();
      expect(new Date(result.expiresAt!).getTime()).toBeGreaterThan(Date.now());
    });

    it('rejects concurrent attempt for the exact same slot by another party (CONFLICT)', async () => {
      const randMs = Math.floor(Math.random() * 1000000000) + 100000;
      const startTime = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000 + randMs);
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

      // First acquire
      await SovereignCalendarEngine.acquireAtomicHold({
        hostUserId: testHost,
        startTime,
        endTime,
        heldBy: 'lead_initial@empresa.com',
        holdMinutes: 15,
        idempotencyKey: 'idem_initial',
      });

      // Concurrent attempt
      const result = await SovereignCalendarEngine.acquireAtomicHold({
        hostUserId: testHost,
        startTime,
        endTime,
        heldBy: 'lead2_adversary@empresa.com',
        holdMinutes: 15,
        idempotencyKey: 'idem_key_2',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('CONFLICT');
    });

    it('allows re-entry by the exact same user / idempotency key', async () => {
      const randMs = Math.floor(Math.random() * 1000000000) + 100000;
      const startTime = new Date(Date.now() + 140 * 24 * 60 * 60 * 1000 + randMs);
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

      // First acquire
      await SovereignCalendarEngine.acquireAtomicHold({
        hostUserId: testHost,
        startTime,
        endTime,
        heldBy: 'lead1@empresa.com',
        holdMinutes: 15,
        idempotencyKey: 'idem_key_reentry',
      });

      // Re-entry
      const result = await SovereignCalendarEngine.acquireAtomicHold({
        hostUserId: testHost,
        startTime,
        endTime,
        heldBy: 'lead1@empresa.com',
        holdMinutes: 15,
        idempotencyKey: 'idem_key_reentry', // same idempotency key
      });

      expect(result.success).toBe(true);
      expect(result.holdId).toBeDefined();
    });
  });

  describe('4. Idempotent Booking Execution', () => {
    let testHost = 'usr_platform_admin_default';

    it('converts an atomic hold into a confirmed booking and handles idempotent duplicate submissions', async () => {
      const { db } = await import('@/db');
      const user = await db.query.users.findFirst();
      if (user) testHost = user.id;

      const randMs2 = Math.floor(Math.random() * 1000000000) + 100000;
      const startTime = new Date(Date.now() + 200 * 24 * 60 * 60 * 1000 + randMs2);
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

      // 1. Hold
      const hold = await SovereignCalendarEngine.acquireAtomicHold({
        hostUserId: testHost,
        startTime,
        endTime,
        heldBy: 'carlos@partner.com',
        holdMinutes: 15,
        idempotencyKey: 'booking_lead_carlos',
      });

      expect(hold.success).toBe(true);
      expect(hold.holdId).toBeDefined();

      // 2. Book
      const booking = await SovereignCalendarEngine.executeIdempotentBooking({
        holdId: hold.holdId!,
        idempotencyKey: 'booking_lead_carlos',
        leadName: 'Carlos Mendoza',
        leadEmail: 'carlos@partner.com',
        leadPhone: '+525512345678',
        notificationPreference: 'whatsapp',
        notes: 'Reunión de alineación estratégica',
      });

      expect(booking.success).toBe(true);
      expect(booking.bookingId).toBeDefined();
      expect(booking.meetingLink).toBeDefined();

      // 3. Idempotent Replay (Double click or webhook retry)
      const duplicateBooking = await SovereignCalendarEngine.executeIdempotentBooking({
        holdId: hold.holdId!,
        idempotencyKey: 'booking_lead_carlos',
        leadName: 'Carlos Mendoza',
        leadEmail: 'carlos@partner.com',
      });

      expect(duplicateBooking.success).toBe(true);
      expect(duplicateBooking.isDuplicate).toBe(true);
      expect(duplicateBooking.bookingId).toBe(booking.bookingId);
    });
  });
});
