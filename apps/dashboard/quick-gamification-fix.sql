-- =============================================
-- CORRECCIÓN RÁPIDA DE GAMIFICACIÓN
-- Ejecutar en PostgreSQL para corregir tipos de datos
-- =============================================

-- Corregir tipos de datos de user_id en tablas de gamificación
ALTER TABLE "gamification_events" ALTER COLUMN "user_id" SET DATA TYPE integer;
ALTER TABLE "gamification_profiles" ALTER COLUMN "user_id" SET DATA TYPE integer;
ALTER TABLE "user_achievements" ALTER COLUMN "user_id" SET DATA TYPE integer;
ALTER TABLE "user_points" ALTER COLUMN "user_id" SET DATA TYPE integer;
ALTER TABLE "user_rewards" ALTER COLUMN "user_id" SET DATA TYPE integer;

-- Corregir estado por defecto de projects
ALTER TABLE "projects" ALTER COLUMN "status" SET DEFAULT 'draft';

-- Agregar foreign keys si no existen
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gamification_events_user_id_users_id_fk') THEN
    ALTER TABLE "gamification_events" ADD CONSTRAINT "gamification_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gamification_profiles_user_id_users_id_fk') THEN
    ALTER TABLE "gamification_profiles" ADD CONSTRAINT "gamification_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_achievements_user_id_users_id_fk') THEN
    ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_points_user_id_users_id_fk') THEN
    ALTER TABLE "user_points" ADD CONSTRAINT "user_points_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_rewards_user_id_users_id_fk') THEN
    ALTER TABLE "user_rewards" ADD CONSTRAINT "user_rewards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;

-- Verificar que todo se configuró correctamente
SELECT 'Corrección de gamificación completada' as status;