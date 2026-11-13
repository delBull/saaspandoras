#!/usr/bin/env bash
# Aplica migraciones SQL pendientes de forma IDEMPOTENTE y registrada.
#
# Contexto: `drizzle-kit generate` no es usable (el journal se detiene en 0087 y
# 0088+ se escribieron a mano). Este runner aplica los .sql en orden y lleva su
# propio registro en `schema_migrations`, sin tocar los snapshots de Drizzle.
#
# Uso:
#   DATABASE_URL=... ./scripts/db/apply-pending-migrations.sh            # aplica
#   DATABASE_URL=... DRY_RUN=1 ./scripts/db/apply-pending-migrations.sh  # solo muestra
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL requerido}"
DIR="${MIGRATIONS_DIR:-apps/dashboard/drizzle}"
DRY_RUN="${DRY_RUN:-0}"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q <<'SQL'
CREATE TABLE IF NOT EXISTS schema_migrations (
  filename    text PRIMARY KEY,
  applied_at  timestamptz NOT NULL DEFAULT now(),
  checksum    text NOT NULL
);
SQL

for file in $(ls "$DIR"/*.sql | sort); do
  name="$(basename "$file")"
  sum="$(shasum -a 256 "$file" | awk '{print $1}')"
  applied="$(psql "$DATABASE_URL" -Atc "select checksum from schema_migrations where filename = '$name'")"

  if [ -n "$applied" ]; then
    if [ "$applied" != "$sum" ]; then
      echo "✗ $name ya aplicada con otro contenido. Migración inmutable: no se reaplica."
      exit 1
    fi
    continue
  fi

  if [ "$DRY_RUN" = "1" ]; then
    echo "→ pendiente: $name"
    continue
  fi

  echo "→ aplicando $name"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q <<SQL
BEGIN;
\i $file
INSERT INTO schema_migrations (filename, checksum) VALUES ('$name', '$sum');
COMMIT;
SQL
done

if [ "$DRY_RUN" != "1" ]; then
  echo "✔ migraciones al día ($(psql "$DATABASE_URL" -Atc 'select count(*) from schema_migrations'))"
fi
