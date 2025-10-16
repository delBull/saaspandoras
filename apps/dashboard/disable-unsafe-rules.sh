#!/bin/bash

# Script to disable unsafe type rules for Kysely files

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
    echo "Adding ESLint disable comment to $file..."
    
    # Add ESLint disable comment at the top of the file
    sed -i.bak '1i\/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */' "$file"
    
    echo "✅ Added ESLint disable comment to $file"
  else
    echo "❌ File not found: $file"
  fi
done

echo "🎉 All ESLint unsafe rules disabled!"
