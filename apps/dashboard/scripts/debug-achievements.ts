
import { db } from '../src/db';
import { achievements, userAchievements, users } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function main() {
    console.log('🔍 Checking Achievements Table...');
    const allAchievements = await db.select().from(achievements);

    if (allAchievements.length === 0) {
        console.log('❌ No achievements found in DB!');
    } else {
        console.log(`✅ Found ${allAchievements.length} achievements.`);
        allAchievements.forEach(a => {
            console.log(`   - [${a.id}] "${a.name}" (Type: ${a.type})`);
        });
    }

    const TEST_WALLET = "0xdeeb671deda720a75b07e9874e4371c194e38919";
    console.log(`\n🔍 Checking User Achievements for ${TEST_WALLET}...`);

    const user = await db.select().from(users).where(eq(users.walletAddress, TEST_WALLET)).limit(1);
    if (!user || user.length === 0) {
        console.log('❌ User not found.');
        process.exit(0);
    }

    const userId = user[0].id; // varchar
    console.log(`   User ID: ${userId}`);

    const userAchs = await db
        .select()
        .from(userAchievements)
        .where(eq(userAchievements.userId, userId));

    if (userAchs.length === 0) {
        console.log('❌ No user achievements found.');
    } else {
        console.log(`✅ Found ${userAchs.length} user achievements.`);
        userAchs.forEach(ua => {
            console.log(`   - Achievement ID: ${ua.achievementId}, Unlocked: ${ua.isUnlocked}`);
        });
    }

    process.exit(0);
}

main().catch(console.error);
