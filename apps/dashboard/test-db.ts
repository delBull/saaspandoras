import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function main() {
    // Check the achievements CATALOG table
    const allAchievements = await db.execute(sql`SELECT id, name, type, description, points_reward FROM achievements ORDER BY id`);
    console.log("Achievements catalog count:", allAchievements.length);
    for (const a of allAchievements) {
        console.log(`  [${a.id}] ${a.name} (type: ${a.type}, points: ${a.points_reward})`);
    }

    // Check user_achievements (unlocked)
    const unlocked = await db.execute(sql`SELECT user_id, achievement_id, is_unlocked, progress FROM user_achievements`);
    console.log("\nUser achievements (unlocked) count:", unlocked.length);
    for (const u of unlocked) {
        console.log(`  user: ${(u.user_id as string)?.substring(0, 12)}, achievement: ${u.achievement_id}, unlocked: ${u.is_unlocked}`);
    }

    // Check gamification profiles
    const profiles = await db.execute(sql`SELECT id, user_id, wallet_address, total_points, current_level FROM gamification_profiles`);
    console.log("\nGamification profiles:", profiles.length);
    for (const p of profiles) {
        console.log(`  ${p.wallet_address} - ${p.total_points} pts - level ${p.current_level}`);
    }

    // Check ALL projects (no status filter)
    const allProjects = await db.execute(sql`SELECT id, title, slug, status, deployment_status, license_contract_address, contract_address, applicant_wallet_address FROM projects ORDER BY created_at DESC LIMIT 5`);
    console.log("\nAll recent projects:", allProjects.length);
    for (const p of allProjects) {
        console.log({ id: p.id, title: p.title, status: p.status, deploymentStatus: p.deployment_status, licenseCA: p.license_contract_address, contractCA: p.contract_address });
    }

    process.exit(0);
}
main();
