'use server';

import { db } from "@/db";
import { administrators, schedulingSlots } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { addDays, format, isSameDay, setHours, setMinutes, startOfDay } from "date-fns";

export interface DayConfig {
    enabled: boolean;
    start: string; // "09:00"
    end: string;   // "17:00"
}

export interface AvailabilityConfig {
    monday: DayConfig;
    tuesday: DayConfig;
    wednesday: DayConfig;
    thursday: DayConfig;
    friday: DayConfig;
    saturday: DayConfig;
    sunday: DayConfig;
    timezone?: string;
}

const MAP_DAYS: Record<string, number> = {
    'sunday': 0,
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6
};

export async function getAdminAvailability(userId: string) {
    try {
        const admin = await db.query.administrators.findFirst({
            where: eq(administrators.walletAddress, userId)
            // NOTE: schema says walletAddress is the unique identifier used effectively as ID in many places, 
            // but `CalendarManager` passes `userId`. 
            // If `userId` passed to CalendarManager is the wallet address (which is likely given previous context), we use walletAddress.
            // Let's verify if `userId` is the `id` (int) or `walletAddress` (string).
            // In `CalendarManager`, `userId` is passed.
            // In usage, usually `account.address`.
            // So queries should use `walletAddress`.
        });

        if (!admin) return { success: false, error: "Admin not found" };

        return { success: true, availability: admin.availability as AvailabilityConfig | null };
    } catch (error) {
        console.error("Error fetching availability:", error);
        return { success: false, error: "Failed to fetch" };
    }
}

export async function saveAvailability(userId: string, config: AvailabilityConfig) {
    try {
        // 1. Update Admin Config
        await db.update(administrators)
            .set({ availability: config })
            .where(eq(administrators.walletAddress, userId));

        // 2. Regenerate Slots for next 30 days
        // A. Delete future Unbooked slots
        const now = new Date();
        await db.delete(schedulingSlots)
            .where(
                and(
                    eq(schedulingSlots.userId, userId),
                    eq(schedulingSlots.isBooked, false),
                    gte(schedulingSlots.startTime, now)
                )
            );

        // B. Generate New Slots
        const newSlots: { userId: string, startTime: Date, endTime: Date, isBooked: boolean, type: string }[] = [];

        // Generate for 30 days
        for (let i = 0; i < 30; i++) {
            const date = addDays(now, i);
            const dayNameIndex = date.getDay(); // 0 = Sunday

            // Find config for this day
            const dayKey = Object.keys(MAP_DAYS).find(k => MAP_DAYS[k] === dayNameIndex);
            if (!dayKey) continue;

            const dayConfig = (config as any)[dayKey] as DayConfig;

            if (dayConfig?.enabled) {
                // Generate slots
                const startParts = dayConfig.start.split(':').map(Number);
                const endParts = dayConfig.end.split(':').map(Number);

                const startH = startParts[0] ?? 0;
                const startM = startParts[1] ?? 0;
                const endH = endParts[0] ?? 0;
                const endM = endParts[1] ?? 0;

                let currentSlot = setMinutes(setHours(date, startH), startM);
                const endTime = setMinutes(setHours(date, endH), endM);

                // While slot + 30 mins <= end time
                while (currentSlot.getTime() + 30 * 60000 <= endTime.getTime()) {
                    // Skip if slot is in the past
                    if (currentSlot > now) {
                        newSlots.push({
                            userId,
                            startTime: new Date(currentSlot),
                            endTime: new Date(currentSlot.getTime() + 30 * 60000),
                            isBooked: false,
                            type: '30_min'
                        });
                    }
                    // Move by 30 mins
                    currentSlot = new Date(currentSlot.getTime() + 30 * 60000);
                }
            }
        }

        // C. Bulk Insert
        if (newSlots.length > 0) {
            // Bulk insert in chunks if needed, but 30 days * ~10 slots = 300 rows, single insert is fine for postgres
            await db.insert(schedulingSlots).values(newSlots);
        }

        return { success: true, generatedCount: newSlots.length };
    } catch (error) {
        console.error("Error saving availability:", error);
        return { success: false, error: "Failed to save" };
    }
}
