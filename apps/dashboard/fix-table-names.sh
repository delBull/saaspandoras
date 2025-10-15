#!/bin/bash

# Script to fix incorrect table names in SQL queries

files=(
  "src/app/api/admin/projects/route.ts"
  "src/app/api/admin/diagnostic/route.ts"
  "src/lib/user-sync.ts"
  "src/app/api/admin/users/route.ts"
  "src/lib/user.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing table names in $file..."
    
    # Fix "User" → "users"
    sed -i.bak 's/FROM "User"/FROM "users"/g' "$file"
    sed -i.bak 's/FROM "User" /FROM "users" /g' "$file"
    
    echo "✅ Fixed table names in $file"
  else
    echo "❌ File not found: $file"
  fi
done

echo "🎉 All table names fixed!"
