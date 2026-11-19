-- 0102_meeting_title.sql
-- Asunto de la reunión. Aditivo y nullable: las reuniones existentes siguen
-- funcionando y la UI cae al título del deck / "Sovereign Meet".
--
-- Rollback:
--   ALTER TABLE "meetings" DROP COLUMN IF EXISTS "title";

ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "title" text;
