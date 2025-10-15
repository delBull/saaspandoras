#!/bin/bash

# Script to fix schema imports from ~/db/schema to @/db/schema

files=(
  "src/app/api/projects/apply/route.ts"
  "src/app/api/projects/draft/route.ts"
  "src/app/api/admin/projects/sync-owners/route.ts"
  "src/app/api/admin/projects/route.ts"
  "src/app/api/admin/projects/[id]/route.ts"
  "src/app/api/admin/projects/[id]/featured/route.ts"
  "src/app/api/admin/projects/featured-status/[id]/route.ts"
  "src/app/api/admin/administrators/[id]/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing schema import in $file..."
    
    # Replace ~/db/schema imports with @/db/schema
    sed -i.bak 's|from "~/db/schema"|from "@/db/schema"|g' "$file"
    
    echo "✅ Fixed schema import in $file"
  else
    echo "❌ File not found: $file"
  fi
done

echo "🎉 All schema imports fixed!"
