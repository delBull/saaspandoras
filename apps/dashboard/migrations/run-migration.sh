#!/bin/bash

# Marketing Automation Migration Runner
# Usage: ./run-migration.sh [local|staging|main|all]

MIGRATION_FILE="2024-12-18_marketing_automation.sql"

LOCAL_DB="postgresql://Marco@localhost:5432/pandoras_local"
STAGING_DB="postgresql://neondb_owner:npg_uj0h1LpbAQxi@ep-withered-thunder-adt88vka-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
MAIN_DB="postgresql://neondb_owner:npg_MjazsA5ybWQ3@ep-summer-bread-adqdsnx4-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

run_migration() {
    local ENV_NAME=$1
    local DB_URL=$2
    
    echo "🚀 Running migration on $ENV_NAME..."
    psql "$DB_URL" -f "$MIGRATION_FILE"
    
    if [ $? -eq 0 ]; then
        echo "✅ Migration successful on $ENV_NAME"
    else
        echo "❌ Migration failed on $ENV_NAME"
        return 1
    fi
}

case "$1" in
    local)
        run_migration "LOCAL" "$LOCAL_DB"
        ;;
    staging)
        run_migration "STAGING" "$STAGING_DB"
        ;;
    main)
        run_migration "MAIN" "$MAIN_DB"
        ;;
    all)
        echo "📦 Running migration on ALL databases..."
        run_migration "LOCAL" "$LOCAL_DB"
        run_migration "STAGING" "$STAGING_DB"
        run_migration "MAIN" "$MAIN_DB"
        echo "🎉 All migrations complete!"
        ;;
    *)
        echo "Usage: $0 {local|staging|main|all}"
        exit 1
        ;;
esac
