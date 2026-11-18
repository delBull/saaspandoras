-- 0101: alinea `meetings.host_collaborator_id` con el modelo de colaboradores.
--
-- Problema: la base tenía `varchar` con FK a `users(id)`, mientras el esquema
-- Drizzle ya declaraba `integer` → `nexus_collaborators(id)`. Insertar una meet
-- con un id de colaborador violaba la FK real (`meetings_host_collaborator_id_users_id_fk`).
--
-- Precondición verificada: la tabla estaba VACÍA (0 filas) al aplicar.
-- Reversible: recrear la FK anterior si hubiera que volver atrás.

BEGIN;

ALTER TABLE "meetings" DROP CONSTRAINT "meetings_host_collaborator_id_users_id_fk";

ALTER TABLE "meetings"
  ALTER COLUMN "host_collaborator_id" TYPE integer USING NULLIF("host_collaborator_id", '')::integer;

ALTER TABLE "meetings"
  ADD CONSTRAINT "meetings_host_collaborator_id_collaborators_fk"
  FOREIGN KEY ("host_collaborator_id") REFERENCES "nexus_collaborators"("id");

COMMIT;
