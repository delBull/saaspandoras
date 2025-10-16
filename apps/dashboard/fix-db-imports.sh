#!/bin/bash

# Script to fix all database imports from ~/db to local Drizzle

files=(
  "src/app/api/projects-debug/route.ts"
  "src/app/api/projects-featured-simple/route.ts"
  "src/app/api/projects/apply/route.ts"
  "src/app/api/projects/draft/route.ts"
  "src/app/api/admin/projects/sync-owners/route.ts"
  "src/app/api/admin/projects/route.ts"
  "src/app/api/admin/projects/[id]/transfer/route.ts"
  "src/app/api/admin/projects/[id]/route.ts"
  "src/app/api/admin/projects/[id]/featured/route.ts"
  "src/app/api/admin/projects/featured-status/[id]/route.ts"
  "src/app/api/admin/diagnostic/route.ts"
  "src/app/api/admin/users/route.ts"
  "src/app/api/admin/featured/toggle/[id]/route.ts"
  "src/app/api/admin/administrators/route.ts"
  "src/app/api/admin/administrators/[id]/route.ts"
  "src/app/api/projects-basic/route.ts"
  "src/app/api/user-sync/connect/route.ts"
  "src/lib/user.ts"
  "src/lib/user-sync.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."
    
    # Replace ~/db imports with local Drizzle setup
    sed -i.bak '1,10{
      /^import { NextResponse/!{
        /^import { db } from "~\/db";$/{
          i\
import { drizzle } from "drizzle-orm/postgres-js";\
import postgres from "postgres";\
\
// Initialize database connection\
const connectionString = process.env.DATABASE_URL;\
if (!connectionString) {\
  throw new Error("DATABASE_URL is not set in environment variables");\
}\
\
const client = postgres(connectionString);\
const db = drizzle(client);
          d
        }
      }
    }' "$file"
    
    echo "✅ Fixed $file"
  else
    echo "❌ File not found: $file"
  fi
done

echo "🎉 All database imports fixed!"
