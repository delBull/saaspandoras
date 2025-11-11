-- Migration: Change gamification_profiles.user_id from integer to varchar to match users.id UUIDs
-- Also update all related tables to use varchar for user_id

-- First, drop foreign key constraints that reference users.id
ALTER TABLE "gamification_events" DROP CONSTRAINT "gamification_events_user_id_users_id_fk";
ALTER TABLE "gamification_profiles" DROP CONSTRAINT "gamification_profiles_user_id_users_id_fk";
ALTER TABLE "user_achievements" DROP CONSTRAINT "user_achievements_user_id_users_id_fk";
ALTER TABLE "user_points" DROP CONSTRAINT "user_points_user_id_users_id_fk";
ALTER TABLE "user_rewards" DROP CONSTRAINT "user_rewards_user_id_users_id_fk";

-- Change users.id from integer to varchar (UUID)
ALTER TABLE "users" ALTER COLUMN "id" TYPE varchar(255);

-- Change all gamification table user_id columns from integer to varchar
ALTER TABLE "gamification_events" ALTER COLUMN "user_id" TYPE varchar(255);
ALTER TABLE "gamification_profiles" ALTER COLUMN "user_id" TYPE varchar(255);
ALTER TABLE "user_achievements" ALTER COLUMN "user_id" TYPE varchar(255);
ALTER TABLE "user_points" ALTER COLUMN "user_id" TYPE varchar(255);
ALTER TABLE "user_rewards" ALTER COLUMN "user_id" TYPE varchar(255);

-- Recreate foreign key constraints
ALTER TABLE "gamification_events" ADD CONSTRAINT "gamification_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "gamification_profiles" ADD CONSTRAINT "gamification_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_points" ADD CONSTRAINT "user_points_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_rewards" ADD CONSTRAINT "user_rewards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
