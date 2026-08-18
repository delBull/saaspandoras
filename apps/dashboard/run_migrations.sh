#!/bin/bash
# ⚠️ WARNING: DO NOT HARDCODE YOUR DATABASE_URL HERE.
# The connection string should be provided via the environment (e.g., .env files).

if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL is not set."
  echo "Please set it in your environment or via a .env file before running migrations."
  exit 1
fi

echo "Generating Drizzle migrations..."
bun run db:generate

echo "Applying Drizzle migrations safely (db:migrate)..."
bun run db:migrate
