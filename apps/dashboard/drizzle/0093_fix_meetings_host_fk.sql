-- 0093_fix_meetings_host_fk.sql
-- CORRECTIVA (no destructiva): la FK de meetings.host_collaborator_id apuntaba a users(id)
-- (varchar), pero el código escribe un id de colaborador de Nexus (integer). Eso rompía
-- "Lanzar Meet Inmediata" y el agendado desde Deal Room con:
--   insert or update on table "meetings" violates foreign key constraint
--   "meetings_host_collaborator_id_users_id_fk"
--
-- Alinea la columna con el esquema de Drizzle (integer, nullable) y apunta la FK a
-- nexus_collaborators(id). La tabla tenía 0 filas al aplicar.
--
-- Rollback:
--   ALTER TABLE meetings DROP CONSTRAINT IF EXISTS meetings_host_collaborator_id_nexus_collaborators_id_fk;
--   ALTER TABLE meetings ALTER COLUMN host_collaborator_id TYPE varchar USING host_collaborator_id::varchar;
--   ALTER TABLE meetings ALTER COLUMN host_collaborator_id SET NOT NULL;
--   ALTER TABLE meetings ADD CONSTRAINT meetings_host_collaborator_id_users_id_fk
--     FOREIGN KEY (host_collaborator_id) REFERENCES users(id);

ALTER TABLE "meetings" DROP CONSTRAINT IF EXISTS "meetings_host_collaborator_id_users_id_fk";
ALTER TABLE "meetings" ALTER COLUMN "host_collaborator_id" DROP NOT NULL;
ALTER TABLE "meetings" ALTER COLUMN "host_collaborator_id" TYPE integer USING NULLIF(btrim("host_collaborator_id"), '')::integer;
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_host_collaborator_id_nexus_collaborators_id_fk"
  FOREIGN KEY ("host_collaborator_id") REFERENCES "nexus_collaborators"("id");
