#!/bin/bash

# Script to fix Drizzle configuration for schema-specific queries

files=(
  "src/app/api/projects/route.ts"
  "src/app/api/projects/featured/route.ts"
  "src/app/api/admin/projects/route.ts"
  "src/app/api/admin/administrators/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing Drizzle config in $file..."
    
    # Check if file needs projects schema
    if grep -q "projects as projectsSchema" "$file"; then
      # Add projects schema to Drizzle config
      sed -i.bak 's|const db = drizzle(client);|const db = drizzle(client, { schema: { projects: projectsSchema } });|g' "$file"
      echo "✅ Added projects schema to $file"
    fi
    
    # Check if file needs administrators schema  
    if grep -q "administrators" "$file" && ! grep -q "schema: { administrators" "$file"; then
      # Add administrators schema to Drizzle config
      sed -i.bak 's|const db = drizzle(client);|const db = drizzle(client, { schema: { administrators } });|g' "$file"
      echo "✅ Added administrators schema to $file"
    fi
    
  else
    echo "❌ File not found: $file"
  fi
done

echo "🎉 All Drizzle configurations fixed!"
