#!/bin/bash
set -e
source .env.production
export PGPASSWORD=$(echo $DATABASE_URL | grep -o ':[^:]*@' | sed 's/://' | sed 's/@//')

for i in {12..20}; do
  file=$(ls drizzle/00${i}_*.sql 2>/dev/null)
  if [ -f "$file" ]; then
    echo "Applying $file..."
    psql "$DATABASE_URL" -f "$file"
    
    # Extract hash (filename without extension)
    filename=$(basename -- "$file")
    hash="${filename%.*}"
    
    # Insert into __drizzle_migrations
    psql "$DATABASE_URL" -c "INSERT INTO __drizzle_migrations (hash, created_at) VALUES ('$hash', extract(epoch from now()) * 1000) ON CONFLICT DO NOTHING;"
    echo "Successfully recorded $hash"
  fi
done
