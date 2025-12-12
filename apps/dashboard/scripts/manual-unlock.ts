
import { GamificationService } from '../src/lib/gamification/service';
import { db } from '../src/db';
import { achievements } from '../src/db/schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function main() {
    const TEST_WALLET = "0xdeeb671deda720a75b07e9874e4371c194e38919";
    const ACHIEVEMENT_NAME = "Curso Completado";

    console.log(`🔓 Attempting to manually unlock "${ACHIEVEMENT_NAME}" for ${TEST_WALLET}...`);

    // 1. Check if Service method works
    // Note: unlockAchievement is private. 
    // We can call 'checkAndUnlockAchievements' with a forced event that triggers it?
    // Or we can modify Service to check if 'Curso Completado' exists?

    // Using checkAndUnlockAchievements via a simulated event
    await (GamificationService as any).checkAndUnlockAchievements(TEST_WALLET, 'course_completed', 100);

    console.log("✅ Unlock call finished.");
    process.exit(0);
}

main().catch(console.error);
