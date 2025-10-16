#!/bin/bash

# Script to fix Drizzle configuration in all API files

files=(
  "src/app/api/admin/projects/[id]/route.ts"
  "src/app/api/admin/projects/featured-status/[id]/route.ts"
  "src/app/api/projects/apply/route.ts"
  "src/app/api/projects/draft/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing Drizzle config in $file..."
    
    # Add projects schema to Drizzle config if missing
    if grep -q "import { projects as projectsSchema }" "$file" && ! grep -q "schema: { projects: projectsSchema }" "$file"; then
      sed -i.bak 's|const db = drizzle(client);|const db = drizzle(client, { schema: { projects: projectsSchema } });|g' "$file"
      echo "✅ Added projects schema to $file"
    fi
    
    # Add administrators schema to Drizzle config if missing
    if grep -q "import { administrators }" "$file" && ! grep -q "schema: { administrators }" "$file"; then
      sed -i.bak 's|const db = drizzle(client);|const db = drizzle(client, { schema: { administrators } });|g' "$file"
      echo "✅ Added administrators schema to $file"
    fi
    
  else
    echo "❌ File not found: $file"
  fi
done

echo "🎉 All Drizzle configurations fixed!"
