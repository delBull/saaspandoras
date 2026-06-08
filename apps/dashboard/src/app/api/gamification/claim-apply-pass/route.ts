import { type NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { db } from "@/db";
import { users, achievements, userAchievements, gamificationProfiles, userPoints } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {
        // Require verified JWT session (fallback to header for TMA)
        const auth = await getAuth();
        let walletAddress = auth.isVerified && auth.session?.address ? auth.session.address : null;
        
        // TMA fallback: if no JWT, try header (Thirdweb sets x-wallet-address)
        if (!walletAddress) {
            const headerWallet = req.headers.get('x-thirdweb-address') ??
                req.headers.get('x-wallet-address') ??
                req.headers.get('x-user-address');
            if (headerWallet) walletAddress = headerWallet.toLowerCase();
        }
        
        if (!walletAddress) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Find User by Wallet
        const user = await db.query.users.findFirst({
            where: eq(users.walletAddress, walletAddress),
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 2. Find "Apply Pass Holder" Achievement
        let achievement = await db.query.achievements.findFirst({
            where: eq(achievements.name, "Apply Pass Holder"),
        });

        // Lazy create if not exists (Auto-seed)
        if (!achievement) {
            const [newAch] = await db.insert(achievements).values({
                name: "Apply Pass Holder",
                description: "Poseedor del acceso exclusivo para crear protocolos en Pandora.",
                icon: "🎟️",
                type: "early_adopter",
                requiredPoints: 0,
                pointsReward: 100,
                badgeUrl: "/badges/apply-pass.png",
                isActive: true,
            }).returning();
            achievement = newAch;
        }

        if (!achievement) {
            return NextResponse.json({ error: "Failed to load achievement" }, { status: 500 });
        }

        // 3. Check if User already has it
        const existingUnlock = await db.query.userAchievements.findFirst({
            where: and(
                eq(userAchievements.userId, user.id),
                eq(userAchievements.achievementId, achievement.id)
            ),
        });

        if (existingUnlock) {
            return NextResponse.json({ awarded: false, message: "Already claimed" });
        }

        // 4. Unlock it!
        await db.transaction(async (tx) => {
            // Award Achievement
            await tx.insert(userAchievements).values({
                userId: user.id,
                achievementId: achievement.id,
                isUnlocked: true,
                unlockedAt: new Date(),
                progress: 100,
            });

            // Award Points
            const points = achievement.pointsReward;

            // Update Profile
            const profile = await tx.query.gamificationProfiles.findFirst({
                where: eq(gamificationProfiles.userId, user.id)
            });

            if (profile) {
                await tx.update(gamificationProfiles)
                    .set({
                        totalPoints: (profile.totalPoints || 0) + points,
                        updatedAt: new Date()
                    })
                    .where(eq(gamificationProfiles.id, profile.id));
            } else {
                // Create profile if missing? (Should exist on login)
                // Skipping for safety to avoid FK errors if logic differs
            }

            // Log Points History
            await tx.insert(userPoints).values({
                userId: user.id,
                points: points,
                reason: "Unlocked: Apply Pass Holder",
                category: "special_event",
                metadata: { achievementId: achievement.id }
            });
        });

        return NextResponse.json({ awarded: true, points: achievement.pointsReward });

    } catch (error) {
        console.error("Claim Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
