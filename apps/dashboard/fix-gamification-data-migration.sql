-- Migration: Update gamification tables to use correct UUID user_ids from users table

-- Update gamification_profiles user_ids based on wallet_address match
UPDATE gamification_profiles
SET user_id = users.id
FROM users
WHERE gamification_profiles.wallet_address = users."walletAddress";

-- Update gamification_events user_ids (assuming they use the same integer system)
UPDATE gamification_events
SET user_id = gamification_profiles.user_id
FROM gamification_profiles
WHERE gamification_events.user_id::integer = gamification_profiles.id;

-- Update user_achievements user_ids
UPDATE user_achievements
SET user_id = gamification_profiles.user_id
FROM gamification_profiles
WHERE user_achievements.user_id::integer = gamification_profiles.id;

-- Update user_points user_ids
UPDATE user_points
SET user_id = gamification_profiles.user_id
FROM gamification_profiles
WHERE user_points.user_id::integer = gamification_profiles.id;

-- Update user_rewards user_ids
UPDATE user_rewards
SET user_id = gamification_profiles.user_id
FROM gamification_profiles
WHERE user_rewards.user_id::integer = gamification_profiles.id;

-- Now recreate the foreign key constraints
ALTER TABLE "gamification_events" ADD CONSTRAINT "gamification_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "gamification_profiles" ADD CONSTRAINT "gamification_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_points" ADD CONSTRAINT "user_points_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_rewards" ADD CONSTRAINT "user_rewards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
