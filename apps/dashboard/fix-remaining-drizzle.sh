#!/bin/bash

# Script to fix remaining Drizzle configuration issues

files=(
  "src/app/api/admin/projects/[id]/route.ts"
  "src/app/api/admin/projects/featured-status/[id]/route.ts"
  "src/app/api/projects/apply/route.ts"
  "src/app/api/projects/draft/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing remaining Drizzle issues in $file..."
    
    # Fix imports and configuration
    sed -i.bak 's|import { drizzle } from "drizzle-orm/postgres-js";|import { db } from "~/db";|' "$file"
    sed -i.bak 's|import postgres from "postgres";||' "$file"
    sed -i.bak 's|// Initialize database connection.*||' "$file"
    sed -i.bak 's|const connectionString = process.env.DATABASE_URL;||' "$file"
    sed -i.bak 's|if (!connectionString) { throw new Error.*||' "$file"
    sed -i.bak 's|const client = postgres(connectionString);||' "$file"
    sed -i.bak 's|const db = drizzle(client.*|// const db = drizzle(client, { schema: { projects: projectsSchema } });|' "$file"
    
    echo "✅ Fixed remaining Drizzle issues in $file"
  else
    echo "❌ File not found: $file"
  fi
done

echo "🎉 All remaining Drizzle issues fixed!"
