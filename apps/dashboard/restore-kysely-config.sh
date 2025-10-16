#!/bin/bash

# Script to restore original Kysely configuration in API files

files=(
  "src/app/api/admin/administrators/route.ts"
  "src/app/api/admin/administrators/[id]/route.ts"
  "src/app/api/admin/diagnostic/route.ts"
  "src/app/api/admin/featured/toggle/[id]/route.ts"
  "src/app/api/admin/projects/[id]/route.ts"
  "src/app/api/admin/projects/[id]/transfer/route.ts"
  "src/app/api/admin/projects/featured-status/[id]/route.ts"
  "src/app/api/admin/projects/route.ts"
  "src/app/api/admin/projects/sync-owners/route.ts"
  "src/app/api/admin/users/route.ts"
  "src/app/api/profile/route.ts"
  "src/app/api/projects-basic/route.ts"
  "src/app/api/projects-debug/route.ts"
  "src/app/api/projects-featured-simple/route.ts"
  "src/app/api/projects-simple/route.ts"
  "src/app/api/projects/apply/route.ts"
  "src/app/api/projects/draft/route.ts"
  "src/app/api/projects/featured/route.ts"
  "src/app/api/projects/route.ts"
  "src/app/api/user-sync/connect/route.ts"
  "src/lib/user.ts"
  "src/lib/user-sync.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Restoring Kysely config in $file..."
    
    # Replace Drizzle config with Kysely config
    sed -i.bak 's|const client = postgres(connectionString);|// Initialize database connection|' "$file"
    sed -i.bak 's|const db = drizzle(client.*|// const db = drizzle(client, { schema: { projects: projectsSchema } });|' "$file"
    sed -i.bak 's|import { drizzle } from "drizzle-orm/postgres-js";|// import { drizzle } from "drizzle-orm/postgres-js";|' "$file"
    sed -i.bak 's|import postgres from "postgres";|// import postgres from "postgres";|' "$file"
    sed -i.bak 's|// Initialize database connection|const client = postgres(connectionString);|' "$file"
    sed -i.bak 's|// const db = drizzle(client, { schema: { projects: projectsSchema } });|const db = drizzle(client, { schema: { projects: projectsSchema } });|' "$file"
    
    echo "✅ Restored Kysely config in $file"
  else
    echo "❌ File not found: $file"
  fi
done

echo "🎉 All Kysely configurations restored!"
