export DATABASE_URL="postgresql://neondb_owner:npg_xnC8cPL4iFUd@ep-spring-mountain-awqc41zk-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
echo "Generating Drizzle migrations..."
bun run db:generate
echo "Applying Drizzle migrations safely (db:migrate)..."
bun run db:migrate
